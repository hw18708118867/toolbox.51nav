<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <input
        v-model="searchText"
        type="text"
        placeholder="搜索命令..."
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      />
      <span class="text-xs whitespace-nowrap" style="color: var(--color-text-muted);">
        {{ filteredCount }} 条命令
      </span>
    </div>

    <TabView :tabs="categories">
      <template v-for="(cat, idx) in categories" :key="idx" #[`tab-${idx}`]>
        <div class="space-y-3">
          <div v-for="(item, cidx) in filteredItems(cat)" :key="cidx"
            class="rounded-md border p-3"
            style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
          >
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';

const searchText = ref('');

interface CmdItem {
  title: string;
  command: string;
  desc?: string;
}

const categories = ['系统信息', '用户管理', '网络', '文件操作', '进程管理', '服务管理', '磁盘管理', '注册表'];

const items: Record<string, CmdItem[]> = {
  '系统信息': [
    { title: '系统信息', command: 'systeminfo', desc: '显示操作系统配置详细信息' },
    { title: '计算机名', command: 'hostname', desc: '显示计算机名' },
    { title: '系统版本', command: 'ver', desc: '显示 Windows 版本号' },
    { title: '环境变量', command: 'set', desc: '显示所有环境变量' },
    { title: '系统运行时间', command: 'net statistics workstation', desc: '查看系统启动时间和运行时长' },
    { title: '系统架构', command: 'echo %PROCESSOR_ARCHITECTURE%', desc: '查看系统架构（AMD64/x86）' },
    { title: '已安装补丁', command: 'wmic qfe list', desc: '列出已安装的系统补丁' },
    { title: '启动项', command: 'wmic startup list full', desc: '列出系统启动项' },
  ],
  '用户管理': [
    { title: '当前用户', command: 'whoami', desc: '显示当前登录用户' },
    { title: '用户权限', command: 'whoami /priv', desc: '显示当前用户权限' },
    { title: '用户组', command: 'whoami /groups', desc: '显示当前用户所属组' },
    { title: '列出本地用户', command: 'net user', desc: '列出所有本地用户账户' },
    { title: '查看用户详情', command: 'net user username', desc: '查看指定用户的详细信息' },
    { title: '创建用户', command: 'net user username password /add', desc: '创建新用户' },
    { title: '删除用户', command: 'net user username /delete', desc: '删除用户' },
    { title: '修改密码', command: 'net user username newpassword', desc: '修改用户密码' },
    { title: '添加到管理员组', command: 'net localgroup administrators username /add', desc: '将用户添加到管理员组' },
    { title: '列出本地组', command: 'net localgroup', desc: '列出所有本地组' },
    { title: '管理员组成员', command: 'net localgroup administrators', desc: '列出管理员组成员' },
    { title: '查看域用户', command: 'net user /domain', desc: '列出域中所有用户' },
    { title: '查看域管理员', command: 'net group "Domain Admins" /domain', desc: '列出域管理员组成员' },
  ],
  '网络': [
    { title: 'IP 配置', command: 'ipconfig /all', desc: '显示所有网络适配器的详细配置' },
    { title: '网络连接', command: 'netstat -ano', desc: '显示所有连接和监听端口，含 PID' },
    { title: '路由表', command: 'route print', desc: '显示路由表' },
    { title: 'ARP 缓存', command: 'arp -a', desc: '显示 ARP 缓存表' },
    { title: 'DNS 缓存', command: 'ipconfig /displaydns', desc: '显示 DNS 解析缓存' },
    { title: '清除 DNS 缓存', command: 'ipconfig /flushdns', desc: '清除 DNS 解析缓存' },
    { title: '跟踪路由', command: 'tracert -d hostname', desc: '跟踪到目标主机的路由路径' },
    { title: 'Ping 测试', command: 'ping -n 4 hostname', desc: '发送 4 个 ICMP 包测试连通性' },
    { title: '端口连通性测试', command: 'Test-NetConnection -ComputerName hostname -Port 443', desc: 'PowerShell 测试指定端口连通性' },
    { title: '查看防火墙状态', command: 'netsh advfirewall show allprofiles', desc: '显示所有配置文件的防火墙状态' },
    { title: '查看共享', command: 'net share', desc: '列出当前共享资源' },
    { title: '查看会话', command: 'net session', desc: '列出当前服务器会话' },
    { title: '查看 Wi-Fi 密码', command: 'netsh wlan show profile name="WiFi名称" key=clear', desc: '查看已保存的 Wi-Fi 密码' },
    { title: 'TCP 连接', command: 'Get-NetTCPConnection | ft LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess', desc: 'PowerShell 查看 TCP 连接' },
  ],
  '文件操作': [
    { title: '列出文件', command: 'dir /a /o:n', desc: '列出所有文件（含隐藏），按名称排序' },
    { title: '递归搜索文件', command: 'dir /s /b filename', desc: '递归搜索指定文件名' },
    { title: '查找字符串', command: 'findstr /s /i "pattern" *.txt', desc: '在文件中搜索字符串' },
    { title: 'PowerShell 搜索文件', command: 'Get-ChildItem -Recurse -Filter "*.txt" | Select-String "pattern"', desc: 'PowerShell 递归搜索文件内容' },
    { title: '查看文件内容', command: 'type filename', desc: '显示文件内容（等同 cat）' },
    { title: '复制文件', command: 'copy source destination', desc: '复制文件' },
    { title: '移动文件', command: 'move source destination', desc: '移动文件' },
    { title: '删除文件', command: 'del /f /q filename', desc: '强制删除文件（不提示确认）' },
    { title: '创建目录', command: 'mkdir dirname', desc: '创建目录' },
    { title: '查看文件权限', command: 'icacls filename', desc: '显示文件/目录的 NTFS 权限' },
    { title: '修改文件权限', command: 'icacls filename /grant username:F', desc: '授予用户完全控制权限' },
    { title: '查看文件哈希', command: 'certutil -hashfile filename SHA256', desc: '计算文件 SHA256 哈希值' },
    { title: 'PowerShell 文件哈希', command: 'Get-FileHash filename -Algorithm SHA256', desc: 'PowerShell 计算文件哈希' },
  ],
  '进程管理': [
    { title: '列出进程', command: 'tasklist /v', desc: '显示所有进程详细信息' },
    { title: '结束进程 (PID)', command: 'taskkill /PID pid /F', desc: '强制结束指定 PID 的进程' },
    { title: '结束进程 (名称)', command: 'taskkill /IM processname /F', desc: '强制结束指定名称的进程' },
    { title: 'WMIC 进程信息', command: 'wmic process list brief', desc: '使用 WMIC 列出进程' },
    { title: 'PowerShell 进程', command: 'Get-Process | ft Id,Name,Path,CPU,WorkingSet', desc: 'PowerShell 查看进程列表' },
    { title: '进程树', command: 'wmic process get ProcessId,ParentProcessId,Name', desc: '查看进程父子关系' },
    { title: '搜索进程路径', command: 'wmic process where "name=\'processname.exe\'" get ExecutablePath', desc: '查找指定进程的可执行文件路径' },
  ],
  '服务管理': [
    { title: '列出服务', command: 'sc query state= all', desc: '列出所有服务及其状态' },
    { title: '查看服务', command: 'sc qc servicename', desc: '查看指定服务的配置' },
    { title: '启动服务', command: 'sc start servicename', desc: '启动指定服务' },
    { title: '停止服务', command: 'sc stop servicename', desc: '停止指定服务' },
    { title: '修改启动类型', command: 'sc config servicename start= auto', desc: '设置服务为自动启动（注意等号后有空格）' },
    { title: 'PowerShell 服务', command: 'Get-Service | ft Name,DisplayName,Status,StartType', desc: 'PowerShell 查看服务列表' },
    { title: '查看服务路径', command: 'reg query HKLM\\SYSTEM\\CurrentControlSet\\Services\\servicename /v ImagePath', desc: '查看服务可执行文件路径（排查提权）' },
  ],
  '磁盘管理': [
    { title: '磁盘使用', command: 'wmic logicaldisk get size,freespace,caption', desc: '查看各磁盘空间使用情况' },
    { title: 'PowerShell 磁盘', command: 'Get-PSDrive -PSProvider FileSystem | ft Name,Used,Free,Root', desc: 'PowerShell 查看磁盘信息' },
    { title: '卷信息', command: 'vol C:', desc: '显示卷标和序列号' },
    { title: '挂载 VHD', command: 'diskpart', desc: '磁盘管理工具（交互式）' },
    { title: '检查磁盘', command: 'chkdsk C: /f', desc: '检查并修复磁盘错误' },
  ],
  '注册表': [
    { title: '查询注册表', command: 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"', desc: '查询开机自启动项' },
    { title: '查询注册表值', command: 'reg query "HKLM\\SOFTWARE\\key" /v valuename', desc: '查询指定注册表键值' },
    { title: '添加注册表值', command: 'reg add "HKLM\\SOFTWARE\\key" /v valuename /t REG_SZ /d "data"', desc: '添加注册表键值' },
    { title: '删除注册表值', command: 'reg delete "HKLM\\SOFTWARE\\key" /v valuename /f', desc: '删除注册表键值' },
    { title: '导出注册表', command: 'reg export "HKLM\\SOFTWARE\\key" backup.reg', desc: '导出注册表项到文件' },
    { title: '导入注册表', command: 'reg import backup.reg', desc: '从文件导入注册表' },
    { title: '用户自启动项', command: 'reg query "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"', desc: '查询当前用户的自启动项' },
    { title: '最近打开文件', command: 'reg query "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs"', desc: '查询最近打开的文件记录' },
  ],
};

const filteredItems = (cat: string): CmdItem[] => {
  const list = items[cat] || [];
  if (!searchText.value.trim()) return list;
  const q = searchText.value.toLowerCase();
  return list.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.command.toLowerCase().includes(q) ||
    (item.desc && item.desc.toLowerCase().includes(q))
  );
};

const filteredCount = computed(() => {
  return Object.values(items).flat().filter(item => {
    if (!searchText.value.trim()) return true;
    const q = searchText.value.toLowerCase();
    return item.title.toLowerCase().includes(q) ||
      item.command.toLowerCase().includes(q) ||
      (item.desc && item.desc.toLowerCase().includes(q));
  }).length;
});
</script>
