<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">密钥长度</label>
        <select v-model="keySize" :disabled="generating" class="rounded-md border px-3 py-2 text-sm" >
          <option :value="1024">1024 位</option>
          <option :value="2048">2048 位</option>
          <option :value="4096">4096 位</option>
        </select>
      </div>
      <div class="pt-4">
        <button @click="generateKeyPair" :disabled="generating || forgeLoading" class="btn-primary">
          {{ generating ? '生成中...' : (forgeLoading ? '加载中...' : '生成密钥对') }}
        </button>
      </div>
    </div>

    <ErrorAlert :message="error" />

    <div v-if="generating" class="flex items-center gap-2 text-sm" style="color: var(--color-text-secondary);">
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25" />
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
      </svg>
      正在生成密钥对，请稍候（可能需要较长时间）...
    </div>

    <div v-if="publicKeyPem" class="space-y-3">
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-medium" style="color: var(--color-text-secondary);">公钥 (PEM)</label>
          <CopyButton :text="publicKeyPem" />
        </div>
        <textarea
          :value="publicKeyPem"
          readonly
          :rows="6"
          class="tool-input w-full rounded-md border px-3 py-2 text-sm resize-y"
          style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-medium" style="color: var(--color-text-secondary);">私钥 (PEM)</label>
          <CopyButton :text="privateKeyPem" />
        </div>
        <textarea
          :value="privateKeyPem"
          readonly
          :rows="10"
          class="tool-input w-full rounded-md border px-3 py-2 text-sm resize-y"
          style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const keySize = ref(2048);
const publicKeyPem = ref('');
const privateKeyPem = ref('');
const generating = ref(false);
const error = ref('');
const forgeLoading = ref(true);

let forge: any = null;

onMounted(async () => {
  try {
    forge = await import('node-forge');
  } catch (e: any) {
    error.value = '加载加密库失败: ' + e.message;
  } finally {
    forgeLoading.value = false;
  }
});

function generateKeyPair() {
  if (!forge) {
    error.value = '加密库尚未加载完成';
    return;
  }
  error.value = '';
  publicKeyPem.value = '';
  privateKeyPem.value = '';
  generating.value = true;

  // Use setTimeout to allow UI to update before blocking key generation
  setTimeout(() => {
    try {
      const keypair = forge.pki.rsa.generateKeyPair({ bits: keySize.value });
      publicKeyPem.value = forge.pki.publicKeyToPem(keypair.publicKey);
      privateKeyPem.value = forge.pki.privateKeyToPem(keypair.privateKey);
    } catch (e: any) {
      error.value = '生成密钥对失败: ' + e.message;
    } finally {
      generating.value = false;
    }
  }, 50);
}
</script>
