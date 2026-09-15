<template>
  <div class="space-y-4">
    <TabView :tabs="['命令生成器', '常用命令速查']">
      <!-- ============ Tab 0: 生成器 ============ -->
      <template #tab-0>
        <div class="space-y-4">
          <!-- 端口 -->
          <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">端口管理</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label class="text-xs" style="color: var(--color-text-muted);">
                操作
                <select v-model="portAction" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="add">开放端口</option>
                  <option value="remove">关闭端口</option>
                  <option value="query">查询端口</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                区域 (留空=默认)
                <input v-model.trim="portZone" placeholder="public" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                端口 (如 8080 或 8000-9000)
                <input v-model.trim="portVal" placeholder="8080" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                协议
                <select v-model="portProto" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                </select>
              </label>
            </div>
            <label class="flex items-center gap-2 mt-3 text-xs" style="color: var(--color-text-muted);">
              <input type="checkbox" v-model="portPermanent" :style="{ accentColor: 'var(--color-primary)' }" />
              永久生效 (--permanent，重启后保留)
            </label>
            <div class="mt-3 flex items-center justify-between gap-2">
              <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ portCmd }}</code>
              <CopyButton :text="portCmd" />
            </div>
          </div>

          <!-- 服务 -->
          <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">服务管理</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label class="text-xs" style="color: var(--color-text-muted);">
                操作
                <select v-model="svcAction" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="add">开放服务</option>
                  <option value="remove">关闭服务</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                区域 (留空=默认)
                <input v-model.trim="svcZone" placeholder="public" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                服务名 (如 http/https/ssh)
                <input v-model.trim="svcVal" placeholder="http" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
            </div>
            <label class="flex items-center gap-2 mt-3 text-xs" style="color: var(--color-text-muted);">
              <input type="checkbox" v-model="svcPermanent" :style="{ accentColor: 'var(--color-primary)' }" />
              永久生效 (--permanent)
            </label>
            <div class="mt-3 flex items-center justify-between gap-2">
              <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ svcCmd }}</code>
              <CopyButton :text="svcCmd" />
            </div>
          </div>

          <!-- 端口转发 -->
          <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">端口转发</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label class="text-xs" style="color: var(--color-text-muted);">
                区域 (留空=默认)
                <input v-model.trim="fwdZone" placeholder="public" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                源端口
                <input v-model.trim="fwdPort" placeholder="80" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                协议
                <select v-model="fwdProto" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                目标端口
                <input v-model.trim="fwdToPort" placeholder="8080" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs col-span-2 md:col-span-4" style="color: var(--color-text-muted);">
                目标地址 (toaddr，可留空仅转端口)
                <input v-model.trim="fwdToAddr" placeholder="192.168.1.100" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
            </div>
            <label class="flex items-center gap-2 mt-3 text-xs" style="color: var(--color-text-muted);">
              <input type="checkbox" v-model="fwdPermanent" :style="{ accentColor: 'var(--color-primary)' }" />
              永久生效 (--permanent)
            </label>
            <p class="text-xs mt-2" style="color: var(--color-text-muted);">提示：端口转发通常需要先开启 IP 伪装（masquerade）。</p>
            <div class="mt-2 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ fwdCmd }}</code>
                <CopyButton :text="fwdCmd" />
              </div>
              <div v-if="fwdToAddr" class="flex items-center justify-between gap-2">
                <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ fwdMasqCmd }}</code>
                <CopyButton :text="fwdMasqCmd" />
              </div>
            </div>
          </div>

          <!-- 富规则 -->
          <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">富规则 (Rich Rule)</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label class="text-xs" style="color: var(--color-text-muted);">
                操作
                <select v-model="richAction" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="add">添加规则</option>
                  <option value="remove">移除规则</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                地址族
                <select v-model="richFamily" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="ipv4">ipv4</option>
                  <option value="ipv6">ipv6</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                源地址 (可留空)
                <input v-model.trim="richSource" placeholder="192.168.1.0/24" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                端口 (可留空)
                <input v-model.trim="richPort" placeholder="3306" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                协议
                <select v-model="richProto" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                动作
                <select v-model="richDecision" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="accept">accept（允许）</option>
                  <option value="reject">reject（拒绝并返回）</option>
                  <option value="drop">drop（丢弃）</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                区域 (留空=默认)
                <input v-model.trim="richZone" placeholder="public" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
            </div>
            <label class="flex items-center gap-2 mt-3 text-xs" style="color: var(--color-text-muted);">
              <input type="checkbox" v-model="richPermanent" :style="{ accentColor: 'var(--color-primary)' }" />
              永久生效 (--permanent)
            </label>
            <div class="mt-3 flex items-center justify-between gap-2">
              <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ richCmd }}</code>
              <CopyButton :text="richCmd" />
            </div>
          </div>

          <!-- 区域与源 -->
          <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text);">默认区域 / 源绑定</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label class="text-xs" style="color: var(--color-text-muted);">
                设置默认区域
                <input v-model.trim="defaultZone" placeholder="public" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                源绑定操作
                <select v-model="srcAction" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">
                  <option value="add">绑定源到区域</option>
                  <option value="remove">从区域解绑源</option>
                </select>
              </label>
              <label class="text-xs" style="color: var(--color-text-muted);">
                源地址 / 网段
                <input v-model.trim="srcVal" placeholder="192.168.1.0/24" :style="inputStyle" class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" />
              </label>
            </div>
            <div class="mt-3 space-y-2">
              <div v-if="defaultZone" class="flex items-center justify-between gap-2">
                <code class="text-xs font-mono break-all" style="color: var(--color-primary);">firewall-cmd --set-default-zone={{ defaultZone }}</code>
                <CopyButton :text="`firewall-cmd --set-default-zone=${defaultZone}`" />
              </div>
              <div v-if="srcVal" class="flex items-center justify-between gap-2">
                <code class="text-xs font-mono break-all" style="color: var(--color-primary);">{{ srcCmd }}</code>
                <CopyButton :text="srcCmd" />
              </div>
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

