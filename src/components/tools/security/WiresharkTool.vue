<template>
  <div class="space-y-4">
    <TabView :tabs="['过滤器生成器', '常用过滤命令']">
      <!-- ============ Tab 0: 生成器 ============ -->
      <template #tab-0>
        <!-- 全局：过滤器类型 -->
        <div class="rounded-md border p-3 flex items-center gap-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <span class="text-xs font-semibold" style="color: var(--color-text);">过滤器类型</span>
          <select v-model="filterType" :style="inputStyle" class="rounded-md border px-2 py-1.5 text-sm">
            <option value="display">显示过滤器 (Display Filter)</option>
            <option value="capture">抓包过滤器 (Capture Filter)</option>
          </select>
          <span class="text-xs" style="color: var(--color-text-muted);">当前语法：{{ filterType === 'display' ? 'Wireshark 显示过滤器' : 'libpcap 抓包语法' }}</span>
        </div>

        <!-- IP 地址过滤 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">IP / 网段过滤</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label class="text-xs" style="color: var(--color-text-muted);">
              方向
              <select v-model="ipDir" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="any">源或目标 (any)</option>
                <option value="src">仅源 (src)</option>
                <option value="dst">仅目标 (dst)</option>
              </select>
            </label>
            <label class="text-xs md:col-span-2" style="color: var(--color-text-muted);">
              地址 (IP 或 CIDR，如 192.168.1.1 / 10.0.0.0/8)
              <input v-model.trim="ipVal" placeholder="192.168.1.1" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
            </label>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ ipCmd || '—' }}</code>
            <CopyButton :text="ipCmd" />
          </div>
        </div>

        <!-- 端口过滤 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">端口过滤</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label class="text-xs" style="color: var(--color-text-muted);">
              协议
              <select v-model="portProto" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="tcp">tcp</option>
                <option value="udp">udp</option>
              </select>
            </label>
            <label class="text-xs" style="color: var(--color-text-muted);">
              方向
              <select v-model="portDir" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="any">源或目标 (any)</option>
                <option value="src">仅源端口</option>
                <option value="dst">仅目标端口</option>
              </select>
            </label>
            <label class="text-xs" style="color: var(--color-text-muted);">
              端口 (如 80 或 8000-9000)
              <input v-model.trim="portVal" placeholder="443" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
            </label>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ portCmd || '—' }}</code>
            <CopyButton :text="portCmd" />
          </div>
        </div>

        <!-- 协议过滤 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">协议过滤</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label class="text-xs" style="color: var(--color-text-muted);">
              协议
              <select v-model="proto" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
                <option value="arp">ARP</option>
                <option value="dns">DNS</option>
                <option value="http">HTTP</option>
                <option value="https">HTTPS (TLS)</option>
                <option value="tls">TLS</option>
                <option value="ssh">SSH</option>
                <option value="smtp">SMTP</option>
                <option value="ftp">FTP</option>
                <option value="dhcp">DHCP</option>
              </select>
            </label>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ protoCmd || '—' }}</code>
            <CopyButton :text="protoCmd" />
          </div>
        </div>

        <!-- TCP 标志位 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">TCP 标志位过滤</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label class="text-xs" style="color: var(--color-text-muted);">
              标志组合
              <select v-model="flagPreset" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="syn">仅 SYN（半开/扫描）</option>
                <option value="syn-ack">SYN + ACK</option>
                <option value="rst">RST（重置）</option>
                <option value="fin">FIN（结束）</option>
              </select>
            </label>
          </div>
          <p class="text-xs mt-2" style="color: var(--color-text-muted);">提示：抓包过滤器用 <code class="font-mono">tcp[tcpflags]</code> 位运算，显示过滤器用 <code class="font-mono">tcp.flags.*</code>。</p>
          <div class="mt-2 flex items-center justify-between gap-2">
            <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ flagCmd || '—' }}</code>
            <CopyButton :text="flagCmd" />
          </div>
        </div>

        <!-- HTTP 应用层 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">HTTP 应用层过滤（显示过滤器）</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label class="text-xs" style="color: var(--color-text-muted);">
              字段
              <select v-model="httpField" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="method">请求方法</option>
                <option value="code">响应状态码</option>
                <option value="contains">报文包含关键字</option>
                <option value="uri">请求 URI 包含</option>
              </select>
            </label>
            <label class="text-xs" style="color: var(--color-text-muted);">
              值 (方法/状态码/关键字)
              <input v-model.trim="httpVal" placeholder="GET" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
            </label>
          </div>
          <p class="text-xs mt-2" style="color: var(--color-text-muted);">说明：HTTP 应用层字段只能作为显示过滤器使用；抓包时请改用 <code class="font-mono">tcp port 80</code>。</p>
          <div class="mt-2 flex items-center justify-between gap-2">
            <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ httpCmd || '—' }}</code>
            <CopyButton :text="httpCmd" />
          </div>
        </div>

        <!-- 组合条件 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">组合条件 (AND / OR)</h3>
          <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <label class="text-xs md:col-span-2" style="color: var(--color-text-muted);">
              条件 A
              <input v-model.trim="comboA" placeholder='ip.addr == 192.168.1.1' :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm font-mono" />
            </label>
            <label class="text-xs" style="color: var(--color-text-muted);">
              连接符
              <select v-model="comboOp" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="and">and（且）</option>
                <option value="or">or（或）</option>
              </select>
            </label>
            <label class="text-xs md:col-span-2" style="color: var(--color-text-muted);">
              条件 B
              <input v-model.trim="comboB" placeholder='tcp.port == 443' :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm font-mono" />
            </label>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ comboCmd || '—' }}</code>
            <CopyButton :text="comboCmd" />
          </div>
        </div>
      </template>

      <!-- ============ Tab 1: 速查 ============ -->
      <template #tab-1>
        <div class="flex items-center gap-3">
          <input
            v-model="searchText"
            type="text"
            placeholder="搜索过滤命令..."
            class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
            :style="inputStyle"
          />
          <span class="text-xs whitespace-nowrap" style="color: var(--color-text-muted);">{{ filteredCount }} 条命令</span>
        </div>
        <TabView :tabs="cheatCats">
          <template v-for="(cat, idx) in cheatCats" :key="idx" #[`tab-${idx}`]>
            <div class="space-y-3 mt-3">
              <div v-for="(item, cidx) in filteredItems(cat)" :key="cidx"
                class="rounded-md border p-3"
                :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="text-sm font-medium" style="color: var(--color-text);">{{ item.title }}</span>
                  <CopyButton :text="item.command" />
                </div>
                <pre class="text-xs font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ item.command }}</pre>
                <p v-if="item.desc" class="text-xs mt-1" style="color: var(--color-text-muted);">{{ item.desc }}</p>
              </div>
              <div v-if="filteredItems(cat).length === 0 && searchText" class="text-center py-4">
                <p class="text-xs" style="color: var(--color-text-muted);">没有匹配的过滤命令</p>
              </div>
            </div>
          </template>
        </TabView>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';

