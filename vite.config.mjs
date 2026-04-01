import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Faltai/',
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase/app')) {
            return 'firebase-app';
          }

          if (id.includes('node_modules/firebase/auth')) {
            return 'firebase-auth';
          }

          if (id.includes('node_modules/firebase/firestore')) {
            return 'firebase-firestore';
          }

          if (id.includes('node_modules/firebase/analytics')) {
            return 'firebase-analytics';
          }

          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
            return 'charts';
          }

          if (id.includes('node_modules/react-calendar')) {
            return 'calendar';
          }

          if (id.includes('node_modules/react-icons')) {
            return 'icons';
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js'
  }
});
