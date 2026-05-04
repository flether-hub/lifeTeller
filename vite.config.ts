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
    // We proxy API requests in development to our Express server process
    // Wait, since we are using Vite middleware in Express, we don't need proxying
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
