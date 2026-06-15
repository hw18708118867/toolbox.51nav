<template>
  <div class="space-y-4">
    <TabView :tabs="['时间戳转日期', '日期转时间戳', '当前时间']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="timestampInput" label="输入时间戳" placeholder="如: 1700000000（秒）或 1700000000000（毫秒）" :rows="2" />
          <div class="flex justify-end">
            <button @click="tsToDate" class="btn-primary">转换</button>
          </div>
          <ErrorAlert :message="error" />
          <div v-if="dateResult" class="rounded-md border p-4 space-y-2" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <div class="flex justify-between text-sm"><span style="color: var(--color-text-secondary);">本地时间</span><span style="color: var(--color-text);">{{ dateResult.local }}</span></div>
            <div class="flex justify-between text-sm"><span style="color: var(--color-text-secondary);">UTC 时间</span><span style="color: var(--color-text);">{{ dateResult.utc }}</span></div>
            <div class="flex justify-between text-sm"><span style="color: var(--color-text-secondary);">ISO 格式</span><span style="color: var(--color-text);">{{ dateResult.iso }}</span></div>
            <div class="flex justify-between text-sm"><span style="color: var(--color-text-secondary);">相对时间</span><span style="color: var(--color-text);">{{ dateResult.relative }}</span></div>
          </div>
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <div class="space-y-2">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">选择日期时间</label>
            <input v-model="dateInput" type="datetime-local" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
          </div>
          <div class="flex justify-end">
            <button @click="dateToTs" class="btn-primary">转换</button>
          </div>
          <div v-if="tsResult" class="rounded-md border p-4 space-y-2" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <div class="flex justify-between items-center text-sm">
              <span style="color: var(--color-text-secondary);">秒级时间戳</span>
              <div class="flex items-center gap-2">
                <code style="color: var(--color-primary);">{{ tsResult.seconds }}</code>
                <CopyButton :text="tsResult.seconds" />
              </div>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span style="color: var(--color-text-secondary);">毫秒级时间戳</span>
              <div class="flex items-center gap-2">
                <code style="color: var(--color-primary);">{{ tsResult.millis }}</code>
                <CopyButton :text="tsResult.millis" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #tab-2>
        <div class="rounded-md border p-6 text-center space-y-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <div class="text-3xl font-mono font-bold" style="color: var(--color-primary);">{{ currentTime }}</div>
          <div class="text-sm" style="color: var(--color-text-secondary);">{{ currentDate }}</div>
          <div class="text-xs" style="color: var(--color-text-muted);">Unix 时间戳: {{ currentTs }}</div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';
import CopyButton from '../../common/CopyButton.vue';

const timestampInput = ref('');
const dateResult = ref<any>(null);
const error = ref('');

const dateInput = ref('');
const tsResult = ref<any>(null);

const currentTime = ref('');
const currentDate = ref('');
const currentTs = ref('');

let timer: ReturnType<typeof setInterval>;

function tsToDate() {
  error.value = '';
  try {
    let ts = parseInt(timestampInput.value.trim());
    if (isNaN(ts)) { error.value = '请输入有效的数字'; return; }
    // 自动检测秒/毫秒
    if (ts < 1e12) ts *= 1000;
    const date = new Date(ts);

    const now = Date.now();
    const diff = now - ts;
    let relative = '';
    const absDiff = Math.abs(diff);
    if (absDiff < 60000) relative = '刚刚';
    else if (absDiff < 3600000) relative = `${Math.floor(absDiff / 60000)} 分钟${diff > 0 ? '前' : '后'}`;
    else if (absDiff < 86400000) relative = `${Math.floor(absDiff / 3600000)} 小时${diff > 0 ? '前' : '后'}`;
    else relative = `${Math.floor(absDiff / 86400000)} 天${diff > 0 ? '前' : '后'}`;

    dateResult.value = {
      local: date.toLocaleString('zh-CN'),
      utc: date.toUTCString(),
      iso: date.toISOString(),
      relative,
    };
  } catch {
    error.value = '转换失败';
  }
}

function dateToTs() {
  try {
    const date = new Date(dateInput.value);
    tsResult.value = {
      seconds: Math.floor(date.getTime() / 1000).toString(),
      millis: date.getTime().toString(),
    };
  } catch {}
}

function updateCurrentTime() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('zh-CN');
  currentDate.value = now.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  currentTs.value = Math.floor(now.getTime() / 1000).toString();
}

onMounted(() => {
  updateCurrentTime();
  timer = setInterval(updateCurrentTime, 1000);
  dateInput.value = new Date().toISOString().slice(0, 16);
});

onUnmounted(() => clearInterval(timer));
</script>
