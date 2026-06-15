<template>
  <div class="space-y-4">
    <TabView :tabs="['加密', '解密', '密钥生成']">
      <!-- Tab 0: 加密 -->
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="encryptInput" label="输入明文" placeholder="请输入要加密的文本" :rows="4" show-count />
          <div class="space-y-3">
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">接收方公钥 (RSA Public Key PEM)</label>
              <textarea v-model="encryptPublicKey" placeholder="请输入或粘贴接收方的 RSA 公钥（PEM 格式）" class="tool-input w-full rounded-xl px-4 py-3 text-sm resize-y" :rows="3" />
            </div>
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">密码短语（可选，额外加密层）</label>
              <input v-model="encryptPassphrase" type="password" placeholder="留空则仅使用公钥加密" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
            </div>
          </div>
          <div class="flex justify-end">
            <button @click="encrypt" class="btn-primary">加密 (PGP 风格)</button>
          </div>
          <ErrorAlert :message="encryptError" />
          <TextOutput v-model="encryptOutput" label="加密结果 (ASCII Armor)" :rows="6" />
        </div>
      </template>

      <!-- Tab 1: 解密 -->
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decryptInput" label="输入密文" placeholder="请输入 PGP 加密后的文本（ASCII Armor）" :rows="4" show-count />
          <div class="space-y-3">
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">私钥 (RSA Private Key PEM)</label>
              <textarea v-model="decryptPrivateKey" placeholder="请输入或粘贴 RSA 私钥（PEM 格式）" class="tool-input w-full rounded-xl px-4 py-3 text-sm resize-y" :rows="3" />
            </div>
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">密码短语</label>
              <input v-model="decryptPassphrase" type="password" placeholder="加密时使用的密码短语" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
            </div>
          </div>
          <div class="flex justify-end">
            <button @click="decrypt" class="btn-primary">解密 (PGP 风格)</button>
          </div>
          <ErrorAlert :message="decryptError" />
          <TextOutput v-model="decryptOutput" label="解密结果" :rows="4" />
        </div>
      </template>

      <!-- Tab 2: 密钥生成 -->
      <template #tab-2>
        <div class="space-y-3">
          <p class="text-xs" style="color: var(--color-text-secondary);">
            生成 RSA 密钥对用于 PGP 加密。2048 位 RSA 密钥提供良好的安全性。
          </p>
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">密钥长度</label>
            <select v-model="keySize" class="rounded-md border px-3 py-1.5 text-sm">
              <option :value="1024">1024 位</option>
              <option :value="2048">2048 位</option>
              <option :value="4096">4096 位</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="generateKeypair" class="btn-primary">生成 PGP 密钥对</button>
          </div>
          <ErrorAlert :message="keygenError" />
          <div v-if="keypair.privateKey || keypair.publicKey" class="space-y-3">
            <TextOutput v-model="keypair.publicKey" label="公钥 (Public Key) - 用于加密" :rows="5" />
            <TextOutput v-model="keypair.privateKey" label="私钥 (Private Key) - 用于解密" :rows="5" />
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import forge from 'node-forge';
import CryptoJS from 'crypto-js';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

// ── Key Generation ──
const keySize = ref(2048);
const keypair = reactive({ privateKey: '', publicKey: '' });
const keygenError = ref('');

function generateKeypair() {
  keygenError.value = '';
  try {
    const rsaKeypair = forge.pki.rsa.generateKeyPair({ bits: keySize.value, workers: -1 });

    // If running without workers, generate synchronously
    const pubKeyPem = forge.pki.publicKeyToPem(rsaKeypair.publicKey);
    const privKeyPem = forge.pki.privateKeyToPem(rsaKeypair.privateKey);

    keypair.publicKey = pubKeyPem;
    keypair.privateKey = privKeyPem;
  } catch (e: any) {
    // Fallback: synchronous generation may block; use smaller key or simpler approach
    try {
      const rsaKeypair = forge.pki.rsa.generateKeyPair({ bits: keySize.value, workers: 0 });
      const pubKeyPem = forge.pki.publicKeyToPem(rsaKeypair.publicKey);
      const privKeyPem = forge.pki.privateKeyToPem(rsaKeypair.privateKey);
      keypair.publicKey = pubKeyPem;
      keypair.privateKey = privKeyPem;
    } catch (e2: any) {
      keygenError.value = '密钥生成失败: ' + e2.message;
    }
  }
}

// ── Encrypt ──
const encryptInput = ref('');
const encryptPublicKey = ref('');
const encryptPassphrase = ref('');
const encryptOutput = ref('');
const encryptError = ref('');

function armorEncode(data: string, label: string): string {
  const b64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data));
  const lines: string[] = [];
  lines.push(`-----BEGIN PGP ${label}-----`);
  lines.push('Version: WebTools PGP');
  lines.push('');
  for (let i = 0; i < b64.length; i += 64) {
    lines.push(b64.substring(i, i + 64));
  }
  const checksum = CryptoJS.CRC32(CryptoJS.enc.Utf8.parse(data)).toString();
  lines.push(`=${checksum}`);
  lines.push(`-----END PGP ${label}-----`);
  return lines.join('\n');
}

function armorDecode(armored: string): { data: string; label: string } | null {
  const lines = armored.trim().split('\n');
  let label = '';
  let b64Lines: string[] = [];
  let inBody = false;

  for (const line of lines) {
    if (line.startsWith('-----BEGIN PGP ')) {
      label = line.replace('-----BEGIN PGP ', '').replace('-----', '').trim();
      inBody = true;
      continue;
    }
    if (line.startsWith('-----END PGP ')) {
      break;
    }
    if (line.startsWith('Version:')) continue;
    if (line.startsWith('=')) continue; // checksum
    if (inBody && line.trim()) {
      b64Lines.push(line.trim());
    }
  }

  if (b64Lines.length === 0) return null;
  try {
    const b64 = b64Lines.join('');
    const data = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(b64));
    return { data, label };
  } catch {
    return null;
  }
}

