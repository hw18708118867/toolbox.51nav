<template>
  <div class="space-y-4">
    <TabView :tabs="['命令生成器', '常用命令速查']">
      <!-- ============ Tab 0: 生成器 ============ -->
      <template #tab-0>
        <div class="space-y-4">
          <!-- 过滤规则 -->
          <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">过滤规则 (filter)</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label class="text-xs" style="color: var(--color-text-muted);">
                操作
                <select v-model="ruleAction" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="A">追加 (-A)</option>
                  <option value="I">插入到链首 (-I)</option>
                  <option value="D">删除 (-D)</option>
                  <option value="R">替换 (-R)</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                表 (留空=filter)
                <select v-model="ruleTable" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="filter">filter</option>
                  <option value="nat">nat</option>
                  <option value="mangle">mangle</option>
                  <option value="raw">raw</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                链
                <select v-model="ruleChain" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="INPUT">INPUT</option>
                  <option value="OUTPUT">OUTPUT</option>
                  <option value="FORWARD">FORWARD</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                协议
                <select v-model="ruleProto" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                  <option value="icmp">icmp</option>
                  <option value="all">all</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                源地址 -s (可留空)
                <input v-model.trim="ruleSrc" placeholder="192.168.1.0/24" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                目标地址 -d (可留空)
                <input v-model.trim="ruleDst" placeholder="10.0.0.5" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                端口匹配
                <select v-model="rulePortType" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="dport">目的端口 --dport</option>
                  <option value="sport">源端口 --sport</option>
                  <option value="none">不按端口</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                端口 (如 22 或 8000:9000)
                <input v-model.trim="rulePort" placeholder="22" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                状态匹配 -m state
                <select v-model="ruleState" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="none">不限</option>
                  <option value="NEW">NEW（新连接）</option>
                  <option value="EST">ESTABLISHED,RELATED（已建立）</option>
                  <option value="NEWEST">NEW,ESTABLISHED,RELATED</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                动作 -j
                <select v-model="ruleTarget" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="ACCEPT">ACCEPT（允许）</option>
                  <option value="DROP">DROP（丢弃）</option>
                  <option value="REJECT">REJECT（拒绝并返回）</option>
                  <option value="LOG">LOG（记录日志）</option>
                </select>
              </label>
            </div>
            <div class="mt-3 flex items-center justify-between gap-2">
              <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ filterCmd }}</code>
              <CopyButton :text="filterCmd" />
            </div>
          </div>

          <!-- 默认策略 -->
          <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">默认策略 (Policy)</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label class="text-xs" style="color: var(--color-text-muted);">
                链
                <select v-model="polChain" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="INPUT">INPUT</option>
                  <option value="OUTPUT">OUTPUT</option>
                  <option value="FORWARD">FORWARD</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                默认动作
                <select v-model="polValue" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="ACCEPT">ACCEPT</option>
                  <option value="DROP">DROP</option>
                </select>
              </label>
            </div>
            <p class="text-xs mt-2" style="color: var(--color-text-muted);">提示：设 DROP 前务必先放行 SSH，否则会把自己挡在门外。</p>
            <div class="mt-2 flex items-center justify-between gap-2">
              <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ polCmd }}</code>
              <CopyButton :text="polCmd" />
            </div>
          </div>

          <!-- NAT 规则 -->
          <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">NAT 规则 (nat 表)</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label class="text-xs" style="color: var(--color-text-muted);">
                类型
                <select v-model="natType" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="DNAT">DNAT 目的转换</option>
                  <option value="SNAT">SNAT 源转换</option>
                  <option value="MASQUERADE">MASQUERADE 伪装</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                协议 (DNAT 用)
                <select v-model="natProto" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                监听端口 (DNAT)
                <input v-model.trim="natDport" placeholder="80" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                转化到地址
                <input v-model.trim="natToAddr" placeholder="192.168.1.100" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                转化到端口 (DNAT)
                <input v-model.trim="natToPort" placeholder="8080" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                源/网段 -s (可留空)
                <input v-model.trim="natSrc" placeholder="10.0.0.0/24" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                出口网卡 -o (SNAT/伪装)
                <input v-model.trim="natIface" placeholder="eth0" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
            </div>
            <p class="text-xs mt-2" style="color: var(--color-text-muted);">提示：DNAT 端口转发还需开启内核转发 `sysctl -w net.ipv4.ip_forward=1`。</p>
            <div class="mt-2 flex items-center justify-between gap-2">
              <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ natCmd }}</code>
              <CopyButton :text="natCmd" />
            </div>
          </div>

          <!-- 限速 / 防护 -->
          <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">限速 / 连接数 / 洪水防护</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label class="text-xs" style="color: var(--color-text-muted);">
                防护类型
                <select v-model="protType" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="limit">连接速率 (-m limit)</option>
                  <option value="connlimit">并发连接数 (-m connlimit)</option>
                  <option value="synflood">SYN 洪水防护</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                协议
                <select v-model="protProto" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                  <option value="icmp">icmp</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                目标端口
                <input v-model.trim="protDport" placeholder="80" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                速率值 (limit 用)
                <input v-model.trim="protLimit" placeholder="25/minute" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                并发上限 (connlimit 用)
                <input v-model.trim="protConn" placeholder="5" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                动作 -j
                <select v-model="protTarget" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="ACCEPT">ACCEPT</option>
                  <option value="DROP">DROP</option>
                  <option value="REJECT">REJECT</option>
                </select>
              </label>
            </div>
            <div class="mt-3 flex items-center justify-between gap-2">
              <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ protCmd }}</code>
              <CopyButton :text="protCmd" />
            </div>
          </div>
        </div>
      </template>

      <!-- ============ Tab 1: 速查 ============ -->
      <template #tab-1>
        <div class="flex items-center gap-3">
          <input
            v-model="searchText"
            type="text"
            placeholder="搜索命令..."
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
                <p class="text-xs" style="color: var(--color-text-muted);">没有匹配的命令</p>
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

