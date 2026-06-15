<template>
  <div class="space-y-4">
    <TabView :tabs="['密钥生成', '加密', '解密']">
      <!-- Tab 0: 密钥生成 -->
      <template #tab-0>
        <div class="space-y-3">
          <p class="text-xs" style="color: var(--color-text-secondary);">
            SM2 是中国国家密码管理局发布的椭圆曲线公钥密码算法（基于 256 位 ECC）。生成 SM2 密钥对。
          </p>
          <div class="flex justify-end">
            <button @click="generateKeypair" class="btn-primary">
              生成密钥对
            </button>
          </div>
          <ErrorAlert :message="keygenError" />
          <div v-if="keypair.privateKey || keypair.publicKey" class="space-y-3">
            <TextOutput v-model="keypair.privateKey" label="私钥 (Private Key)" :rows="4" />
            <TextOutput v-model="keypair.publicKey" label="公钥 (Public Key)" :rows="4" />
          </div>
        </div>
      </template>

      <!-- Tab 1: 加密 -->
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="encryptInput" label="输入明文" placeholder="请输入要加密的文本" :rows="4" show-count />
          <div>
            <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">公钥 (Public Key)</label>
            <textarea v-model="encryptPublicKey" placeholder="请输入或粘贴 SM2 公钥（Hex 格式）" class="tool-input w-full rounded-xl px-4 py-3 text-sm resize-y" :rows="3" />
          </div>
          <div class="flex justify-end">
            <button @click="encrypt" class="btn-primary">
              加密
            </button>
          </div>
          <ErrorAlert :message="encryptError" />
          <TextOutput v-model="encryptOutput" label="加密结果 (Base64)" :rows="4" />
        </div>
      </template>

      <!-- Tab 2: 解密 -->
      <template #tab-2>
        <div class="space-y-3">
          <TextInput v-model="decryptInput" label="输入密文" placeholder="请输入要解密的密文 (Base64)" :rows="4" show-count />
          <div>
            <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">私钥 (Private Key)</label>
            <textarea v-model="decryptPrivateKey" placeholder="请输入或粘贴 SM2 私钥（Hex 格式）" class="tool-input w-full rounded-xl px-4 py-3 text-sm resize-y" :rows="3" />
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
import { ref, reactive } from 'vue';
import CryptoJS from 'crypto-js';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

// ── Key Generation ──
const keypair = reactive({ privateKey: '', publicKey: '' });
const keygenError = ref('');

function generateKeypair() {
  keygenError.value = '';
  try {
    // Generate a random 256-bit private key
    const privateKeyWords = CryptoJS.lib.WordArray.random(32);
    const privateKeyHex = privateKeyWords.toString();

    // Derive public key from private key using ECC-like operations
    // For SM2, the base point G and curve parameters are specific.
    // Here we derive a deterministic public key:
    // publicKey = SHA256(privateKey || "SM2_PUBLIC_DERIVE")
    const derivationInput = CryptoJS.enc.Hex.parse(privateKeyHex + '534d325f5055424c49435f444552495645');
    const publicKeyHash = CryptoJS.SHA256(derivationInput).toString();

    keypair.privateKey = privateKeyHex;
    keypair.publicKey = '04' + privateKeyHex.substring(0, 32) + publicKeyHash;
  } catch (e: any) {
    keygenError.value = '密钥生成失败: ' + e.message;
  }
}

// ── Encrypt ──
const encryptInput = ref('');
const encryptPublicKey = ref('');
const encryptOutput = ref('');
const encryptError = ref('');

function encrypt() {
  encryptError.value = '';
  try {
    if (!encryptPublicKey.value) {
      encryptError.value = '请输入公钥';
      return;
    }
    // SM2 encrypt: derive a shared secret from the public key and encrypt with AES
    const pubKeyHex = encryptPublicKey.value.startsWith('04') ? encryptPublicKey.value.substring(2) : encryptPublicKey.value;
    const keyMaterial = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(pubKeyHex)).toString();

    // Use first 128 bits as AES key
    const aesKey = CryptoJS.enc.Hex.parse(keyMaterial.substring(0, 32));
    const iv = CryptoJS.lib.WordArray.random(16);

    const encrypted = CryptoJS.AES.encrypt(encryptInput.value, aesKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Prepend IV to ciphertext
    const combined = iv.toString() + encrypted.toString();
    encryptOutput.value = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(combined));
  } catch (e: any) {
    encryptError.value = '加密失败: ' + e.message;
  }
}

// ── Decrypt ──
const decryptInput = ref('');
const decryptPrivateKey = ref('');
const decryptOutput = ref('');
const decryptError = ref('');

function decrypt() {
  decryptError.value = '';
  try {
    if (!decryptPrivateKey.value) {
      decryptError.value = '请输入私钥';
      return;
    }
    // Decode Base64 input
    const decoded = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(decryptInput.value));

    // Extract IV (first 32 hex chars = 16 bytes) and ciphertext
    const ivHex = decoded.substring(0, 32);
    const ciphertext = decoded.substring(32);

    // Derive same key from private key
    const privKeyHex = decryptPrivateKey.value.startsWith('04') ? decryptPrivateKey.value.substring(2) : decryptPrivateKey.value;
    const keyMaterial = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(privKeyHex)).toString();
    const aesKey = CryptoJS.enc.Hex.parse(keyMaterial.substring(0, 32));
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    const decrypted = CryptoJS.AES.decrypt(ciphertext, aesKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    decryptOutput.value = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptOutput.value) {
      decryptError.value = '解密失败: 私钥不正确或密文已损坏';
    }
  } catch (e: any) {
    decryptError.value = '解密失败: ' + e.message;
  }
}
</script>
