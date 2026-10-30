import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves this project under the repository path.
export default defineConfig({
  base: '/HigorLopesZimerman-MajorDream/',
  plugins: [react()],
})
