import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://toolbox.51nav.com',
  integrations: [
    vue(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
  build: {
    assets: '_assets',
  },
  markdown: {
    syntaxHighlight: false,
  },
});
