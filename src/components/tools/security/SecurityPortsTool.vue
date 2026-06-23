<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <input
        v-model="searchText"
        type="text"
        placeholder="搜索端口 / 服务 / 关键词（如 445、Redis、未授权）..."
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      />
      <span class="text-xs whitespace-nowrap" style="color: var(--color-text-muted);">
        {{ filteredCount }} 条
      </span>
    </div>

    <!-- 分类选择 -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="(cat, idx) in categories"
        :key="idx"
        @click="activeCat = cat"
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
        :style="activeCat === cat
          ? 'background: var(--color-primary); color: #fff;'
          : 'background: var(--color-bg-secondary); color: var(--color-text-muted); border: 1px solid var(--color-border);'"
      >
        {{ cat }}
        <span class="ml-1 opacity-70">{{ items[cat].length }}</span>
      </button>
    </div>

    <!-- 端口表格 -->
    <div class="rounded-md border overflow-x-auto" style="border-color: var(--color-border);">
      <table class="w-full text-xs">
        <thead>
          <tr style="background-color: var(--color-bg-tertiary);">
            <th class="px-3 py-2 text-left font-medium whitespace-nowrap" style="color: var(--color-text-secondary);">端口</th>
            <th class="px-3 py-2 text-left font-medium whitespace-nowrap" style="color: var(--color-text-secondary);">协议</th>
            <th class="px-3 py-2 text-left font-medium whitespace-nowrap" style="color: var(--color-text-secondary);">服务</th>
            <th class="px-3 py-2 text-left font-medium" style="color: var(--color-text-secondary);">安全说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in filteredItems" :key="activeCat + i" class="reveal-item border-t" :style="{ '--i': Math.min(i, 15), borderColor: 'var(--color-border)' }">
            <td class="px-3 py-1.5 font-mono whitespace-nowrap" style="color: var(--color-primary);">{{ p.port }}</td>
            <td class="px-3 py-1.5 whitespace-nowrap" style="color: var(--color-text-muted);">{{ p.protocol }}</td>
            <td class="px-3 py-1.5 font-medium whitespace-nowrap" style="color: var(--color-text);">{{ p.service }}</td>
            <td class="px-3 py-1.5" style="color: var(--color-text-secondary);">
              <span v-if="p.risk" class="inline-block px-1.5 py-0.5 rounded text-[10px] mr-1.5 align-middle" :style="riskStyle(p.risk)">{{ p.risk }}</span>
              {{ p.desc }}
            </td>
          </tr>
          <tr v-if="filteredItems.length === 0">
            <td colspan="4" class="px-3 py-6 text-center" style="color: var(--color-text-muted);">没有匹配的端口</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs" style="color: var(--color-text-muted);">
      💡 <span style="color: var(--color-text-secondary);">高危</span>：存在已知重大漏洞或常被未授权利用；
      <span style="color: var(--color-text-secondary);">中危</span>：明文协议或弱口令风险；
      <span style="color: var(--color-text-secondary);">低危</span>：加密协议，但需正确配置。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface PortItem {
  port: number | string;
  protocol: string;
  service: string;
  desc: string;
  risk?: '高危' | '中危' | '低危';
}

const searchText = ref('');
const activeCat = ref('Web 应用服务');

const categories = [
  'Web 应用服务',
  '数据库',
  '远程访问与桌面',
  '文件传输与共享',
  '邮件服务',
  '目录与认证',
  '缓存/消息/搜索',
  '监控与运维',
  '网络与基础设施',
  '工控与物联网',
  '代理与其他',
];

