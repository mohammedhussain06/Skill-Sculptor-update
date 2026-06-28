import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '@/contexts/ThemeContext';

interface ThreeBackgroundProps {
  /** Base opacity of the canvas (default: 0.16) */
  opacity?: number;
}

/**
 * ThreeBackground — A persistent 3D Knowledge Network.
 * Represents core study hubs (Machine Learning, Deep Learning, Data Science, Web Dev, App Dev, UI/UX)
 * as floating nodes, clusters, and connection roadmaps.
 * Dynamic light signal pulses travel along the connection lines.
 * Automatically adapts to dark and light mode themes!
 */
export function ThreeBackground({ opacity = 0.16 }: ThreeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isDark = theme === 'dark';

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 50);

    // ── Helper: Create text sprite texture ─────────────────
    const createTextSprite = (text: string, colorHex: string) => {
      const textCanvas = document.createElement('canvas');
      textCanvas.width = 160;
      textCanvas.height = 48;
      const ctx = textCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 160, 48);

        // High-tech capsule background: Dark slate or Solid white
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)';
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 2.5;
        ctx.roundRect ? ctx.roundRect(2, 2, 156, 44, 8) : ctx.rect(2, 2, 156, 44);
        ctx.fill();
        ctx.stroke();

        // Monospace capsule text
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = colorHex;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 80, 24);
      }

      const texture = new THREE.CanvasTexture(textCanvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(10, 3.2, 1);
      return sprite;
    };

    // ── Define Study Knowledge Hubs (Dark vs Light colors) ─
    const hubs = [
      { name: 'Machine Learning', pos: new THREE.Vector3(-24, 12, -4), color: isDark ? 0x818cf8 : 0x4f46e5 },
      { name: 'Deep Learning', pos: new THREE.Vector3(-8, 16, 2), color: isDark ? 0xa78bfa : 0x7c3aed },
      { name: 'Data Science', pos: new THREE.Vector3(-18, -14, 5), color: isDark ? 0x2dd4bf : 0x0d9488 },
      { name: 'Web Dev', pos: new THREE.Vector3(22, -10, -5), color: isDark ? 0x38bdf8 : 0x0284c7 },
      { name: 'App Dev', pos: new THREE.Vector3(18, 14, -6), color: isDark ? 0xf59e0b : 0xd97706 },
      { name: 'UI / UX Design', pos: new THREE.Vector3(5, -6, 4), color: isDark ? 0xf472b6 : 0xdb2777 },
    ];

    // Add hub labels to scene
    hubs.forEach((hub) => {
      const colorHexStr = `#${hub.color.toString(16).padStart(6, '0')}`;
      const label = createTextSprite(hub.name, colorHexStr);
      label.position.copy(hub.pos).add(new THREE.Vector3(0, 3, 0));
      scene.add(label);
    });

    // ── Build Node network positions ──────────────────────
    const nodes: {
      pos: THREE.Vector3;
      origin: THREE.Vector3;
      vel: THREE.Vector3;
      color: THREE.Color;
      hubIndex: number;
    }[] = [];

    const totalSatelliteNodes = 90;
    for (let i = 0; i < totalSatelliteNodes; i++) {
      const hubIndex = i % hubs.length;
      const hub = hubs[hubIndex];

      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 8;
      const offset = new THREE.Vector3(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * radius * 0.7,
        (Math.random() - 0.5) * radius * 0.7
      );

      const pos = hub.pos.clone().add(offset);
      const origin = pos.clone();

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.015,
        (Math.random() - 0.5) * 0.015,
        (Math.random() - 0.5) * 0.015
      );

      const color = new THREE.Color(hub.color).addScalar((Math.random() - 0.5) * 0.12);
      nodes.push({ pos, origin, vel, color, hubIndex });
    }

    // Include hubs
    hubs.forEach((hub, idx) => {
      nodes.push({
        pos: hub.pos,
        origin: hub.pos.clone(),
        vel: new THREE.Vector3(0, 0, 0),
        color: new THREE.Color(hub.color),
        hubIndex: idx,
      });
    });

    const totalNodesCount = nodes.length;

    // ── Particles Points Geometry ──────────────────────────
    const positions = new Float32Array(totalNodesCount * 3);
    const colors = new Float32Array(totalNodesCount * 3);

    nodes.forEach((node, i) => {
      const i3 = i * 3;
      positions[i3] = node.pos.x;
      positions[i3 + 1] = node.pos.y;
      positions[i3 + 2] = node.pos.z;

      colors[i3] = node.color.r;
      colors[i3 + 1] = node.color.g;
      colors[i3 + 2] = node.color.b;
    });

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointMaterial = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.75 : 0.9,
      depthWrite: false,
    });

    const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(pointCloud);

    // ── Connection Lines (Constellation Roads) ────────────
    const maxLineConnections = totalNodesCount * 6;
    const linePositions = new Float32Array(maxLineConnections * 2 * 3);
    const lineColors = new Float32Array(maxLineConnections * 2 * 3);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: isDark ? 0.08 : 0.16, // higher line visibility for light mode
      vertexColors: true,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    // ── Active Learning Signals (Pulses traveling) ────────
    interface Signal {
      startNode: THREE.Vector3;
      endNode: THREE.Vector3;
      color: THREE.Color;
      progress: number;
      speed: number;
    }
    const activeSignals: Signal[] = [];
    const maxSignals = 14;

    const connectionThreshold = 13;
    const getConnectedPairs = () => {
      const pairs: [number, number][] = [];
      for (let i = 0; i < totalNodesCount; i++) {
        for (let j = i + 1; j < totalNodesCount; j++) {
          const d = nodes[i].pos.distanceTo(nodes[j].pos);
          if (d < connectionThreshold) {
            pairs.push([i, j]);
          }
        }
      }
      return pairs;
    };

    const refreshSignals = () => {
      const pairs = getConnectedPairs();
      if (pairs.length === 0) return;

      while (activeSignals.length < maxSignals) {
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        const startNode = nodes[pair[0]];
        const endNode = nodes[pair[1]];

        activeSignals.push({
          startNode: startNode.pos,
          endNode: endNode.pos,
          color: startNode.color.clone().lerp(endNode.color, 0.5),
          progress: Math.random(),
          speed: 0.006 + Math.random() * 0.009,
        });
      }
    };

    const signalPositions = new Float32Array(maxSignals * 3);
    const signalColors = new Float32Array(maxSignals * 3);

    const signalGeometry = new THREE.BufferGeometry();
    signalGeometry.setAttribute('position', new THREE.BufferAttribute(signalPositions, 3));
    signalGeometry.setAttribute('color', new THREE.BufferAttribute(signalColors, 3));

    const signalMaterial = new THREE.PointsMaterial({
      size: 1.1,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.9 : 0.95,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const signalPointCloud = new THREE.Points(signalGeometry, signalMaterial);
    scene.add(signalPointCloud);

    // ── Mouse Interaction ──────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 6;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 6;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // ── Animation Frame loop ──────────────────────────────
    let raf: number;
    const tempPos = new THREE.Vector3();

    const animate = () => {
      raf = requestAnimationFrame(animate);

      const time = Date.now() * 0.0006;

      nodes.forEach((node, idx) => {
        if (idx < totalSatelliteNodes) {
          node.pos.x = node.origin.x + Math.sin(time + idx) * 0.45;
          node.pos.y = node.origin.y + Math.cos(time * 0.8 + idx) * 0.45;
          node.pos.z = node.origin.z + Math.sin(time * 0.5 + idx) * 0.3;
        }
      });

      const positionsAttr = pointGeometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < totalNodesCount; i++) {
        positionsAttr.setXYZ(i, nodes[i].pos.x, nodes[i].pos.y, nodes[i].pos.z);
      }
      positionsAttr.needsUpdate = true;

      let lineIndex = 0;
      const linePositionsAttr = lineGeometry.getAttribute('position') as THREE.BufferAttribute;
      const lineColorsAttr = lineGeometry.getAttribute('color') as THREE.BufferAttribute;

      for (let i = 0; i < totalNodesCount; i++) {
        for (let j = i + 1; j < totalNodesCount; j++) {
          const d = nodes[i].pos.distanceTo(nodes[j].pos);

          if (d < connectionThreshold && lineIndex < maxLineConnections) {
            linePositionsAttr.setXYZ(lineIndex * 2, nodes[i].pos.x, nodes[i].pos.y, nodes[i].pos.z);
            lineColorsAttr.setXYZ(lineIndex * 2, nodes[i].color.r, nodes[i].color.g, nodes[i].color.b);

            linePositionsAttr.setXYZ(lineIndex * 2 + 1, nodes[j].pos.x, nodes[j].pos.y, nodes[j].pos.z);
            lineColorsAttr.setXYZ(lineIndex * 2 + 1, nodes[j].color.r, nodes[j].color.g, nodes[j].color.b);

            lineIndex++;
          }
        }
      }

      for (let i = lineIndex; i < maxLineConnections; i++) {
        linePositionsAttr.setXYZ(i * 2, 0, 0, 0);
        linePositionsAttr.setXYZ(i * 2 + 1, 0, 0, 0);
      }
      linePositionsAttr.needsUpdate = true;
      lineColorsAttr.needsUpdate = true;

      refreshSignals();
      const signalPositionsAttr = signalGeometry.getAttribute('position') as THREE.BufferAttribute;
      const signalColorsAttr = signalGeometry.getAttribute('color') as THREE.BufferAttribute;

      activeSignals.forEach((signal, idx) => {
        signal.progress += signal.speed;

        if (signal.progress >= 1) {
          const pairs = getConnectedPairs();
          if (pairs.length > 0) {
            const pair = pairs[Math.floor(Math.random() * pairs.length)];
            signal.startNode = nodes[pair[0]].pos;
            signal.endNode = nodes[pair[1]].pos;
            signal.color = nodes[pair[0]].color.clone().lerp(nodes[pair[1]].color, 0.5);
          }
          signal.progress = 0;
        }

        tempPos.copy(signal.startNode).lerp(signal.endNode, signal.progress);
        signalPositionsAttr.setXYZ(idx, tempPos.x, tempPos.y, tempPos.z);
        signalColorsAttr.setXYZ(idx, signal.color.r, signal.color.g, signal.color.b);
      });
      signalPositionsAttr.needsUpdate = true;
      signalColorsAttr.needsUpdate = true;

      camera.position.x += (mouseX - camera.position.x) * 0.02;
      camera.position.y += (-mouseY - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      pointGeometry.dispose();
      pointMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      signalGeometry.dispose();
      signalMaterial.dispose();
      renderer.dispose();
    };
  }, [opacity, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity }}
      aria-hidden="true"
    />
  );
}