// ── 过滤规则 ──
const ruleAction = ref('A');
const ruleTable = ref('filter');
const ruleChain = ref('INPUT');
const ruleProto = ref('tcp');
const ruleSrc = ref('');
const ruleDst = ref('');
const rulePortType = ref('dport');
const rulePort = ref('22');
const ruleState = ref('none');
const ruleTarget = ref('ACCEPT');

const filterCmd = computed(() => {
  const parts: string[] = [];
  if (ruleTable.value !== 'filter') parts.push(`-t ${ruleTable.value}`);
  parts.push(`-${ruleAction.value} ${ruleChain.value}`);
  if (ruleProto.value !== 'all') parts.push(`-p ${ruleProto.value}`);
  if (ruleSrc.value.trim()) parts.push(`-s ${ruleSrc.value.trim()}`);
  if (ruleDst.value.trim()) parts.push(`-d ${ruleDst.value.trim()}`);
  if (rulePortType.value !== 'none' && rulePort.value.trim()) {
    parts.push(`--${rulePortType.value} ${rulePort.value.trim()}`);
  }
  if (ruleState.value === 'NEW') parts.push(`-m state --state NEW`);
  else if (ruleState.value === 'EST') parts.push(`-m state --state ESTABLISHED,RELATED`);
  else if (ruleState.value === 'NEWEST') parts.push(`-m state --state NEW,ESTABLISHED,RELATED`);
  parts.push(`-j ${ruleTarget.value}`);
  return `iptables ${parts.join(' ')}`;
});

// ── 默认策略 ──
const polChain = ref('INPUT');
const polValue = ref('DROP');
const polCmd = computed(() => `iptables -P ${polChain.value} ${polValue.value}`);

// ── NAT ──
const natType = ref('DNAT');
const natProto = ref('tcp');
const natDport = ref('80');
const natToAddr = ref('192.168.1.100');
const natToPort = ref('8080');
const natSrc = ref('');
const natIface = ref('eth0');

const natCmd = computed(() => {
  const src = natSrc.value.trim();
  if (natType.value === 'MASQUERADE') {
    let s = `iptables -t nat -A POSTROUTING`;
    if (natIface.value.trim()) s += ` -o ${natIface.value.trim()}`;
    if (src) s += ` -s ${src}`;
    return `${s} -j MASQUERADE`;
  }
  if (natType.value === 'SNAT') {
    let s = `iptables -t nat -A POSTROUTING`;
    if (src) s += ` -s ${src}`;
    if (natIface.value.trim()) s += ` -o ${natIface.value.trim()}`;
    return `${s} -j SNAT --to-source ${natToAddr.value.trim() || '1.2.3.4'}`;
  }
  // DNAT
  let s = `iptables -t nat -A PREROUTING -p ${natProto.value}`;
  if (natDport.value.trim()) s += ` --dport ${natDport.value.trim()}`;
  if (src) s += ` -s ${src}`;
  s += ` -j DNAT --to-destination ${natToAddr.value.trim() || '192.168.1.100'}`;
  if (natToPort.value.trim()) s += `:${natToPort.value.trim()}`;
  return s;
});

// ── 限速 / 防护 ──
const protType = ref('limit');
const protProto = ref('tcp');
const protDport = ref('80');
const protLimit = ref('25/minute');
const protConn = ref('5');
const protTarget = ref('ACCEPT');

const protCmd = computed(() => {
  let s = `iptables -A INPUT -p ${protProto.value}`;
  if (protDport.value.trim()) s += ` --dport ${protDport.value.trim()}`;
  if (protType.value === 'limit') {
    s += ` -m limit --limit ${protLimit.value.trim() || '25/minute'}`;
  } else if (protType.value === 'connlimit') {
    s += ` -m connlimit --connlimit-above ${protConn.value.trim() || '5'}`;
  } else if (protType.value === 'synflood') {
    s += ` --syn -m limit --limit ${protLimit.value.trim() || '1/s'}`;
  }
  return `${s} -j ${protTarget.value}`;
});

// ── 速查表 ──
const searchText = ref('');
const cheatCats = ['基础与列表', '端口与协议', '源/目标 IP 控制', 'NAT 与端口转发', '状态匹配', '限速与防护', '日志与规则维护'];