function encrypt() {
  encryptError.value = '';
  encryptOutput.value = '';
  try {
    if (!encryptInput.value) { encryptError.value = '请输入明文'; return; }

    // Generate random session key
    const sessionKey = CryptoJS.lib.WordArray.random(32).toString();
    const iv = CryptoJS.lib.WordArray.random(16).toString();

    // Encrypt message with AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(encryptInput.value, CryptoJS.enc.Hex.parse(sessionKey), {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Encrypt session key with RSA public key
    let encryptedSessionKey = '';
    if (encryptPublicKey.value) {
      try {
        const pubKey = forge.pki.publicKeyFromPem(encryptPublicKey.value);
        const sessionKeyBytes = forge.util.hexToBytes(sessionKey);
        const ivBytes = forge.util.hexToBytes(iv);
        const combined = sessionKeyBytes + ivBytes;
        encryptedSessionKey = forge.util.encode64(
          pubKey.encrypt(combined, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
          })
        );
      } catch {
        // No valid public key provided, use passphrase-only mode
        encryptedSessionKey = '';
      }
    }

    // Apply passphrase if provided
    let finalEncrypted = encrypted.toString();
    if (encryptPassphrase.value) {
      const passKey = CryptoJS.PBKDF2(encryptPassphrase.value, CryptoJS.enc.Hex.parse(iv), {
        keySize: 256 / 32,
        iterations: 10000,
      });
      const passEncrypted = CryptoJS.AES.encrypt(finalEncrypted, passKey, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      finalEncrypted = passEncrypted.toString();
    }

    // Build payload
    const payload = JSON.stringify({
      v: 1,
      sessionKey: encryptedSessionKey,
      iv: iv,
      ciphertext: finalEncrypted,
      hasPassphrase: !!encryptPassphrase.value,
    });

    encryptOutput.value = armorEncode(payload, 'MESSAGE');
  } catch (e: any) {
    encryptError.value = '加密失败: ' + e.message;
  }
}

// ── Decrypt ──
const decryptInput = ref('');
const decryptPrivateKey = ref('');
const decryptPassphrase = ref('');
const decryptOutput = ref('');
const decryptError = ref('');

function decrypt() {
  decryptError.value = '';
  decryptOutput.value = '';
  try {
    if (!decryptInput.value) { decryptError.value = '请输入密文'; return; }

    // Try to decode armor
    let payloadStr = decryptInput.value;
    const decoded = armorDecode(decryptInput.value);
    if (decoded) {
      payloadStr = decoded.data;
    }

    let payload: any;
    try {
      payload = JSON.parse(payloadStr);
    } catch {
      decryptError.value = '解密失败: 密文格式不正确（不是有效的 PGP 消息）';
      return;
    }

    let { sessionKey, iv, ciphertext, hasPassphrase } = payload;
    let sessionKeyHex = '';
    let ivHex = iv || '';

    // Decrypt session key with RSA private key
    if (sessionKey && decryptPrivateKey.value) {
      try {
        const privKey = forge.pki.privateKeyFromPem(decryptPrivateKey.value);
        const keyBytes = forge.util.decode64(sessionKey);
        const combined = privKey.decrypt(keyBytes, 'RSA-OAEP', {
          md: forge.md.sha256.create(),
        });
        sessionKeyHex = forge.util.bytesToHex(combined.substring(0, 32));
        ivHex = forge.util.bytesToHex(combined.substring(32, 48));
      } catch {
        decryptError.value = '解密失败: 私钥不正确或私钥不匹配';
        return;
      }
    }

    // Remove passphrase layer if present
    let innerCiphertext = ciphertext;
    if (hasPassphrase) {
      if (!decryptPassphrase.value) {
        decryptError.value = '解密失败: 需要提供密码短语';
        return;
      }
      try {
        const passKey = CryptoJS.PBKDF2(decryptPassphrase.value, CryptoJS.enc.Hex.parse(ivHex), {
          keySize: 256 / 32,
          iterations: 10000,
        });
        const passDecrypted = CryptoJS.AES.decrypt(innerCiphertext, passKey, {
          iv: CryptoJS.enc.Hex.parse(ivHex),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        innerCiphertext = passDecrypted.toString();
        if (!innerCiphertext) {
          decryptError.value = '解密失败: 密码短语不正确';
          return;
        }
      } catch {
        decryptError.value = '解密失败: 密码短语解密出错';
        return;
      }
    }

    // If we have a session key, decrypt the inner layer
    if (sessionKeyHex) {
      const decrypted = CryptoJS.AES.decrypt(innerCiphertext, CryptoJS.enc.Hex.parse(sessionKeyHex), {
        iv: CryptoJS.enc.Hex.parse(ivHex),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      decryptOutput.value = decrypted.toString(CryptoJS.enc.Utf8);
    } else if (hasPassphrase) {
      // Only passphrase was used, the innerCiphertext is the actual message
      decryptOutput.value = innerCiphertext;
    } else {
      decryptError.value = '解密失败: 无法解密（缺少密钥信息）';
      return;
    }

    if (!decryptOutput.value) {
      decryptError.value = '解密失败: 密钥或密码不正确';
    }
  } catch (e: any) {
    decryptError.value = '解密失败: ' + e.message;
  }
}
</script>
