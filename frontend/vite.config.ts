import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Railway serves the app from the domain root, not /sigar/
  base: '/',
  plugins: [react()],
})
