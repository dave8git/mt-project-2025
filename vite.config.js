import { defineConfig } from 'vite';

export default defineConfig({
  root: './renderer', // Where your index.html lives
  build: {
    outDir: '../dist/renderer', // Where built files go
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  publicDir: 'assets'
});