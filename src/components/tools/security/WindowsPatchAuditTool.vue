<template>
  <div class="space-y-6">
    <p class="legal-note">
      ⚠️ 本工具仅用于**你拥有合法授权的资产自查 / 授权安全评估**。它会根据 systeminfo 输出的补丁(KB)列表，判断系统是否缺失已知的提权 / 远程代码执行补丁，属于防御与合规自查用途。请勿对未授权系统使用。
    </p>

    <!-- 输入区 -->
    <div>
      <h3 class="section-title">① 粘贴 systeminfo 输出</h3>
      <p class="hint">
        在目标 Windows 上运行 <code class="inline">systeminfo</code>（或 <code class="inline">systeminfo &gt; si.txt</code>）后，把结果粘贴到下面，或上传 .txt 文件。支持中英文输出。
      </p>
      <textarea
        v-model="input"
        class="si-input"
        rows="10"
        placeholder="在此粘贴 systeminfo 的完整输出…"
      ></textarea>
      <div class="actions">
        <button class="btn-primary" @click="runAudit">开始分析</button>
        <button class="btn-secondary" @click="loadSample">填入示例</button>
        <label class="btn-secondary file-btn">
          上传 .txt
          <input type="file" accept=".txt,text/plain" class="hidden-file" @change="onFile" />
        </label>
        <button v-if="result" class="btn-ghost" @click="clearAll">清空</button>
      </div>
    </div>

    <!-- 分析结果 -->
    <div v-if="result">
      <h3 class="section-title">② 审计结果</h3>
      <!-- 系统概要 -->
      <div class="summary">
        <div class="sum-item">
          <span class="sum-label">操作系统</span>
          <span class="sum-val break-all">{{ result.ctx.osRaw || '未识别' }}</span>
        </div>
        <div class="sum-item">
          <span class="sum-label">OS Build</span>
          <span class="sum-val">{{ result.ctx.build ?? '未知' }}</span>
        </div>
        <div class="sum-item">
          <span class="sum-label">已装补丁数</span>
          <span class="sum-val">{{ result.ctx.kbCount }}</span>
        </div>
        <div class="sum-item">
          <span class="sum-label">命中漏洞</span>
          <span class="sum-val" :class="result.hits.length ? 'danger' : 'ok'">{{ result.hits.length }}</span>
        </div>
      </div>

      <!-- 命中列表 -->
      <div v-if="result.hits.length" class="space-y-3 mt-4">
        <div v-for="h in result.hits" :key="h.cve.cve" class="vuln-card">
          <div class="vuln-head">
            <span class="vuln-cve">{{ h.cve.cve }}</span>
            <span class="badge" :class="h.cve.type === 'RCE' ? 'badge-rce' : 'badge-eop'">{{ h.cve.type === 'RCE' ? '远程代码执行' : '权限提升' }}</span>
            <span v-if="h.cve.exploit" class="badge badge-exp">有公开 EXP</span>
          </div>
          <p class="vuln-title">{{ h.cve.titleZh }} <span class="vuln-title-en">{{ h.cve.titleEn }}</span></p>
          <p class="vuln-note">{{ h.cve.note }}</p>
          <div class="fix-row">
            <div class="fix-kbs">
              <span class="fix-label">建议安装（任意一个即可修复）：</span>
              <span class="kb-list">KB{{ h.missingKbs.join(' / KB') }}</span>
            </div>
            <CopyButton :text="'KB' + h.missingKbs.join(' KB')" />
          </div>
          <a class="vuln-ref" :href="h.cve.ref" target="_blank" rel="noopener">微软官方公告 ↗</a>
        </div>
      </div>
      <div v-else class="empty">
        未发现已知可利用的提权 / 远程代码执行补丁缺失。<br />
        <span class="text-muted">仍可能存在配置类弱点（无引号服务路径、可写服务等），建议配合 PowerUp / winpeas 进一步排查。</span>
      </div>
    </div>

    <!-- 漏洞数据库概览 -->
    <div>
      <h3 class="section-title">③ 漏洞数据库概览</h3>
      <p class="hint">
        内置快照更新于 <b class="db-date">{{ dbUpdated }}</b>。下表为当前生效库（点「一键更新」后会随之刷新）的大致情况；若条目偏旧或想纳入更全的漏洞，可点下方「一键更新」拉取最新内置源，或导入自定义 JSON。
      </p>
      <div class="db-stats">
        <div class="db-stat"><span class="db-stat-num">{{ dbStats.total }}</span><span class="db-stat-lbl">总条目</span></div>
        <div class="db-stat"><span class="db-stat-num danger">{{ dbStats.eop }}</span><span class="db-stat-lbl">权限提升</span></div>
        <div class="db-stat"><span class="db-stat-num danger">{{ dbStats.rce }}</span><span class="db-stat-lbl">远程代码执行</span></div>
        <div class="db-stat"><span class="db-stat-num danger">{{ dbStats.exploit }}</span><span class="db-stat-lbl">有公开 EXP</span></div>
      </div>
      <div class="db-table-wrap">
        <table class="db-table">
          <thead>
            <tr><th>#</th><th>CVE</th><th>类型</th><th>影响系统</th><th>公开 EXP</th><th>修复补丁</th></tr>
          </thead>
          <tbody>
            <tr v-for="(v, i) in db" :key="v.cve">
              <td>{{ i + 1 }}</td>
              <td class="mono">{{ v.cve }}</td>
              <td><span class="badge" :class="v.type === 'RCE' ? 'badge-rce' : 'badge-eop'">{{ v.type === 'RCE' ? 'RCE' : 'EoP' }}</span></td>
              <td class="os-cell">{{ osLabel(v.osMatch) }}</td>
              <td>{{ v.exploit ? '✓' : '—' }}</td>
              <td class="mono">{{ v.patchKbs.length }} 个</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 数据更新 -->
    <div>
      <h3 class="section-title">④ 更新漏洞数据库</h3>
      <p class="hint">
        内置为精选静态快照（仅含高影响、有公开利用的漏洞）。点「一键更新」可直接从内置源拉取，无需自己找地址；也可粘贴自定义数据库 JSON 地址拉取，或导入本地 JSON 文件。数据库格式与下方内置结构一致。
      </p>
      <div class="actions">
        <input v-model="dbUrl" class="url-input" placeholder="可选：覆盖为自定义数据库 JSON 地址" />
        <button class="btn-primary" @click="updateFromDefault">一键更新（内置源）</button>
        <button class="btn-secondary" @click="updateFromUrl">从地址更新</button>
        <label class="btn-secondary file-btn">
          导入本地 JSON
          <input type="file" accept=".json,application/json" class="hidden-file" @change="onDbFile" />
        </label>
        <button class="btn-ghost" @click="restoreDb">恢复内置</button>
      </div>
      <p v-if="dbStatus" class="db-status" :class="dbError ? 'err' : 'ok'">{{ dbStatus }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import {
  parseSystemInfo,
  audit,
  vulnerabilityDb,
  DEFAULT_DB_URL,
  DB_UPDATED_DATE,
  type VulnEntry,
  type ParsedSystemInfo,
  type AuditResult,
} from './windowsPatchAuditData';

const input = ref('');
const dbUrl = ref(DEFAULT_DB_URL);
const db = ref<VulnEntry[]>([...vulnerabilityDb]);
const dbStatus = ref('');
const dbError = ref(false);
const dbUpdated = DB_UPDATED_DATE;

// 数据库概览统计：随 db 变化实时刷新，帮助用户判断是否需要更新
const dbStats = computed(() => {
  const list = db.value;
  return {
    total: list.length,
    eop: list.filter((v) => v.type === 'EoP').length,
    rce: list.filter((v) => v.type === 'RCE').length,
    exploit: list.filter((v) => v.exploit).length,
  };
});

const OS_LABEL_MAP: Record<string, string> = {
  'windows 10': 'Win10',
  'windows 11': 'Win11',
  'windows server 2019': 'Server 2019',
  'windows server 2022': 'Server 2022',
  'windows server': 'Server 全系',
  'windows 7': 'Win7',
  'windows server 2008': 'Server 2008',
};
function osLabel(os: string[]): string {
  return os.map((o) => OS_LABEL_MAP[o] ?? o).join(' / ');
}

interface Result {
  ctx: ParsedSystemInfo;
  hits: AuditResult[];
}
const result = ref<Result | null>(null);

function runAudit() {
  const text = input.value.trim();
  if (!text) {
    result.value = null;
    return;
  }
  const ctx = parseSystemInfo(text);
  const hits = audit(ctx, db.value);
  result.value = { ctx, hits };
}

function loadSample() {
  input.value = `Host Name:                 DESKTOP-TEST
OS Name:                   Microsoft Windows 10 Pro
OS Version:                10.0.18363 N/A Build 18363
System Manufacturer:       Microsoft Corporation
System Type:               x64-based PC
Hotfix(s):                 2 Hotfix(s) Installed.
                           [01]: KB4498523
                           [02]: KB4507455`;
  runAudit();
}

function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    input.value = String(reader.result || '');
    runAudit();
  };
  reader.readAsText(f);
}

