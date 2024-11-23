import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  assetsInclude: ['**/*.png'],
  // Ensure public directory is served correctly
  publicDir: 'public'
});