const inputStyle = {
  backgroundColor: 'var(--color-bg-secondary)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
};

// 全局过滤器类型
const filterType = ref<'display' | 'capture'>('display');

// ── IP / 网段 ──
const ipDir = ref('any');
const ipVal = ref('192.168.1.1');
const ipCmd = computed(() => {
  const v = ipVal.value.trim();
  if (!v) return '';
  const isNet = v.includes('/');
  if (filterType.value === 'capture') {
    const kw = isNet ? 'net' : 'host';
    if (ipDir.value === 'src') return `src ${kw} ${v}`;
    if (ipDir.value === 'dst') return `dst ${kw} ${v}`;
    return `${kw} ${v}`;
  }
  if (ipDir.value === 'src') return `ip.src == ${v}`;
  if (ipDir.value === 'dst') return `ip.dst == ${v}`;
  return `ip.addr == ${v}`;
});

// ── 端口 ──
const portProto = ref('tcp');
const portDir = ref('any');
const portVal = ref('443');
const portCmd = computed(() => {
  const v = portVal.value.trim();
  if (!v) return '';
  if (filterType.value === 'capture') {
    if (portDir.value === 'src') return `${portProto.value} src port ${v}`;
    if (portDir.value === 'dst') return `${portProto.value} dst port ${v}`;
    return `${portProto.value} port ${v}`;
  }
  if (portDir.value === 'src') return `${portProto.value}.srcport == ${v}`;
  if (portDir.value === 'dst') return `${portProto.value}.dstport == ${v}`;
  return `${portProto.value}.port == ${v}`;
});

