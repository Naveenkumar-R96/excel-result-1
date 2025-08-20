import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  extend: {
    animation: {
      'pulse-slow': 'pulse 6s ease-in-out infinite',
    },
    fontFamily: {
      poppins: ['Poppins', 'sans-serif'],
    },
  }
})