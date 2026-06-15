<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <label class="text-xs font-medium shrink-0" style="color: var(--color-text-secondary);">输入格式</label>
      <select v-model="inputFormat" class="rounded-md border px-3 py-1.5 text-sm" style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);">
        <option value="hex">十六进制 (Hex)</option>
        <option value="base64">Base64</option>
      </select>
    </div>

    <TextInput v-model="rawInput" :label="'输入 ' + (inputFormat === 'hex' ? '十六进制' : 'Base64') + ' 数据'" :placeholder="inputFormat === 'hex' ? '089601120548656c6c6f' : 'CJYBEgVIZWxsbw=='" :rows="4" show-count />

    <div class="flex justify-end">
      <button @click="decode" :disabled="!rawInput.trim()" class="btn-primary">解码</button>
    </div>

    <ErrorAlert :message="error" />

    <!-- Decoded Fields -->
    <div v-if="fields.length > 0" class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium" style="color: var(--color-text-secondary);">解码结果 ({{ fields.length }} 个字段)</span>
      </div>

      <div class="overflow-auto rounded-md border" style="background: var(--color-bg); border-color: var(--color-border);">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-xs font-medium" style="border-color: var(--color-border); color: var(--color-text-secondary);">
              <th class="text-left p-2 whitespace-nowrap">字段 #</th>
              <th class="text-left p-2 whitespace-nowrap">Wire Type</th>
              <th class="text-left p-2 whitespace-nowrap">值 (原始)</th>
              <th class="text-left p-2 whitespace-nowrap">值 (解释)</th>
            </tr>
          </thead>
          <tbody class="divide-y" style="border-color: var(--color-border);">
            <tr v-for="(field, idx) in fields" :key="idx" style="color: var(--color-text);">
              <td class="p-2 font-mono whitespace-nowrap">{{ field.fieldNumber }}</td>
              <td class="p-2 font-mono whitespace-nowrap">{{ field.wireTypeName }} ({{ field.wireType }})</td>
              <td class="p-2 font-mono whitespace-nowrap max-w-xs truncate" :title="field.rawHex">{{ field.rawHex }}</td>
              <td class="p-2 font-mono">{{ field.interpreted }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="rounded-md border p-3" style="background: var(--color-bg); border-color: var(--color-border);">
        <summary class="text-xs font-medium cursor-pointer" style="color: var(--color-text-secondary);">协议参考</summary>
        <div class="mt-2 text-xs space-y-1" style="color: var(--color-text-secondary);">
          <p><code class="font-mono" style="color: var(--color-text);">Wire 0</code> — Varint (int32, int64, uint32, uint64, sint32, sint64, bool, enum)</p>
          <p><code class="font-mono" style="color: var(--color-text);">Wire 1</code> — 64-bit (fixed64, sfixed64, double)</p>
          <p><code class="font-mono" style="color: var(--color-text);">Wire 2</code> — Length-delimited (string, bytes, embedded messages, packed repeated fields)</p>
          <p><code class="font-mono" style="color: var(--color-text);">Wire 5</code> — 32-bit (fixed32, sfixed32, float)</p>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const inputFormat = ref('hex');
const rawInput = ref('');
const error = ref('');

interface ProtoField {
  fieldNumber: number;
  wireType: number;
  wireTypeName: string;
  rawHex: string;
  interpreted: string;
}

const fields = ref<ProtoField[]>([]);

const WIRE_TYPE_NAMES: Record<number, string> = {
  0: 'Varint',
  1: 'Fixed64',
  2: 'Length-delimited',
  5: 'Fixed32',
};

function decode() {
  error.value = '';
  fields.value = [];
  try {
    let bytes: Uint8Array;

    if (inputFormat.value === 'hex') {
      const hex = rawInput.value.replace(/\s/g, '');
      if (!/^[0-9a-fA-F]*$/.test(hex)) {
        error.value = '无效的十六进制数据';
        return;
      }
      bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || []);
    } else {
      try {
        const binaryStr = atob(rawInput.value.replace(/\s/g, ''));
        bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
      } catch {
        error.value = '无效的 Base64 数据';
        return;
      }
    }

    decodeProtobuf(bytes);
  } catch (e: any) {
    error.value = '解码失败: ' + e.message;
  }
}

