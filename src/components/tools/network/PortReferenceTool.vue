<template>
  <div>
    <div class="mb-4 flex gap-2">
      <input v-model="search" placeholder="搜索端口或服务..." class="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 flex-1" style="border-color: var(--color-border); color: var(--color-text); background-color: var(--color-bg);" />
    </div>
    <div class="rounded-md border overflow-x-auto" style="border-color: var(--color-border);">
      <table class="w-full text-xs">
        <thead><tr style="background-color: var(--color-bg-tertiary);"><th class="px-3 py-2 text-left font-medium" style="color: var(--color-text-secondary);">端口</th><th class="px-3 py-2 text-left font-medium" style="color: var(--color-text-secondary);">协议</th><th class="px-3 py-2 text-left font-medium" style="color: var(--color-text-secondary);">服务</th><th class="px-3 py-2 text-left font-medium" style="color: var(--color-text-secondary);">说明</th></tr></thead>
        <tbody>
          <tr v-for="(p, i) in filteredPorts" :key="p.port + p.protocol" class="reveal-item border-t" :style="{ '--i': Math.min(i, 15), borderColor: 'var(--color-border)' }">
            <td class="px-3 py-1.5 font-mono" style="color: var(--color-primary);">{{ p.port }}</td>
            <td class="px-3 py-1.5" style="color: var(--color-text-muted);">{{ p.protocol }}</td>
            <td class="px-3 py-1.5 font-medium" style="color: var(--color-text);">{{ p.service }}</td>
            <td class="px-3 py-1.5" style="color: var(--color-text-secondary);">{{ p.desc }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
const search = ref('');
const ports = [
  { port: 20, protocol: 'TCP', service: 'FTP-DATA', desc: '文件传输协议 - 数据' },
  { port: 21, protocol: 'TCP', service: 'FTP', desc: '文件传输协议 - 控制' },
  { port: 22, protocol: 'TCP', service: 'SSH', desc: '安全 Shell 远程登录' },
  { port: 23, protocol: 'TCP', service: 'Telnet', desc: '远程登录' },
  { port: 25, protocol: 'TCP', service: 'SMTP', desc: '简单邮件传输协议' },
  { port: 53, protocol: 'TCP/UDP', service: 'DNS', desc: '域名解析服务' },
  { port: 67, protocol: 'UDP', service: 'DHCP', desc: '动态主机配置协议 - 服务端' },
  { port: 68, protocol: 'UDP', service: 'DHCP', desc: '动态主机配置协议 - 客户端' },
  { port: 80, protocol: 'TCP', service: 'HTTP', desc: '超文本传输协议' },
  { port: 110, protocol: 'TCP', service: 'POP3', desc: '邮局协议 v3' },
  { port: 123, protocol: 'UDP', service: 'NTP', desc: '网络时间协议' },
  { port: 143, protocol: 'TCP', service: 'IMAP', desc: '互联网邮件访问协议' },
  { port: 161, protocol: 'UDP', service: 'SNMP', desc: '简单网络管理协议' },
  { port: 443, protocol: 'TCP', service: 'HTTPS', desc: 'HTTP over SSL/TLS' },
  { port: 465, protocol: 'TCP', service: 'SMTPS', desc: 'SMTP over SSL' },
  { port: 587, protocol: 'TCP', service: 'SMTP', desc: '邮件提交' },
  { port: 993, protocol: 'TCP', service: 'IMAPS', desc: 'IMAP over SSL' },
  { port: 995, protocol: 'TCP', service: 'POP3S', desc: 'POP3 over SSL' },
  { port: 1080, protocol: 'TCP', service: 'SOCKS', desc: 'SOCKS 代理' },
  { port: 1433, protocol: 'TCP', service: 'MSSQL', desc: 'Microsoft SQL Server' },
  { port: 1521, protocol: 'TCP', service: 'Oracle', desc: 'Oracle 数据库' },
  { port: 3306, protocol: 'TCP', service: 'MySQL', desc: 'MySQL 数据库' },
  { port: 3389, protocol: 'TCP', service: 'RDP', desc: '远程桌面协议' },
  { port: 5432, protocol: 'TCP', service: 'PostgreSQL', desc: 'PostgreSQL 数据库' },
  { port: 6379, protocol: 'TCP', service: 'Redis', desc: 'Redis 缓存数据库' },
  { port: 8080, protocol: 'TCP', service: 'HTTP-Alt', desc: 'HTTP 备用端口 / 代理' },
  { port: 8443, protocol: 'TCP', service: 'HTTPS-Alt', desc: 'HTTPS 备用端口' },
  { port: 9092, protocol: 'TCP', service: 'Kafka', desc: 'Apache Kafka' },
  { port: 9200, protocol: 'TCP', service: 'Elasticsearch', desc: 'Elasticsearch' },
  { port: 27017, protocol: 'TCP', service: 'MongoDB', desc: 'MongoDB 数据库' },
];
const filteredPorts = computed(() => {
  if (!search.value) return ports;
  const q = search.value.toLowerCase();
  return ports.filter(p => String(p.port).includes(q) || p.service.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
});
</script>
