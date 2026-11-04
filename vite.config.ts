import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative asset paths work on GitHub Pages subpaths and Coolify root domains.
export default defineConfig({
  base: './',
  plugins: [react()],
})
