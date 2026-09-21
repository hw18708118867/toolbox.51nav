<template>
  <div class="space-y-6">
    <!-- 步骤 1：选择系统 -->
    <div>
      <h3 class="section-title">① 选择操作系统</h3>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="os in oses"
          :key="os.id"
          @click="selectedOs = os.id"
          class="os-card"
          :class="{ active: selectedOs === os.id }"
        >
          <span class="os-icon" v-html="os.icon"></span>
          <span class="os-name">{{ os.name }}</span>
        </button>
      </div>
    </div>

    <!-- 步骤 2：选择场景 -->
    <div>
      <h3 class="section-title">② 选择应急场景</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="s in scenarios"
          :key="s.id"
          @click="selectScenario(s)"
          class="scenario-card no-underline"
          :class="{ active: selectedScenario?.id === s.id }"
        >
          <span class="scenario-name">{{ s.name }}</span>
          <span class="scenario-sum">{{ s.summary }}</span>
        </button>
      </div>
    </div>

    <!-- 步骤 3：阶段与命令 -->
    <div v-if="selectedScenario">
      <h3 class="section-title">③ 处置命令清单（{{ osLabel }}）</h3>

      <!-- 阶段切换 -->
      <div class="flex flex-wrap gap-2 phase-tabs">
        <button
          v-for="(ph, idx) in phases"
          :key="ph"
          @click="activePhase = idx"
          class="phase-tab"
          :class="{ active: activePhase === idx }"
        >
          <span class="phase-num">{{ idx + 1 }}</span>{{ ph }}
          <span class="phase-count">{{ currentPhaseItems(ph).length }}</span>
        </button>
      </div>

      <!-- 当前阶段命令 -->
      <div class="space-y-3 mt-4">
        <div
          v-for="(item, i) in currentPhaseItems(phases[activePhase])"
          :key="i"
          class="cmd-card"
        >
          <div class="cmd-head">
            <code class="cmd-text">{{ item.cmd }}</code>
            <CopyButton :text="item.cmd" />
          </div>
          <p class="cmd-desc">{{ item.desc }}</p>
          <span v-if="item.note" class="cmd-note">{{ item.note }}</span>
        </div>

        <div v-if="currentPhaseItems(phases[activePhase]).length === 0" class="empty-hint">
          该阶段暂无命令
        </div>
      </div>

      <!-- 阶段全部复制 -->
      <div class="mt-4 flex flex-wrap gap-2">
        <button class="btn-secondary" @click="copyPhase">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          复制本阶段全部命令
        </button>
        <button class="btn-secondary" @click="copyAll">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
          复制全场景命令
        </button>
      </div>
    </div>

    <!-- 步骤 4：报告导出 -->
    <div v-if="selectedScenario" class="report-box">
      <h3 class="section-title">④ 生成应急报告草稿</h3>
      <p class="report-tip">
        自动汇总所选系统与场景的处置命令，附时间线模板，导出为 Markdown 草稿，便于现场记录与归档。
      </p>
      <div class="flex flex-wrap gap-2 mb-3">
        <button class="btn-primary" @click="generateReport">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          生成报告
        </button>
        <button v-if="reportText" class="btn-secondary" @click="downloadReport">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          下载 .md
        </button>
        <CopyButton v-if="reportText" :text="reportText" />
      </div>
      <textarea
        v-if="reportText"
        v-model="reportText"
        readonly
        class="report-area"
        rows="14"
      ></textarea>
    </div>

    <p class="legal-note">
      ⚠️ 所有命令仅可在你拥有合法权限与授权的系统上执行；处置顺序遵循「先取证、后清理，先遏制、再根除」。本工具为参考清单，实际操作请结合现场情况。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import { scenarios, PHASES as phases, type Phase, type Scenario } from './emergencyResponseData';

type OsId = 'linux' | 'windows';

const oses: { id: OsId; name: string; icon: string }[] = [
  {
    id: 'linux',
    name: 'Linux / Unix 服务器',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V12l-2 2v2l2-1 2 1v-2l-2-2v-2.5A4 4 0 0 0 12 2z"/><path d="M16 6a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V12l-2 2v2l2-1 2 1v-2l-2-2V9.5A4 4 0 0 0 16 6z"/><path d="M12 13v9"/></svg>',
  },
  {
    id: 'windows',
    name: 'Windows 服务器',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 12h9M12 12h9"/></svg>',
  },
];

const selectedOs = ref<OsId>('linux');
const selectedScenario = ref<Scenario | null>(null);
const activePhase = ref(0);
const reportText = ref('');

const osLabel = computed(() => (selectedOs.value === 'linux' ? 'Linux / Unix' : 'Windows'));

function selectScenario(s: Scenario) {
  selectedScenario.value = s;
  activePhase.value = 0;
  reportText.value = '';
}

function phaseItemsFor(s: Scenario, ph: Phase) {
  const table = selectedOs.value === 'linux' ? s.linux : s.windows;
  return table[ph] ?? [];
}

