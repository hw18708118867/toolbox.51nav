<template>
  <div class="space-y-4">
    <TabView :tabs="['场景化分析流程', '日志源速查', '关联研判与时间线']">
      <!-- ① 场景化分析流程 -->
      <template #tab-0>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <input
              v-model="scenarioQuery"
              type="text"
              placeholder="搜索场景 / 关键词 / 迹象，如 爆破、WebShell、提权、清日志 ..."
              class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
              style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
            />
            <span class="text-xs whitespace-nowrap" style="color: var(--color-text-muted);">
              {{ filteredScenarios.length }} 个场景
            </span>
          </div>

          <!-- 场景选择 -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in filteredScenarios"
              :key="s.id"
              @click="selectedId = s.id"
              class="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              :style="selectedId === s.id
                ? 'background: var(--color-primary); color: #fff;'
                : 'background: var(--color-bg-secondary); color: var(--color-text-muted); border: 1px solid var(--color-border);'"
            >
              {{ s.name }}
            </button>
            <p v-if="filteredScenarios.length === 0" class="text-xs" style="color: var(--color-text-muted);">没有匹配的场景，试试更短的关键词。</p>
          </div>

          <div v-if="current && filteredScenarios.length > 0" class="space-y-4">
            <!-- 场景概览 -->
            <div class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
              <div class="flex items-start justify-between gap-3 flex-wrap">
                <div class="min-w-0">
                  <h3 class="text-base font-semibold" style="color: var(--color-text);">{{ current.name }}</h3>
                  <p class="text-sm mt-1 leading-relaxed" style="color: var(--color-text-secondary);">{{ current.summary }}</p>
                </div>
                <CopyButton :text="allCmds(current)" />
              </div>
              <div class="flex flex-wrap gap-1.5 mt-3">
                <span class="text-xs" style="color: var(--color-text-muted);">适用迹象：</span>
                <span v-for="(g, i) in current.signs" :key="i" class="sign-chip">{{ g }}</span>
              </div>
            </div>

            <!-- 分步流程 -->
            <div>
              <h4 class="section-h">分析流程（按顺序执行：先取证，再判断）</h4>
              <div class="space-y-3">
                <div v-for="(step, i) in current.steps" :key="i" class="step-card">
                  <div class="flex items-start gap-3">
                    <span class="step-num">{{ i + 1 }}</span>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold" style="color: var(--color-text);">{{ step.title }}</p>
                      <p class="text-xs mt-0.5 leading-relaxed" style="color: var(--color-text-muted);">{{ step.goal }}</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                    <div class="side-card">
                      <p class="side-title">
                        <span class="os-pill os-win">Windows</span>
                        <span class="truncate">{{ step.win.src }}</span>
                      </p>
                      <div class="cmd-row">
                        <code class="cmd-text">{{ step.win.cmd }}</code>
                        <CopyButton :text="step.win.cmd" />
                      </div>
                      <p class="side-read"><span class="read-lbl">判别</span>{{ step.win.read }}</p>
                    </div>
                    <div class="side-card">
                      <p class="side-title">
                        <span class="os-pill os-linux">Linux</span>
                        <span class="truncate">{{ step.linux.src }}</span>
                      </p>
                      <div class="cmd-row">
                        <code class="cmd-text">{{ step.linux.cmd }}</code>
                        <CopyButton :text="step.linux.cmd" />
                      </div>
                      <p class="side-read"><span class="read-lbl">判别</span>{{ step.linux.read }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 关联链 -->
            <div class="rounded-md border p-4" style="border-color: var(--color-border);">
              <h4 class="section-h !mt-0">典型关联链（把分散的日志串成一条线）</h4>
              <div class="space-y-2">
                <div class="chain-line"><span class="os-pill os-win">Windows</span><code class="chain-code">{{ current.chainWin }}</code></div>
                <div class="chain-line"><span class="os-pill os-linux">Linux</span><code class="chain-code">{{ current.chainLinux }}</code></div>
              </div>
            </div>

            <!-- 研判与处置 -->
            <div class="rounded-md border p-4" style="border-color: var(--color-border);">
              <h4 class="section-h !mt-0">研判结论与处置</h4>
              <ul class="text-xs space-y-1.5" style="color: var(--color-text-secondary);">
                <li v-for="(c, i) in current.conclusions" :key="i">· {{ c }}</li>
              </ul>
            </div>
          </div>
        </div>
      </template>

      <!-- ② 日志源速查 -->
      <template #tab-1>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <input
              v-model="sourceQuery"
              type="text"
              placeholder="搜索日志源 / 路径 / 内容，如 Security、auth.log、Sysmon、audit ..."
              class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
              style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
            />
            <span class="text-xs whitespace-nowrap" style="color: var(--color-text-muted);">{{ filteredSources.length }} 个日志源</span>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="os in osFilters"
              :key="os"
              @click="sourceOs = os"
              class="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              :style="sourceOs === os
                ? 'background: var(--color-primary); color: #fff;'
                : 'background: var(--color-bg-secondary); color: var(--color-text-muted); border: 1px solid var(--color-border);'"
            >{{ os }} <span class="ml-1 opacity-70">{{ sourceCount(os) }}</span></button>
          </div>

          <div class="rounded-md border overflow-x-auto" style="border-color: var(--color-border);">
            <table class="w-full text-xs">
              <thead>
                <tr style="background-color: var(--color-bg-tertiary);">
                  <th class="px-3 py-2 text-left font-medium whitespace-nowrap" style="color: var(--color-text-secondary);">系统</th>
                  <th class="px-3 py-2 text-left font-medium" style="color: var(--color-text-secondary);">日志源与位置</th>
                  <th class="px-3 py-2 text-left font-medium" style="color: var(--color-text-secondary);">记录内容 / 开启前提</th>
                  <th class="px-3 py-2 text-left font-medium" style="color: var(--color-text-secondary);">读取命令</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, i) in filteredSources" :key="i" class="border-t align-top" :style="{ borderColor: 'var(--color-border)' }">
                  <td class="px-3 py-2 whitespace-nowrap"><span class="os-pill" :class="s.os === 'Windows' ? 'os-win' : 'os-linux'">{{ s.os }}</span></td>
                  <td class="px-3 py-2">
                    <p class="font-medium whitespace-nowrap" style="color: var(--color-text);">{{ s.name }}</p>
                    <code class="path-text">{{ s.path }}</code>
                  </td>
                  <td class="px-3 py-2">
                    <p style="color: var(--color-text-secondary);">{{ s.content }}</p>
                    <p class="mt-1" style="color: var(--color-text-muted);">{{ s.enabled }}</p>
                  </td>
                  <td class="px-3 py-2" style="min-width: 16rem;">
                    <code class="cmd-text">{{ s.cmd }}</code>
                    <div class="mt-1.5"><CopyButton :text="s.cmd" /></div>
                  </td>
                </tr>
                <tr v-if="filteredSources.length === 0">
                  <td colspan="4" class="px-3 py-8 text-center" style="color: var(--color-text-muted);">没有匹配的日志源</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="text-xs" style="color: var(--color-text-muted);">
            多数 Linux 审计能力（进程命令行、网络连接、文件改写）默认不记录，需事先配置 auditd 规则或集中日志；Windows 的 4688 命令行、4663 对象访问、Sysmon 同样需要额外开启。
          </p>
        </div>
      </template>

      <!-- ③ 关联研判与时间线 -->
      <template #tab-2>
        <div class="space-y-4">
          <h4 class="section-h !mt-0">典型攻击链：一个动作会同时落在多个日志里</h4>
          <div class="space-y-3">
            <div v-for="(c, i) in ATTACK_CHAINS" :key="i" class="rounded-md border p-4" style="border-color: var(--color-border);">
              <p class="text-sm font-semibold mb-2" style="color: var(--color-text);">{{ i + 1 }}. {{ c.name }}</p>
              <div class="space-y-2">
                <div class="chain-line"><span class="os-pill os-win">Windows</span><code class="chain-code">{{ c.win }}</code></div>
                <div class="chain-line"><span class="os-pill os-linux">Linux</span><code class="chain-code">{{ c.linux }}</code></div>
              </div>
              <p class="text-xs mt-2 leading-relaxed" style="color: var(--color-text-secondary);">{{ c.note }}</p>
            </div>
          </div>

          <h4 class="section-h">时间线对齐与常见误报</h4>
          <div class="space-y-2">
            <div v-for="(p, i) in PITFALLS" :key="i" class="rounded-md border px-3 py-2.5" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
              <p class="text-xs font-semibold" style="color: var(--color-text);">{{ p.title }}</p>
              <p class="text-xs mt-1 leading-relaxed" style="color: var(--color-text-secondary);">{{ p.text }}</p>
            </div>
          </div>

          <p class="text-xs" style="color: var(--color-text-muted);">
            ⚠️ 所有命令仅可在你拥有合法权限与授权的系统上执行；处置顺序遵循「先取证、后清理，先遏制、再根除」。本工具为分析流程参考，实际研判请结合现场环境与多方证据。
          </p>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';
