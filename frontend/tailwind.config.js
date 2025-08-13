/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.5s infinite alternate',
        'scanner-sweep': 'scanner-sweep 2s ease-in-out infinite',
        'pulse-step': 'pulse-step 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-glow': {
          'from': { boxShadow: '0 0 8px 0 var(--primary)' },
          'to': { boxShadow: '0 0 16px 4px var(--primary)' }
        },
        'scanner-sweep': {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' }
        },
        'pulse-step': {
          'from': { backgroundColor: 'rgba(0, 217, 255, 0.1)' },
          'to': { backgroundColor: 'rgba(0, 217, 255, 0.3)' }
        }
      }
    },
  },
  plugins: [],
};

export default config;
