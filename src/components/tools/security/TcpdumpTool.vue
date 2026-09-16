<template>
  <div class="space-y-4">
    <TabView :tabs="['命令生成器', '常用抓包命令']">
      <!-- ============ Tab 0: 生成器 ============ -->
      <template #tab-0>
        <!-- 完整命令 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-primary-light);">
          <div class="flex items-center justify-between gap-2 mb-2">
            <h3 class="text-sm font-semibold" style="color: var(--color-text);">完整命令</h3>
            <CopyButton :text="fullCmd" />
          </div>
          <pre class="text-xs font-mono overflow-x-auto p-3 rounded break-all" style="background-color: var(--color-bg-tertiary); color: var(--color-primary); white-space: pre-wrap; word-break: break-all;">{{ fullCmd || 'tcpdump' }}</pre>
          <p class="text-xs mt-2" style="color: var(--color-text-muted);">提示：tcpdump 通常需要 root 权限（命令前加 <code class="font-mono">sudo</code>）；表达式已用单引号包裹，直接粘贴到终端即可。</p>
        </div>

        <!-- 抓包选项 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">抓包选项</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label class="text-xs" style="color: var(--color-text-muted);">
              网卡 (-i)
              <select v-model="iface" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="any">any（所有网卡）</option>
                <option value="eth0">eth0</option>
                <option value="lo">lo（本地回环）</option>
                <option value="wlan0">wlan0（无线）</option>
                <option value="tun0">tun0（VPN）</option>
              </select>
            </label>
            <label class="text-xs" style="color: var(--color-text-muted);">
              地址解析
              <select v-model="resolve" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="">默认（解析主机与端口名）</option>
                <option value="n">-n（不解析主机名）</option>
                <option value="nn">-nn（都不解析，最快）</option>
              </select>
            </label>
            <label class="text-xs" style="color: var(--color-text-muted);">
              时间戳
              <select v-model="ts" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="">默认（相对时间）</option>
                <option value="tttt">-tttt（可读日期时间）</option>
                <option value="t">-t（不显示时间）</option>
              </select>
            </label>
          </div>
          <div class="flex flex-wrap gap-x-5 gap-y-2 mt-3">
            <label class="text-xs flex items-center gap-1.5" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="outV" :style="checkStyle" /> <span>-v 详细</span>
            </label>
            <label class="text-xs flex items-center gap-1.5" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="outX" :style="checkStyle" /> <span>-X 十六进制+ASCII</span>
            </label>
            <label class="text-xs flex items-center gap-1.5" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="outA" :style="checkStyle" /> <span>-A 仅 ASCII</span>
            </label>
            <label class="text-xs flex items-center gap-1.5" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="outE" :style="checkStyle" /> <span>-e 链路层头</span>
            </label>
            <label class="text-xs flex items-center gap-1.5" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="outQ" :style="checkStyle" /> <span>-q 简洁</span>
            </label>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <label class="text-xs" style="color: var(--color-text-muted);">
              抓包数量 (-c N)
              <input v-model.trim="count" placeholder="如 100" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
            </label>
            <label class="text-xs" style="color: var(--color-text-muted);">
              快照长度 (-s N，0=完整)
              <input v-model.trim="snaplen" placeholder="如 0" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
            </label>
            <label class="text-xs" style="color: var(--color-text-muted);">
              写入文件 (-w)
              <input v-model.trim="writeFile" placeholder="如 cap.pcap" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
            </label>
          </div>
        </div>

        <!-- 条件连接方式 -->
        <div class="rounded-md border p-3 flex items-center gap-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <span class="text-xs font-semibold" style="color: var(--color-text);">多个条件连接方式</span>
          <select v-model="connOp" :style="inputStyle" class="rounded-md border px-2 py-1.5 text-sm">
            <option value="and">and（且）</option>
            <option value="or">or（或）</option>
          </select>
          <span class="text-xs" style="color: var(--color-text-muted);">下方填写的条件会按此方式拼接成 BPF 表达式</span>
        </div>

        <!-- 主机 / 网段 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">主机 / 网段过滤</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label class="text-xs" style="color: var(--color-text-muted);">
              方向
              <select v-model="hostDir" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="any">源或目标</option>
                <option value="src">仅源</option>
                <option value="dst">仅目标</option>
              </select>
            </label>
            <label class="text-xs md:col-span-2" style="color: var(--color-text-muted);">
              地址 (IP 或 CIDR，如 192.168.1.1 / 10.0.0.0/8)
              <input v-model.trim="hostVal" placeholder="192.168.1.1" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
            </label>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ hostCmd || '—' }}</code>
            <CopyButton :text="hostCmd" />
          </div>
        </div>

        <!-- 端口 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">端口过滤</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label class="text-xs" style="color: var(--color-text-muted);">
              协议
              <select v-model="portProto" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="">不限定（port）</option>
                <option value="tcp">tcp</option>
                <option value="udp">udp</option>
              </select>
            </label>
            <label class="text-xs" style="color: var(--color-text-muted);">
              方向
              <select v-model="portDir" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="any">源或目标</option>
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

        <!-- 协议 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">协议过滤</h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <label class="text-xs" style="color: var(--color-text-muted);">
              协议
              <select v-model="protoSel" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="">不限</option>
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
                <option value="arp">ARP</option>
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
              <select v-model="flagSel" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="">不选</option>
                <option value="syn">仅 SYN（半开/扫描）</option>
                <option value="syn-ack">SYN + ACK</option>
                <option value="rst">RST（重置）</option>
                <option value="fin">FIN（结束）</option>
                <option value="ack">ACK 置位</option>
                <option value="psh">PSH 置位</option>
              </select>
            </label>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ flagCmd || '—' }}</code>
            <CopyButton :text="flagCmd" />
          </div>
        </div>

        <!-- 包长度 -->
        <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">包长度过滤</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label class="text-xs" style="color: var(--color-text-muted);">
              条件
              <select v-model="sizeOp" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="">不选</option>
                <option value="greater">greater（大于等于字节）</option>
                <option value="less">less（小于等于字节）</option>
                <option value="ip-len">IP 总长度 &gt; 字节</option>
              </select>
            </label>
            <label class="text-xs" style="color: var(--color-text-muted);">
              字节数
              <input v-model.trim="sizeVal" placeholder="如 1000" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
            </label>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ sizeCmd || '—' }}</code>
            <CopyButton :text="sizeCmd" />
          </div>
        </div>
      </template>

      <!-- ============ Tab 1: 速查 ============ -->
      <template #tab-1>
        <div class="flex items-center gap-3">
          <input
            v-model="searchText"
            type="text"
            placeholder="搜索抓包命令..."
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
                <p class="text-xs" style="color: var(--color-text-muted);">没有匹配的抓包命令</p>
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
const checkStyle = { accentColor: 'var(--color-primary)' };

