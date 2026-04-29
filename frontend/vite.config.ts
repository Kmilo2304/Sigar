import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/sigar/',  // 🔥 esto es lo que te falta
  plugins: [react()],
})