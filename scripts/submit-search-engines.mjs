// 部署后通知搜索引擎收录：
//   1) 百度主动推送（URL 级，需 BAIDU_TOKEN；配额用尽会友好提示，不算失败）
//   2) IndexNow（Bing / Yandex / Seznam 通用，需 INDEXNOW_KEY）
//      Google 没有对普通网页开放的推送 API（sitemap ping 已于 2023 下线），
//      Google 收录靠 Search Console 提交的 sitemap 自然抓取，无需在此处理。
// 用法（通常在 CI 构建后调用）：
//   BAIDU_TOKEN=xxx INDEXNOW_KEY=xxx node scripts/submit-search-engines.mjs
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';

const SITE_HOST = process.env.SITE_HOST || 'toolbox.51nav.com';
const SITE_ORIGIN = `https://${SITE_HOST}`;
const BAIDU_TOKEN = process.env.BAIDU_TOKEN || '';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '';

// 从 dist 下的 sitemap*.xml 收集页面 URL
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
function request(urlStr, method = 'GET', body, contentType = 'text/plain') {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const headers = {};
    if (body) {
      headers['Content-Type'] = contentType;
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

async function pushBaidu() {
  if (!BAIDU_TOKEN) return console.log('[Baidu] 未设置 BAIDU_TOKEN，跳过');
  const urls = collectUrls();
  if (!urls.length) return console.log('[Baidu] 未解析到 URL，跳过');
  try {
    const res = await request(
      `http://data.zz.baidu.com/urls?site=${SITE_HOST}&token=${BAIDU_TOKEN}`,
      'POST',
      urls.join('\n')
    );
    if (res.status === 200) {
      console.log('[Baidu] 推送成功:', res.body);
    } else if (res.body.includes('over quota')) {
      // 当日配额用尽：之前推送已生效，非故障
      console.log(`[Baidu] 今日配额已用完（本次未推送 ${urls.length} 条，此前推送仍有效），明天自动恢复`);
    } else {
      console.error('[Baidu] 推送异常:', res.status, res.body);
    }
  } catch (e) {
    console.error('[Baidu] 请求失败:', e.message);
  }
}

async function pushIndexNow() {
  if (!INDEXNOW_KEY) return console.log('[IndexNow] 未设置 INDEXNOW_KEY，跳过（Bing/Yandex 收录靠 sitemap 自然抓取）');
  const urls = collectUrls();
  if (!urls.length) return console.log('[IndexNow] 未解析到 URL，跳过');

  // 把 key 验证文件写进 dist，随本次部署一起上线（IndexNow 要求站点根目录可访问 <key>.txt）
  const distDir = 'dist';
  if (existsSync(distDir)) {
    writeFileSync(`${distDir}/${INDEXNOW_KEY}.txt`, INDEXNOW_KEY);
  } else {
    return console.error('[IndexNow] 找不到 dist/，无法写入 key 验证文件，跳过');
  }

  const payload = JSON.stringify({
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  });
  try {
    // api.indexnow.org 是通用端点，自动分发给 Bing/Yandex/Seznam
    const res = await request('https://api.indexnow.org/indexnow', 'POST', payload, 'application/json; charset=utf-8');
    // 200/202 = 已受理；400 = key 校验失败（通常因 key 文件还没上线，下次部署即正常）
    console.log('[IndexNow] 状态码:', res.status, res.body || '');
    if (res.status === 400) {
      console.log('[IndexNow] 若首次使用：key 验证文件刚生成，需等本次部署上线后再跑一次即可通过');
    }
  } catch (e) {
    console.error('[IndexNow] 请求失败:', e.message);
  }
}

await pushBaidu();
await pushIndexNow();
