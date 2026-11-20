import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: el build funciona en GitHub Pages, Firebase o cualquier subcarpeta
export default defineConfig({
  base: './',
  plugins: [react()],
  // host: true expone el servidor en la red local para probar desde el celular
  server: { host: true },
});
