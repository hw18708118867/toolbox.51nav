<template>
  <div class="space-y-4">
    <div>
      <input
        v-model="uaInput"
        type="text"
        placeholder="请输入 User-Agent 字符串"
        class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
        
        @keyup.enter="parse"
      />
    </div>
    <div class="flex justify-end">
      <button
        @click="parse"
        class="btn-primary"
      >
        解析
      </button>
    </div>

    <div v-if="result" class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
      <table class="w-full text-sm">
        <tbody>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary); width: 130px;">浏览器</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">
              {{ result.browser }}
              <CopyButton :text="result.browser" />
            </td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">浏览器引擎</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">
              {{ result.engine }}
              <CopyButton :text="result.engine" />
            </td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">操作系统</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">
              {{ result.os }}
              <CopyButton :text="result.os" />
            </td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">设备类型</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">
              {{ result.device }}
              <CopyButton :text="result.device" />
            </td>
          </tr>
          <tr>
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">完整 UA</td>
            <td class="px-4 py-2.5 break-all" style="color: var(--color-text);">
              {{ result.raw }}
              <CopyButton :text="result.raw" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const uaInput = ref('');

interface UaResult {
  browser: string;
  engine: string;
  os: string;
  device: string;
  raw: string;
}

const result = ref<UaResult | null>(null);

function parseBrowser(ua: string): string {
  if (/Edg\/(\d+[\.\d]*)/.test(ua)) {
    return 'Microsoft Edge ' + (ua.match(/Edg\/(\d+[\.\d]*)/)?.[1] || '');
  }
  if (/OPR\/(\d+[\.\d]*)/.test(ua)) {
    return 'Opera ' + (ua.match(/OPR\/(\d+[\.\d]*)/)?.[1] || '');
  }
  if (/Firefox\/(\d+[\.\d]*)/.test(ua)) {
    return 'Firefox ' + (ua.match(/Firefox\/(\d+[\.\d]*)/)?.[1] || '');
  }
  if (/Chrome\/(\d+[\.\d]*)/.test(ua)) {
    return 'Chrome ' + (ua.match(/Chrome\/(\d+[\.\d]*)/)?.[1] || '');
  }
  if (/Safari\/(\d+[\.\d]*)/.test(ua) && /Version\/(\d+[\.\d]*)/.test(ua)) {
    return 'Safari ' + (ua.match(/Version\/(\d+[\.\d]*)/)?.[1] || '');
  }
  return '未知浏览器';
}

function parseEngine(ua: string): string {
  if (/Gecko\/\d/.test(ua) && /Firefox/.test(ua)) return 'Gecko';
  if (/AppleWebKit\/(\d+[\.\d]*)/.test(ua)) {
    const version = ua.match(/AppleWebKit\/(\d+[\.\d]*)/)?.[1] || '';
    if (/Chrome/.test(ua)) return 'Blink (' + version + ')';
    return 'WebKit (' + version + ')';
  }
  if (/Trident\/(\d+[\.\d]*)/.test(ua)) return 'Trident ' + (ua.match(/Trident\/(\d+[\.\d]*)/)?.[1] || '');
  return '未知引擎';
}

function parseOs(ua: string): string {
  if (/Windows NT (\d+\.\d+)/.test(ua)) {
    const ver = ua.match(/Windows NT (\d+\.\d+)/)?.[1];
    const map: Record<string, string> = {
      '10.0': 'Windows 10/11',
      '6.3': 'Windows 8.1',
      '6.2': 'Windows 8',
      '6.1': 'Windows 7',
      '6.0': 'Windows Vista',
      '5.1': 'Windows XP',
    };
    return map[ver || ''] || 'Windows';
  }
  if (/Mac OS X (\d+[._\d]*)/.test(ua)) {
    const ver = (ua.match(/Mac OS X (\d+[._\d]*)/)?.[1] || '').replace(/_/g, '.');
    return 'macOS ' + ver;
  }
  if (/Android (\d+[\.\d]*)/.test(ua)) return 'Android ' + (ua.match(/Android (\d+[\.\d]*)/)?.[1] || '');
  if (/iPhone OS (\d+[_\d]*)/.test(ua)) return 'iOS ' + (ua.match(/iPhone OS (\d+[_\d]*)/)?.[1] || '').replace(/_/g, '.');
  if (/iPad.*OS (\d+[_\d]*)/.test(ua)) return 'iPadOS ' + (ua.match(/iPad.*OS (\d+[_\d]*)/)?.[1] || '').replace(/_/g, '.');
  if (/Linux/.test(ua)) return 'Linux';
  return '未知操作系统';
}

function parseDevice(ua: string): string {
  if (/Mobile|iPhone|Android.*Mobile/.test(ua)) return 'Mobile';
  if (/iPad|Android(?!.*Mobile)/.test(ua)) return 'Tablet';
  return 'Desktop';
}

function parse() {
  const ua = uaInput.value.trim();
  if (!ua) return;

  result.value = {
    browser: parseBrowser(ua),
    engine: parseEngine(ua),
    os: parseOs(ua),
    device: parseDevice(ua),
    raw: ua,
  };
}

onMounted(() => {
  uaInput.value = navigator.userAgent;
  parse();
});
</script>
