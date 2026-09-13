import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  server: { port: 4321 },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
