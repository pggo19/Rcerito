import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativa: la misma build sirve para web, vista previa y Capacitor (Android)
export default defineConfig({
  base: './',
  plugins: [react()],
})