// ── 选项 ──
const iface = ref('any');
const resolve = ref('nn');
const ts = ref('');
const outV = ref(false);
const outX = ref(false);
const outA = ref(false);
const outE = ref(false);
const outQ = ref(false);
const count = ref('');
const snaplen = ref('0');
const writeFile = ref('');

const optionFlags = computed(() => {
  const f: string[] = [];
  f.push(`-i ${iface.value}`);
  if (resolve.value === 'n') f.push('-n');
  else if (resolve.value === 'nn') f.push('-nn');
  if (outV.value) f.push('-v');
  if (outX.value) f.push('-X');
  if (outA.value) f.push('-A');
  if (outE.value) f.push('-e');
  if (outQ.value) f.push('-q');
  if (count.value.trim()) f.push(`-c ${count.value.trim()}`);
  if (snaplen.value.trim()) f.push(`-s ${snaplen.value.trim()}`);
  if (writeFile.value.trim()) f.push(`-w ${writeFile.value.trim()}`);
  if (ts.value === 'tttt') f.push('-tttt');
  else if (ts.value === 't') f.push('-t');
  return f.join(' ');
});

// ── 表达式条件 ──
const connOp = ref('and');

const hostDir = ref('any');
const hostVal = ref('192.168.1.1');
const hostCmd = computed(() => {
  const v = hostVal.value.trim();
  if (!v) return '';
  const isNet = v.includes('/');
  const kw = isNet ? 'net' : 'host';
  if (hostDir.value === 'src') return `src ${kw} ${v}`;
  if (hostDir.value === 'dst') return `dst ${kw} ${v}`;
  return `${kw} ${v}`;
});

const portProto = ref('tcp');
const portDir = ref('any');
const portVal = ref('443');
const portCmd = computed(() => {
  const v = portVal.value.trim();
  if (!v) return '';
  const proto = portProto.value ? `${portProto.value} ` : '';
  if (portDir.value === 'src') return `${proto}src port ${v}`;
  if (portDir.value === 'dst') return `${proto}dst port ${v}`;
  return `${proto}port ${v}`;
});

const protoSel = ref('');
const protoCmd = computed(() => protoSel.value);

const flagSel = ref('syn');
const flagMap: Record<string, string> = {
  'syn': "tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn",
  'syn-ack': "tcp[tcpflags] & (tcp-syn|tcp-ack) == (tcp-syn|tcp-ack)",
  'rst': "tcp[tcpflags] & tcp-rst != 0",
  'fin': "tcp[tcpflags] & tcp-fin != 0",
  'ack': "tcp[tcpflags] & tcp-ack != 0",
  'psh': "tcp[tcpflags] & tcp-psh != 0",
};
const flagCmd = computed(() => (flagSel.value ? flagMap[flagSel.value] : ''));

