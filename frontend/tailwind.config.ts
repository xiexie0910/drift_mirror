import type { Config } from 'tailwindcss';

/**
 * DriftMirror Tailwind Configuration
 * ============================================================
 * 
 * Design Philosophy: Calm Futurism
 * - Subtle depth, not spectacle
 * - Material-based surfaces
 * - Precision and restraint
 * - Teal as the sole accent color (used sparingly)
 */

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent: TEAL (used with restraint)
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        // Neutral palette
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Semantic states (muted, not celebratory)
        state: {
          complete: '#6EE7B7',
          'complete-bg': '#ECFDF5',
          attention: '#FCD34D',
          'attention-bg': '#FFFBEB',
          concern: '#FDA4AF',
          'concern-bg': '#FFF1F2',
        },
      },
      fontFamily: {
        // Clean, neutral sans-serif
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Mono', 'monospace'],
      },
      boxShadow: {
        // Soft, physical, stable shadows
        'surface': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'surface-md': '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'surface-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'surface-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        // Glass shadows with subtle teal tint
        'glass': '0 4px 16px 0 rgba(20, 184, 166, 0.04), 0 2px 8px 0 rgba(0, 0, 0, 0.02)',
        'glass-strong': '0 8px 24px 0 rgba(20, 184, 166, 0.06), 0 4px 12px 0 rgba(0, 0, 0, 0.03)',
      },
      backdropBlur: {
        'glass-subtle': '12px',
        'glass-strong': '16px',
        'glass-quiet': '8px',
      },
      borderRadius: {
        'surface': '0.75rem',
        'surface-lg': '1rem',
        'surface-xl': '1.25rem',
      },
      animation: {
        // Calm, predictable animations only
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