const zonePart = (z: string) => (z && z.trim() ? ` --zone=${z.trim()}` : '');
const permPart = (p: boolean) => (p ? ' --permanent' : '');

// ── 端口 ──
const portAction = ref('add');
const portZone = ref('public');
const portVal = ref('8080');
const portProto = ref('tcp');
const portPermanent = ref(true);
const portCmd = computed(() => {
  const verb = portAction.value === 'query' ? 'query-port' : `${portAction.value}-port`;
  const port = portVal.value.trim() || '8080';
  return `firewall-cmd${zonePart(portZone.value)} --${verb}=${port}/${portProto.value}${permPart(portPermanent.value)}`;
});

// ── 服务 ──
const svcAction = ref('add');
const svcZone = ref('public');
const svcVal = ref('http');
const svcPermanent = ref(true);
const svcCmd = computed(() =>
  `firewall-cmd${zonePart(svcZone.value)} --${svcAction.value}-service=${svcVal.value.trim() || 'http'}${permPart(svcPermanent.value)}`
);

// ── 端口转发 ──
const fwdZone = ref('public');
const fwdPort = ref('80');
const fwdProto = ref('tcp');
const fwdToPort = ref('8080');
const fwdToAddr = ref('192.168.1.100');
const fwdPermanent = ref(true);
const fwdTarget = computed(() => {
  const parts = [`port=${fwdPort.value.trim() || '80'}`, `proto=${fwdProto.value}`, `toport=${fwdToPort.value.trim() || '8080'}`];
  if (fwdToAddr.value.trim()) parts.push(`toaddr=${fwdToAddr.value.trim()}`);
  return parts.join(':');
});
const fwdCmd = computed(() =>
  `firewall-cmd${zonePart(fwdZone.value)} --add-forward-port=${fwdTarget.value}${permPart(fwdPermanent.value)}`
);
const fwdMasqCmd = computed(() => `firewall-cmd${zonePart(fwdZone.value)} --add-masquerade${permPart(fwdPermanent.value)}`);

