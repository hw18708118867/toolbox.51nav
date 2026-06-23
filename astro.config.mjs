import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';

// 取最近一次 git 提交时间作为 sitemap 的 lastmod 基准
// 反映站点真实更新时间；CI/无 git 环境回退到当前时间
let lastmodISO;
try {
  lastmodISO = execSync('git log -1 --format=%cI').toString().trim();
} catch {
  lastmodISO = new Date().toISOString();
}

export default defineConfig({
  site: 'https://toolbox.51nav.com',
  integrations: [
    vue(),
    sitemap({
      serialize(item) {
        item.lastmod = lastmodISO;
        return item;
      },
    }),
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
