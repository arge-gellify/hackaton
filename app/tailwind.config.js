/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['24px', '32px'],
        '2xl': ['32px', '40px'],
      },
      colors: {
        primary: { DEFAULT: '#0C5CAB', hover: '#0d68bd', soft: 'rgba(12,92,171,0.15)' },
        secondary: '#0a4a8a',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        surface: {
          DEFAULT: '#09090b',
          raised: '#111114',
          panel: '#15151a',
          border: '#26262d',
          hover: '#1c1c22',
        },
        text: {
          DEFAULT: '#fafafa',
          muted: '#a1a1aa',
          dim: '#71717a',
        },
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(12,92,171,0.4), 0 8px 24px -8px rgba(12,92,171,0.4)',
      },
      backgroundImage: {
        'panel-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
        'app-radial': 'radial-gradient(1200px 600px at 0% 0%, rgba(12,92,171,0.10), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(12,92,171,0.06), transparent 60%)',
      },
    },
  },
  plugins: [],
};
