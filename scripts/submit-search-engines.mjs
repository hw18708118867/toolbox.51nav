// 部署后通知搜索引擎：百度(主动推送 API，URL 级) + Google / Bing(sitemap ping，无需密钥)
// 用法（通常在 CI 构建后调用）：
//   BAIDU_TOKEN=xxx node scripts/submit-search-engines.mjs
// 环境变量：
//   BAIDU_TOKEN       百度主动推送 token（可选，未设置则仅跳过百度）
//   SITE_HOST         站点域名（可选，默认 toolbox.51nav.com）
//   SITE_SITEMAP_URL  索引 sitemap 地址（可选，默认 https://<host>/sitemap-index.xml）
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';

const SITE_HOST = process.env.SITE_HOST || 'toolbox.51nav.com';
const SITEMAP_URL = process.env.SITE_SITEMAP_URL || `https://${SITE_HOST}/sitemap-index.xml`;
const BAIDU_TOKEN = process.env.BAIDU_TOKEN || '';

// 1. 从 dist 下的 sitemap*.xml 收集页面 URL（供百度主动推送使用）
function collectUrls() {
  const distDir = 'dist';
  if (!existsSync(distDir)) return [];
  const files = readdirSync(distDir).filter((f) => /^sitemap.*\.xml$/.test(f));
  const urls = [];
  for (const f of files) {
    const xml = readFileSync(`${distDir}/${f}`, 'utf8');
    const locs = xml.match(/<loc>(.*?)<\/loc>/g) || [];
    for (const l of locs) {
      const u = l.replace(/<\/?loc>/g, '').trim();
      if (u.endsWith('.xml')) continue; // 跳过 sitemap 索引里自身
      urls.push(u);
    }
  }
  return urls;
}

// 简易 GET / POST（自动适配 http/https）
function request(urlStr, method = 'GET', body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const headers = {};
    if (body) {
      headers['Content-Type'] = 'text/plain';
      headers['Content-Length'] = Buffer.byteLength(body);
    }
    const r = lib.request(
      { hostname: u.hostname, path: u.pathname + u.search, method, headers },
      (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  // --- 百度：主动推送（URL 级，需 token）---
  if (BAIDU_TOKEN) {
    const urls = collectUrls();
    if (urls.length) {
      try {
        const res = await request(
          `http://data.zz.baidu.com/urls?site=${SITE_HOST}&token=${BAIDU_TOKEN}`,
          'POST',
          urls.join('\n')
        );
        console.log('[Baidu] 状态码:', res.status, '返回:', res.body);
      } catch (e) {
        console.error('[Baidu] 推送失败:', e.message);
      }
    }
  } else {
    console.log('[Baidu] 未设置 BAIDU_TOKEN，跳过');
  }

  // --- Google：sitemap ping（通知重新抓取 sitemap）---
  try {
    const res = await request(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
    console.log('[Google] ping 状态码:', res.status);
  } catch (e) {
    console.error('[Google] ping 失败:', e.message);
  }

  // --- Bing：sitemap ping（通知重新抓取 sitemap）---
  try {
    const res = await request(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
    console.log('[Bing] ping 状态码:', res.status);
  } catch (e) {
    console.error('[Bing] ping 失败:', e.message);
  }
}

main();
