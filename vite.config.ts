import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
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
