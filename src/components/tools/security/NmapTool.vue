<template>
  <div class="space-y-4">
    <!-- 目标 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">扫描目标</label>
      <input
        v-model="target"
        type="text"
        placeholder="192.168.1.0/24  example.com  10.10.10.10-20"
        class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      />
      <p class="text-xs mt-1" style="color: var(--color-text-muted);">支持单个 IP、域名、CIDR（如 192.168.1.0/24）、范围（如 10.0.0.1-10）或逗号分隔的多个目标</p>
    </div>

    <!-- 扫描模板 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">扫描模板（一键预设）</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="t in templates"
          :key="t.id"
          type="button"
          @click="applyTemplate(t)"
          class="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none"
          :style="activeTemplate === t.id
            ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)', backgroundColor: 'var(--color-bg-tertiary)' }
            : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)' }"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- 选项开关 -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input type="checkbox" v-model="opts.syn" />
        SYN 隐蔽扫描 (-sS)
      </label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input type="checkbox" v-model="opts.tcp" />
        TCP 全连接 (-sT)
      </label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input type="checkbox" v-model="opts.udp" />
        UDP 扫描 (-sU)
      </label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input type="checkbox" v-model="opts.ping" />
        Ping 扫描/主机发现 (-sn)
      </label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input type="checkbox" v-model="opts.os" />
        操作系统检测 (-O)
      </label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input type="checkbox" v-model="opts.service" />
        版本探测 (-sV)
      </label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input type="checkbox" v-model="opts.scripts" />
        默认脚本扫描 (-sC)
      </label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input type="checkbox" v-model="opts.aggressive" />
        激进扫描 (-A)
      </label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input type="checkbox" v-model="opts.noPing" />
        跳过主机发现 (-Pn)
      </label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input type="checkbox" v-model="opts.traceroute" />
        路由追踪 (--traceroute)
      </label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input type="checkbox" v-model="opts.vuln" />
        漏洞脚本 (-sV --script=vuln)
      </label>
    </div>

    <!-- 端口 / 速率 / 输出 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">端口范围</label>
        <input
          v-model="portSpec"
          type="text"
          placeholder="留空=默认 或 1-1000 / 80,443 / -"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">扫描速率 (-T)</label>
        <select
          v-model="timing"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        >
          <option value="">默认</option>
          <option value="0">T0 极慢（规避 IDS）</option>
          <option value="1">T1 慢速</option>
          <option value="2">T2 普通</option>
          <option value="3">T3 快速（默认）</option>
          <option value="4">T4 激进</option>
          <option value="5">T5 最快（易漏报）</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">输出格式 (-o)</label>
        <select
          v-model="output"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        >
          <option value="">不输出到文件</option>
          <option value="n">普通 (-oN result.nmap)</option>
          <option value="x">XML (-oX result.xml)</option>
          <option value="g">grepable (-oG result.gnmap)</option>
          <option value="a">all (-oA result)</option>
        </select>
      </div>
    </div>

    <!-- 自定义额外参数 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">额外参数（可选，追加到命令末尾）</label>
      <input
        v-model="extra"
        type="text"
        placeholder="如 --script http-enum --top-ports 1000"
        class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      />
    </div>

    <!-- 生成结果 -->
    <div class="reveal-item rounded-md border p-3" style="border-color: var(--color-border); backgroundColor: var(--color-bg-secondary);">
      <div class="flex items-center justify-between gap-2 mb-1">
        <span class="text-xs font-medium" style="color: var(--color-text-secondary);">生成的 nmap 命令</span>
        <CopyButton :text="command" />
      </div>
      <pre class="text-sm font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ command }}</pre>
    </div>

    <p class="text-xs" style="color: var(--color-text-muted);">
      仅用于合法授权的安全测试与学习。未经目标系统所有者书面授权的扫描可能违反法律与服务条款。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const target = ref('');
const portSpec = ref('');
const timing = ref('');
const output = ref('');
const extra = ref('');
const activeTemplate = ref('');

const opts = reactive({
  syn: false,
  tcp: false,
  udp: false,
  ping: false,
  os: false,
  service: false,
  scripts: false,
  aggressive: false,
  noPing: false,
  traceroute: false,
  vuln: false,
});

interface Template {
  id: string;
  label: string;
  apply: () => void;
}

function resetOpts() {
  Object.keys(opts).forEach((k) => { (opts as any)[k] = false; });
}

const templates: Template[] = [
  { id: 'quick', label: '快速 Ping 发现', apply: () => { resetOpts(); opts.ping = true; } },
  { id: 'syn', label: 'SYN 端口扫描', apply: () => { resetOpts(); opts.syn = true; } },
  { id: 'svc', label: '服务+版本', apply: () => { resetOpts(); opts.syn = true; opts.service = true; } },
  { id: 'default', label: '默认脚本扫描', apply: () => { resetOpts(); opts.syn = true; opts.service = true; opts.scripts = true; } },
  { id: 'full', label: '全端口扫描', apply: () => { resetOpts(); opts.syn = true; opts.service = true; opts.scripts = true; opts.os = true; portSpec.value = '1-65535'; } },
  { id: 'os', label: 'OS 识别', apply: () => { resetOpts(); opts.syn = true; opts.os = true; } },
  { id: 'aggressive', label: '激进扫描', apply: () => { resetOpts(); opts.aggressive = true; } },
  { id: 'udp', label: 'UDP 扫描', apply: () => { resetOpts(); opts.udp = true; } },
  { id: 'vuln', label: '漏洞扫描', apply: () => { resetOpts(); opts.syn = true; opts.vuln = true; } },
];

function applyTemplate(t: Template) {
  t.apply();
  activeTemplate.value = t.id;
}

const command = computed(() => {
  const args: string[] = ['nmap'];
  if (opts.ping) args.push('-sn');
  if (opts.syn) args.push('-sS');
  if (opts.tcp) args.push('-sT');
  if (opts.udp) args.push('-sU');
  if (opts.service) args.push('-sV');
  if (opts.scripts) args.push('-sC');
  if (opts.os) args.push('-O');
  if (opts.aggressive) args.push('-A');
  if (opts.noPing) args.push('-Pn');
  if (opts.traceroute) args.push('--traceroute');
  if (opts.vuln) args.push('-sV', '--script=vuln');

  const t = (timing.value || '').trim();
  if (t !== '') args.push(`-T${t}`);

  const p = (portSpec.value || '').trim();
  if (p === '-') args.push('-p-');
  else if (p) args.push(`-p${p}`);

  if (output.value) {
    const map: Record<string, string> = { n: '-oN result.nmap', x: '-oX result.xml', g: '-oG result.gnmap', a: '-oA result' };
    args.push(map[output.value]);
  }

  if (extra.value.trim()) args.push(extra.value.trim());

  const targetVal = target.value.trim() || 'TARGET';
  args.push(targetVal);

  return args.join(' ');
});
</script>