// ── 协议 ──
const proto = ref('http');
const protoMap: Record<string, { capture: string; display: string }> = {
  tcp: { capture: 'tcp', display: 'tcp' },
  udp: { capture: 'udp', display: 'udp' },
  icmp: { capture: 'icmp', display: 'icmp' },
  arp: { capture: 'arp', display: 'arp' },
  dns: { capture: 'port 53', display: 'dns' },
  http: { capture: 'tcp port 80', display: 'http' },
  https: { capture: 'tcp port 443', display: 'tls' },
  tls: { capture: 'tcp port 443', display: 'tls' },
  ssh: { capture: 'tcp port 22', display: 'ssh' },
  smtp: { capture: 'tcp port 25', display: 'smtp' },
  ftp: { capture: 'tcp port 21', display: 'ftp' },
  dhcp: { capture: 'port 67 or port 68', display: 'bootp' },
};
const protoCmd = computed(() => {
  const m = protoMap[proto.value];
  if (!m) return '';
  return filterType.value === 'capture' ? m.capture : m.display;
});

// ── TCP 标志位 ──
const flagPreset = ref('syn');
const flagMap: Record<string, { capture: string; display: string }> = {
  'syn': { capture: 'tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn', display: 'tcp.flags.syn == 1 && tcp.flags.ack == 0' },
  'syn-ack': { capture: 'tcp[tcpflags] & (tcp-syn|tcp-ack) == (tcp-syn|tcp-ack)', display: 'tcp.flags.syn == 1 && tcp.flags.ack == 1' },
  'rst': { capture: 'tcp[tcpflags] & tcp-rst != 0', display: 'tcp.flags.reset == 1' },
  'fin': { capture: 'tcp[tcpflags] & tcp-fin != 0', display: 'tcp.flags.fin == 1' },
};
const flagCmd = computed(() => {
  const m = flagMap[flagPreset.value];
  return filterType.value === 'capture' ? m.capture : m.display;
});

// ── HTTP 应用层（显示过滤器）──
const httpField = ref('method');
const httpVal = ref('GET');
const httpCmd = computed(() => {
  const v = httpVal.value.trim();
  if (httpField.value === 'method') return `http.request.method == "${v || 'GET'}"`;
  if (httpField.value === 'code') return `http.response.code == ${v || '200'}`;
  if (httpField.value === 'contains') return `http contains "${v}"`;
  if (httpField.value === 'uri') return `http.request.uri contains "${v}"`;
  return '';
});

// ── 组合条件 ──
const comboA = ref('ip.addr == 192.168.1.1');
const comboOp = ref('and');
const comboB = ref('tcp.port == 443');
const comboCmd = computed(() => {
  const a = comboA.value.trim();
  const b = comboB.value.trim();
  if (!a || !b) return '';
  return `(${a}) ${comboOp.value} (${b})`;
});

// ── 速查表 ──
const searchText = ref('');
const cheatCats = ['IP 过滤', '端口与协议', 'TCP 标志位', 'HTTP 应用层', 'DNS 与常见服务', '组合与高级', '抓包过滤器 (Capture)'];

