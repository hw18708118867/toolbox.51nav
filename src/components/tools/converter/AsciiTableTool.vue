<template>
  <div class="space-y-3">
    <div class="flex gap-2">
      <input
        v-model="filter"
        type="text"
        placeholder="搜索字符、编码或描述..."
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none "

        @keyup.escape="filter = ''"
      />
      <button
        v-if="filter"
        @click="filter = ''"
        class="px-3 py-2 rounded-md border text-xs"
        style="background-color: var(--color-bg-secondary); color: var(--color-text-muted); border-color: var(--color-border);"
      >
        清除
      </button>
    </div>

    <div class="text-xs" style="color: var(--color-text-muted);">
      共 {{ filteredTable.length }} 个字符
    </div>

    <div class="rounded-md border overflow-auto max-h-[500px]" style="border-color: var(--color-border);">
      <table class="w-full text-sm" style="border-collapse: collapse;">
        <thead class="sticky top-0 z-10" style="background-color: var(--color-bg-secondary);">
          <tr>
            <th class="px-3 py-2.5 text-left text-xs font-medium" style="color: var(--color-text-secondary); border-bottom: 2px solid var(--color-border);">Dec</th>
            <th class="px-3 py-2.5 text-left text-xs font-medium" style="color: var(--color-text-secondary); border-bottom: 2px solid var(--color-border);">Hex</th>
            <th class="px-3 py-2.5 text-left text-xs font-medium" style="color: var(--color-text-secondary); border-bottom: 2px solid var(--color-border);">Oct</th>
            <th class="px-3 py-2.5 text-center text-xs font-medium" style="color: var(--color-text-secondary); border-bottom: 2px solid var(--color-border);">Char</th>
            <th class="px-3 py-2.5 text-left text-xs font-medium" style="color: var(--color-text-secondary); border-bottom: 2px solid var(--color-border);">HTML 实体</th>
            <th class="px-3 py-2.5 text-left text-xs font-medium" style="color: var(--color-text-secondary); border-bottom: 2px solid var(--color-border);">描述</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in filteredTable"
            :key="entry.dec"
            class="transition-colors hover:bg-opacity-50"
            :style="{ backgroundColor: entry.dec % 2 === 0 ? 'transparent' : 'var(--color-bg-tertiary)' }"
            @mouseenter="hoveredRow = entry.dec"
            @mouseleave="hoveredRow = -1"
          >
            <td class="px-3 py-2 font-mono text-xs tabular-nums" style="color: var(--color-text-secondary);">{{ entry.dec }}</td>
            <td class="px-3 py-2 font-mono text-xs" style="color: var(--color-primary);">U+{{ entry.hex }}</td>
            <td class="px-3 py-2 font-mono text-xs" style="color: var(--color-text-muted);">{{ entry.oct }}</td>
            <td class="px-3 py-2 text-center font-mono font-bold" :style="{ color: entry.isControl ? 'var(--color-text-muted)' : 'var(--color-text)' }">
              <span v-if="entry.dec === 32" class="inline-block w-4 h-4 border border-dashed rounded" style="border-color: var(--color-text-muted);" title="空格"></span>
              <span v-else-if="!entry.isControl" style="font-size: 1.1em;">{{ entry.char }}</span>
              <span v-else class="text-xs px-1 py-0.5 rounded" style="background-color: var(--color-bg-tertiary);">{{ entry.char }}</span>
            </td>
            <td class="px-3 py-2 font-mono text-xs" style="color: var(--color-text-secondary);">
              <template v-if="entry.htmlEntity">{{ entry.htmlEntity }}</template>
              <span v-else style="color: var(--color-text-muted);">-</span>
            </td>
            <td class="px-3 py-2 text-xs" style="color: var(--color-text-secondary);">{{ entry.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <span class="text-xs font-medium mr-1 self-center" style="color: var(--color-text-muted);">快速跳转:</span>
      <button
        v-for="group in quickGroups"
        :key="group.label"
        @click="filter = group.label"
        class="px-2 py-1 rounded text-xs transition-colors"
        style="background-color: var(--color-bg-secondary); color: var(--color-text-muted); border: 1px solid var(--color-border);"
      >
        {{ group.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const filter = ref('');
const hoveredRow = ref(-1);

interface AsciiEntry {
  dec: number;
  hex: string;
  oct: string;
  char: string;
  htmlEntity: string;
  description: string;
  isControl: boolean;
}

const descriptions: Record<number, string> = {
  0: '空字符',
  1: '标题开始',
  2: '正文开始',
  3: '正文结束',
  4: '传输结束',
  5: '请求',
  6: '确认',
  7: '响铃',
  8: '退格',
  9: '水平制表符',
  10: '换行',
  11: '垂直制表符',
  12: '换页',
  13: '回车',
  14: '移出',
  15: '移入',
  16: '数据链路转义',
  17: '设备控制1',
  18: '设备控制2',
  19: '设备控制3',
  20: '设备控制4',
  21: '否定确认',
  22: '同步空闲',
  23: '传输块结束',
  24: '取消',
  25: '介质中断',
  26: '替代',
  27: '转义',
  28: '文件分隔符',
  29: '组分隔符',
  30: '记录分隔符',
  31: '单元分隔符',
  32: '空格',
  33: '感叹号',
  34: '双引号',
  35: '井号',
  36: '美元符号',
  37: '百分号',
  38: '和号',
  39: '单引号',
  40: '左圆括号',
  41: '右圆括号',
  42: '星号',
  43: '加号',
  44: '逗号',
  45: '连字符/减号',
  46: '句号',
  47: '斜线',
  48: '数字0',
  49: '数字1',
  50: '数字2',
  51: '数字3',
  52: '数字4',
  53: '数字5',
  54: '数字6',
  55: '数字7',
  56: '数字8',
  57: '数字9',
  58: '冒号',
  59: '分号',
  60: '小于号',
  61: '等号',
  62: '大于号',
  63: '问号',
  64: 'At符号',
  65: '大写字母A',
  66: '大写字母B',
  67: '大写字母C',
  68: '大写字母D',
  69: '大写字母E',
  70: '大写字母F',
  71: '大写字母G',
  72: '大写字母H',
  73: '大写字母I',
  74: '大写字母J',
  75: '大写字母K',
  76: '大写字母L',
  77: '大写字母M',
  78: '大写字母N',
  79: '大写字母O',
  80: '大写字母P',
  81: '大写字母Q',
  82: '大写字母R',
  83: '大写字母S',
  84: '大写字母T',
  85: '大写字母U',
  86: '大写字母V',
  87: '大写字母W',
  88: '大写字母X',
  89: '大写字母Y',
  90: '大写字母Z',
  91: '左方括号',
  92: '反斜线',
  93: '右方括号',
  94: '脱字符',
  95: '下划线',
  96: '重音符',
  97: '小写字母a',
  98: '小写字母b',
  99: '小写字母c',
  100: '小写字母d',
  101: '小写字母e',
  102: '小写字母f',
  103: '小写字母g',
  104: '小写字母h',
  105: '小写字母i',
  106: '小写字母j',
  107: '小写字母k',
  108: '小写字母l',
  109: '小写字母m',
  110: '小写字母n',
  111: '小写字母o',
  112: '小写字母p',
  113: '小写字母q',
  114: '小写字母r',
  115: '小写字母s',
  116: '小写字母t',
  117: '小写字母u',
  118: '小写字母v',
  119: '小写字母w',
  120: '小写字母x',
  121: '小写字母y',
  122: '小写字母z',
  123: '左花括号',
  124: '竖线',
  125: '右花括号',
  126: '波浪号',
  127: '删除',
};

const htmlEntities: Record<number, string> = {
  34: '&amp;quot;',
  38: '&amp;amp;',
  39: '&amp;apos;',
  60: '&amp;lt;',
  62: '&amp;gt;',
  162: '&amp;cent;',
  163: '&amp;pound;',
  165: '&amp;yen;',
  169: '&amp;copy;',
  174: '&amp;reg;',
};

function getHtmlEntity(dec: number): string {
  if (htmlEntities[dec]) return htmlEntities[dec];
  if (dec >= 32 && dec <= 126) return `&amp;#${dec};`;
  return '';
}

const asciiTable = computed<AsciiEntry[]>(() => {
  const entries: AsciiEntry[] = [];
  for (let i = 0; i < 128; i++) {
    const isControl = i < 32 || i === 127;
    let char: string;
    if (i < 32) {
      const abbreviations: Record<number, string> = {
        0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ', 6: 'ACK',
        7: 'BEL', 8: 'BS',  9: 'TAB', 10: 'LF', 11: 'VT', 12: 'FF', 13: 'CR',
        14: 'SO', 15: 'SI', 16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3',
        20: 'DC4', 21: 'NAK', 22: 'SYN', 23: 'ETB', 24: 'CAN', 25: 'EM',
        26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS', 30: 'RS', 31: 'US',
      };
      char = abbreviations[i] || '?';
    } else if (i === 127) {
      char = 'DEL';
    } else {
      char = String.fromCharCode(i);
    }
    entries.push({
      dec: i,
      hex: i.toString(16).toUpperCase().padStart(4, '0'),
      oct: i.toString(8).padStart(3, '0'),
      char,
      htmlEntity: getHtmlEntity(i),
      description: descriptions[i] || '',
      isControl,
    });
  }
  return entries;
});

const filteredTable = computed(() => {
  if (!filter.value.trim()) return asciiTable.value;
  const f = filter.value.toLowerCase();
  return asciiTable.value.filter(e =>
    e.dec.toString().includes(f) ||
    e.hex.toLowerCase().includes(f) ||
    e.oct.includes(f) ||
    e.char.toLowerCase().includes(f) ||
    e.htmlEntity.toLowerCase().includes(f) ||
    e.description.toLowerCase().includes(f)
  );
});

const quickGroups = [
  { label: '控制字符 (0-31)' },
  { label: '数字 (48-57)' },
  { label: '大写字母 (65-90)' },
  { label: '小写字母 (97-122)' },
  { label: '符号' },
  { label: 'DEL' },
];
</script>
