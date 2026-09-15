<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-4">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">填充方式</label>
      <select v-model="rsaScheme" class="rounded-md border px-3 py-1.5 text-sm">
        <option value="RSA-OAEP">RSA-OAEP</option>
        <option value="RSAES-PKCS1-V1_5">RSA PKCS#1 v1.5</option>
        <option value="NONE">无填充 (NoPadding / Raw)</option>
      </select>
      <template v-if="rsaScheme === 'RSA-OAEP'">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">OAEP 哈希</label>
        <select v-model="rsaHash" class="rounded-md border px-3 py-1.5 text-sm">
          <option value="sha1">SHA-1（OpenSSL 默认）</option>
          <option value="sha256">SHA-256</option>
          <option value="sha512">SHA-512</option>
        </select>
      </template>
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">字节序 (Vector)</label>
      <select v-model="rsaEndian" class="rounded-md border px-3 py-1.5 text-sm">
        <option value="normal">normal（大端）</option>
        <option value="reverse">reverse（小端）</option>
      </select>
    </div>
    <TabView :tabs="['加密', '解密']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="encryptInput" label="输入明文" placeholder="请输入要加密的文本" :rows="4" show-count />
          <TextInput v-model="publicKey" label="公钥 (PEM 格式)" placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----" :rows="6" />
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输出格式</label>
            <select v-model="encryptOutputFormat" class="rounded-md border px-3 py-1.5 text-sm">
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="doEncrypt" :disabled="forgeLoading" class="btn-primary">
              {{ forgeLoading ? '加载中...' : '加密' }}
            </button>
          </div>
          <ErrorAlert :message="encryptError" />
          <TextOutput v-model="encryptOutput" label="加密结果" :rows="4" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decryptInput" label="输入密文" placeholder="请输入要解密的密文" :rows="4" show-count />
          <TextInput v-model="privateKey" label="私钥 (PEM 格式)" placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----" :rows="6" />
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输入格式</label>
            <select v-model="decryptInputFormat" class="rounded-md border px-3 py-1.5 text-sm">
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="doDecrypt" :disabled="forgeLoading" class="btn-primary">
              {{ forgeLoading ? '加载中...' : '解密' }}
            </button>
          </div>
          <ErrorAlert :message="decryptError" />
          <TextOutput v-model="decryptOutput" label="解密结果" :rows="4" />
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const encryptInput = ref('');
const publicKey = ref('');
const encryptOutput = ref('');
const encryptError = ref('');
const encryptOutputFormat = ref('Base64');

const decryptInput = ref('');
const privateKey = ref('');
const decryptOutput = ref('');
const decryptError = ref('');
const decryptInputFormat = ref('Base64');

// 填充方式：RSA-OAEP（可配置哈希）/ RSA PKCS#1 v1.5
const rsaScheme = ref('RSA-OAEP');
const rsaHash = ref('sha256');
// 字节序（部分工具称为 Vector）：normal=大端，reverse=小端（反转明文/结果字节）
const rsaEndian = ref('normal');

const forgeLoading = ref(true);
let forge: any = null;

onMounted(async () => {
  try {
    forge = await import('node-forge');
  } catch (e: any) {
    encryptError.value = '加载加密库失败: ' + e.message;
  } finally {
    forgeLoading.value = false;
  }
});

function getForgeMd(name: string) {
  switch (name) {
    case 'sha1':
      return forge.md.sha1;
    case 'sha512':
      return forge.md.sha512;
    default:
      return forge.md.sha256;
  }
}

/** 反转字节序（用于 normal/reverse 字节序开关）。参数/结果均为 UTF-8 字节串。 */
function reverseBytes(b: string): string {
  return b.split('').reverse().join('');
}

/** 根据当前填充方式构造 node-forge 的加密参数。
 *  RSA-OAEP 需要同时指定摘要与 MGF1 的哈希（两者需一致，OpenSSL 默认 SHA-1）。 */