import {
  SCENARIOS,
  LOG_SOURCES,
  ATTACK_CHAINS,
  PITFALLS,
  type Scenario,
} from './systemLogAnalyzerData';

const scenarioQuery = ref('');
const selectedId = ref(SCENARIOS[0].id);

const filteredScenarios = computed(() => {
  const q = scenarioQuery.value.trim().toLowerCase();
  if (!q) return SCENARIOS;
  return SCENARIOS.filter((s) => {
    const hay = [
      s.name, s.summary, ...s.signs, ...s.tags,
      ...s.steps.flatMap((st) => [st.title, st.goal, st.win.src, st.win.read, st.linux.src, st.linux.read]),
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });
});

// 搜索后若当前场景已被过滤掉，自动切到结果中的第一个，避免详情与选中态不一致
watch(filteredScenarios, (list) => {
  if (list.length && !list.some((s) => s.id === selectedId.value)) {
    selectedId.value = list[0].id;
  }
});

const current = computed(() => SCENARIOS.find((s) => s.id === selectedId.value) || SCENARIOS[0]);

function allCmds(s: Scenario): string {
  return s.steps
    .map((st, i) => `# ${i + 1}. ${st.title}\n# Windows — ${st.win.src}\n${st.win.cmd}\n# Linux — ${st.linux.src}\n${st.linux.cmd}`)
    .join('\n\n');
}

const osFilters = ['全部', 'Windows', 'Linux'] as const;
const sourceQuery = ref('');
const sourceOs = ref<string>('全部');

function sourceCount(os: string): number {
  return os === '全部' ? LOG_SOURCES.length : LOG_SOURCES.filter((s) => s.os === os).length;
}

const filteredSources = computed(() => {
  const q = sourceQuery.value.trim().toLowerCase();
  return LOG_SOURCES.filter((s) => {
    if (sourceOs.value !== '全部' && s.os !== sourceOs.value) return false;
    if (!q) return true;
    return [s.os, s.name, s.path, s.content, s.enabled, s.cmd].join(' ').toLowerCase().includes(q);
  });
});
</script>

<style scoped>
.section-h { font-size: 0.8rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.6rem; }
.sign-chip { font-size: 0.68rem; padding: 0.1rem 0.45rem; border-radius: 0.35rem; background: var(--color-bg-tertiary); color: var(--color-text-secondary); }
.step-card { border-radius: 0.55rem; border: 1px solid var(--color-border); padding: 0.85rem; background: var(--color-bg-secondary); }
.step-num { flex-shrink: 0; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; background: var(--color-primary); color: #fff; }
.side-card { border-radius: 0.45rem; border: 1px solid var(--color-border); padding: 0.65rem; background: var(--color-bg); min-width: 0; }
.side-title { display: flex; align-items: center; gap: 0.4rem; font-size: 0.7rem; color: var(--color-text-secondary); margin-bottom: 0.45rem; min-width: 0; }
.os-pill { flex-shrink: 0; font-size: 0.62rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 0.3rem; }
.os-win { background: var(--color-primary-light); color: var(--color-primary); }
.os-linux { background: rgba(245, 158, 11, 0.14); color: #b45309; }
.cmd-row { display: flex; align-items: flex-start; gap: 0.45rem; flex-wrap: wrap; }
.cmd-row > :first-child { flex: 1 1 13rem; min-width: 0; }
.cmd-text { display: block; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.68rem; line-height: 1.5; white-space: pre-wrap; word-break: break-all; padding: 0.45rem 0.6rem; border-radius: 0.35rem; background: var(--color-bg-tertiary); color: var(--color-text-secondary); }
.path-text { display: block; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.65rem; word-break: break-all; color: var(--color-text-muted); margin-top: 0.15rem; }
.side-read { font-size: 0.7rem; line-height: 1.55; color: var(--color-text-secondary); margin-top: 0.5rem; }
.read-lbl { display: inline-block; font-size: 0.62rem; font-weight: 700; color: var(--color-primary); margin-right: 0.35rem; }
.chain-line { display: flex; align-items: flex-start; gap: 0.5rem; flex-wrap: wrap; }
.chain-code { flex: 1 1 14rem; min-width: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.7rem; line-height: 1.5; word-break: break-word; color: var(--color-text-secondary); }
</style>
