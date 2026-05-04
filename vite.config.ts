import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
    },
    // Wrangler handles functions in /functions automatically
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
