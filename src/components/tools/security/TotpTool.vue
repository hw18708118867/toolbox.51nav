<template>
  <div class="space-y-4">
    <!-- 密钥输入 -->
    <div>
      <label class="text-xs font-medium mb-1.5 block" style="color: var(--color-text-secondary);">Base32 密钥</label>
      <input
        v-model="secret"
        type="text"
        placeholder="请输入 Base32 编码的密钥"
        class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
        
      />
    </div>

    <!-- 配置选项 -->
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">算法</label>
        <select v-model="algorithm" class="w-full rounded-md border px-3 py-2 text-sm" >
          <option value="SHA-1">SHA-1</option>
          <option value="SHA-256">SHA-256</option>
          <option value="SHA-512">SHA-512</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">位数</label>
        <select v-model.number="digits" class="w-full rounded-md border px-3 py-2 text-sm" >
          <option :value="6">6 位</option>
          <option :value="8">8 位</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">周期（秒）</label>
        <select v-model.number="period" class="w-full rounded-md border px-3 py-2 text-sm" >
          <option :value="30">30</option>
          <option :value="60">60</option>
        </select>
      </div>
    </div>

    <!-- TOTP 码显示 -->
    <div v-if="totpCode" class="text-center space-y-3 py-4">
      <div class="text-4xl font-mono font-bold tracking-widest" style="color: var(--color-text);">
        {{ formattedCode }}
      </div>
      <!-- 倒计时进度条 -->
      <div class="mx-auto max-w-xs">
        <div class="h-2 rounded-full overflow-hidden" style="background-color: var(--color-bg-tertiary);">
          <div
            class="h-full rounded-full transition-all duration-1000"
            :style="`width: ${progressPercent}%; background-color: ${progressColor};`"
          />
        </div>
        <p class="text-xs mt-1" style="color: var(--color-text-muted);">{{ remainingSeconds }} 秒后刷新</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!totpCode && !error" class="text-center py-6">
      <p class="text-sm" style="color: var(--color-text-muted);">输入密钥后将自动生成 TOTP 验证码</p>
    </div>

    <ErrorAlert :message="error" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const secret = ref('');
const algorithm = ref('SHA-1');
const digits = ref(6);
const period = ref(30);
const totpCode = ref('');
const remainingSeconds = ref(0);
const error = ref('');
let timer: ReturnType<typeof setInterval> | null = null;

const formattedCode = computed(() => {
  if (!totpCode.value) return '';
  if (digits.value === 8) return totpCode.value;
  return totpCode.value.substring(0, 3) + ' ' + totpCode.value.substring(3);
});

const progressPercent = computed(() => {
  return (remainingSeconds.value / period.value) * 100;
});

const progressColor = computed(() => {
  if (remainingSeconds.value <= 5) return '#ef4444';
  if (remainingSeconds.value <= 10) return '#f59e0b';
  return 'var(--color-primary)';
});

function base32Decode(input: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let cleaned = input.toUpperCase().replace(/[\s=-]+/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (const char of cleaned) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((buffer >> bitsLeft) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

async function computeHMAC(key: Uint8Array, message: Uint8Array, algo: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: algo },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, message);
}

async function generateTOTP() {
  if (!secret.value) {
    totpCode.value = '';
    return;
  }

  try {
    error.value = '';
    const key = base32Decode(secret.value);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / period.value);

    // Convert counter to 8-byte big-endian buffer
    const counterBuf = new ArrayBuffer(8);
    const counterView = new DataView(counterBuf);
    counterView.setBigUint64(0, BigInt(counter));

    const hmacResult = await computeHMAC(key, new Uint8Array(counterBuf), algorithm.value);
    const hmacBytes = new Uint8Array(hmacResult);

    // Dynamic truncation
    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
    const binary =
      ((hmacBytes[offset] & 0x7f) << 24) |
      ((hmacBytes[offset + 1] & 0xff) << 16) |
      ((hmacBytes[offset + 2] & 0xff) << 8) |
      (hmacBytes[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits.value);
    totpCode.value = otp.toString().padStart(digits.value, '0');
  } catch (e: any) {
    error.value = '生成失败: ' + e.message;
    totpCode.value = '';
  }
}

function updateRemaining() {
  const epoch = Math.floor(Date.now() / 1000);
  remainingSeconds.value = period.value - (epoch % period.value);

  // Auto-regenerate when period resets
  if (remainingSeconds.value === period.value) {
    generateTOTP();
  }
}

watch([secret, algorithm, digits, period], () => {
  generateTOTP();
});

onMounted(() => {
  updateRemaining();
  generateTOTP();
  timer = setInterval(() => {
    updateRemaining();
  }, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>
