import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // ต้องมีบรรทัดนี้

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // และต้องมีบรรทัดนี้
  ],
})