<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <button
        @click="triggerFileInput"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors border"
        style="background-color: var(--color-bg-secondary); color: var(--color-text); border-color: var(--color-border);"
      >
        选择图片
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileSelect"
      />
      <span v-if="fileName" class="text-sm" style="color: var(--color-text);">{{ fileName }}</span>
    </div>

    <div v-if="loading" class="text-sm text-center py-4" style="color: var(--color-text-muted);">
      正在读取 EXIF 数据...
    </div>

    <ErrorAlert :message="error" />

    <div v-if="metadata && !loading" class="space-y-4">
      <div v-if="previewUrl" class="rounded-lg border overflow-hidden" style="border-color: var(--color-border);">
        <img :src="previewUrl" class="w-full max-h-64 object-contain" />
      </div>

      <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
        <table class="w-full text-sm" v-if="hasExifData">
          <tbody>
            <tr style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary); width: 140px;">文件大小</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.fileSize }}</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">图片尺寸</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.dimensions }}</td>
            </tr>
            <tr v-if="metadata.make" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">相机制造商</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.make }}</td>
            </tr>
            <tr v-if="metadata.model" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">相机型号</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.model }}</td>
            </tr>
            <tr v-if="metadata.dateTaken" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">拍摄日期</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.dateTaken }}</td>
            </tr>
            <tr v-if="metadata.iso" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">ISO</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.iso }}</td>
            </tr>
            <tr v-if="metadata.aperture" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">光圈</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.aperture }}</td>
            </tr>
            <tr v-if="metadata.shutterSpeed" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">快门速度</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.shutterSpeed }}</td>
            </tr>
            <tr v-if="metadata.focalLength" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">焦距</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.focalLength }}</td>
            </tr>
            <tr v-if="metadata.flash !== null" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">闪光灯</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.flash }}</td>
            </tr>
            <tr v-if="metadata.gps" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">GPS 坐标</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.gps }}</td>
            </tr>
            <tr v-if="metadata.software" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">软件</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.software }}</td>
            </tr>
            <tr v-if="metadata.orientation">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">方向</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ metadata.orientation }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!hasExifData && !loading && !error"
        class="rounded-md border px-4 py-3 text-sm"
        style="background-color: #fffbeb; border-color: #fde68a; color: #92400e;"
      >
        <svg class="inline-block w-4 h-4 mr-1.5 -mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        该图片不包含 EXIF 元数据。可能已被处理软件移除，或来自不支持 EXIF 的来源。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

interface ExifMetadata {
  fileSize: string;
  dimensions: string;
  make: string;
  model: string;
  dateTaken: string;
  iso: string;
  aperture: string;
  shutterSpeed: string;
  focalLength: string;
  flash: string | null;
  gps: string;
  software: string;
  orientation: string;
}

const fileInputRef = ref<HTMLInputElement>();
const fileName = ref('');
const previewUrl = ref('');
const metadata = ref<ExifMetadata | null>(null);
const loading = ref(false);
const error = ref('');

const hasExifData = computed(() => {
  if (!metadata.value) return false;
  const m = metadata.value;
  return !!(m.make || m.model || m.dateTaken || m.iso || m.gps || m.software);
});

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatGps(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lon).toFixed(6)}° ${lonDir}`;
}

function getOrientationLabel(value: number): string {
  const labels: Record<number, string> = {
    1: '正常',
    2: '水平翻转',
    3: '旋转 180°',
    4: '垂直翻转',
    5: '逆时针旋转 90° + 垂直翻转',
    6: '顺时针旋转 90°',
    7: '顺时针旋转 90° + 垂直翻转',
    8: '逆时针旋转 90°',
  };
  return labels[value] || `未知 (${value})`;
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    await readFile(input.files[0]);
  }
}

async function readFile(file: File) {
  error.value = '';
  loading.value = true;
  metadata.value = null;
  fileName.value = file.name;
  previewUrl.value = URL.createObjectURL(file);

  // Build basic metadata from File API
  const basicMeta: ExifMetadata = {
    fileSize: formatSize(file.size),
    dimensions: '',
    make: '',
    model: '',
    dateTaken: '',
    iso: '',
    aperture: '',
    shutterSpeed: '',
    focalLength: '',
    flash: null,
    gps: '',
    software: '',
    orientation: '',
  };

  // Get image dimensions
  const dimensionsPromise = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      basicMeta.dimensions = `${img.naturalWidth} x ${img.naturalHeight} px`;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = previewUrl.value;
  });

  // Try to read EXIF using dynamic import of exifr
  try {
    const exifr = await import('exifr');
    const exifData = await exifr.parse(file, {
      pick: ['Make', 'Model', 'DateTimeOriginal', 'ISO', 'FNumber', 'ExposureTime', 'FocalLength', 'Flash', 'GPSLatitude', 'GPSLongitude', 'Software', 'Orientation'],
    });

    if (exifData) {
      if (exifData.Make) basicMeta.make = exifData.Make;
      if (exifData.Model) basicMeta.model = exifData.Model;
      if (exifData.DateTimeOriginal) basicMeta.dateTaken = formatDate(exifData.DateTimeOriginal);
      if (exifData.ISO) basicMeta.iso = String(exifData.ISO);
      if (exifData.FNumber) basicMeta.aperture = 'f/' + exifData.FNumber;
      if (exifData.ExposureTime) {
        const et = exifData.ExposureTime;
        basicMeta.shutterSpeed = et < 1 ? `1/${Math.round(1/et)}s` : `${et}s`;
      }
      if (exifData.FocalLength) basicMeta.focalLength = exifData.FocalLength + 'mm';
      if (exifData.Flash !== undefined) {
        basicMeta.flash = exifData.Flash ? '已闪光' : '未闪光';
      }
      if (exifData.GPSLatitude !== undefined && exifData.GPSLongitude !== undefined) {
        basicMeta.gps = formatGps(exifData.GPSLatitude, exifData.GPSLongitude);
      }
      if (exifData.Software) basicMeta.software = exifData.Software;
      if (exifData.Orientation) basicMeta.orientation = getOrientationLabel(exifData.Orientation);
    }
  } catch (e: any) {
    // exifr library not available or parse failed — just show basic info
    if (e.message && e.message.includes('Failed to resolve')) {
      // Library not installed, silently continue with basic info
    } else {
      error.value = 'EXIF 解析失败: ' + (e.message || '未知错误');
    }
  }

  await dimensionsPromise;
  metadata.value = basicMeta;
  loading.value = false;
}

function formatDate(date: any): string {
  if (typeof date === 'string') {
    // Try to parse "2024:01:15 14:30:00" format
    const match = date.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
    }
    return date;
  }
  if (date instanceof Date) {
    return date.toLocaleString('zh-CN');
  }
  return String(date);
}
</script>
