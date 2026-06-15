<template>
  <div class="space-y-4">
    <TabView :tabs="['加密', '解密']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="encryptInput" label="输入明文" placeholder="请输入要加密的文本" :rows="4" show-count />
          <TextInput v-model="publicKey" label="公钥 (PEM 格式)" placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----" :rows="6" />
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
          <TextInput v-model="decryptInput" label="输入密文" placeholder="请输入要解密的密文 (Base64)" :rows="4" show-count />
          <TextInput v-model="privateKey" label="私钥 (PEM 格式)" placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----" :rows="6" />
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

const decryptInput = ref('');
const privateKey = ref('');
const decryptOutput = ref('');
const decryptError = ref('');

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
    const pubKey = forge.pki.publicKeyFromPem(publicKey.value.trim());
    const encrypted = pubKey.encrypt(encryptInput.value, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
    });
    encryptOutput.value = forge.util.encode64(encrypted);
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
    const decoded = forge.util.decode64(decryptInput.value.trim());
    const decrypted = privKey.decrypt(decoded, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
    });
    decryptOutput.value = decrypted;
  } catch (e: any) {
    decryptError.value = '解密失败: ' + e.message;
  }
}
</script>