function clearAll() {
  input.value = '';
  result.value = null;
}

// 一键更新：直接使用内置源地址，用户无需填写
async function updateFromDefault() {
  dbUrl.value = DEFAULT_DB_URL;
  await updateFromUrl();
}

async function updateFromUrl() {
  const url = dbUrl.value.trim();
  if (!url) {
    dbStatus.value = '未填写地址，请填写最新数据库 JSON 地址，或用「导入本地 JSON」。';
    dbError.value = true;
    return;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = (await res.json()) as VulnEntry[];
    if (!Array.isArray(data)) throw new Error('JSON 顶层应为漏洞数组');
    db.value = data;
    dbStatus.value = `已从地址更新，当前库含 ${data.length} 条漏洞。`;
    dbError.value = false;
    if (result.value) runAudit();
  } catch (err) {
    dbError.value = true;
    dbStatus.value = '更新失败：' + (err instanceof Error ? err.message : String(err)) + '（可能是跨域限制或地址无效）';
  }
}

function onDbFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || '[]')) as VulnEntry[];
      if (!Array.isArray(data)) throw new Error('JSON 顶层应为漏洞数组');
      db.value = data;
      dbStatus.value = `已导入本地数据库，当前库含 ${data.length} 条漏洞。`;
      dbError.value = false;
      if (result.value) runAudit();
    } catch (err) {
      dbError.value = true;
      dbStatus.value = '导入失败：' + (err instanceof Error ? err.message : String(err));
    }
  };
  reader.readAsText(f);
}

