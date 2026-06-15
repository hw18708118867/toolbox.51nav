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
          <TextInput v-model="decryptInput" label="输入密文" placeholder="请输入要解密的密文" :rows="4" show-count />
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

// 加密相关
const encryptInput = ref('');
const key = ref('');
const iv = ref('');
const mode = ref('CBC');
const padding = ref('Pkcs7');
const outputFormat = ref('Base64');
const encryptOutput = ref('');
const error = ref('');

// 解密相关
const decryptInput = ref('');
const decryptKey = ref('');
const decryptIv = ref('');
const decryptMode = ref('CBC');
const inputFormat = ref('Base64');
const decryptOutput = ref('');
const decryptError = ref('');

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

function encrypt() {
  error.value = '';
  try {
    const keyHex = CryptoJS.enc.Utf8.parse(key.value);
    const ivHex = iv.value ? CryptoJS.enc.Utf8.parse(iv.value) : undefined;
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
  try {
    const keyHex = CryptoJS.enc.Utf8.parse(decryptKey.value);
    const ivHex = decryptIv.value ? CryptoJS.enc.Utf8.parse(decryptIv.value) : undefined;

    let cipherParams: CryptoJS.lib.CipherParams;
    if (inputFormat.value === 'Base64') {
      cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(decryptInput.value),
      });
    } else {
      cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Hex.parse(decryptInput.value),
      });
    }

    const decrypted = CryptoJS.AES.decrypt(cipherParams, keyHex, {
      mode: getMode(decryptMode.value),
      padding: CryptoJS.pad.Pkcs7,
      iv: ivHex,
    });
    decryptOutput.value = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptOutput.value) {
      decryptError.value = '解密失败: 可能密钥或 IV 不正确';
    }
  } catch (e: any) {
    decryptError.value = '解密失败: ' + e.message;
  }
}
</script>
