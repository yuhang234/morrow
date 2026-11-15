/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF6',
          100: '#FBF6EE',
          200: '#F5EDDF',
          300: '#EFE3CF',
        },
        orange: {
          peel: '#E8893A',
          flesh: '#F2A65A',
          deep: '#C96A28',
          soft: '#F7C992',
          glow: '#FFD9A8',
        },
        cobalt: {
          DEFAULT: '#3B5BA5',
          soft: '#6E88BD',
        },
        ink: {
          900: '#3A332C',
          700: '#5C5550',
          500: '#8A817A',
          300: '#B8AFA6',
        },
        night: {
          900: '#1B1815',
          800: '#24201C',
          700: '#2E2924',
          600: '#3A332C',
        },
      },
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Hiragino Sans GB"',
          'system-ui',
          'sans-serif',
        ],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
      },
      maxWidth: {
        reading: '34rem',
      },
      boxShadow: {
        soft: '0 6px 24px -8px rgba(120, 90, 50, 0.18)',
        glow: '0 0 40px -4px rgba(232, 137, 58, 0.45)',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        breathe: 'breathe 5s ease-in-out infinite',
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