function restoreDb() {
  db.value = [...vulnerabilityDb];
  dbStatus.value = `已恢复内置数据库（${vulnerabilityDb.length} 条）。`;
  dbError.value = false;
  if (result.value) runAudit();
}
</script>

<style scoped>
.legal-note {
  font-size: 0.72rem;
  line-height: 1.5;
  color: var(--color-text-muted);
  padding: 0.75rem 1rem;
  border-radius: 0.7rem;
  background: var(--color-primary-light);
}
.section-title {
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}
.hint {
  font-size: 0.72rem;
  line-height: 1.55;
  color: var(--color-text-muted);
  margin-bottom: 0.6rem;
}
.inline {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  padding: 0 0.25rem;
  border-radius: 0.25rem;
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}
.si-input {
  width: 100%;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  line-height: 1.5;
  padding: 0.75rem;
  border-radius: 0.7rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-text);
  outline: none;
  resize: vertical;
}
.si-input:focus { border-color: var(--color-primary); }
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.7rem;
}
.btn-primary {
  padding: 0.5rem 1rem;
  border-radius: 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  border: none;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
}
.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.9rem;
  border-radius: 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}
.btn-ghost {
  padding: 0.5rem 0.9rem;
  border-radius: 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
}
.btn-secondary:hover, .btn-ghost:hover { border-color: var(--color-primary); color: var(--color-primary); }
.file-btn { position: relative; overflow: hidden; }
.hidden-file { display: none; }

.summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}
@media (min-width: 640px) { .summary { grid-template-columns: repeat(4, 1fr); } }
.sum-item {
  padding: 0.7rem 0.85rem;
  border-radius: 0.7rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}
.sum-label { display: block; font-size: 0.68rem; color: var(--color-text-muted); }
.sum-val { display: block; margin-top: 0.2rem; font-size: 0.82rem; font-weight: 700; color: var(--color-text); }
.sum-val.danger { color: #ef4444; }
.sum-val.ok { color: #22c55e; }

.vuln-card {
  padding: 0.85rem 1rem;
  border-radius: 0.8rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
}
.vuln-head { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.vuln-cve { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem; font-weight: 700; color: var(--color-primary); }
.badge { font-size: 0.66rem; font-weight: 700; padding: 0.12rem 0.5rem; border-radius: 0.5rem; }
.badge-eop { background: rgba(234, 179, 8, 0.15); color: #eab308; }
.badge-rce { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.badge-exp { background: rgba(239, 68, 68, 0.22); color: #ef4444; }
.vuln-title { margin-top: 0.45rem; font-size: 0.82rem; font-weight: 600; color: var(--color-text); }
.vuln-title-en { font-weight: 400; font-size: 0.72rem; color: var(--color-text-muted); margin-left: 0.35rem; }
.vuln-note { margin-top: 0.35rem; font-size: 0.74rem; line-height: 1.55; color: var(--color-text-secondary); }
.fix-row { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; margin-top: 0.55rem; flex-wrap: wrap; }
.fix-label { font-size: 0.72rem; color: var(--color-text-muted); }
.kb-list { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.76rem; color: #22c55e; }
.vuln-ref { display: inline-block; margin-top: 0.5rem; font-size: 0.72rem; color: var(--color-primary); text-decoration: none; }
.vuln-ref:hover { text-decoration: underline; }

.empty {
  margin-top: 0.8rem;
  padding: 1.2rem 1rem;
  border-radius: 0.8rem;
  border: 1px dashed var(--color-border);
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text);
  background: var(--color-bg-secondary);
}
.text-muted { font-size: 0.72rem; color: var(--color-text-muted); }

.url-input {
  flex: 1;
  min-width: 200px;
  padding: 0.5rem 0.7rem;
  font-size: 0.76rem;
  border-radius: 0.6rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-text);
  outline: none;
}
.url-input:focus { border-color: var(--color-primary); }
.db-status { margin-top: 0.6rem; font-size: 0.72rem; }
.db-status.ok { color: #22c55e; }
.db-status.err { color: #ef4444; }

.db-date { color: var(--color-primary); }
.db-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}
@media (min-width: 640px) { .db-stats { grid-template-columns: repeat(4, 1fr); } }
.db-stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.7rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}
.db-stat-num { font-size: 1.25rem; font-weight: 800; color: var(--color-text); line-height: 1.1; }
.db-stat-num.danger { color: #ef4444; }
.db-stat-lbl { font-size: 0.68rem; color: var(--color-text-muted); }
.db-table-wrap { overflow-x: auto; border-radius: 0.7rem; border: 1px solid var(--color-border); }
.db-table { width: 100%; border-collapse: collapse; font-size: 0.74rem; }
.db-table th, .db-table td {
  padding: 0.5rem 0.6rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.db-table thead th { background: var(--color-bg-secondary); color: var(--color-text-muted); font-weight: 700; }
.db-table tbody tr:last-child td { border-bottom: none; }
.db-table .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--color-primary); }
.db-table .os-cell { white-space: normal; min-width: 9rem; }
.badge-eop { background: rgba(234, 179, 8, 0.15); color: #eab308; }
.badge-rce { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
</style>