function decodeProtobuf(bytes: Uint8Array) {
  let offset = 0;
  const result: ProtoField[] = [];

  while (offset < bytes.length) {
    // Read tag (varint)
    const tagResult = readVarint(bytes, offset);
    if (tagResult === null) {
      error.value = '无法读取 tag varint, 偏移: ' + offset;
      return;
    }
    const { value: tag, bytesRead: tagBytes } = tagResult;
    offset += tagBytes;

    const fieldNumber = tag >>> 3;
    const wireType = tag & 0x07;

    if (fieldNumber === 0) {
      error.value = '无效的字段号 0, 偏移: ' + (offset - tagBytes);
      return;
    }

    const wireTypeName = WIRE_TYPE_NAMES[wireType] ?? `Unknown(${wireType})`;

    let rawHex = '';
    let interpreted = '';

    switch (wireType) {
      case 0: {
        // Varint
        const vr = readVarint(bytes, offset);
        if (vr === null) {
          error.value = `无法读取 varint 值, 字段 ${fieldNumber}, 偏移: ${offset}`;
          return;
        }
        rawHex = bytesToHex(bytes.slice(offset, offset + vr.bytesRead));
        interpreted = String(vr.value);
        offset += vr.bytesRead;
        break;
      }
      case 1: {
        // Fixed64 (8 bytes little-endian)
        if (offset + 8 > bytes.length) {
          error.value = `Fixed64 数据不足, 字段 ${fieldNumber}, 偏移: ${offset}`;
          return;
        }
        rawHex = bytesToHex(bytes.slice(offset, offset + 8));
        // Read as little-endian 64-bit
        let val64 = 0n;
        for (let i = 7; i >= 0; i--) {
          val64 = (val64 << 8n) | BigInt(bytes[offset + i]);
        }
        interpreted = val64.toString();
        // Also try as double (IEEE 754)
        const dv = new DataView(bytes.buffer.slice(bytes.byteOffset + offset, bytes.byteOffset + offset + 8));
        const doubleVal = dv.getFloat64(0, true);
        if (!isNaN(doubleVal)) {
          interpreted += ` (double: ${doubleVal})`;
        }
        offset += 8;
        break;
      }
      case 2: {
        // Length-delimited
        const lr = readVarint(bytes, offset);
        if (lr === null) {
          error.value = `无法读取长度, 字段 ${fieldNumber}, 偏移: ${offset}`;
          return;
        }
        const length = lr.value;
        offset += lr.bytesRead;

        if (length < 0 || offset + length > bytes.length) {
          error.value = `长度超出范围, 字段 ${fieldNumber}, 长度: ${length}, 偏移: ${offset}`;
          return;
        }

        const data = bytes.slice(offset, offset + length);
        rawHex = bytesToHex(data);

        // Try to interpret as UTF-8 string
        try {
          const str = new TextDecoder('utf-8', { fatal: true }).decode(data);
          if (isPrintable(str)) {
            interpreted = `"${str}"`;
          } else {
            interpreted = `bytes[${length}] (可能为嵌套消息)`;
            // Try to decode as nested message
            try {
              const nested = new ProtoFieldAccumulator();
              decodeProtobufInto(data, nested);
              if (nested.fields.length > 0) {
                interpreted = `嵌套消息: { ${nested.fields.map(f => `${f.fieldNumber}: ${f.interpreted}`).join(', ')} }`;
              }
            } catch {
              // Not a nested message
            }
          }
        } catch {
          interpreted = `bytes[${length}]`;
        }

        offset += length;
        break;
      }
      case 5: {
        // Fixed32 (4 bytes little-endian)
        if (offset + 4 > bytes.length) {
          error.value = `Fixed32 数据不足, 字段 ${fieldNumber}, 偏移: ${offset}`;
          return;
        }
        rawHex = bytesToHex(bytes.slice(offset, offset + 4));
        let val32 = 0;
        for (let i = 3; i >= 0; i--) {
          val32 = (val32 << 8) | bytes[offset + i];
        }
        interpreted = String(val32);
        // Try as float
        const fv = new DataView(bytes.buffer.slice(bytes.byteOffset + offset, bytes.byteOffset + offset + 4));
        const floatVal = fv.getFloat32(0, true);
        if (!isNaN(floatVal)) {
          interpreted += ` (float: ${floatVal})`;
        }
        offset += 4;
        break;
      }
      default: {
        error.value = `未知 Wire Type ${wireType}, 字段 ${fieldNumber}, 偏移: ${offset}`;
        return;
      }
    }

    result.push({
      fieldNumber,
      wireType,
      wireTypeName,
      rawHex,
      interpreted,
    });
  }

  fields.value = result;
}

function readVarint(bytes: Uint8Array, offset: number): { value: number; bytesRead: number } | null {
  let result = 0;
  let shift = 0;
  let bytesRead = 0;

  while (offset + bytesRead < bytes.length) {
    const byte = bytes[offset + bytesRead];
    result |= (byte & 0x7f) << shift;
    bytesRead++;
    if ((byte & 0x80) === 0) break;
    shift += 7;
    if (shift >= 35) {
      // Too large for safe JS int
      break;
    }
  }

  if (bytesRead === 0) return null;
  return { value: result, bytesRead };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

function isPrintable(str: string): boolean {
  if (str.length === 0) return false;
  // Allow common printable chars including Chinese
  for (let i = 0; i < Math.min(str.length, 100); i++) {
    const c = str.charCodeAt(i);
    if (c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) return false;
  }
  return true;
}

class ProtoFieldAccumulator {
  fields: { fieldNumber: number; interpreted: string }[] = [];
}

function decodeProtobufInto(bytes: Uint8Array, acc: ProtoFieldAccumulator) {
  let offset = 0;
  while (offset < bytes.length) {
    const tagRes = readVarint(bytes, offset);
    if (tagRes === null) break;
    const { value: tag, bytesRead: tagBytes } = tagRes;
    offset += tagBytes;
    const fieldNumber = tag >>> 3;
    const wireType = tag & 0x07;

    if (wireType === 0) {
      const vr = readVarint(bytes, offset);
      if (vr === null) break;
      acc.fields.push({ fieldNumber, interpreted: String(vr.value) });
      offset += vr.bytesRead;
    } else if (wireType === 2) {
      const lr = readVarint(bytes, offset);
      if (lr === null) break;
      offset += lr.bytesRead;
      const length = lr.value;
      if (offset + length > bytes.length) break;
      const data = bytes.slice(offset, offset + length);
      try {
        const str = new TextDecoder('utf-8', { fatal: true }).decode(data);
        acc.fields.push({ fieldNumber, interpreted: `"${str}"` });
      } catch {
        acc.fields.push({ fieldNumber, interpreted: `bytes[${length}]` });
      }
      offset += length;
    } else if (wireType === 1) {
      if (offset + 8 > bytes.length) break;
      offset += 8;
      acc.fields.push({ fieldNumber, interpreted: '(fixed64)' });
    } else if (wireType === 5) {
      if (offset + 4 > bytes.length) break;
      offset += 4;
      acc.fields.push({ fieldNumber, interpreted: '(fixed32)' });
    } else {
      break;
    }
  }
}
</script>
