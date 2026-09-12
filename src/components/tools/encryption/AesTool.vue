<template>
  <div class="space-y-4">
    <TabView :tabs="['加密', '解密']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="encryptInput" label="输入明文" placeholder="请输入要加密的文本" :rows="4" show-count />
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">密钥 (Key)</label>
              <input v-model="key" type="text" placeholder="请输入密钥" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
            </div>
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">IV（可选）</label>
              <input v-model="iv" type="text" placeholder="留空则自动生成" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
            </div>
          </div>
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">密钥/IV 编码</label>
            <select v-model="keyEncoding" class="rounded-md border px-3 py-1.5 text-sm" >
              <option value="Auto">自动</option>
              <option value="Utf8">UTF-8</option>
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
            <span class="text-xs" style="color: var(--color-text-secondary);">选择密钥与 IV 的编码方式（当它们经过 Base64/Hex 编码时）</span>
          </div>
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">模式</label>
            <select v-model="mode" class="rounded-md border px-3 py-1.5 text-sm" >
              <option value="CBC">CBC</option>
              <option value="ECB">ECB</option>
              <option value="CTR">CTR</option>
              <option value="OFB">OFB</option>
              <option value="CFB">CFB</option>
            </select>
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">填充</label>
            <select v-model="padding" class="rounded-md border px-3 py-1.5 text-sm" >
              <option value="Pkcs7">PKCS7</option>
              <option value="ZeroPadding">ZeroPadding</option>
              <option value="NoPadding">NoPadding</option>
            </select>
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输出</label>
            <select v-model="outputFormat" class="rounded-md border px-3 py-1.5 text-sm" >
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="encrypt" class="btn-primary">
              加密
            </button>
          </div>
          <ErrorAlert :message="error" />
          <TextOutput v-model="encryptOutput" label="加密结果" :rows="4" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decryptInput" label="输入密文" placeholder="请输入要解密的密文（支持从 URL 复制的 %2B 这类编码形式）" :rows="4" show-count />
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">密钥 (Key)</label>
              <input v-model="decryptKey" type="text" placeholder="请输入密钥" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
            </div>
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">IV</label>
              <input v-model="decryptIv" type="text" placeholder="加密时使用的 IV" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
            </div>
          </div>
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">密钥/IV 编码</label>
            <select v-model="decryptKeyEncoding" class="rounded-md border px-3 py-1.5 text-sm" >
              <option value="Auto">自动</option>
              <option value="Utf8">UTF-8</option>
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
            <span class="text-xs" style="color: var(--color-text-secondary);">选择密钥与 IV 的编码方式（当它们经过 Base64/Hex 编码时）</span>
          </div>
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">模式</label>
            <select v-model="decryptMode" class="rounded-md border px-3 py-1.5 text-sm" >
              <option value="CBC">CBC</option>
              <option value="ECB">ECB</option>
              <option value="CTR">CTR</option>
              <option value="OFB">OFB</option>
              <option value="CFB">CFB</option>
            </select>
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输入格式</label>
            <select v-model="inputFormat" class="rounded-md border px-3 py-1.5 text-sm" >
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="decrypt" class="btn-primary">
              解密
            </button>
          </div>
          <ErrorAlert :message="decryptError" />
          <NoticeAlert :message="decryptNotice" />
          <TextOutput v-model="decryptOutput" label="解密结果" :rows="4" />
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CryptoJS from 'crypto-js';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';
import NoticeAlert from '../../common/NoticeAlert.vue';
import { normalizeCipherInput, describeCipherNormalization } from '../../../lib/cipher-input';

// 加密相关
const encryptInput = ref('');
const key = ref('');
const iv = ref('');
const keyEncoding = ref('Auto');
const mode = ref('CBC');
const padding = ref('Pkcs7');
const outputFormat = ref('Base64');
const encryptOutput = ref('');
const error = ref('');

// 解密相关
const decryptInput = ref('');
const decryptKey = ref('');
const decryptIv = ref('');
const decryptKeyEncoding = ref('Auto');
const decryptMode = ref('CBC');
const inputFormat = ref('Base64');
const decryptOutput = ref('');
const decryptError = ref('');
const decryptNotice = ref('');

