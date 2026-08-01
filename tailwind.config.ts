import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#121212', lime: '#d9ff43', coral: '#ff5b50' },
      boxShadow: { soft: '0 18px 45px rgba(14, 19, 14, .09)' },
      borderRadius: { '4xl': '2rem' }
    }
  },
  plugins: []
}
export default config
