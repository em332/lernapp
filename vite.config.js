import { defineConfig } from 'vite';

export default defineConfig({
  // Root is the project directory (index.html lives here)
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
  },
});
