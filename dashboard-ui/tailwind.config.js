/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  important: '#apex-dashboard-root',
  theme: {
    extend: {
      colors: {
        midnight: '#0a0a0a',
        'midnight-light': '#1a1a1a',
        neon: {
          green: '#00f2ea',
          purple: '#7000ff',
          blue: '#00c3ff',
        },
        surface: {
          50: '#ffffff',
          100: '#1c1c1e',
          200: '#2c2c2e',
          300: '#3a3a3c',
          800: '#121212',
          900: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      boxShadow: {
        'neon-green': '0 0 10px rgba(0, 242, 234, 0.3), 0 0 20px rgba(0, 242, 234, 0.1)',
        'neon-purple': '0 0 10px rgba(112, 0, 255, 0.3), 0 0 20px rgba(112, 0, 255, 0.1)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
