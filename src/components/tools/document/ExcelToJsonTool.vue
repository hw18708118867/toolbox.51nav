<template>
  <div class="space-y-4">
    <!-- File Upload -->
    <div
      class="rounded-md border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
      :class="isDragging ? 'border-blue-400 bg-blue-50' : ''"
      style="border-color: var(--color-border);"
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input ref="fileInputRef" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileChange" />
      <p v-if="!fileName" class="text-sm" style="color: var(--color-text-muted);">
        点击选择或拖拽 <strong>.xlsx</strong> 文件到此处
      </p>
      <p v-else class="text-sm" style="color: var(--color-text);">
        已选择: <strong>{{ fileName }}</strong> ({{ (fileSize / 1024).toFixed(1) }} KB)
      </p>
    </div>

    <!-- Sheet Selector -->
    <div v-if="sheets.length > 0" class="flex items-center gap-3">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">选择工作表</label>
      <select v-model="selectedSheet" class="rounded-md border px-3 py-1.5 text-sm" style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);" @change="parseSheet">
        <option v-for="(sheet, idx) in sheets" :key="idx" :value="idx">{{ sheet }}</option>
      </select>
      <span class="text-xs text-gray-400" v-if="previewInfo">({{ previewInfo.rows }} 行 x {{ previewInfo.cols }} 列)</span>
    </div>

    <ErrorAlert :message="error" />

    <!-- Output -->
    <div v-if="output" class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium" style="color: var(--color-text-secondary);">JSON 输出</span>
        <CopyButton :text="output" />
      </div>
      <textarea
        :value="output"
        readonly
        rows="16"
        class="w-full rounded-md border p-3 text-sm font-mono resize-y"
        style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ErrorAlert from '../../common/ErrorAlert.vue';
import CopyButton from '../../common/CopyButton.vue';

const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const fileName = ref('');
const fileSize = ref(0);
const error = ref('');
const output = ref('');
const sheets = ref<string[]>([]);
const selectedSheet = ref(0);
const previewInfo = ref<{ rows: number; cols: number } | null>(null);

// We store the parsed workbook data
let workbookSheets: Map<string, string[][]> = new Map();

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) processFile(file);
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) processFile(file);
}

async function processFile(file: File) {
  error.value = '';
  output.value = '';
  sheets.value = [];
  workbookSheets.clear();
  previewInfo.value = null;

  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    error.value = '请选择 .xlsx 或 .xls 文件';
    return;
  }

  fileName.value = file.name;
  fileSize.value = file.size;

  try {
    const data = await readFileAsArrayBuffer(file);
    const sheetsMap = await parseXlsx(data);
    workbookSheets = sheetsMap;
    sheets.value = Array.from(sheetsMap.keys());
    if (sheets.value.length > 0) {
      selectedSheet.value = 0;
      parseSheet();
    }
  } catch (e: any) {
    error.value = '文件解析失败: ' + e.message;
  }
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

async function parseXlsx(data: ArrayBuffer): Promise<Map<string, string[][]>> {
  // XLSX is a ZIP file. Use raw ZIP parsing.
  const bytes = new Uint8Array(data);
  const result = new Map<string, string[][]>();

  // Find ZIP local file headers
  const entries = findZipEntries(bytes);

  // Find shared strings
  let sharedStrings: string[] = [];
  const ssiEntry = entries.find(e => e.name === 'xl/sharedStrings.xml');
  if (ssiEntry) {
    const xml = decodeUtf8(bytes.slice(ssiEntry.dataOffset, ssiEntry.dataOffset + ssiEntry.compressedSize));
    sharedStrings = parseSharedStrings(xml);
  }

  // Find worksheet files
  for (const entry of entries) {
    const match = entry.name.match(/^xl\/worksheets\/sheet(\d+)\.xml$/);
    if (match) {
      const xml = decodeUtf8(bytes.slice(entry.dataOffset, entry.dataOffset + entry.compressedSize));
      const sheetData = parseSheetXml(xml, sharedStrings);
      result.set(`Sheet${match[1]}`, sheetData);
    }
  }

  // Try to get actual sheet names from workbook.xml
  const wbEntry = entries.find(e => e.name === 'xl/workbook.xml');
  if (wbEntry) {
    const wbXml = decodeUtf8(bytes.slice(wbEntry.dataOffset, wbEntry.dataOffset + wbEntry.compressedSize));
    const names = parseSheetNames(wbXml);
    // Re-map with actual names
    const renamed = new Map<string, string[][]>();
    let idx = 1;
    for (const [key, value] of result) {
      const newName = names.length >= idx ? names[idx - 1] : key;
      renamed.set(newName, value);
      idx++;
    }
    return renamed;
  }

  return result;
}