interface CmdItem { title: string; command: string; desc?: string; }
const cheat: Record<string, CmdItem[]> = {
  '基础与列表': [
    { title: '列出所有规则', command: 'iptables -L', desc: '查看 filter 表各链规则' },
    { title: '带行号列出', command: 'iptables -L --line-numbers', desc: '删除规则时用行号定位' },
    { title: '查看 NAT 表', command: 'iptables -t nat -L' },
    { title: '详细+数字格式', command: 'iptables -L -v -n', desc: '显示计数与 IP（不反查主机名）' },
    { title: '清空所有规则', command: 'iptables -F', desc: '清空 filter 表，不影响默认策略' },
    { title: '清空某条链', command: 'iptables -F INPUT' },
    { title: '删除自定义链', command: 'iptables -X' },
    { title: '重置计数器', command: 'iptables -Z' },
    { title: '设置默认策略', command: 'iptables -P INPUT DROP', desc: '改之前先放行 SSH，否则会断连' },
    { title: '保存规则 (Debian)', command: 'iptables-save > /etc/iptables/rules.v4' },
    { title: '保存规则 (CentOS)', command: 'service iptables save' },
    { title: '恢复规则', command: 'iptables-restore < /etc/iptables/rules.v4' },
  ],
  '端口与协议': [
    { title: '开放 SSH', command: 'iptables -A INPUT -p tcp --dport 22 -j ACCEPT' },
    { title: '开放 HTTP/HTTPS', command: 'iptables -A INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT' },
    { title: '开放端口范围', command: 'iptables -A INPUT -p tcp --dport 8000:9000 -j ACCEPT' },
    { title: '拒绝某端口', command: 'iptables -A INPUT -p tcp --dport 23 -j DROP' },
    { title: '允许已建立连接', command: 'iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT', desc: '建议放在链靠前位置' },
    { title: '禁止 Ping', command: 'iptables -A INPUT -p icmp --icmp-type echo-request -j DROP' },
    { title: '允许本机回环', command: 'iptables -A INPUT -i lo -j ACCEPT', desc: '放行 127.0.0.1 本地通信' },
  ],
  '源/目标 IP 控制': [
    { title: '允许指定 IP', command: 'iptables -A INPUT -s 192.168.1.100 -j ACCEPT' },
    { title: '允许网段', command: 'iptables -A INPUT -s 192.168.1.0/24 -j ACCEPT' },
    { title: '拒绝指定 IP', command: 'iptables -A INPUT -s 10.0.0.5 -j DROP' },
    { title: '拒绝整个网段', command: 'iptables -A INPUT -s 10.0.0.0/8 -j DROP' },
    { title: '按目标 IP 限制出口', command: 'iptables -A OUTPUT -d 8.8.8.8 -j ACCEPT' },
    { title: '按网卡接口', command: 'iptables -A INPUT -i eth0 -j ACCEPT' },
  ],
  'NAT 与端口转发': [
    { title: 'DNAT 端口转发', command: 'iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination 192.168.1.100:8080' },
    { title: '开启内核转发', command: 'sysctl -w net.ipv4.ip_forward=1', desc: 'DNAT 转发的前提' },
    { title: 'SNAT 出口地址', command: 'iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -j SNAT --to-source 1.2.3.4' },
    { title: 'MASQUERADE 伪装', command: 'iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE', desc: '动态获取公网 IP 时替代 SNAT' },
    { title: '本机端口重定向', command: 'iptables -t nat -A OUTPUT -p tcp --dport 80 -j REDIRECT --to-port 8080' },
  ],
  '状态匹配': [
    { title: '新连接 + 已建立', command: 'iptables -A INPUT -m state --state NEW,ESTABLISHED -j ACCEPT' },
    { title: 'conntrack 新连接', command: 'iptables -A INPUT -m conntrack --ctstate NEW -j ACCEPT' },
    { title: '仅放行已建立', command: 'iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT' },
  ],
  '限速与防护': [
    { title: '限制连接速率', command: 'iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute -j ACCEPT', desc: '超过速率的包走后续规则（通常 DROP）' },
    { title: '限制单 IP 并发连接', command: 'iptables -A INPUT -p tcp --dport 22 -m connlimit --connlimit-above 5 -j REJECT', desc: '防 SSH 爆破' },
    { title: 'SYN 洪水防护', command: 'iptables -A INPUT -p tcp --syn -m limit --limit 1/s -j ACCEPT' },
    { title: 'Ping 洪水防护', command: 'iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s -j ACCEPT' },
    { title: '阻断非法 TCP 标志', command: 'iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP', desc: '防 XMAS / NULL 扫描' },
  ],
  '日志与规则维护': [
    { title: '记录并丢弃', command: 'iptables -A INPUT -j LOG --log-prefix "IPT-DROP: "', desc: 'LOG 不终止匹配，需配合后续 DROP' },
    { title: '按行号删除规则', command: 'iptables -D INPUT 3', desc: '行号来自 iptables -L --line-numbers' },
    { title: '在链首插入', command: 'iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT', desc: '优先于已有规则生效' },
    { title: '替换规则', command: 'iptables -R INPUT 2 -p tcp --dport 22 -j DROP' },
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
