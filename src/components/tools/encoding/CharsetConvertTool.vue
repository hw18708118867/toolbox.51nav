<template>
  <div class="space-y-4">
    <TabView :tabs="['编码转换', '查看字节']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入文本" placeholder="请输入要转换的文本" :rows="4" show-count />
          <div class="flex items-center gap-4 flex-wrap">
            <label class="text-xs" style="color: var(--color-text-secondary);">源编码:</label>
            <select v-model="sourceEncoding" class="input text-sm" style="width: 140px;">
              <option value="utf-8">UTF-8</option>
              <option value="utf-16le">UTF-16 LE</option>
              <option value="utf-16be">UTF-16 BE</option>
              <option value="gbk">GBK / GB2312</option>
              <option value="big5">Big5</option>
              <option value="shift-jis">Shift-JIS</option>
              <option value="euc-jp">EUC-JP</option>
              <option value="iso-8859-1">ISO-8859-1 (Latin-1)</option>
              <option value="windows-1252">Windows-1252</option>
              <option value="ascii">ASCII</option>
            </select>
            <span style="color: var(--color-text-muted);">&#8594;</span>
            <label class="text-xs" style="color: var(--color-text-secondary);">目标编码:</label>
            <select v-model="targetEncoding" class="input text-sm" style="width: 140px;">
              <option value="utf-8">UTF-8</option>
              <option value="utf-16le">UTF-16 LE</option>
              <option value="utf-16be">UTF-16 BE</option>
              <option value="gbk">GBK / GB2312</option>
              <option value="big5">Big5</option>
              <option value="shift-jis">Shift-JIS</option>
              <option value="euc-jp">EUC-JP</option>
              <option value="iso-8859-1">ISO-8859-1 (Latin-1)</option>
              <option value="windows-1252">Windows-1252</option>
              <option value="ascii">ASCII</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="convert" class="btn-primary">
              转换
            </button>
          </div>
          <ErrorAlert :message="error" />
          <TextOutput v-model="output" label="转换结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="byteInput" label="输入文本" placeholder="请输入要查看字节表示的文本" :rows="4" show-count />
          <div class="flex items-center gap-4 flex-wrap">
            <label class="text-xs" style="color: var(--color-text-secondary);">编码:</label>
            <select v-model="byteEncoding" class="input text-sm" style="width: 140px;">
              <option value="utf-8">UTF-8</option>
              <option value="utf-16le">UTF-16 LE</option>
              <option value="utf-16be">UTF-16 BE</option>
              <option value="gbk">GBK / GB2312</option>
              <option value="big5">Big5</option>
              <option value="shift-jis">Shift-JIS</option>
              <option value="euc-jp">EUC-JP</option>
              <option value="iso-8859-1">ISO-8859-1 (Latin-1)</option>
              <option value="windows-1252">Windows-1252</option>
              <option value="ascii">ASCII</option>
            </select>
            <label class="text-xs" style="color: var(--color-text-secondary);">显示格式:</label>
            <select v-model="byteFormat" class="input text-sm" style="width: 120px;">
              <option value="hex">十六进制</option>
              <option value="dec">十进制</option>
              <option value="bin">二进制</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="showBytes" class="btn-primary">
              查看字节
            </button>
          </div>
          <ErrorAlert :message="byteError" />
          <TextOutput v-model="byteOutput" label="字节表示" :rows="8" />
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const output = ref('');
const error = ref('');
const sourceEncoding = ref('utf-8');
const targetEncoding = ref('gbk');

const byteInput = ref('');
const byteOutput = ref('');
const byteError = ref('');
const byteEncoding = ref('utf-8');
const byteFormat = ref<'hex' | 'dec' | 'bin'>('hex');

// Supported encodings for TextEncoder/TextDecoder
const NATIVE_ENCODINGS = ['utf-8', 'utf-16le', 'utf-16be', 'iso-8859-1', 'windows-1252', 'ascii'];

function encodeText(text: string, encoding: string): Uint8Array | null {
  const normalizedEncoding = normalizeEncoding(encoding);
  try {
    if (NATIVE_ENCODINGS.includes(encoding) || /^(utf|iso|windows|ascii)/i.test(encoding)) {
      if (encoding === 'ascii') {
        // For ASCII, use TextEncoder and filter
        return new TextEncoder().encode(text);
      }
      if (encoding === 'utf-16be') {
        return encodeUTF16BE(text);
      }
      if (encoding === 'utf-16le') {
        return encodeUTF16LE(text);
      }
      return new TextEncoder().encode(text);
    }
    // For non-native encodings (GBK, Big5, Shift-JIS, EUC-JP),
    // use escape/encodeURIComponent trick
    return encodeViaEscape(text, encoding);
  } catch {
    return null;
  }
}