// ── 富规则 ──
const richAction = ref('add');
const richFamily = ref('ipv4');
const richSource = ref('192.168.1.0/24');
const richPort = ref('3306');
const richProto = ref('tcp');
const richDecision = ref('accept');
const richZone = ref('public');
const richPermanent = ref(true);
const richRule = computed(() => {
  let r = `rule family="${richFamily.value}"`;
  if (richSource.value.trim()) r += ` source address="${richSource.value.trim()}"`;
  if (richPort.value.trim()) r += ` port port="${richPort.value.trim()}" protocol="${richProto.value}"`;
  r += ` ${richDecision.value}`;
  return r;
});
const richCmd = computed(() =>
  `firewall-cmd${zonePart(richZone.value)} --${richAction.value}-rich-rule='${richRule.value}'${permPart(richPermanent.value)}`
);

// ── 默认区域 / 源绑定 ──
const defaultZone = ref('public');
const srcAction = ref('add');
const srcVal = ref('192.168.1.0/24');
const srcCmd = computed(() =>
  `firewall-cmd${zonePart('')} --${srcAction.value}-source=${srcVal.value.trim()}${permPart(true)}`
);

// ── 速查表 ──
const searchText = ref('');
const cheatCats = ['基础与状态', '端口管理', '服务管理', '端口转发', '富规则', '区域与源', '应急与重载'];