function getMode(name: string) {
  const modes: Record<string, any> = {
    CBC: CryptoJS.mode.CBC,
    ECB: CryptoJS.mode.ECB,
    CTR: CryptoJS.mode.CTR,
    OFB: CryptoJS.mode.OFB,
    CFB: CryptoJS.mode.CFB,
  };
  return modes[name] || CryptoJS.mode.CBC;
}

function getPadding(name: string) {
  const paddings: Record<string, any> = {
    Pkcs7: CryptoJS.pad.Pkcs7,
    ZeroPadding: CryptoJS.pad.ZeroPadding,
    NoPadding: CryptoJS.pad.NoPadding,
  };
  return paddings[name] || CryptoJS.pad.Pkcs7;
}

/** 自动判断密钥 / IV 的编码：
 *  - 纯十六进制且长度为偶数 → Hex
 *  - 形似 Base64（允许 JSON 转义的 \/ 这类字符）→ Base64
 *  - 其它 → UTF-8（直接当文本转字节）
 *  说明：形如 "mysecretkey1234" 的全字母数字串会优先判为 Base64，
 *  若你的密钥确实是 UTF-8 明文且被误判，请手动选 UTF-8。 */
function detectEncoding(value: string): string {
  const v = value.trim();
  if (!v) return 'Utf8';
  if (/^[0-9a-fA-F]+$/.test(v) && v.length % 2 === 0) return 'Hex';
  // 去掉 JSON 转义的 \ 后再判断是否为合法 Base64（长度需为 4 的倍数）
  const cleaned = v.replace(/\\/g, '');
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned) && cleaned.length % 4 === 0 && cleaned.length > 0) {
    return 'Base64';
  }
  return 'Utf8';
}

/** 按所选编码把密钥 / IV 解析为字节序列（WordArray）。
 *  Auto：自动判断编码；UTF-8 直接当文本；Base64/Hex 先解码为原始字节。
 *  Base64/Hex 中反斜杠是非法字符，几乎都来自「从 JSON 复制时 \/ 这类转义」，
 *  直接剔除可避免密钥被静默改坏导致解密失败。 */
function parseSecret(value: string, encoding: string): CryptoJS.lib.WordArray {
  const enc = encoding === 'Auto' ? detectEncoding(value) : encoding;
  const v = enc === 'Base64' || enc === 'Hex' ? value.replace(/\\/g, '') : value;
  switch (enc) {
    case 'Base64':
      return CryptoJS.enc.Base64.parse(v);
    case 'Hex':
      return CryptoJS.enc.Hex.parse(v);
    default:
      return CryptoJS.enc.Utf8.parse(v);
  }
}

function encrypt() {
  error.value = '';
  try {
    const keyHex = parseSecret(key.value, keyEncoding.value);
    const ivHex = iv.value ? parseSecret(iv.value, keyEncoding.value) : undefined;
    const encrypted = CryptoJS.AES.encrypt(encryptInput.value, keyHex, {
      mode: getMode(mode.value),
      padding: getPadding(padding.value),
      iv: ivHex,
    });
    encryptOutput.value = outputFormat.value === 'Base64' ? encrypted.toString() : encrypted.ciphertext.toString();
  } catch (e: any) {
    error.value = '加密失败: ' + e.message;
  }
}

function decrypt() {
  decryptError.value = '';
  decryptNotice.value = '';
  try {
    const keyHex = parseSecret(decryptKey.value, decryptKeyEncoding.value);
    const ivHex = decryptIv.value ? parseSecret(decryptIv.value, decryptKeyEncoding.value) : undefined;
    const isBase64 = inputFormat.value === 'Base64';

    const { value: cipherText, notes } = normalizeCipherInput(decryptInput.value, isBase64);
    decryptNotice.value = describeCipherNormalization(notes);

    let cipherParams: CryptoJS.lib.CipherParams;
    if (isBase64) {
      cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(cipherText),
      });
    } else {
      cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Hex.parse(cipherText),
      });
    }

    const decrypted = CryptoJS.AES.decrypt(cipherParams, keyHex, {
      mode: getMode(decryptMode.value),
      padding: CryptoJS.pad.Pkcs7,
      iv: ivHex,
    });
    decryptOutput.value = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptOutput.value) {
      decryptError.value = '解密失败: 可能密钥、IV 或模式不正确；若密文来自 URL，请确认它是完整且未被二次转义的';
    }
  } catch (e: any) {
    decryptError.value = '解密失败: ' + e.message;
  }
}
</script>