const sizeOp = ref('');
const sizeVal = ref('');
const sizeCmd = computed(() => {
  const v = sizeVal.value.trim();
  if (!v) return '';
  if (sizeOp.value === 'greater') return `greater ${v}`;
  if (sizeOp.value === 'less') return `less ${v}`;
  if (sizeOp.value === 'ip-len') return `ip[2:2] > ${v}`;
  return '';
});

const expression = computed(() => {
  const parts = [hostCmd.value, portCmd.value, protoCmd.value, flagCmd.value, sizeCmd.value].filter(Boolean);
  if (!parts.length) return '';
  const joiner = connOp.value === 'or' ? ' or ' : ' and ';
  return `'${parts.join(joiner)}'`;
});

const fullCmd = computed(() => {
  const opts = optionFlags.value;
  const expr = expression.value;
  return `tcpdump ${opts}${expr ? ' ' + expr : ''}`;
});

// ── 速查表 ──
const searchText = ref('');
const cheatCats = ['基础抓包', '主机与端口', '协议过滤', 'TCP 标志位', '输出与文件', '高级用法'];

interface CmdItem { title: string; command: string; desc?: string; }
const cheat: Record<string, CmdItem[]> = {
  '基础抓包': [
    { title: '抓所有网卡', command: 'sudo tcpdump -i any -nn' },
    { title: '指定网卡 eth0', command: 'sudo tcpdump -i eth0 -nn' },
    { title: '不解析主机名', command: 'sudo tcpdump -i any -n' },
    { title: '可读时间 + 详细', command: 'sudo tcpdump -i any -nn -tttt -v' },
    { title: '抓 100 个包后停止', command: 'sudo tcpdump -i any -nn -c 100' },
    { title: '抓完整包（snaplen 0）', command: 'sudo tcpdump -i any -nn -s 0' },
  ],
  '主机与端口': [
    { title: '指定主机（进出）', command: "sudo tcpdump -i any -nn host 192.168.1.1" },
    { title: '仅源主机', command: "sudo tcpdump -i any -nn src host 192.168.1.1" },
    { title: '仅目标主机', command: "sudo tcpdump -i any -nn dst host 8.8.8.8" },
    { title: '整个网段', command: "sudo tcpdump -i any -nn net 10.0.0.0/8" },
    { title: '指定端口', command: "sudo tcpdump -i any -nn port 443" },
    { title: '仅目标 TCP 端口 80', command: "sudo tcpdump -i any -nn tcp dst port 80" },
    { title: '源端口范围', command: "sudo tcpdump -i any -nn 'tcp src portrange 8000-9000'" },
  ],
  '协议过滤': [
    { title: '仅 TCP', command: 'sudo tcpdump -i any -nn tcp' },
    { title: '仅 UDP', command: 'sudo tcpdump -i any -nn udp' },
    { title: '仅 ICMP（ping）', command: 'sudo tcpdump -i any -nn icmp' },
    { title: '仅 ARP', command: 'sudo tcpdump -i any -nn arp' },
    { title: 'DNS 流量', command: 'sudo tcpdump -i any -nn udp port 53' },
  ],
  'TCP 标志位': [
    { title: '仅 SYN（扫描/半开）', command: "sudo tcpdump -i any -nn 'tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn'" },
    { title: 'SYN + ACK', command: "sudo tcpdump -i any -nn 'tcp[tcpflags] & (tcp-syn|tcp-ack) == (tcp-syn|tcp-ack)'" },
    { title: 'RST 包', command: "sudo tcpdump -i any -nn 'tcp[tcpflags] & tcp-rst != 0'" },
    { title: 'FIN 包', command: "sudo tcpdump -i any -nn 'tcp[tcpflags] & tcp-fin != 0'" },
  ],
  '输出与文件': [
    { title: '十六进制 + ASCII', command: 'sudo tcpdump -i any -nn -X' },
    { title: '仅 ASCII（看明文）', command: 'sudo tcpdump -i any -nn -A' },
    { title: '写入文件', command: 'sudo tcpdump -i any -nn -w cap.pcap' },
    { title: '读取已存文件', command: 'tcpdump -nn -r cap.pcap' },
    { title: '链路层头 + 简洁', command: 'sudo tcpdump -i any -nn -e -q' },
  ],
  '高级用法': [
    { title: '大包（≥1000 字节）', command: 'sudo tcpdump -i any -nn greater 1000' },
    { title: '小包（≤64 字节）', command: 'sudo tcpdump -i any -nn less 64' },
    { title: 'IP 总长度 > 1000', command: 'sudo tcpdump -i any -nn "ip[2:2] > 1000"' },
    { title: '主机且特定端口', command: "sudo tcpdump -i any -nn 'host 192.168.1.1 and tcp port 443'" },
    { title: '排除 SSH', command: "sudo tcpdump -i any -nn 'not port 22'" },
    { title: '或条件组合', command: "sudo tcpdump -i any -nn 'port 80 or port 443'" },
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
