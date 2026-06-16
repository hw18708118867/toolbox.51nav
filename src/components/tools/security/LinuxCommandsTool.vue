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

const categories = ['系统信息', '用户管理', '网络', '文件操作', '进程管理', '权限管理', '磁盘管理', '包管理'];

const items: Record<string, CmdItem[]> = {
  '系统信息': [
    { title: '系统信息', command: 'uname -a', desc: '显示内核版本、主机名等完整系统信息' },
    { title: '内核版本', command: 'uname -r', desc: '仅显示内核版本号' },
    { title: '系统发行版', command: 'cat /etc/os-release', desc: '显示发行版名称和版本' },
    { title: '主机名', command: 'hostname', desc: '显示当前主机名' },
    { title: '系统运行时间', command: 'uptime', desc: '显示系统运行时长和负载' },
    { title: '系统运行详情', command: 'who -b', desc: '显示系统最后启动时间' },
    { title: 'CPU 信息', command: 'lscpu', desc: '显示 CPU 架构和详细信息' },
    { title: '内存信息', command: 'free -h', desc: '显示内存使用情况（人类可读格式）' },
    { title: '环境变量', command: 'env', desc: '显示所有环境变量' },
    { title: '已加载内核模块', command: 'lsmod', desc: '列出当前加载的内核模块' },
    { title: 'PCI 设备', command: 'lspci', desc: '列出所有 PCI 设备' },
    { title: 'USB 设备', command: 'lsusb', desc: '列出所有 USB 设备' },
    { title: '已安装内核', command: 'dpkg -l | grep linux-image', desc: '列出已安装的内核（Debian/Ubuntu）' },
  ],
  '用户管理': [
    { title: '当前用户', command: 'whoami', desc: '显示当前登录用户' },
    { title: '用户 ID', command: 'id', desc: '显示用户 UID/GID 及所属组' },
    { title: '所有用户', command: 'cat /etc/passwd', desc: '列出系统所有用户' },
    { title: '所有组', command: 'cat /etc/group', desc: '列出系统所有组' },
    { title: '创建用户', command: 'useradd -m -s /bin/bash username', desc: '创建用户并建立家目录' },
    { title: '删除用户', command: 'userdel -r username', desc: '删除用户及其家目录' },
    { title: '修改密码', command: 'passwd username', desc: '修改用户密码' },
    { title: '添加到组', command: 'usermod -aG groupname username', desc: '将用户添加到附加组' },
    { title: '切换用户', command: 'su - username', desc: '切换到指定用户（加载环境变量）' },
    { title: 'Sudo 执行', command: 'sudo command', desc: '以超级用户权限执行命令' },
    { title: 'Sudo 免密', command: 'echo "username ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/username', desc: '配置指定用户 sudo 免密' },
    { title: '登录用户', command: 'w', desc: '显示当前登录的用户及其活动' },
    { title: '用户历史', command: 'last', desc: '显示用户登录历史记录' },
    { title: '失败登录', command: 'lastb', desc: '显示失败的登录尝试' },
  ],
  '网络': [
    { title: 'IP 地址', command: 'ip addr show', desc: '显示所有网络接口的 IP 地址' },
    { title: '网卡信息', command: 'ip link show', desc: '显示网络接口链路状态' },
    { title: '路由表', command: 'ip route show', desc: '显示路由表' },
    { title: '网络连接', command: 'ss -tunlp', desc: '显示所有 TCP/UDP 连接和监听端口' },
    { title: '网络统计', command: 'netstat -tunlp', desc: '传统方式显示网络连接（需安装 net-tools）' },
    { title: 'ARP 表', command: 'ip neigh show', desc: '显示 ARP 缓存表' },
    { title: 'DNS 解析', command: 'dig example.com', desc: '查询域名 DNS 记录' },
    { title: 'DNS 简查', command: 'nslookup example.com', desc: '简单 DNS 查询' },
    { title: '跟踪路由', command: 'traceroute example.com', desc: '跟踪到目标的网络路径' },
    { title: 'Ping 测试', command: 'ping -c 4 example.com', desc: '发送 4 个 ICMP 包测试连通性' },
    { title: '端口扫描', command: 'nc -zv hostname 1-1000', desc: '扫描主机的 1-1000 端口' },
    { title: '监听端口', command: 'nc -lvnp 4444', desc: '监听指定端口（常用于反弹 Shell）' },
    { title: '防火墙状态', command: 'sudo iptables -L -n -v', desc: '查看 iptables 防火墙规则' },
    { title: 'UFW 防火墙', command: 'sudo ufw status', desc: '查看 UFW 防火墙状态' },
    { title: '抓包', command: 'sudo tcpdump -i eth0 -w capture.pcap', desc: '抓取网络数据包保存到文件' },
    { title: 'Wi-Fi 扫描', command: 'iwlist wlan0 scan', desc: '扫描附近的 Wi-Fi 网络' },
  ],
  '文件操作': [
    { title: '列出文件', command: 'ls -lah', desc: '列出所有文件（含隐藏），显示权限和大小' },
    { title: '递归搜索文件', command: 'find / -name "filename" 2>/dev/null', desc: '从根目录递归搜索文件' },
    { title: '按类型搜索', command: 'find / -type f -name "*.conf" 2>/dev/null', desc: '搜索指定扩展名的文件' },
    { title: '按大小搜索', command: 'find / -size +100M 2>/dev/null', desc: '搜索大于 100MB 的文件' },
    { title: 'SUID 文件', command: 'find / -perm -u=s -type f 2>/dev/null', desc: '查找 SUID 权限的文件（提权检查）' },
    { title: '可写目录', command: 'find / -writable -type d 2>/dev/null', desc: '查找全局可写的目录' },
    { title: '搜索文件内容', command: 'grep -r "pattern" /path 2>/dev/null', desc: '递归搜索文件内容' },
    { title: '查看文件', command: 'cat filename', desc: '显示文件全部内容' },
    { title: '分页查看', command: 'less filename', desc: '分页查看文件内容' },
    { title: '查看头部', command: 'head -n 20 filename', desc: '查看文件前 20 行' },
    { title: '查看尾部', command: 'tail -n 20 -f filename', desc: '查看文件末尾 20 行并实时跟踪' },
    { title: '文件哈希', command: 'sha256sum filename', desc: '计算文件 SHA256 哈希值' },
    { title: '文件权限', command: 'chmod 755 filename', desc: '修改文件权限为 755' },
    { title: '文件所有者', command: 'chown user:group filename', desc: '修改文件所有者和组' },
    { title: '创建软链接', command: 'ln -s /path/to/target linkname', desc: '创建符号链接' },
    { title: '磁盘使用', command: 'du -sh /path', desc: '查看目录总大小' },
  ],
  '进程管理': [
    { title: '进程列表', command: 'ps aux', desc: '显示所有进程详细信息' },
    { title: '进程树', command: 'ps auxf', desc: '以树形结构显示进程' },
    { title: '实时监控', command: 'top', desc: '实时显示进程资源使用情况' },
    { title: 'HTop', command: 'htop', desc: '增强版实时进程监控（需安装）' },
    { title: '查找进程', command: 'pgrep -f "processname"', desc: '按名称查找进程 PID' },
    { title: '结束进程', command: 'kill -9 PID', desc: '强制结束指定 PID 的进程' },
    { title: '按名结束', command: 'pkill -f "processname"', desc: '按名称强制结束进程' },
    { title: '进程详情', command: 'ls -la /proc/PID/exe', desc: '查看进程的可执行文件路径' },
    { title: '进程环境变量', command: 'cat /proc/PID/environ | tr "\\0" "\\n"', desc: '查看进程的环境变量' },
    { title: '进程打开文件', command: 'lsof -p PID', desc: '查看进程打开的所有文件' },
    { title: '端口占用', command: 'lsof -i :80', desc: '查看占用 80 端口的进程' },
  ],
  '权限管理': [
    { title: 'SUID 文件', command: 'find / -perm -4000 -type f 2>/dev/null', desc: '查找 SUID 权限文件' },
    { title: 'SGID 文件', command: 'find / -perm -2000 -type f 2>/dev/null', desc: '查找 SGID 权限文件' },
    { title: 'Capabilities', command: 'getcap -r / 2>/dev/null', desc: '查找具有特殊能力的二进制文件' },
    { title: 'Sudo 权限', command: 'sudo -l', desc: '查看当前用户可执行的 sudo 命令' },
    { title: '可写 Sudoers', command: 'find / -name sudoers -writable 2>/dev/null', desc: '查找可写的 sudoers 文件' },
    { title: 'Cron 任务', command: 'cat /etc/crontab', desc: '查看系统级定时任务' },
    { title: '用户 Cron', command: 'crontab -l', desc: '查看当前用户的定时任务' },
    { title: '可写 Cron', command: 'ls -la /etc/cron*', desc: '检查定时任务文件权限' },
    { title: '可写 /etc/passwd', command: 'ls -la /etc/passwd', desc: '检查 passwd 文件是否可写（提权）' },
    { title: '可写 /etc/shadow', command: 'ls -la /etc/shadow', desc: '检查 shadow 文件是否可读（提权）' },
  ],
  '磁盘管理': [
    { title: '磁盘使用', command: 'df -h', desc: '显示各文件系统磁盘使用情况' },
    { title: '目录大小', command: 'du -sh /*', desc: '显示根目录下各目录大小' },
    { title: '磁盘分区', command: 'fdisk -l', desc: '列出所有磁盘分区信息' },
    { title: '块设备', command: 'lsblk', desc: '以树形结构显示块设备' },
    { title: '挂载点', command: 'mount | column -t', desc: '显示当前挂载的文件系统' },
    { title: '挂载磁盘', command: 'mount /dev/sdb1 /mnt/disk', desc: '挂载指定分区到目录' },
    { title: '卸载磁盘', command: 'umount /mnt/disk', desc: '卸载指定挂载点' },
    { title: '文件系统检查', command: 'fsck /dev/sda1', desc: '检查并修复文件系统' },
    { title: '磁盘 IO', command: 'iostat -x 1', desc: '实时监控磁盘 IO 统计' },
  ],
  '包管理': [
    { title: 'APT 搜索', command: 'apt search packagename', desc: '搜索软件包（Debian/Ubuntu）' },
    { title: 'APT 安装', command: 'sudo apt install packagename', desc: '安装软件包' },
    { title: 'APT 更新', command: 'sudo apt update && sudo apt upgrade', desc: '更新软件源并升级所有包' },
    { title: 'APT 删除', command: 'sudo apt remove packagename', desc: '卸载软件包' },
    { title: 'YUM 安装', command: 'sudo yum install packagename', desc: '安装软件包（CentOS/RHEL）' },
    { title: 'DNF 安装', command: 'sudo dnf install packagename', desc: '安装软件包（Fedora）' },
    { title: 'Pacman 安装', command: 'sudo pacman -S packagename', desc: '安装软件包（Arch）' },
    { title: '已安装包', command: 'dpkg -l | grep keyword', desc: '搜索已安装的软件包（Debian/Ubuntu）' },
    { title: 'RPM 已安装', command: 'rpm -qa | grep keyword', desc: '搜索已安装的软件包（CentOS/RHEL）' },
    { title: '文件所属包', command: 'dpkg -S /path/to/file', desc: '查找文件属于哪个软件包' },
    { title: 'Snap 安装', command: 'sudo snap install packagename', desc: '通过 Snap 安装软件包' },
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
