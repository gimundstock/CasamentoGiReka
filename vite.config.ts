import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // In dev: serve at '/'. In production: use subdirectory path unless a custom domain sets VITE_BASE_PATH=/
  base: process.env.VITE_BASE_PATH ?? (mode === 'production' ? '/CasamentoGiReka/' : '/'),
}))