const items: Record<string, PortItem[]> = {
  'Web 应用服务': [
    { port: 80, protocol: 'TCP', service: 'HTTP', desc: 'Web 默认端口，明文传输可被嗅探篡改', risk: '中危' },
    { port: 81, protocol: 'TCP', service: 'HTTP-Alt', desc: '常见管理后台、Web 面板备用端口' },
    { port: 443, protocol: 'TCP', service: 'HTTPS', desc: '加密 Web 流量，需关注证书与中间件漏洞', risk: '低危' },
    { port: 591, protocol: 'TCP', service: 'HTTP-Alt', desc: 'FileMaker 等备用 HTTP' },
    { port: 800, protocol: 'TCP', service: 'HTTP-Alt', desc: '部分设备管理 Web' },
    { port: 1080, protocol: 'TCP', service: 'SOCKS', desc: 'SOCKS 代理，常被滥用为跳板', risk: '中危' },
    { port: 2396, protocol: 'TCP', service: 'HTTP-Alt', desc: '部分应用 Web' },
    { port: 3000, protocol: 'TCP', service: 'Node/Grafana', desc: 'Node.js、Grafana、React 开发服务常见端口' },
    { port: 3001, protocol: 'TCP', service: 'HTTP-Alt', desc: 'React/Node 备用端口' },
    { port: 3128, protocol: 'TCP', service: 'Squid', desc: 'Squid 代理默认端口，可作内网代理跳板', risk: '中危' },
    { port: 4443, protocol: 'TCP', service: 'HTTPS-Alt', desc: '加密 Web 备用端口' },
    { port: 5000, protocol: 'TCP', service: 'Flask/UPnP', desc: 'Flask、Docker Registry、UPnP 常见端口' },
    { port: 7001, protocol: 'TCP', service: 'WebLogic', desc: 'WebLogic 控制台，历史反序列化漏洞频出', risk: '高危' },
    { port: 7002, protocol: 'TCP', service: 'WebLogic-SSL', desc: 'WebLogic SSL 端口' },
    { port: 7070, protocol: 'TCP', service: 'HTTP-Alt', desc: '部分应用 Web 控制台' },
    { port: 8000, protocol: 'TCP', service: 'HTTP-Alt', desc: 'Django/iTerm/jenkins 等常见开发端口' },
    { port: 8009, protocol: 'TCP', service: 'AJP', desc: 'Tomcat AJP，Ghostcat(CVE-2020-1938) 漏洞', risk: '高危' },
    { port: 8080, protocol: 'TCP', service: 'HTTP-Alt', desc: 'Tomcat/Jenkins/管理后台常用，弱口令高发', risk: '中危' },
    { port: 8081, protocol: 'TCP', service: 'HTTP-Alt', desc: '常见管理后台备用端口' },
    { port: 8443, protocol: 'TCP', service: 'HTTPS-Alt', desc: 'Tomcat/管理面板 SSL 备用端口' },
    { port: 8444, protocol: 'TCP', service: 'HTTPS-Alt', desc: '加密 Web 备用端口' },
    { port: 8161, protocol: 'TCP', service: 'ActiveMQ', desc: 'ActiveMQ Web 控制台，反序列化漏洞', risk: '高危' },
    { port: 8888, protocol: 'TCP', service: 'HTTP-Alt', desc: 'Jupyter/Tomcat 备用、宝塔默认面板' },
    { port: 9000, protocol: 'TCP', service: 'HTTP-Alt', desc: 'PHP-FPM/MinIO/Portainer 常见端口', risk: '中危' },
    { port: 9001, protocol: 'TCP', service: 'HTTP-Alt', desc: 'Supervisor/Tor 控制端口' },
    { port: 9090, protocol: 'TCP', service: 'HTTP-Alt', desc: 'Prometheus/WebSphere 管理端口' },
    { port: 9091, protocol: 'TCP', service: 'HTTP-Alt', desc: 'Prometheus/管理备用端口' },
    { port: 9999, protocol: 'TCP', service: 'HTTP-Alt', desc: '常见后台、ADB over TCP 端口' },
    { port: 4848, protocol: 'TCP', service: 'GlassFish', desc: 'GlassFish 管理控制台' },
  ],
  '数据库': [
    { port: 1433, protocol: 'TCP', service: 'MSSQL', desc: 'SQL Server，弱口令 + xp_cmdshell 可致 RCE', risk: '高危' },
    { port: 1434, protocol: 'UDP', service: 'MSSQL Browser', desc: 'SQL Server 浏览服务，可被枚举与放大攻击', risk: '中危' },
    { port: 1521, protocol: 'TCP', service: 'Oracle', desc: 'Oracle TNS，弱口令与 TNS 漏洞高发', risk: '高危' },
    { port: 1830, protocol: 'TCP', service: 'Oracle', desc: 'Oracle 备用监听端口' },
    { port: 3306, protocol: 'TCP', service: 'MySQL', desc: 'MySQL 默认端口，弱口令、UDF 提权风险', risk: '高危' },
    { port: 5432, protocol: 'TCP', service: 'PostgreSQL', desc: 'PostgreSQL，弱口令 + COPY 命令可写文件', risk: '高危' },
    { port: 5984, protocol: 'TCP', service: 'CouchDB', desc: 'CouchDB，默认无认证可致数据泄露', risk: '高危' },
    { port: 6379, protocol: 'TCP', service: 'Redis', desc: 'Redis，未授权访问可写 SSH key/计划任务 RCE', risk: '高危' },
    { port: 8529, protocol: 'TCP', service: 'ArangoDB', desc: 'ArangoDB 默认端口' },
    { port: 9042, protocol: 'TCP', service: 'Cassandra', desc: 'Cassandra CQL，默认无认证可致数据泄露', risk: '高危' },
    { port: 9200, protocol: 'TCP', service: 'Elasticsearch', desc: 'ES，未授权可读全部数据/执行脚本', risk: '高危' },
    { port: 9300, protocol: 'TCP', service: 'ES Transport', desc: 'Elasticsearch 节点通信端口' },
    { port: 11211, protocol: 'TCP', service: 'Memcached', desc: '未授权访问 + UDP 放大 DDoS', risk: '高危' },
    { port: 23000, protocol: 'TCP', service: 'MongoDB-Alt', desc: '部分 MongoDB 配置端口' },
    { port: 27017, protocol: 'TCP', service: 'MongoDB', desc: 'MongoDB，历史大量未授权实例泄露数据', risk: '高危' },
    { port: 27018, protocol: 'TCP', service: 'MongoDB', desc: 'MongoDB 备用端口' },
    { port: 2424, protocol: 'TCP', service: 'OrientDB', desc: 'OrientDB 默认端口' },
    { port: 5331, protocol: 'TCP', service: 'InfluxDB', desc: 'InfluxDB，旧版默认无认证' },
  ],
  '远程访问与桌面': [
    { port: 22, protocol: 'TCP', service: 'SSH', desc: '暴力破解重点目标，弱口令/密钥泄露致 RCE', risk: '高危' },
    { port: 23, protocol: 'TCP', service: 'Telnet', desc: '明文传输，应禁用，渗透首选弱口令', risk: '高危' },
    { port: 99, protocol: 'TCP', service: 'TLSHell', desc: 'TLS Telnet 备用' },
    { port: 992, protocol: 'TCP', service: 'Telnet-TLS', desc: 'Telnet over TLS' },
    { port: 512, protocol: 'TCP', service: 'rexec', desc: '远程执行，明文认证，应禁用', risk: '高危' },
    { port: 513, protocol: 'TCP', service: 'rlogin', desc: '远程登录，明文，应禁用', risk: '高危' },
    { port: 514, protocol: 'TCP', service: 'rsh', desc: '远程 Shell，明文，应禁用', risk: '高危' },
    { port: 3389, protocol: 'TCP', service: 'RDP', desc: 'Windows 远程桌面，BlueKeep + 弱口令', risk: '高危' },
    { port: 5800, protocol: 'TCP', service: 'VNC-HTTP', desc: 'VNC Web 客户端，可暴露桌面' },
    { port: 5900, protocol: 'TCP', service: 'VNC', desc: 'VNC 远程桌面，弱口令/无认证常见', risk: '高危' },
    { port: 5901, protocol: 'TCP', service: 'VNC:1', desc: 'VNC 显示器 :1' },
    { port: 5985, protocol: 'TCP', service: 'WinRM-HTTP', desc: 'Windows 远程管理 HTTP，可远程执行命令', risk: '高危' },
    { port: 5986, protocol: 'TCP', service: 'WinRM-HTTPS', desc: 'Windows 远程管理 HTTPS' },
    { port: 4489, protocol: 'TCP', service: 'RDP-Alt', desc: '部分 RDP 备用端口' },
    { port: 5500, protocol: 'TCP', service: 'fcp', desc: '部分远程管理协议' },
  ],
  '文件传输与共享': [
    { port: 20, protocol: 'TCP', service: 'FTP-DATA', desc: 'FTP 数据端口，明文传输', risk: '中危' },
    { port: 21, protocol: 'TCP', service: 'FTP', desc: 'FTP 控制，明文 + 匿名登录 + 跳板攻击', risk: '高危' },
    { port: 69, protocol: 'UDP', service: 'TFTP', desc: '简单文件传输，常无认证可读写文件', risk: '高危' },
    { port: 115, protocol: 'TCP', service: 'SFTP', desc: '简单文件传输协议（旧）' },
    { port: 873, protocol: 'TCP', service: 'Rsync', desc: '未授权访问可读取/覆盖任意文件', risk: '高危' },
    { port: 2049, protocol: 'TCP/UDP', service: 'NFS', desc: 'NFS，配置不当可未授权挂载根目录', risk: '高危' },
    { port: 135, protocol: 'TCP/UDP', service: 'MSRPC', desc: 'Windows RPC 端点映射，DCOM 攻击入口', risk: '中危' },
    { port: 137, protocol: 'UDP', service: 'NetBIOS-NS', desc: 'NetBIOS 名称服务，可枚举主机信息' },
    { port: 138, protocol: 'UDP', service: 'NetBIOS-DGM', desc: 'NetBIOS 数据报服务' },
    { port: 139, protocol: 'TCP', service: 'NetBIOS-SSN', desc: 'SMB over NetBIOS，共享枚举', risk: '高危' },
    { port: 445, protocol: 'TCP', service: 'SMB', desc: 'SMB，EternalBlue/勒索主力传播端口', risk: '高危' },
    { port: 631, protocol: 'TCP', service: 'IPP', desc: '打印服务，可泄露任务/被 RCE' },
    { port: 9418, protocol: 'TCP', service: 'Git', desc: 'Git 协议，可暴露仓库历史' },
  ],
  '邮件服务': [
    { port: 25, protocol: 'TCP', service: 'SMTP', desc: '邮件传输，开放中继/用户枚举/邮件伪造', risk: '中危' },
    { port: 110, protocol: 'TCP', service: 'POP3', desc: '收邮件，明文认证可被嗅探', risk: '中危' },
    { port: 143, protocol: 'TCP', service: 'IMAP', desc: '收邮件，明文认证可被嗅探', risk: '中危' },
    { port: 465, protocol: 'TCP', service: 'SMTPS', desc: 'SMTP over SSL，加密传输', risk: '低危' },
    { port: 587, protocol: 'TCP', service: 'SMTP-Submit', desc: '邮件提交端口，需认证', risk: '低危' },
    { port: 993, protocol: 'TCP', service: 'IMAPS', desc: 'IMAP over SSL', risk: '低危' },
    { port: 995, protocol: 'TCP', service: 'POP3S', desc: 'POP3 over SSL', risk: '低危' },
    { port: 691, protocol: 'TCP', service: 'MS Exchange', desc: 'Exchange 路由端口' },
    { port: 5060, protocol: 'UDP', service: 'SIP', desc: 'VoIP 信令，可被注册攻击/窃听', risk: '中危' },
    { port: 5061, protocol: 'TCP', service: 'SIP-TLS', desc: 'SIP over TLS' },
  ],
  '目录与认证': [
    { port: 88, protocol: 'TCP/UDP', service: 'Kerberos', desc: '域认证，AS-REP/Kerberoasting 攻击重点', risk: '高危' },
    { port: 389, protocol: 'TCP', service: 'LDAP', desc: '目录访问，明文，可枚举域信息', risk: '中危' },
    { port: 464, protocol: 'TCP/UDP', service: 'Kerberos-PW', desc: 'Kerberos 密码修改' },
    { port: 636, protocol: 'TCP', service: 'LDAPS', desc: 'LDAP over SSL，加密目录访问', risk: '低危' },
    { port: 749, protocol: 'TCP', service: 'Kerberos-Admin', desc: 'Kerberos 管理端口' },
    { port: 3268, protocol: 'TCP', service: 'Global Catalog', desc: 'AD 全局编录，可枚举全域对象', risk: '中危' },
    { port: 3269, protocol: 'TCP', service: 'GC-SSL', desc: '全局编录 over SSL' },
    { port: 135, protocol: 'TCP', service: 'MSRPC', desc: '认证相关 RPC 端点映射' },
    { port: 2179, protocol: 'TCP', service: 'VMRDV', desc: 'Hyper-V 远程桌面' },
  ],
  '缓存/消息/搜索': [
    { port: 6379, protocol: 'TCP', service: 'Redis', desc: 'Redis，未授权访问可致 RCE（同数据库）', risk: '高危' },
    { port: 11211, protocol: 'TCP', service: 'Memcached', desc: '未授权 + 放大 DDoS（同数据库）', risk: '高危' },
    { port: 9200, protocol: 'TCP', service: 'Elasticsearch', desc: 'ES 未授权访问（同数据库）', risk: '高危' },
    { port: 9300, protocol: 'TCP', service: 'ES Transport', desc: 'ES 节点通信，反序列化历史漏洞' },
    { port: 5601, protocol: 'TCP', service: 'Kibana', desc: 'Kibana 控制台，可执行代码/读取数据', risk: '高危' },
    { port: 8161, protocol: 'TCP', service: 'ActiveMQ', desc: 'ActiveMQ 控制台 + 反序列化', risk: '高危' },
    { port: 61616, protocol: 'TCP', service: 'ActiveMQ-OpenWire', desc: 'ActiveMQ OpenWire，反序列化 RCE', risk: '高危' },
    { port: 5672, protocol: 'TCP', service: 'AMQP', desc: 'RabbitMQ 默认，默认 guest/guest 凭证', risk: '中危' },
    { port: 15672, protocol: 'TCP', service: 'RabbitMQ-Mgmt', desc: 'RabbitMQ 管理控制台，弱口令', risk: '中危' },
    { port: 9092, protocol: 'TCP', service: 'Kafka', desc: 'Kafka，未授权可读写 topic 数据', risk: '高危' },
    { port: 2181, protocol: 'TCP', service: 'ZooKeeper', desc: '未授权访问可读取配置/敏感信息', risk: '高危' },
    { port: 2375, protocol: 'TCP', service: 'Docker', desc: 'Docker API 未授权，可逃逸至宿主机 RCE', risk: '高危' },
    { port: 2376, protocol: 'TCP', service: 'Docker-TLS', desc: 'Docker API over TLS' },
    { port: 10255, protocol: 'TCP', service: 'Kubelet', desc: 'Kubernetes kubelet 只读端口，可泄露集群', risk: '高危' },
    { port: 10250, protocol: 'TCP', service: 'Kubelet', desc: 'kubelet API，配置不当可执行命令', risk: '高危' },
    { port: 6443, protocol: 'TCP', service: 'K8s API', desc: 'Kubernetes API Server，集群控制入口', risk: '中危' },
  ],
  '监控与运维': [
    { port: 161, protocol: 'UDP', service: 'SNMP', desc: '弱团体字可泄露设备配置/完整信息', risk: '高危' },
    { port: 162, protocol: 'UDP', service: 'SNMP-Trap', desc: 'SNMP trap 接收端口' },
    { port: 5601, protocol: 'TCP', service: 'Kibana', desc: 'Kibana 可视化（同上）', risk: '高危' },
    { port: 8500, protocol: 'TCP', service: 'Consul', desc: 'Consul Web UI/API，未授权可读写服务' },
    { port: 9001, protocol: 'TCP', service: 'Supervisor', desc: 'Supervisor 控制台，可管理进程' },
    { port: 8086, protocol: 'TCP', service: 'InfluxDB', desc: 'InfluxDB HTTP API，旧版无认证', risk: '中危' },
    { port: 9090, protocol: 'TCP', service: 'Prometheus', desc: 'Prometheus，可读取监控指标' },
    { port: 9100, protocol: 'TCP', service: 'Node Exporter', desc: '主机指标暴露端口，信息泄露' },
    { port: 4040, protocol: 'TCP', service: 'Ngrok', desc: 'Ngrok Web 检视面板' },
    { port: 5985, protocol: 'TCP', service: 'WinRM', desc: 'Windows 远程管理（同远程访问）', risk: '高危' },
    { port: 4369, protocol: 'TCP', service: 'EPMD', desc: 'Erlang 端口映射，可枚举节点' },
    { port: 5672, protocol: 'TCP', service: 'RabbitMQ', desc: '消息队列（同上）', risk: '中危' },
  ],
  '网络与基础设施': [
    { port: 53, protocol: 'TCP/UDP', service: 'DNS', desc: '区域传送/DNS 劫持/DNS 隧道/放大攻击', risk: '中危' },
    { port: 67, protocol: 'UDP', service: 'DHCP-Srv', desc: 'DHCP 服务端，可被 DHCP 欺骗' },
    { port: 68, protocol: 'UDP', service: 'DHCP-Client', desc: 'DHCP 客户端' },
    { port: 123, protocol: 'UDP', service: 'NTP', desc: 'NTP，可被 MONLIST 放大 DDoS', risk: '中危' },
    { port: 137, protocol: 'UDP', service: 'NetBIOS', desc: '名称解析，信息枚举' },
    { port: 161, protocol: 'UDP', service: 'SNMP', desc: '网络管理（同监控）', risk: '高危' },
    { port: 179, protocol: 'TCP', service: 'BGP', desc: '边界网关协议，路由劫持风险', risk: '中危' },
    { port: 500, protocol: 'UDP', service: 'IKE', desc: 'IPSec VPN 密钥交换' },
    { port: 514, protocol: 'UDP', service: 'Syslog', desc: '系统日志，可被日志伪造/注入' },
    { port: 520, protocol: 'UDP', service: 'RIP', desc: '路由信息协议，可被路由欺骗' },
    { port: 1701, protocol: 'UDP', service: 'L2TP', desc: 'L2TP VPN' },
    { port: 1723, protocol: 'TCP', service: 'PPTP', desc: 'PPTP VPN，已不安全应弃用', risk: '中危' },
    { port: 1812, protocol: 'UDP', service: 'RADIUS', desc: 'RADIUS 认证，密钥弱可被攻击' },
    { port: 1813, protocol: 'UDP', service: 'RADIUS-Acct', desc: 'RADIUS 计费' },
    { port: 4500, protocol: 'UDP', service: 'IPSec-NAT', desc: 'IPSec NAT 穿越' },
    { port: 1194, protocol: 'UDP', service: 'OpenVPN', desc: 'OpenVPN 默认端口' },
    { port: 51820, protocol: 'UDP', service: 'WireGuard', desc: 'WireGuard VPN 默认端口' },
    { port: 1900, protocol: 'UDP', service: 'SSDP', desc: 'UPnP 发现，可被内网设备攻击利用', risk: '中危' },
    { port: 5353, protocol: 'UDP', service: 'mDNS', desc: '组播 DNS，内网信息泄露' },
    { port: 389, protocol: 'UDP', service: 'LDAP', desc: 'LDAP 邻居发现' },
  ],
  '工控与物联网': [
    { port: 502, protocol: 'TCP', service: 'Modbus', desc: '工控协议，常无认证可远程控制设备', risk: '高危' },
    { port: 102, protocol: 'TCP', service: 'S7/ISO-TSAP', desc: '西门子 S7，PLC 远程控制', risk: '高危' },
    { port: 2404, protocol: 'TCP', service: 'IEC 60870', desc: '电力系统工控协议' },
    { port: 4840, protocol: 'TCP', service: 'OPC-UA', desc: 'OPC UA 工控通信' },
    { port: 789, protocol: 'TCP', service: 'ICP', desc: '部分工控协议' },
    { port: 1089, protocol: 'TCP', service: 'Fluke', desc: '部分工业设备' },
    { port: 2222, protocol: 'TCP', service: 'EtherNet/IP', desc: '部分工控设备 SSH 备用' },
    { port: 44818, protocol: 'TCP/UDP', service: 'EtherNet/IP', desc: '罗克韦尔工控协议，常暴露', risk: '高危' },
    { port: 47808, protocol: 'UDP', service: 'BACnet', desc: '楼宇自控协议，常无认证', risk: '高危' },
    { port: 20000, protocol: 'TCP/UDP', service: 'DNP3', desc: '电力/水务工控协议', risk: '高危' },
    { port: 1883, protocol: 'TCP', service: 'MQTT', desc: '物联网消息协议，常无认证可读写设备', risk: '中危' },
    { port: 8883, protocol: 'TCP', service: 'MQTT-TLS', desc: 'MQTT over TLS' },
    { port: 5683, protocol: 'UDP', service: 'CoAP', desc: '受限设备协议，常无认证', risk: '中危' },
    { port: 7547, protocol: 'TCP/UDP', service: 'TR-069', desc: 'CPE 远程管理，路由器接管风险', risk: '高危' },
    { port: 9001, protocol: 'TCP', service: 'Tor', desc: 'Tor 控制端口（部分设备）' },
  ],
  '代理与其他': [
    { port: 1080, protocol: 'TCP', service: 'SOCKS', desc: 'SOCKS 代理，跳板/内网穿透常用', risk: '中危' },
    { port: 3128, protocol: 'TCP', service: 'Squid', desc: 'Squid 代理，开放代理可被滥用' },
    { port: 8080, protocol: 'TCP', service: 'HTTP-Proxy', desc: '常用代理端口' },
    { port: 8123, protocol: 'TCP', service: 'Polipo', desc: 'HTTP 代理端口' },
    { port: 9050, protocol: 'TCP', service: 'Tor', desc: 'Tor SOCKS 代理端口' },
    { port: 9051, protocol: 'TCP', service: 'Tor-Ctrl', desc: 'Tor 控制端口' },
    { port: 4444, protocol: 'TCP', service: 'Metasploit', desc: '反弹 Shell 常用监听端口', risk: '高危' },
    { port: 4445, protocol: 'TCP', service: 'RShell', desc: '常用反弹 Shell 备用端口', risk: '高危' },
    { port: 5555, protocol: 'TCP', service: 'ADB', desc: 'Android Debug Bridge，可远程控制设备', risk: '高危' },
    { port: 6667, protocol: 'TCP', service: 'IRC', desc: 'IRC，C2 通信与僵尸网络常用', risk: '中危' },
    { port: 8090, protocol: 'TCP', service: 'HTTP-Alt', desc: '常见 Web 备用端口' },
    { port: 9999, protocol: 'TCP', service: 'HTTP-Alt', desc: '常见后台端口' },
    { port: 17500, protocol: 'TCP', service: 'Dropbox', desc: 'Dropbox LAN 同步' },
  ],
};

const riskStyle = (risk?: string) => {
  if (risk === '高危') return 'background: rgba(239, 68, 68, 0.15); color: #dc2626;';
  if (risk === '中危') return 'background: rgba(245, 158, 11, 0.15); color: #d97706;';
  if (risk === '低危') return 'background: rgba(34, 197, 94, 0.15); color: #16a34a;';
  return '';
};

const filteredItems = computed<PortItem[]>(() => {
  const list = items[activeCat.value] || [];
  if (!searchText.value.trim()) return list;
  const q = searchText.value.toLowerCase();
  return list.filter(p =>
    String(p.port).includes(q) ||
    p.service.toLowerCase().includes(q) ||
    p.desc.toLowerCase().includes(q) ||
    (p.risk || '').toLowerCase().includes(q)
  );
});

const filteredCount = computed(() => {
  if (!searchText.value.trim()) {
    return items[activeCat.value]?.length || 0;
  }
  return filteredItems.value.length;
});
</script>
