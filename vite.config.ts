import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    target: 'es2020',

    sourcemap: false,

    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'data-vendor': ['@tanstack/react-query', 'axios'],
          'form-vendor': ['zod', 'jwt-decode'],
          flatpickr: ['flatpickr'],
          qrcode: ['react-qr-code'],
        },
      },
    },
  },

  server: {
    port: 5173,
    strictPort: false,
  },

  preview: {
    port: 4173,
    strictPort: false,
  },
});