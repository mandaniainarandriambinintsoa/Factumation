import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendors React
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              // Supabase
              'vendor-supabase': ['@supabase/supabase-js'],
              // PDF generation (le plus lourd)
              'vendor-pdf': ['html2pdf.js'],
              // Icônes
              'vendor-icons': ['lucide-react'],
            }
          }
        }
      }
    };
});