interface ZipEntry {
  name: string;
  dataOffset: number;
  compressedSize: number;
}

function findZipEntries(bytes: Uint8Array): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset < bytes.length - 30) {
    // Look for local file header signature: 0x04034b50
    if (bytes[offset] === 0x50 && bytes[offset + 1] === 0x4b &&
        bytes[offset + 2] === 0x03 && bytes[offset + 3] === 0x04) {

      const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
      const compressedSize = bytes[offset + 18] | (bytes[offset + 19] << 8) |
        (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
      const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
      const extraFieldLength = bytes[offset + 28] | (bytes[offset + 29] << 8);

      const nameStart = offset + 30;
      const nameBytes = bytes.slice(nameStart, nameStart + fileNameLength);
      const name = decodeUtf8(nameBytes);

      const dataOffset = nameStart + fileNameLength + extraFieldLength;

      if (compressionMethod === 0) {
        // Stored (no compression)
        entries.push({ name, dataOffset, compressedSize });
      }

      // Skip to next entry
      offset = dataOffset + compressedSize;
    } else {
      offset++;
    }
  }

  return entries;
}

function parseSheetXml(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];

  // Find the dimension to know how many columns
  const dimMatch = xml.match(/<dimension[^>]*ref="[^:]*:([A-Z]+)(\d+)"/);
  let maxCols = 0;
  if (dimMatch) {
    maxCols = colLetterToIndex(dimMatch[1]) + 1;
  }

  // Parse rows
  const rowRe = /<row[^>]*>(.*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(xml)) !== null) {
    const rowXml = rowMatch[1];
    const cells = parseRowCells(rowXml, sharedStrings);
    rows.push(cells);
  }

  // Normalize row lengths
  if (maxCols === 0) {
    maxCols = Math.max(...rows.map(r => r.length), 0);
  }
  for (const row of rows) {
    while (row.length < maxCols) row.push('');
  }

  return rows;
}

function parseRowCells(rowXml: string, sharedStrings: string[]): string[] {
  const cells: { col: number; value: string }[] = [];

  // Parse c (cell) elements: <c r="A1" t="s"><v>0</v></c>
  const cellRe = /<c[^>]*r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]*)")?[^>]*>(.*?)<\/c>/g;
  let m: RegExpExecArray | null;
  while ((m = cellRe.exec(rowXml)) !== null) {
    const col = colLetterToIndex(m[1]);
    const cellType = m[3] || '';
    const cellContent = m[4];
    const vMatch = cellContent.match(/<v[^>]*>(.*?)<\/v>/);
    let value = vMatch ? vMatch[1] : '';

    if (cellType === 's' && value !== '') {
      // Shared string reference
      const idx = parseInt(value);
      if (!isNaN(idx) && idx >= 0 && idx < sharedStrings.length) {
        value = sharedStrings[idx];
      }
    } else if (cellType === 'b') {
      value = value === '1' ? 'true' : 'false';
    }

    cells.push({ col, value });
  }

  // Convert to array
  if (cells.length === 0) return [];
  const maxCol = Math.max(...cells.map(c => c.col));
  const result = new Array(maxCol + 1).fill('');
  for (const cell of cells) {
    result[cell.col] = cell.value;
  }
  return result;
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siRe = /<si[^>]*>(.*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = siRe.exec(xml)) !== null) {
    const si = m[1];
    // Could have <t> or <r><t> (rich text)
    const tMatches = si.match(/<t[^>]*>(.*?)<\/t>/g);
    if (tMatches) {
      strings.push(tMatches.map(t => t.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")).join(''));
    } else {
      strings.push(si.replace(/<[^>]*>/g, ''));
    }
  }
  return strings;
}

function parseSheetNames(xml: string): string[] {
  const names: string[] = [];
  const sheetRe = /<sheet[^>]*name="([^"]*)"[^>]*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = sheetRe.exec(xml)) !== null) {
    names.push(m[1]);
  }
  return names;
}

function colLetterToIndex(col: string): number {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 65 + 1);
  }
  return result - 1;
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}

function parseSheet() {
  error.value = '';
  output.value = '';
  previewInfo.value = null;

  if (sheets.value.length === 0) return;

  const sheetName = sheets.value[selectedSheet.value];
  const data = workbookSheets.get(sheetName);
  if (!data || data.length === 0) {
    error.value = '工作表为空';
    return;
  }

  // First row as headers, or just array of arrays
  const headers = data[0];
  const result: Record<string, string>[] = [];

  for (let i = 1; i < data.length; i++) {
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j] || `col_${j}`;
      row[key] = data[i][j] || '';
    }
    result.push(row);
  }

  previewInfo.value = {
    rows: result.length,
    cols: headers.length,
  };

  output.value = JSON.stringify(result, null, 2);
}
</script>