interface CmdItem { title: string; command: string; desc?: string; }
const cheat: Record<string, CmdItem[]> = {
  '基础与状态': [
    { title: '启动 firewalld', command: 'systemctl start firewalld', desc: '立即启动防火墙服务' },
    { title: '停止 firewalld', command: 'systemctl stop firewalld', desc: '立即停止（会失去所有防护）' },
    { title: '开机自启', command: 'systemctl enable firewalld', desc: '设置开机自动启动' },
    { title: '取消开机自启', command: 'systemctl disable firewalld', desc: '禁用开机启动' },
    { title: '查看运行状态', command: 'systemctl status firewalld', desc: '查看服务状态与最近日志' },
    { title: '查看防火墙状态', command: 'firewall-cmd --state', desc: '输出 running / not running' },
    { title: '查看版本', command: 'firewall-cmd --version', desc: '显示 firewalld 版本号' },
    { title: '查看默认区域全部规则', command: 'firewall-cmd --list-all', desc: '列出默认区域的服务/端口/富规则' },
    { title: '查看所有区域规则', command: 'firewall-cmd --list-all-zones', desc: '列出所有区域的完整配置' },
    { title: '重载规则', command: 'firewall-cmd --reload', desc: '不中断连接地重新加载永久配置' },
    { title: '完全重载', command: 'firewall-cmd --complete-reload', desc: '断开所有连接后重载（会中断当前会话）' },
  ],
  '端口管理': [
    { title: '开放 TCP 端口(永久)', command: 'firewall-cmd --zone=public --add-port=8080/tcp --permanent', desc: '开放 8080 端口并永久保存' },
    { title: '开放 UDP 端口', command: 'firewall-cmd --zone=public --add-port=53/udp --permanent' },
    { title: '开放端口范围', command: 'firewall-cmd --zone=public --add-port=8000-9000/tcp --permanent', desc: '批量开放一段端口' },
    { title: '临时开放端口', command: 'firewall-cmd --zone=public --add-port=8080/tcp', desc: '仅当前运行时生效，重启后失效' },
    { title: '关闭端口', command: 'firewall-cmd --zone=public --remove-port=8080/tcp --permanent' },
    { title: '查询端口是否开放', command: 'firewall-cmd --zone=public --query-port=8080/tcp', desc: 'yes / no' },
    { title: '列出已开放端口', command: 'firewall-cmd --zone=public --list-ports' },
  ],
  '服务管理': [
    { title: '开放 HTTP 服务', command: 'firewall-cmd --zone=public --add-service=http --permanent', desc: '开放 80 端口(等价 --add-port=80/tcp)' },
    { title: '开放 HTTPS 服务', command: 'firewall-cmd --zone=public --add-service=https --permanent' },
    { title: '开放 SSH 服务', command: 'firewall-cmd --zone=public --add-service=ssh --permanent' },
    { title: '开放 MySQL 服务', command: 'firewall-cmd --zone=public --add-service=mysql --permanent' },
    { title: '关闭服务', command: 'firewall-cmd --zone=public --remove-service=http --permanent' },
    { title: '列出所有预定义服务', command: 'firewall-cmd --get-services', desc: '查看 firewalld 内置服务名' },
    { title: '列出已开放服务', command: 'firewall-cmd --zone=public --list-services' },
  ],
  '端口转发': [
    { title: '端口转发到本机', command: 'firewall-cmd --zone=public --add-forward-port=port=80:proto=tcp:toport=8080 --permanent', desc: '将 80 转发到本机 8080' },
    { title: '转发到其它主机', command: 'firewall-cmd --zone=public --add-forward-port=port=80:proto=tcp:toport=8080:toaddr=192.168.1.100 --permanent' },
    { title: '开启 IP 伪装', command: 'firewall-cmd --zone=public --add-masquerade --permanent', desc: '端口转发跨主机时必需' },
    { title: '移除端口转发', command: 'firewall-cmd --zone=public --remove-forward-port=port=80:proto=tcp:toport=8080 --permanent' },
    { title: '查询转发是否生效', command: 'firewall-cmd --zone=public --query-forward-port=port=80:proto=tcp:toport=8080' },
  ],
  '富规则': [
    { title: '允许指定 IP 访问端口', command: 'firewall-cmd --zone=public --add-rich-rule=\'rule family="ipv4" source address="192.168.1.100" port port="3306" protocol="tcp" accept\' --permanent' },
    { title: '允许整个网段', command: 'firewall-cmd --zone=public --add-rich-rule=\'rule family="ipv4" source address="192.168.1.0/24" accept\' --permanent' },
    { title: '拒绝指定 IP', command: 'firewall-cmd --zone=public --add-rich-rule=\'rule family="ipv4" source address="10.0.0.5" reject\' --permanent' },
    { title: '丢弃指定 IP(无响应)', command: 'firewall-cmd --zone=public --add-rich-rule=\'rule family="ipv4" source address="10.0.0.5" drop\' --permanent' },
    { title: '限制每秒连接数', command: 'firewall-cmd --zone=public --add-rich-rule=\'rule family="ipv4" service name="http" limit value="10/s" accept\' --permanent' },
    { title: '移除富规则', command: 'firewall-cmd --zone=public --remove-rich-rule=\'rule family="ipv4" source address="192.168.1.100" accept\' --permanent' },
    { title: '列出富规则', command: 'firewall-cmd --zone=public --list-rich-rules' },
  ],
  '区域与源': [
    { title: '查看默认区域', command: 'firewall-cmd --get-default-zone' },
    { title: '设置默认区域', command: 'firewall-cmd --set-default-zone=public' },
    { title: '查看活跃区域', command: 'firewall-cmd --get-active-zones', desc: '显示绑定了接口/源的区域' },
    { title: '列出所有区域', command: 'firewall-cmd --get-zones' },
    { title: '绑定源地址到区域', command: 'firewall-cmd --zone=public --add-source=192.168.1.0/24 --permanent', desc: '将某 IP/网段流量归入指定区域' },
    { title: '解绑源地址', command: 'firewall-cmd --zone=public --remove-source=192.168.1.0/24 --permanent' },
    { title: '绑定网卡到区域', command: 'firewall-cmd --zone=public --add-interface=eth0 --permanent' },
    { title: '修改网卡所属区域', command: 'firewall-cmd --zone=dmz --change-interface=eth1 --permanent' },
  ],
  '应急与重载': [
    { title: '应急模式(拒绝所有)', command: 'firewall-cmd --panic-on', desc: '紧急切断全部进出流量，仅本机可操作' },
    { title: '关闭应急模式', command: 'firewall-cmd --panic-off' },
    { title: '查询应急模式', command: 'firewall-cmd --query-panic' },
    { title: '永久配置生效(重载)', command: 'firewall-cmd --reload', desc: '修改 --permanent 规则后必须 reload' },
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
