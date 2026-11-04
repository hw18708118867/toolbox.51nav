<template>
  <div class="space-y-4">
    <!-- 搜索 -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="color: var(--color-text-muted);">
          <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" stroke-linecap="round" />
        </svg>
        <input
          v-model="query"
          type="text"
          placeholder="搜索事件 ID / 中文 / 英文 / 日志，如 4624、登录、logon、清除、Sysmon ..."
          class="w-full rounded-md border pl-9 pr-9 py-2 text-sm focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
        <button
          v-if="query"
          @click="query = ''"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm leading-none"
          style="color: var(--color-text-muted);"
          title="清空搜索"
        >×</button>
      </div>
      <span class="text-xs whitespace-nowrap" style="color: var(--color-text-muted);">
        {{ filtered.length }} / {{ totalCount }} 条
      </span>
    </div>

    <!-- 分类 -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="chip in chips"
        :key="chip.name"
        @click="activeCat = chip.name"
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
        :style="activeCat === chip.name
          ? 'background: var(--color-primary); color: #fff;'
          : 'background: var(--color-bg-secondary); color: var(--color-text-muted); border: 1px solid var(--color-border);'"
      >
        {{ chip.name }}
        <span class="ml-1 opacity-70">{{ chip.count }}</span>
      </button>
    </div>

    <!-- 事件表格 -->
    <div class="rounded-md border overflow-x-auto" style="border-color: var(--color-border);">
      <table class="w-full text-xs">
        <thead>
          <tr style="background-color: var(--color-bg-tertiary);">
            <th class="px-3 py-2 text-left font-medium whitespace-nowrap" style="color: var(--color-text-secondary);">事件 ID</th>
            <th class="px-3 py-2 text-left font-medium whitespace-nowrap" style="color: var(--color-text-secondary);">日志来源</th>
            <th class="px-3 py-2 text-left font-medium" style="color: var(--color-text-secondary);">事件与说明</th>
            <th class="px-3 py-2 text-left font-medium whitespace-nowrap" style="color: var(--color-text-secondary);">关注度</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="e in filtered" :key="keyOf(e)">
            <tr
              class="evt-row border-t"
              :class="{ 'is-open': expandedKey === keyOf(e) }"
              :style="{ borderColor: 'var(--color-border)' }"
              @click="toggle(e)"
            >
              <td class="px-3 py-2 font-mono font-semibold whitespace-nowrap align-top" style="color: var(--color-primary);">{{ e.id }}</td>
              <td class="px-3 py-2 whitespace-nowrap align-top" style="color: var(--color-text-muted);">{{ e.log }}</td>
              <td class="px-3 py-2 align-top">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium text-sm" style="color: var(--color-text);">{{ e.name }}</span>
                  <span class="px-1.5 py-0.5 rounded text-[10px]" style="background: var(--color-bg-tertiary); color: var(--color-text-muted);">{{ e.cat }}</span>
                </div>
                <p class="mt-0.5 leading-relaxed" style="color: var(--color-text-secondary);">{{ e.desc }}</p>
              </td>
              <td class="px-3 py-2 align-top whitespace-nowrap">
                <span class="inline-block px-1.5 py-0.5 rounded text-[10px]" :style="levelStyle(e.level)">{{ e.level || '信息' }}</span>
                <span class="inline-block ml-1.5 text-[10px]" style="color: var(--color-text-muted);">{{ expandedKey === keyOf(e) ? '▲' : '▼' }}</span>
              </td>
            </tr>

            <!-- 展开详情 -->
            <tr v-if="expandedKey === keyOf(e)" class="border-t" :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }">
              <td colspan="4" class="px-3 py-3">
                <div class="space-y-2.5">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5">
                    <div><span class="dt-lbl">英文原名</span><span class="dt-val">{{ e.en }}</span></div>
                    <div><span class="dt-lbl">日志通道</span><span class="dt-val break-all">{{ channelOf(e) }}</span></div>
                    <div v-if="e.fields"><span class="dt-lbl">关键字段</span><span class="dt-val break-all">{{ e.fields }}</span></div>
                    <div><span class="dt-lbl">分类</span><span class="dt-val">{{ e.cat }}</span></div>
                  </div>
                  <div v-if="e.tip" class="rounded-md px-3 py-2" style="background: var(--color-bg); border: 1px solid var(--color-border);">
                    <span class="dt-lbl">排查要点</span>
                    <p class="mt-1 leading-relaxed" style="color: var(--color-text-secondary);">{{ e.tip }}</p>
                  </div>

                  <div class="space-y-2">
                    <p class="dt-lbl">查询命令（点右侧按钮复制）</p>
                    <div class="cmd-row">
                      <div class="flex-1 min-w-0">
                        <p class="dt-lbl">PowerShell</p>
                        <code class="cmd-text">{{ psCmd(e) }}</code>
                      </div>
                      <CopyButton :text="psCmd(e)" />
                    </div>
                    <div class="cmd-row">
                      <div class="flex-1 min-w-0">
                        <p class="dt-lbl">CMD / wevtutil</p>
                        <code class="cmd-text">{{ wevtCmd(e) }}</code>
                      </div>
                      <CopyButton :text="wevtCmd(e)" />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <tr v-if="filtered.length === 0">
            <td colspan="4" class="px-3 py-8 text-center" style="color: var(--color-text-muted);">
              没有匹配的事件 ID。试试只输入数字（如 <code style="color: var(--color-primary);">4624</code>）、英文（如 <code style="color: var(--color-primary);">logon</code>）或中文关键词（如 <code style="color: var(--color-primary);">清除</code>）。
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs" style="color: var(--color-text-muted);">
      💡 支持多个关键词用空格分隔（需同时命中），例如 <code style="color: var(--color-primary);">4624 network</code> 或 <code style="color: var(--color-primary);">sysmon 注入</code>；点击任意一行可展开英文原名、排查要点与可复制的查询命令。
    </p>

    <!-- 登录类型对照 -->
    <div class="rounded-md border p-4" style="border-color: var(--color-border);">
      <p class="text-sm font-semibold mb-2" style="color: var(--color-text);">Logon Type 对照表（解读 4624 / 4625 必备）</p>
      <table class="w-full text-xs">
        <thead>
          <tr style="background-color: var(--color-bg-tertiary);">
            <th class="px-2 py-1.5 text-left font-medium whitespace-nowrap" style="color: var(--color-text-secondary);">类型</th>
            <th class="px-2 py-1.5 text-left font-medium whitespace-nowrap" style="color: var(--color-text-secondary);">名称</th>
            <th class="px-2 py-1.5 text-left font-medium" style="color: var(--color-text-secondary);">含义与典型场景</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in LOGON_TYPES" :key="l.type" class="border-t" :style="{ borderColor: 'var(--color-border)' }">
            <td class="px-2 py-1.5 font-mono font-semibold whitespace-nowrap" style="color: var(--color-primary);">{{ l.type }}</td>
            <td class="px-2 py-1.5 font-mono whitespace-nowrap" style="color: var(--color-text);">{{ l.name }}</td>
            <td class="px-2 py-1.5" style="color: var(--color-text-secondary);">{{ l.desc }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 常用排查命令 -->
    <div class="rounded-md border p-4" style="border-color: var(--color-border);">
      <p class="text-sm font-semibold mb-3" style="color: var(--color-text);">常用排查命令（一键复制）</p>
      <div class="space-y-2.5">
        <div v-for="(c, i) in QUICK_COMMANDS" :key="i" class="cmd-row">
          <div class="flex-1 min-w-0">
            <p class="text-xs mb-1" style="color: var(--color-text-secondary);">{{ c.name }}</p>
            <code class="cmd-text">{{ c.cmd }}</code>
          </div>
          <CopyButton :text="c.cmd" />
        </div>
      </div>
    </div>

    <div class="rounded-md border px-3 py-2.5 text-xs leading-relaxed" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <span class="font-semibold" style="color: var(--color-text);">关于软件安装取证：</span>
      <span style="color: var(--color-text-secondary);">MsiInstaller 只记录 MSI / Windows Installer 类安装包，绿色软件、自解压 exe、脚本投递不会产生安装事件。这类落地要靠 4688 / Sysmon 事件 1、11 看进程与文件，配合卸载注册表项（Sysmon 12/13）与 Amcache 一起还原；补丁安装看 WindowsUpdateClient 19/20，Store 与侧载 MSIX 看 AppXDeploymentServer。</span>
    </div>

    <p class="text-xs" style="color: var(--color-text-muted);">
      事件 ID 的具体字段会随 Windows 版本与审计策略不同而变化；部分事件（如 4688 命令行、4663、Sysmon）需先开启对应审计或安装 Sysmon 才会有记录。本工具仅用于授权范围内的日志分析与安全排查。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import {
  EVENT_ITEMS,
  EVENT_CATEGORIES,
  LOGON_TYPES,
  QUICK_COMMANDS,
  type EventItem,
} from './windowsEventIdData';

const query = ref('');
const activeCat = ref('全部');
const expandedKey = ref('');

const totalCount = EVENT_ITEMS.length;

const chips = computed(() => [
  { name: '全部', count: totalCount },
  ...EVENT_CATEGORIES.map((c) => ({ name: c, count: EVENT_ITEMS.filter((e) => e.cat === c).length })),
]);

const keywords = computed(() => query.value.trim().toLowerCase().split(/\s+/).filter(Boolean));

const filtered = computed(() => {
  const kws = keywords.value;
  return EVENT_ITEMS.filter((e) => {
    if (activeCat.value !== '全部' && e.cat !== activeCat.value) return false;
    if (kws.length === 0) return true;
    const hay = [
      e.id, e.log, e.channel || '', e.name, e.en, e.cat, e.desc, e.tip || '', e.fields || '',
    ].join(' ').toLowerCase();
    return kws.every((k) => hay.includes(k));
  });
});

const keyOf = (e: EventItem) => `${e.id}|${e.log}`;
const channelOf = (e: EventItem) => e.channel || e.log;

function toggle(e: EventItem) {
  const k = keyOf(e);
  expandedKey.value = expandedKey.value === k ? '' : k;
}

function levelStyle(level?: string): string {
  switch (level) {
    case '高危': return 'background: rgba(239, 68, 68, 0.12); color: #dc2626;';
    case '关注': return 'background: rgba(245, 158, 11, 0.14); color: #b45309;';
    default: return 'background: var(--color-bg-tertiary); color: var(--color-text-muted);';
  }
}

function psCmd(e: EventItem): string {
  return `Get-WinEvent -FilterHashtable @{LogName='${channelOf(e)}'; Id=${e.id}} -MaxEvents 20 | Format-List TimeCreated, Id, ProviderName, Message`;
}

function wevtCmd(e: EventItem): string {
  return `wevtutil qe "${channelOf(e)}" /q:"*[System[(EventID=${e.id})]]" /f:text /c:20`;
}
</script>

<style scoped>
.evt-row { cursor: pointer; transition: background-color 0.15s ease; }
.evt-row:hover, .evt-row.is-open { background-color: var(--color-bg-secondary); }
.dt-lbl { font-size: 0.68rem; color: var(--color-text-muted); display: block; margin-bottom: 0.15rem; }
.dt-val { font-size: 0.75rem; color: var(--color-text); word-break: break-word; }
.cmd-row { display: flex; align-items: flex-start; gap: 0.5rem; flex-wrap: wrap; }
.cmd-row > :first-child { flex: 1 1 14rem; min-width: 0; }
.cmd-text {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.7rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  padding: 0.5rem 0.65rem;
  border-radius: 0.4rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}
</style>
