// 百度主动推送（实时收录）脚本
// 用法：
//   先构建: npm run build
//   再推送: BAIDU_TOKEN=你的token npm run push:baidu
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import http from 'node:http';

const SITE_HOST = 'toolbox.51nav.com';
const TOKEN = process.env.BAIDU_TOKEN;

if (!TOKEN) {
  console.error('❌ 请先设置环境变量 BAIDU_TOKEN（在百度搜索资源平台「链接提交」页获取）');
  process.exit(1);
}

// 1. 从 dist 下的 sitemap*.xml 收集 URL
const distDir = 'dist';
if (!existsSync(distDir)) {
  console.error('❌ 找不到 dist/ 目录，请先执行 npm run build');
  process.exit(1);
}
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

if (urls.length === 0) {
  console.error('❌ 没有从 sitemap 中解析到任何 URL');
  process.exit(1);
}
console.log(`📦 共解析到 ${urls.length} 个 URL，开始推送到百度...`);

// 2. POST 到百度接口
const postData = urls.join('\n');
const api = `http://data.zz.baidu.com/urls?site=${SITE_HOST}&token=${TOKEN}`;
const u = new URL(api);
const req = http.request(
  {
    hostname: u.hostname,
    path: u.pathname + u.search,
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(postData),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (d) => (body += d));
    res.on('end', () => {
      console.log('HTTP 状态码:', res.statusCode);
      console.log('百度返回:', body);
      // 返回示例: {"remain":99998,"success":312} 或 {"error":401,"message":"token is not valid"}
    });
  }
);
req.on('error', (e) => {
  console.error('❌ 请求失败:', e.message);
  process.exit(1);
});
req.write(postData);
req.end();
