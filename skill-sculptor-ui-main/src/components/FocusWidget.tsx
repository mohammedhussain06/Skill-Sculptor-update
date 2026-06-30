import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Flame, CloudRain, Sparkles, Clock, X, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types for the Timer
type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const MODE_LIMITS: Record<TimerMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function FocusWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODE_LIMITS.focus);
  const [isRunning, setIsRunning] = useState(false);

  // Audio mix states (values 0 to 100)
  const [rainVol, setRainVol] = useState(0);
  const [synthVol, setSynthVol] = useState(0);
  const [campVol, setCampVol] = useState(0);

  // Audio API Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Rain audio nodes
  const rainSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);

  // Synth audio nodes
  const oscsRef = useRef<OscillatorNode[]>([]);
  const synthGainRef = useRef<GainNode | null>(null);

  // Campfire audio nodes
  const campSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const campGainRef = useRef<GainNode | null>(null);

  // Interval Ref for Timer
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Web Audio API Initializer ────────────────────────
  const initAudio = () => {
    if (audioCtxRef.current) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // 1. Setup Rain (Procedural Brown Noise)
    const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
    const rainBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const rainData = rainBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration filter
      rainData[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = rainData[i];
      rainData[i] *= 3.5; // Compensate amplitude
    }

    const rainSource = ctx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1000, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0, ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(ctx.destination);
    rainSource.start();

    rainSourceRef.current = rainSource;
    rainGainRef.current = rainGain;

    // 2. Setup Cozy Synth Hum (Procedural Warm Harmonics + Sweeping LFO Pad)
    const synthGain = ctx.createGain();
    synthGain.gain.setValueAtTime(0, ctx.currentTime);

    // Mid-frequency base oscillators (highly audible on laptop/mobile speakers)
    const frequencies = [130.81, 196.00, 261.63, 329.63]; // C3, G3, C4, E4
    const oscs: OscillatorNode[] = [];
    
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      // Triangle waves for warm, vintage keyboard vibe
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const oscGain = ctx.createGain();
      // Balanced detuned amplitude weights
      oscGain.gain.setValueAtTime(idx === 0 ? 0.35 : idx === 1 ? 0.25 : idx === 2 ? 0.2 : 0.15, ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(synthGain);
      osc.start();
      oscs.push(osc);
    });

    const synthFilter = ctx.createBiquadFilter();
    synthFilter.type = 'lowpass';
    synthFilter.frequency.setValueAtTime(400, ctx.currentTime);

    // Slowly modulating LFO to simulate breathing filter sweep (audible & warm)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // slow breathing

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(120, ctx.currentTime); // sweep filter up/down by 120Hz

    lfo.connect(lfoGain);
    lfoGain.connect(synthFilter.frequency); // Sweep the lowpass filter frequency
    lfo.start();

    synthGain.connect(synthFilter);
    synthFilter.connect(ctx.destination);

    oscsRef.current = oscs;
    synthGainRef.current = synthGain;

    // 3. Setup Campfire Crackle (Procedural crackling impulses + low rumble)
    const campBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const campData = campBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Sporadic crackle pops (vivid impulses)
      const crackle = Math.random() > 0.9998 ? (Math.random() * 2 - 1) * 0.8 : 0;
      // Deep, warm fire roar (white noise rumble)
      const fireRoar = (Math.random() * 2 - 1) * 0.05;
      campData[i] = crackle + fireRoar;
    }

    const campSource = ctx.createBufferSource();
    campSource.buffer = campBuffer;
    campSource.loop = true;

    // Lowpass filter at 2000Hz lets through deep rumble + crisp pops (no bandpass choking)
    const campFilter = ctx.createBiquadFilter();
    campFilter.type = 'lowpass';
    campFilter.frequency.setValueAtTime(2000, ctx.currentTime);

    const campGain = ctx.createGain();
    campGain.gain.setValueAtTime(0, ctx.currentTime);

    campSource.connect(campFilter);
    campFilter.connect(campGain);
    campGain.connect(ctx.destination);
    campSource.start();

    campSourceRef.current = campSource;
    campGainRef.current = campGain;
  };

  // ── Web Audio Synth Alert chime ────────────────────────
  const playAlertChime = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const chimeGain = ctx.createGain();
    chimeGain.gain.setValueAtTime(0.3, ctx.currentTime);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5

    osc1.connect(chimeGain);
    osc2.connect(chimeGain);
    chimeGain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(ctx.currentTime + 1.5);
    osc2.stop(ctx.currentTime + 1.5);
  };

  // ── Sync volume knobs to audio ref gains ───────────────
  useEffect(() => {
    if (!audioCtxRef.current) return;
    
    // Resume context if suspended (browser security autoplay policies)
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const time = audioCtxRef.current.currentTime;

    if (rainGainRef.current) {
      rainGainRef.current.gain.linearRampToValueAtTime(rainVol / 100 * 0.45, time + 0.1);
    }
    if (synthGainRef.current) {
      synthGainRef.current.gain.linearRampToValueAtTime(synthVol / 100 * 0.4, time + 0.1);
    }
    if (campGainRef.current) {
      campGainRef.current.gain.linearRampToValueAtTime(campVol / 100 * 0.35, time + 0.1);
    }
  }, [rainVol, synthVol, campVol]);

  // ── Timer loop effect ──────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playAlertChime();
            return 0;
          }
          
          // Log active focus seconds for today (only in 'focus' mode)
          if (timerMode === 'focus') {
            const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
            const key = 'study_focus_seconds_log';
            const raw = localStorage.getItem(key);
            const logs = raw ? JSON.parse(raw) : {};
            logs[todayStr] = (logs[todayStr] || 0) + 1;
            localStorage.setItem(key, JSON.stringify(logs));
          }
          
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRunning]);

  // ── Clean Web Audio context on destroy ─────────────────
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const handleModeChange = (mode: TimerMode) => {
    setIsRunning(false);
    setTimerMode(mode);
    setTimeLeft(MODE_LIMITS[mode]);
  };

  const handleTogglePlay = () => {
    initAudio(); // Instantiate audio elements on first user click
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODE_LIMITS[timerMode]);
  };

  // Convert time to layout strings
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (timeLeft / MODE_LIMITS[timerMode]) * 100;

  return (
    <>
      {/* ── FLOATING BUTTON (FAB) ── */}
      <button
        onClick={() => {
          initAudio();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-primary text-white shadow-xl hover:scale-108 hover:shadow-2xl transition-all duration-300",
          isOpen && "rotate-90 opacity-0 pointer-events-none"
        )}
        title="Open Focus Mode"
      >
        <Timer className="w-6 h-6" />
      </button>

      {/* ── FOCUS SIDEBAR PANEL ── */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 sm:w-96 z-50 transition-transform duration-500 ease-out transform translate-x-full",
          isOpen && "translate-x-0"
        )}
      >
        {/* Glassmorphic Panel Container */}
        <div className="h-full w-full bg-card/65 backdrop-blur-3xl border-l border-white/8 p-6 flex flex-col justify-between shadow-2xl relative">
          
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg border border-white/5 bg-white/3 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          {/* Core Widget Body */}
          <div className="space-y-8 mt-6">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Cozy Focus Workspace
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Procedural sound board & Pomodoro timer</p>
            </div>

            {/* ── Pomodoro Timer Section ── */}
            <Card className="border-0 bg-white/3 border-white/5 p-4 sm:p-5 rounded-2xl flex flex-col items-center">
              {/* Presets */}
              <div className="flex gap-1.5 mb-6 w-full justify-between">
                {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={cn(
                      "text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all duration-200",
                      timerMode === mode
                        ? "bg-primary text-white border-primary"
                        : "bg-white/3 border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                  </button>
                ))}
              </div>

              {/* Radial Progress Ring & Numbers */}
              <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className="stroke-white/5 fill-transparent"
                    strokeWidth="5"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className="stroke-primary fill-transparent transition-all duration-1000 ease-linear"
                    strokeWidth="5"
                    strokeDasharray={402}
                    strokeDashoffset={402 - (402 * progressPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5 tracking-wider">
                    {timerMode === 'focus' ? 'Study time' : 'Chill time'}
                  </div>
                </div>
              </div>

              {/* Play / Reset buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleTogglePlay}
                  size="icon"
                  className="rounded-full w-11 h-11 bg-primary text-white hover:bg-primary-hover shadow-md hover:scale-105 transition-all"
                >
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="icon"
                  className="rounded-full w-11 h-11 border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            </Card>

            {/* ── Ambient Soundboard Section ── */}
            <div className="space-y-5">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-secondary" />
                Ambient Soundboard
              </h4>

              <div className="space-y-4">
                {/* Rain sound channel */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-foreground/80">
                    <span className="flex items-center gap-2">
                      <CloudRain className="w-4 h-4 text-cyan-400" />
                      Steady Rain
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">{rainVol}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rainVol}
                    onChange={(e) => {
                      initAudio();
                      setRainVol(parseInt(e.target.value));
                    }}
                    className="w-full h-1 bg-white/5 border border-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Synth hum sound channel */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-foreground/80">
                    <span className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-indigo-400" />
                      Cozy Synth Pad
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">{synthVol}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={synthVol}
                    onChange={(e) => {
                      initAudio();
                      setSynthVol(parseInt(e.target.value));
                    }}
                    className="w-full h-1 bg-white/5 border border-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Campfire crackle sound channel */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-foreground/80">
                    <span className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      Campfire Crackle
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">{campVol}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={campVol}
                    onChange={(e) => {
                      initAudio();
                      setCampVol(parseInt(e.target.value));
                    }}
                    className="w-full h-1 bg-white/5 border border-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer details */}
          <div className="text-center text-[10px] text-muted-foreground font-semibold border-t border-white/8 pt-4">
            SkillSculptor Focus Mode
          </div>
        </div>
      </div>
    </>
  );
}
