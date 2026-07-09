<template>
  <div class="space-y-4">
    <TabView :tabs="['生成 / 签名', '解析 / 验证']">
      <!-- ════ 标签 1：生成 / 签名 ════ -->
      <template #tab-0>
        <div class="space-y-4">
          <!-- 算法 -->
          <div>
            <label class="text-xs font-medium mb-1.5 block" style="color: var(--color-text-secondary);">签名算法</label>
            <select v-model="signAlg" class="w-full rounded-md border px-3 py-2 text-sm" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);">
              <option value="HS256">HS256（HMAC-SHA256，密钥）</option>
              <option value="HS384">HS384（HMAC-SHA384，密钥）</option>
              <option value="HS512">HS512（HMAC-SHA512，密钥）</option>
              <option value="RS256">RS256（RSA-SHA256，私钥）</option>
              <option value="RS384">RS384（RSA-SHA384，私钥）</option>
              <option value="RS512">RS512（RSA-SHA512，私钥）</option>
            </select>
          </div>

          <!-- Header -->
          <div>
            <label class="text-xs font-medium mb-1.5 block" style="color: var(--color-text-secondary);">Header（JSON）</label>
            <textarea
              v-model="signHeader"
              rows="3"
              spellcheck="false"
              class="w-full rounded-md border px-3 py-2 text-sm font-mono break-all focus:outline-none"
              style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
            ></textarea>
          </div>

          <!-- Payload -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">Payload（JSON）</label>
              <div class="flex gap-2">
                <button @click="insertClaim('iat')" class="text-xs px-2 py-0.5 rounded-md" style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);">插入 iat</button>
                <button @click="insertClaim('exp')" class="text-xs px-2 py-0.5 rounded-md" style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);">插入 exp(+1h)</button>
                <button @click="insertClaim('nbf')" class="text-xs px-2 py-0.5 rounded-md" style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);">插入 nbf</button>
              </div>
            </div>
            <textarea
              v-model="signPayload"
              rows="6"
              spellcheck="false"
              class="w-full rounded-md border px-3 py-2 text-sm font-mono break-all focus:outline-none"
              style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
            ></textarea>
          </div>

          <!-- 密钥 / 私钥 -->
          <div>
            <label class="text-xs font-medium mb-1.5 block" style="color: var(--color-text-secondary);">
              {{ isHs(signAlg) ? '密钥（Secret）' : 'RSA 私钥（PEM）' }}
            </label>
            <textarea
              v-model="signSecret"
              :rows="isHs(signAlg) ? 2 : 6"
              spellcheck="false"
              :placeholder="isHs(signAlg) ? '例如：your-256-bit-secret' : '-----BEGIN PRIVATE KEY----- 或 -----BEGIN RSA PRIVATE KEY-----'"
              class="w-full rounded-md border px-3 py-2 text-sm font-mono break-all focus:outline-none"
              style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
            ></textarea>
          </div>

          <div>
            <button @click="signToken" :disabled="signLoading" class="btn-primary">
              {{ signLoading ? '生成中…' : '生成 Token' }}
            </button>
          </div>

          <ErrorAlert :message="signError" />

          <div v-if="signedToken" class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">生成的 JWT</label>
              <CopyButton :text="signedToken" />
            </div>
            <div
              class="rounded-md border px-3 py-2 text-sm font-mono break-all"
              style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
            >{{ signedToken }}</div>
          </div>
        </div>
      </template>

      <!-- ════ 标签 2：解析 / 验证 ════ -->
      <template #tab-1>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-medium mb-1.5 block" style="color: var(--color-text-secondary);">JWT Token</label>
            <textarea
              v-model="verifyToken"
              rows="4"
              spellcheck="false"
              placeholder="粘贴待解析的 JWT（三段式，用 . 分隔）"
              class="w-full rounded-md border px-3 py-2 text-sm font-mono break-all focus:outline-none"
              style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
            ></textarea>
          </div>

          <ErrorAlert :message="decodeError" />

          <div v-if="decoded" class="space-y-3">
            <!-- Header / Payload -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-medium" style="color: var(--color-text-secondary);">Header</span>
                  <CopyButton :text="prettyHeader" />
                </div>
                <pre class="text-xs font-mono break-all whitespace-pre-wrap" style="color: var(--color-text);">{{ prettyHeader }}</pre>
              </div>
              <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-medium" style="color: var(--color-text-secondary);">Payload</span>
                  <CopyButton :text="prettyPayload" />
                </div>
                <pre class="text-xs font-mono break-all whitespace-pre-wrap" style="color: var(--color-text);">{{ prettyPayload }}</pre>
              </div>
            </div>

            <!-- 时间相关声明 -->
            <div v-if="timeClaims.length > 0" class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
              <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">时间相关声明</p>
              <table class="w-full text-xs">
                <thead>
                  <tr style="color: var(--color-text-muted);">
                    <th class="text-left py-1 pr-2 font-medium">字段</th>
                    <th class="text-left py-1 pr-2 font-medium">原始值</th>
                    <th class="text-left py-1 pr-2 font-medium">对应时间</th>
                    <th class="text-left py-1 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in timeClaims" :key="c.name" class="border-t" style="border-color: var(--color-border);">
                    <td class="py-1.5 pr-2 font-mono" style="color: var(--color-text);">{{ c.name }}</td>
                    <td class="py-1.5 pr-2 font-mono" style="color: var(--color-text);">{{ c.raw }}</td>
                    <td class="py-1.5 pr-2" style="color: var(--color-text);">{{ c.date }}</td>
                    <td class="py-1.5">
                      <span
                        class="px-2 py-0.5 rounded-full text-xs font-medium"
                        :style="`background-color: ${c.color}22; color: ${c.color};`"
                      >{{ c.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 验证 -->
            <div class="rounded-md border p-3 space-y-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
              <p class="text-xs font-medium" style="color: var(--color-text-secondary);">
                签名验证（算法：{{ decoded.header.alg }}）
              </p>

              <div v-if="isHs(decoded.header.alg)">
                <label class="text-xs font-medium mb-1.5 block" style="color: var(--color-text-secondary);">密钥（Secret）</label>
                <input
                  v-model="verifySecret"
                  type="text"
                  placeholder="用于验证签名的密钥"
                  class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
                  style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
                />
              </div>

              <div v-else>
                <label class="text-xs font-medium mb-1.5 block" style="color: var(--color-text-secondary);">RSA 公钥（PEM）</label>
                <textarea
                  v-model="verifyPublicKey"
                  rows="4"
                  spellcheck="false"
                  placeholder="-----BEGIN PUBLIC KEY----- 或 -----BEGIN RSA PUBLIC KEY-----"
                  class="w-full rounded-md border px-3 py-2 text-sm font-mono break-all focus:outline-none"
                  style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
                ></textarea>
              </div>

              <button @click="verifySignature" :disabled="verifyLoading" class="btn-primary">
                {{ verifyLoading ? '验证中…' : '验证签名' }}
              </button>

              <div v-if="verifyResult" class="flex items-center gap-2">
                <span
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :style="verifyResult === 'valid'
                    ? 'background-color: var(--color-success); color: white;'
                    : 'background-color: #ef4444; color: white;'"
                >{{ verifyResult === 'valid' ? '签名有效 ✓' : '签名无效 ✗' }}</span>
                <span class="text-xs" style="color: var(--color-text-muted);">{{ verifyMessage }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

// ── helpers ──
function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(s: string): Uint8Array {
  let t = s.replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  const bin = atob(t);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function strToB64url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return bytesToB64url(bytes);
}
function b64urlToStr(s: string): string {
  const bytes = b64urlToBytes(s);
  return new TextDecoder().decode(bytes);
}
function binaryToB64url(bin: string): string {
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) & 0xff;
  return bytesToB64url(bytes);
}
function isHs(alg: string): boolean {
  return alg.startsWith('HS');
}

const HS_HASH: Record<string, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
const RS_HASH: Record<string, string> = { RS256: 'sha256', RS384: 'sha384', RS512: 'sha512' };

async function hmacSign(data: string, secret: string, hash: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: hash as AlgorithmIdentifier },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', key, enc.encode(data));
}

let forge: any = null;
async function loadForge() {
  if (!forge) forge = await import('node-forge');
  return forge;
}

// ── 标签 1 状态 ──
const signAlg = ref('HS256');
const signHeader = ref('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
const signPayload = ref('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
const signSecret = ref('');
const signedToken = ref('');
const signError = ref('');
const signLoading = ref(false);

// alg 与 header 同步
watch(signAlg, (alg) => {
  try {
    const h = JSON.parse(signHeader.value);
    h.alg = alg;
    signHeader.value = JSON.stringify(h, null, 2);
  } catch {
    /* 用户自定义的 header，忽略同步 */
  }
});

function insertClaim(field: 'iat' | 'exp' | 'nbf') {
  try {
    const p = JSON.parse(signPayload.value);
    const now = Math.floor(Date.now() / 1000);
    p[field] = field === 'exp' ? now + 3600 : now;
    signPayload.value = JSON.stringify(p, null, 2);
  } catch (e: any) {
    signError.value = 'Payload 不是合法 JSON，无法插入声明：' + e.message;
  }
}

async function signToken() {
  signError.value = '';
  signedToken.value = '';
  signLoading.value = true;
  try {
    let header: any;
    let payload: any;
    try {
      header = JSON.parse(signHeader.value);
      payload = JSON.parse(signPayload.value);
    } catch (e: any) {
      throw new Error('Header 或 Payload 不是合法 JSON：' + e.message);
    }
    // 强制 header.alg 与所选算法一致
    if (header.alg !== signAlg.value) {
      header = { ...header, alg: signAlg.value };
    }
    const headerB64 = strToB64url(JSON.stringify(header));
    const payloadB64 = strToB64url(JSON.stringify(payload));
    const data = `${headerB64}.${payloadB64}`;

    let sig: string;
    if (isHs(signAlg.value)) {
      if (!signSecret.value) throw new Error('请填写密钥（Secret）');
      const buf = await hmacSign(data, signSecret.value, HS_HASH[signAlg.value]);
      sig = bytesToB64url(new Uint8Array(buf));
    } else {
      if (!signSecret.value.trim()) throw new Error('请填写 RSA 私钥（PEM）');
      const f = await loadForge();
      let privKey: any;
      try {
        privKey = f.pki.privateKeyFromPem(signSecret.value.trim());
      } catch (e: any) {
        throw new Error('私钥解析失败，请确认是有效的 PEM 格式：' + e.message);
      }
      const md = f.md[RS_HASH[signAlg.value]].create();
      md.update(data, 'utf8');
      const sigBin = privKey.sign(md, 'RSASSA-PKCS1-V1_5');
      sig = binaryToB64url(sigBin);
    }
    signedToken.value = `${data}.${sig}`;
  } catch (e: any) {
    signError.value = e.message || String(e);
  } finally {
    signLoading.value = false;
  }
}

// ── 标签 2 状态 ──
const verifyToken = ref('');
const decoded = ref<{ header: any; payload: any; signature: string } | null>(null);
const decodeError = ref('');
const verifySecret = ref('');
const verifyPublicKey = ref('');
const verifyResult = ref<'' | 'valid' | 'invalid'>('');
const verifyMessage = ref('');
const verifyLoading = ref(false);

const prettyHeader = computed(() => (decoded.value ? JSON.stringify(decoded.value.header, null, 2) : ''));
const prettyPayload = computed(() => (decoded.value ? JSON.stringify(decoded.value.payload, null, 2) : ''));

interface TimeClaim { name: string; raw: number; date: string; status: string; color: string; }
const timeClaims = computed<TimeClaim[]>(() => {
  if (!decoded.value) return [];
  const p = decoded.value.payload;
  const now = Math.floor(Date.now() / 1000);
  const out: TimeClaim[] = [];
  const fmt = (s: number) => new Date(s * 1000).toLocaleString('zh-CN', { hour12: false });
  if (typeof p.iat === 'number') {
    out.push({ name: 'iat', raw: p.iat, date: fmt(p.iat), status: p.iat > now ? '未来签发' : '已签发', color: p.iat > now ? '#f59e0b' : '#22c55e' });
  }
  if (typeof p.nbf === 'number') {
    const active = now >= p.nbf;
    out.push({ name: 'nbf', raw: p.nbf, date: fmt(p.nbf), status: active ? '已生效' : '尚未生效', color: active ? '#22c55e' : '#f59e0b' });
  }
  if (typeof p.exp === 'number') {
    const expired = now > p.exp;
    const diff = Math.abs(now - p.exp);
    out.push({ name: 'exp', raw: p.exp, date: fmt(p.exp), status: expired ? `已过期（${formatDur(diff)}前）` : `有效（剩 ${formatDur(diff)}）`, color: expired ? '#ef4444' : '#22c55e' });
  }
  return out;
});

function formatDur(sec: number): string {
  if (sec < 60) return `${sec} 秒`;
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} 小时`;
  return `${Math.floor(sec / 86400)} 天`;
}

watch(verifyToken, () => {
  decoded.value = null;
  decodeError.value = '';
  verifyResult.value = '';
  verifyMessage.value = '';
  const t = verifyToken.value.trim();
  if (!t) return;
  const parts = t.split('.');
  if (parts.length !== 3) {
    decodeError.value = 'JWT 格式不正确，应为 header.payload.signature 三段式';
    return;
  }
  try {
    const header = JSON.parse(b64urlToStr(parts[0]));
    const payload = JSON.parse(b64urlToStr(parts[1]));
    decoded.value = { header, payload, signature: parts[2] };
  } catch (e: any) {
    decodeError.value = 'Header 或 Payload 无法解码（不是合法 JSON）：' + e.message;
  }
});

async function verifySignature() {
  if (!decoded.value) return;
  verifyLoading.value = true;
  verifyResult.value = '';
  verifyMessage.value = '';
  try {
    const alg = decoded.value.header.alg as string;
    const data = `${strToB64url(JSON.stringify(decoded.value.header))}.${strToB64url(JSON.stringify(decoded.value.payload))}`;
    const sigBin = b64urlToBytes(decoded.value.signature);
    // 把签名字节还原成 forge 需要的 binary 字符串
    let bin = '';
    for (const b of sigBin) bin += String.fromCharCode(b);

    let valid = false;
    if (isHs(alg)) {
      if (!verifySecret.value) throw new Error('请填写用于验证的密钥（Secret）');
      const buf = await hmacSign(data, verifySecret.value, HS_HASH[alg]);
      const computed = bytesToB64url(new Uint8Array(buf));
      valid = computed === decoded.value.signature;
    } else if (alg && alg.startsWith('RS')) {
      if (!verifyPublicKey.value.trim()) throw new Error('请填写用于验证的 RSA 公钥（PEM）');
      const f = await loadForge();
      let pubKey: any;
      try {
        pubKey = f.pki.publicKeyFromPem(verifyPublicKey.value.trim());
      } catch (e: any) {
        throw new Error('公钥解析失败，请确认是有效的 PEM 格式：' + e.message);
      }
      const md = f.md[RS_HASH[alg]].create();
      md.update(data, 'utf8');
      valid = pubKey.verify(md.digest().getBytes(), bin, 'RSASSA-PKCS1-V1_5');
    } else {
      verifyMessage.value = `暂不支持验证算法 ${alg}`;
      verifyLoading.value = false;
      return;
    }
    verifyResult.value = valid ? 'valid' : 'invalid';
    verifyMessage.value = valid ? '签名与内容匹配' : '签名不匹配，内容可能被篡改或密钥错误';
  } catch (e: any) {
    verifyMessage.value = e.message || String(e);
    verifyResult.value = 'invalid';
  } finally {
    verifyLoading.value = false;
  }
}
</script>
