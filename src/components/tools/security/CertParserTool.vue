<template>
  <div class="space-y-4">
    <!-- PEM 证书输入 -->
    <TextInput v-model="certInput" label="PEM 证书" placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----" :rows="8" show-count />

    <!-- 解析按钮 -->
    <div class="flex justify-end">
      <button @click="parseCert" :disabled="forgeLoading" class="btn-primary">
        {{ forgeLoading ? '加载中...' : '解析' }}
      </button>
    </div>

    <ErrorAlert :message="error" />

    <!-- 解析结果 -->
    <div v-if="certInfo" class="space-y-3">
      <!-- 过期状态 -->
      <div
        v-if="certInfo.isExpired"
        class="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span>该证书已过期</span>
      </div>
      <div
        v-else
        class="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        style="background-color: #f0fdf4; border-color: #bbf7d0; color: #166534;"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>该证书在有效期内</span>
      </div>

      <!-- 证书信息表格 -->
      <div class="rounded-lg border overflow-hidden" style="border-color: var(--color-border);">
        <table class="w-full text-sm">
          <tbody>
            <tr v-for="field in certFields" :key="field.label" class="border-b last:border-b-0" style="border-color: var(--color-border);">
              <td class="px-4 py-2.5 font-medium whitespace-nowrap w-36" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">{{ field.label }}</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">
                <div class="flex items-center gap-2">
                  <span class="break-all font-mono text-xs">{{ field.value }}</span>
                  <CopyButton v-if="field.value" :text="field.value" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import TextInput from '../../common/TextInput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const certInput = ref('');
const error = ref('');
const forgeLoading = ref(true);

interface CertInfo {
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  isExpired: boolean;
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  keySize: string;
}

const certInfo = ref<CertInfo | null>(null);

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

const certFields = computed(() => {
  if (!certInfo.value) return [];
  return [
    { label: '主题 (Subject)', value: certInfo.value.subject },
    { label: '颁发者 (Issuer)', value: certInfo.value.issuer },
    { label: '序列号', value: certInfo.value.serialNumber },
    { label: '生效时间', value: certInfo.value.validFrom },
    { label: '过期时间', value: certInfo.value.validTo },
    { label: '签名算法', value: certInfo.value.signatureAlgorithm },
    { label: '公钥算法', value: certInfo.value.publicKeyAlgorithm },
    { label: '密钥长度', value: certInfo.value.keySize },
  ];
});

function parseCert() {
  if (!forge) {
    error.value = '加密库尚未加载完成';
    return;
  }
  error.value = '';
  certInfo.value = null;

  if (!certInput.value.trim()) {
    error.value = '请输入 PEM 证书';
    return;
  }

  try {
    const cert = forge.pki.certificateFromPem(certInput.value.trim());

    const now = new Date();
    const notAfter = cert.validity.notAfter;
    const isExpired = now > notAfter;

    // Determine public key algorithm and key size
    let publicKeyAlgorithm = '未知';
    let keySize = '未知';

    try {
      const pubKey = cert.publicKey;
      if (pubKey) {
        if (pubKey.n) {
          // RSA key
          publicKeyAlgorithm = 'RSA';
          keySize = pubKey.n.bitLength() + ' 位';
        } else if (pubKey.pub) {
          // EC key (node-forge representation)
          publicKeyAlgorithm = 'EC';
          keySize = 'EC';
        }
      }
    } catch {
      // Ignore errors in key analysis
    }

    // Determine signature algorithm
    let signatureAlgorithm = '未知';
    const sigOid = cert.siginfo?.algorithmOid;
    if (sigOid) {
      const oidMap: Record<string, string> = {
        '1.2.840.113549.1.1.5': 'SHA-1 with RSA',
        '1.2.840.113549.1.1.11': 'SHA-256 with RSA',
        '1.2.840.113549.1.1.12': 'SHA-384 with RSA',
        '1.2.840.113549.1.1.13': 'SHA-512 with RSA',
        '1.2.840.10045.4.3.2': 'ECDSA with SHA-256',
        '1.2.840.10045.4.3.3': 'ECDSA with SHA-384',
      };
      signatureAlgorithm = oidMap[sigOid] || sigOid;
    }

    certInfo.value = {
      subject: cert.subject.attributes.map((a: any) => `${a.shortName || a.name}=${a.value}`).join(', '),
      issuer: cert.issuer.attributes.map((a: any) => `${a.shortName || a.name}=${a.value}`).join(', '),
      serialNumber: cert.serialNumber,
      validFrom: formatDate(cert.validity.notBefore),
      validTo: formatDate(cert.validity.notAfter),
      isExpired,
      signatureAlgorithm,
      publicKeyAlgorithm,
      keySize,
    };
  } catch (e: any) {
    error.value = '解析证书失败: ' + e.message;
  }
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}
</script>
