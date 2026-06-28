import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "2.5rem",
        xl: "3rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: {
          DEFAULT: "hsl(var(--background))",
          secondary: "hsl(var(--background-secondary))",
        },
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          muted: "hsl(var(--primary-muted))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
          muted: "hsl(var(--secondary-muted))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          darker: "hsl(var(--muted-darker))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* New neon colors */
        neon: {
          violet: "hsl(263 80% 62%)",
          cyan: "hsl(191 97% 50%)",
          amber: "hsl(38 95% 55%)",
        },
      },
      boxShadow: {
        'card': 'var(--card-shadow)',
        'card-hover': 'var(--card-hover)',
        'glow': 'var(--shadow-glow)',
        'glow-violet': 'var(--glow-violet)',
        'glow-cyan': 'var(--glow-cyan)',
        'glow-amber': 'var(--glow-amber)',
        'neon-sm': '0 0 8px hsl(263 80% 62% / 0.4)',
        'neon-md': '0 0 20px hsl(263 80% 62% / 0.4), 0 0 40px hsl(263 80% 62% / 0.2)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-tri': 'var(--gradient-tri)',
        'gradient-subtle': 'var(--gradient-subtle)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "neon-glow": {
          "0%, 100%": { boxShadow: "0 0 10px hsl(263 80% 62% / 0.4)" },
          "50%": { boxShadow: "0 0 30px hsl(263 80% 62% / 0.7), 0 0 60px hsl(191 97% 50% / 0.3)" },
        },
        "aurora": {
          "0%": { transform: "rotate(0deg)", opacity: "0.08" },
          "50%": { opacity: "0.15" },
          "100%": { transform: "rotate(360deg)", opacity: "0.08" },
        },
        "particle-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(20px, -30px) scale(1.05)" },
          "66%": { transform: "translate(-15px, 15px) scale(0.95)" },
        },
        "slide-in-from-bottom": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "hsl(263 80% 62% / 0.3)" },
          "50%": { borderColor: "hsl(191 97% 50% / 0.5)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "neon-glow": "neon-glow 3s ease-in-out infinite",
        "aurora": "aurora 20s linear infinite",
        "particle-drift": "particle-drift 8s ease-in-out infinite",
        "slide-in-up": "slide-in-from-bottom 0.6s ease-out both",
        "fade-in": "fade-in 0.5s ease-out both",
        "border-glow": "border-glow 3s ease-in-out infinite",
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
