import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: el build funciona en GitHub Pages, Firebase o cualquier subcarpeta
export default defineConfig({
  base: './',
  plugins: [react()],
});