interface CmdItem { title: string; command: string; desc?: string; }
const cheat: Record<string, CmdItem[]> = {
  'IP 过滤': [
    { title: '指定 IP（源或目标）', command: 'ip.addr == 192.168.1.1', desc: '显示过滤器：匹配该 IP 的进出流量' },
    { title: '仅源 IP', command: 'ip.src == 192.168.1.1' },
    { title: '仅目标 IP', command: 'ip.dst == 8.8.8.8' },
    { title: '排除某 IP', command: 'ip.addr != 192.168.1.1' },
    { title: 'IP 段 (CIDR)', command: 'ip.addr == 10.0.0.0/8' },
    { title: 'IPv6 地址', command: 'ipv6.addr == fe80::1' },
  ],
  '端口与协议': [
    { title: 'TCP 某端口', command: 'tcp.port == 80' },
    { title: '仅目标 TCP 端口', command: 'tcp.dstport == 443' },
    { title: '仅源 TCP 端口', command: 'tcp.srcport == 22' },
    { title: 'UDP 某端口', command: 'udp.port == 53' },
    { title: '端口范围', command: 'tcp.port >= 8000 && tcp.port <= 9000' },
    { title: '某协议', command: 'dns', desc: '等价显示过滤器字段名' },
    { title: '非 TCP', command: '!tcp' },
  ],
  'TCP 标志位': [
    { title: '仅 SYN（半开/扫描）', command: 'tcp.flags.syn == 1 && tcp.flags.ack == 0' },
    { title: 'SYN + ACK', command: 'tcp.flags.syn == 1 && tcp.flags.ack == 1' },
    { title: 'RST 包', command: 'tcp.flags.reset == 1' },
    { title: 'FIN 包', command: 'tcp.flags.fin == 1' },
    { title: '含 SYN 标志', command: 'tcp.flags.syn == 1' },
    { title: '连接建立完成', command: 'tcp.flags.ack == 1 && tcp.flags.syn == 0' },
  ],
  'HTTP 应用层': [
    { title: '指定请求方法', command: 'http.request.method == "GET"', desc: 'POST/PUT/DELETE 同理' },
    { title: '响应状态码', command: 'http.response.code == 200' },
    { title: '4xx/5xx 错误', command: 'http.response.code >= 400' },
    { title: '报文含关键字', command: 'http contains "password"' },
    { title: 'URI 含路径', command: 'http.request.uri contains "/admin"' },
    { title: '仅请求方向', command: 'http.request' },
    { title: '仅响应方向', command: 'http.response' },
  ],
  'DNS 与常见服务': [
    { title: 'DNS 流量', command: 'dns' },
    { title: 'DNS 查询某域名', command: 'dns.qry.name contains "example"' },
    { title: 'TLS/HTTPS 流量', command: 'tls' },
    { title: 'TLS SNI', command: 'tls.handshake.extension.type == "server_name"' },
    { title: 'ARP 流量', command: 'arp' },
    { title: 'ICMP (ping)', command: 'icmp' },
    { title: 'SSH 流量', command: 'ssh' },
  ],
  '组合与高级': [
    { title: 'AND 组合', command: '(ip.addr == 192.168.1.1) and (tcp.port == 443)' },
    { title: 'OR 组合', command: '(tcp.port == 80) or (tcp.port == 443)' },
    { title: '排除本地环回', command: 'ip.addr != 127.0.0.1' },
    { title: '某主机且非 DNS', command: '(ip.addr == 10.0.0.5) && !dns' },
    { title: '大包（>1000 字节）', command: 'frame.len > 1000' },
    { title: '握手失败（无 ACK）', command: 'tcp.flags.syn == 1 && tcp.flags.ack == 0' },
  ],
  '抓包过滤器 (Capture)': [
    { title: '指定主机', command: 'host 192.168.1.1', desc: 'libpcap 语法，抓包时即生效' },
    { title: '源主机', command: 'src host 192.168.1.1' },
    { title: '目标主机', command: 'dst host 8.8.8.8' },
    { title: '网段', command: 'net 10.0.0.0/8' },
    { title: 'TCP 端口', command: 'tcp port 443' },
    { title: 'UDP 端口', command: 'udp port 53' },
    { title: '组合', command: 'host 192.168.1.1 and tcp port 80' },
    { title: '排除', command: 'not port 22' },
  ],
};

const matchItem = (item: CmdItem, q: string) =>
  item.title.toLowerCase().includes(q) ||
  item.command.toLowerCase().includes(q) ||
  (item.desc && item.desc.toLowerCase().includes(q));

const filteredItems = (cat: string): CmdItem[] => {
  const list = cheat[cat] || [];
  if (!searchText.value.trim()) return list;
  const q = searchText.value.toLowerCase();
  return list.filter((i) => matchItem(i, q));
};
const filteredCount = computed(() => {
  const q = searchText.value.trim().toLowerCase();
  return Object.values(cheat).flat().filter((i) => !q || matchItem(i, q)).length;
});
</script>