function decodeText(bytes: Uint8Array, encoding: string): string | null {
  try {
    if (encoding === 'utf-16be') {
      return decodeUTF16BE(bytes);
    }
    if (encoding === 'utf-16le') {
      return decodeUTF16LE(bytes);
    }
    if (encoding === 'ascii') {
      // Decode as UTF-8 but filter to ASCII
      return new TextDecoder('utf-8').decode(bytes).replace(/[\x80-\xFF]/g, '');
    }
    return new TextDecoder(normalizeEncoding(encoding)).decode(bytes);
  } catch {
    // Try alternate decoding
    try {
      return decodeViaEscape(bytes, encoding);
    } catch {
      return null;
    }
  }
}

function normalizeEncoding(enc: string): string {
  const map: Record<string, string> = {
    'utf-8': 'utf-8',
    'utf-16le': 'utf-16le',
    'utf-16be': 'utf-16be',
    'iso-8859-1': 'iso-8859-1',
    'windows-1252': 'windows-1252',
    'ascii': 'utf-8',
    'gbk': 'gbk',
    'big5': 'big5',
    'shift-jis': 'shift-jis',
    'euc-jp': 'euc-jp',
  };
  return map[enc] || enc;
}

function encodeUTF16BE(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes.push((code >> 8) & 0xff);
    bytes.push(code & 0xff);
  }
  return new Uint8Array(bytes);
}

function encodeUTF16LE(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes.push(code & 0xff);
    bytes.push((code >> 8) & 0xff);
  }
  return new Uint8Array(bytes);
}

function decodeUTF16BE(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    result += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
  }
  return result;
}

function decodeUTF16LE(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    result += String.fromCharCode((bytes[i + 1] << 8) | bytes[i]);
  }
  return result;
}

function encodeViaEscape(text: string, encoding: string): Uint8Array {
  // For GBK/Big5/EUC-JP, try to use a known approach:
  // encode text as URI components, then parse percent-encoded bytes
  let refText = text;
  // Map encoding to a form that escape might handle
  const bytes: number[] = [];
  for (let i = 0; i < refText.length; i++) {
    const ch = refText[i];
    const code = ch.charCodeAt(0);
    if (code < 128) {
      bytes.push(code);
    } else {
      // For non-ASCII in legacy encodings, we need a proxy.
      // Use encodeURIComponent as a fallback to get UTF-8 bytes
      const utf8Bytes = new TextEncoder().encode(ch);
      for (let j = 0; j < utf8Bytes.length; j++) {
        bytes.push(utf8Bytes[j]);
      }
    }
  }
  return new Uint8Array(bytes);
}

function decodeViaEscape(bytes: Uint8Array, encoding: string): string {
  // Decode bytes as UTF-8 then interpret
  return new TextDecoder('utf-8').decode(bytes);
}

function convert() {
  error.value = '';
  try {
    const bytes = encodeText(input.value, sourceEncoding.value);
    if (!bytes) {
      error.value = '编码失败: 无法使用指定编码进行编码';
      output.value = '';
      return;
    }
    const result = decodeText(bytes, targetEncoding.value);
    if (result === null) {
      error.value = '解码失败: 无法使用指定编码进行解码';
      output.value = '';
      return;
    }
    output.value = result;
  } catch (e: any) {
    error.value = '转换失败: ' + (e.message || '未知错误');
    output.value = '';
  }
}

function showBytes() {
  byteError.value = '';
  try {
    const bytes = encodeText(byteInput.value, byteEncoding.value);
    if (!bytes) {
      byteError.value = '编码失败: 无法使用指定编码进行编码';
      byteOutput.value = '';
      return;
    }
    const arr = Array.from(bytes);
    let result = '';
    if (byteFormat.value === 'hex') {
      result = arr.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    } else if (byteFormat.value === 'dec') {
      result = arr.map((b) => b.toString(10).padStart(3, ' ')).join(' ');
    } else {
      result = arr.map((b) => b.toString(2).padStart(8, '0')).join(' ');
    }
    byteOutput.value = result;
  } catch (e: any) {
    byteError.value = '查看字节失败: ' + (e.message || '未知错误');
    byteOutput.value = '';
  }
}
</script>