function buildSchemeOptions() {
  if (rsaScheme.value === 'RSA-OAEP') {
    const md = getForgeMd(rsaHash.value).create();
    return { md, mgf1: { md: getForgeMd(rsaHash.value).create() } };
  }
  return {};
}

function normalizePublicKeyPem(raw: string): string {
  const s = raw.trim();
  if (s.includes('-----BEGIN PUBLIC KEY-----') || s.includes('-----BEGIN RSA PUBLIC KEY-----')) {
    return s;
  }
  // 有些工具只粘贴 base64 主体，自动补 PEM 头；优先按 X.509 包装
  return '-----BEGIN PUBLIC KEY-----\n' + s + '\n-----END PUBLIC KEY-----';
}

function doEncrypt() {
  encryptError.value = '';
  encryptOutput.value = '';
  if (!forge) {
    encryptError.value = '加密库尚未加载完成';
    return;
  }
  if (!encryptInput.value) {
    encryptError.value = '请输入要加密的文本';
    return;
  }
  if (!publicKey.value) {
    encryptError.value = '请输入公钥';
    return;
  }
  try {
    const pubKey = forge.pki.publicKeyFromPem(normalizePublicKeyPem(publicKey.value));
    // 先转成 UTF-8 字节串，避免中文等非 ASCII 明文被当 Latin-1 处理而损坏
    let plainBytes = forge.util.encodeUtf8(encryptInput.value);
    // 无填充（Raw）模式要求明文恰好为密钥字节长度，长度不足时按大端左补 0
    if (rsaScheme.value === 'NONE') {
      const k = Math.ceil(pubKey.n.bitLength() / 8);
      if (plainBytes.length > k) {
        encryptError.value = `明文过长：无填充模式要求明文字节数不超过密钥长度（${k} 字节）`;
        return;
      }
      if (plainBytes.length < k) {
        plainBytes = '\0'.repeat(k - plainBytes.length) + plainBytes;
      }
    }
    if (rsaEndian.value === 'reverse') {
      plainBytes = reverseBytes(plainBytes);
    }
    const encrypted = pubKey.encrypt(plainBytes, rsaScheme.value, buildSchemeOptions());
    encryptOutput.value =
      encryptOutputFormat.value === 'Hex'
        ? forge.util.bytesToHex(encrypted)
        : forge.util.encode64(encrypted);
  } catch (e: any) {
    encryptError.value = '加密失败: ' + e.message;
  }
}

function doDecrypt() {
  decryptError.value = '';
  decryptOutput.value = '';
  if (!forge) {
    decryptError.value = '加密库尚未加载完成';
    return;
  }
  if (!decryptInput.value) {
    decryptError.value = '请输入要解密的密文';
    return;
  }
  if (!privateKey.value) {
    decryptError.value = '请输入私钥';
    return;
  }
  try {
    const privKey = forge.pki.privateKeyFromPem(privateKey.value.trim());
    const decoded =
      decryptInputFormat.value === 'Hex'
        ? forge.util.hexToBytes(decryptInput.value.trim())
        : forge.util.decode64(decryptInput.value.trim());
    const decrypted = privKey.decrypt(decoded, rsaScheme.value, buildSchemeOptions());
    // 无填充（Raw）模式解密结果是大端字节，需去掉前导 0 再还原文本
    let out = decrypted;
    if (rsaEndian.value === 'reverse') {
      out = reverseBytes(out);
    }
    if (rsaScheme.value === 'NONE') {
      let i = 0;
      while (i < out.length - 1 && out.charCodeAt(i) === 0) i++;
      out = out.slice(i);
    }
    // 解密结果是 UTF-8 字节串，转回可读文本（兼容纯 ASCII）
    decryptOutput.value = forge.util.decodeUtf8(out);
  } catch (e: any) {
    decryptError.value = '解密失败: ' + e.message;
  }
}
</script>