function currentPhaseItems(ph: Phase) {
  if (!selectedScenario.value) return [];
  return phaseItemsFor(selectedScenario.value, ph);
}

function buildPhaseCommands(ph: Phase): string {
  if (!selectedScenario.value) return '';
  return phaseItemsFor(selectedScenario.value, ph)
    .map((it) => `- \`${it.cmd}\`  ${it.desc}${it.note ? `  （${it.note}）` : ''}`)
    .join('\n');
}

function copyText(text: string) {
  if (!text) return;
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

function copyPhase() {
  const ph = phases[activePhase.value];
  copyText(buildPhaseCommands(ph));
}

function copyAll() {
  if (!selectedScenario.value) return;
  const lines = phases.map((ph) => {
    const cmds = buildPhaseCommands(ph);
    return `### ${ph}\n${cmds || '（无）'}`;
  });
  copyText(`# ${selectedScenario.value.name}（${osLabel.value}）处置命令\n\n${lines.join('\n\n')}`);
}

function generateReport() {
  if (!selectedScenario.value) return;
  const s = selectedScenario.value;
  const now = new Date().toLocaleString('zh-CN');
  const sections = phases
    .map((ph) => {
      const cmds = buildPhaseCommands(ph);
      return `### ${ph}\n${cmds || '（无）'}`;
    })
    .join('\n\n');

  reportText.value = `# 网络安全应急响应报告草稿

- **操作系统**：${osLabel.value}
- **事件类型**：${s.name}
- **生成时间**：${now}
- **处置人**：________

> 本报告由「应急响应工具箱」生成，仅供现场记录参考。请在授权范围内操作，遵循「先取证、后清理」。

## 一、事件概述
${s.summary}
现场现象描述：________________________________________

## 二、处置时间线（现场填写）
| 时间 | 动作 | 执行人 | 结果 |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

## 三、处置命令清单（${osLabel.value} / ${s.name}）
${sections}

## 四、结论与加固建议
- 失陷入口：________________________________
- 已清除的持久化项（计划任务/服务/后门文件）：________________________________
- 后续加固动作：________________________________

---
*免责声明：命令执行需具备合法授权；本工具不对执行后果负责。*
`;
}

function downloadReport() {
  if (!reportText.value) return;
  const blob = new Blob([reportText.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `应急响应报告-${selectedScenario.value?.id || 'ir'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.section-title {
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
  color: var(--color-text);
}
.os-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.1rem;
  border-radius: 0.9rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.25s;
}
.os-card.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
.os-icon {
  display: flex;
  color: inherit;
}
.os-name {
  font-size: 0.85rem;
  font-weight: 600;
}
.scenario-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.9rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
  cursor: pointer;
  transition: all 0.25s;
  text-align: left;
}
.scenario-card:hover {
  border-color: var(--color-primary);
}
.scenario-card.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
.scenario-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
}
.scenario-sum {
  font-size: 0.72rem;
  line-height: 1.4;
  color: var(--color-text-muted);
}
.phase-tabs {
  margin-bottom: 0.25rem;
}
.phase-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.8rem;
  border-radius: 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}
.phase-tab.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.phase-num {
  display: inline-flex;
  width: 1.1rem;
  height: 1.1rem;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  font-size: 0.65rem;
}
.phase-tab:not(.active) .phase-num {
  background: var(--color-border);
  color: var(--color-text-secondary);
}
.phase-count {
  font-size: 0.65rem;
  padding: 0.05rem 0.35rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.25);
}
.phase-tab:not(.active) .phase-count {
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}
.cmd-card {
  padding: 0.85rem 1rem;
  border-radius: 0.8rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
}
.cmd-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}
.cmd-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--color-primary);
  word-break: break-all;
  white-space: pre-wrap;
  flex: 1;
}
.cmd-desc {
  margin-top: 0.4rem;
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}
.cmd-note {
  display: inline-block;
  margin-top: 0.4rem;
  font-size: 0.68rem;
  padding: 0.1rem 0.5rem;
  border-radius: 0.5rem;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}
.empty-hint {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  padding: 1rem 0;
  text-align: center;
}
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  border-radius: 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover {
  opacity: 0.9;
}
.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}
.btn-secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.report-box {
  padding: 1rem;
  border-radius: 1rem;
  border: 1px dashed var(--color-border);
  background-color: var(--color-bg-secondary);
}
.report-tip {
  font-size: 0.74rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
  line-height: 1.5;
}
.report-area {
  width: 100%;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  line-height: 1.5;
  padding: 0.75rem;
  border-radius: 0.7rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-text);
  resize: vertical;
}
.legal-note {
  font-size: 0.7rem;
  line-height: 1.5;
  color: var(--color-text-muted);
  padding: 0.75rem 1rem;
  border-radius: 0.7rem;
  background: var(--color-primary-light);
}
</style>
