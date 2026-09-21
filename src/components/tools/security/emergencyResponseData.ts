// 网络安全应急响应工具箱 —— 场景作战卡数据
// 每个场景包含 Linux 与 Windows 两套命令，按阶段（识别 / 遏制 / 根除 / 恢复 / 溯源）组织。
// 命令均为常见、真实可用的排查/处置命令；请在授权范围内执行，优先取证再清理。

export const PHASES = ['识别与确认', '遏制隔离', '根除清理', '恢复加固', '溯源取证'] as const;
export type Phase = (typeof PHASES)[number];

export interface CmdItem {
  cmd: string;
  desc: string;
  note?: string; // 例如：仅 systemd / 需 root / 需管理员
}

export interface Scenario {
  id: string;
  name: string;
  summary: string;
  linux: Record<Phase, CmdItem[]>;
  windows: Record<Phase, CmdItem[]>;
}

function P(
  identify: CmdItem[],
  contain: CmdItem[],
  eradicate: CmdItem[],
  recover: CmdItem[],
  forensics: CmdItem[],
): Record<Phase, CmdItem[]> {
  return {
    识别与确认: identify,
    遏制隔离: contain,
    根除清理: eradicate,
    恢复加固: recover,
    溯源取证: forensics,
  };
}

export const scenarios: Scenario[] = [
  // ───────────────────────── 1. 主机被入侵 / 系统沦陷 ─────────────────────────
  {
    id: 'host-compromised',
    name: '主机被入侵 / 系统沦陷',
    summary: '发现未授权账号、可疑进程或异常登录时，先确认失陷范围，再隔离与清理。',
    linux: P(
      [
        { cmd: 'whoami; id', desc: '确认当前用户与权限组，看是否为 root / sudo' },
        { cmd: 'w; last -a; lastlog', desc: '查看当前登录会话与历史登录来源 IP' },
        { cmd: "awk -F: '$3==0 {print $1}' /etc/passwd", desc: '找出所有 UID=0 的账号，排查后门账号', note: '含 root' },
        { cmd: 'ps auxf --sort=-%cpu | head -20', desc: '按 CPU 排序查看进程树，定位异常进程' },
        { cmd: 'ss -antup  # 或 netstat -anp', desc: '查看监听端口与已建立的外连连接' },
        { cmd: 'ls -lat /tmp /var/tmp /dev/shm', desc: '查看临时目录下最近被改动的可疑文件' },
        { cmd: 'journalctl -p err -xb --no-pager | tail -50', desc: '查看本次启动后的系统错误日志', note: '仅 systemd' },
      ],
      [
        { cmd: 'iptables -A INPUT -s <恶意IP> -j DROP', desc: '封禁确认的恶意来源 IP（亦可跳 iptables 工具生成）' },
        { cmd: 'ifdown eth0  # 或 nmcli dev disconnect eth0', desc: '物理隔离：断开网卡，阻断外连与回连', note: '谨慎，会断 SSH' },
        { cmd: 'pkill -f <恶意进程名>', desc: '终止可疑进程（先记录 PID 与命令行）' },
        { cmd: 'passwd -l <可疑账号>', desc: '锁定可疑系统账号，防止继续登录' },
        { cmd: 'tcpdump -i any -w /evidence/cap.pcap  # 跳 tcpdump 工具', desc: '断网前先抓包留存网络证据' },
      ],
      [
        { cmd: 'systemctl list-unit-files --type=service --state=enabled', desc: '列出开机自启服务，排查伪装服务', note: '仅 systemd' },
        { cmd: 'crontab -l; ls -la /etc/cron.* /var/spool/cron', desc: '检查用户与系统级计划任务' },
        { cmd: 'cat /etc/rc.local; ls -la /etc/init.d', desc: '检查开机启动脚本与 SysV 服务' },
        { cmd: 'cp -a /path/suspect /evidence/  # 先备份再 rm -f', desc: '删除前先保留样本用于取证' },
        { cmd: 'chkrootkit; rkhunter --check', desc: 'rootkit 检测（需预先安装）' },
      ],
      [
        { cmd: 'passwd <用户>  # 为所有相关账号改密', desc: '失陷后必须重置口令' },
        { cmd: "sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config", desc: '禁止 root 直接 SSH 登录' },
        { cmd: 'apt-get update && apt-get upgrade -y  # 或 yum update', desc: '安装系统补丁，修复被利用的漏洞' },
        { cmd: 'systemctl enable --now firewalld', desc: '启用主机防火墙', note: '仅 systemd' },
        { cmd: 'chattr -i /etc/passwd /etc/shadow  # 解除异常 immutable', desc: '若关键文件被 chattr +i 锁定，先解除' },
      ],
      [
        { cmd: 'tar czf /evidence/fs-$(date +%s).tar.gz /etc /var/log /home 2>/dev/null', desc: '打包关键目录做文件系统快照' },
        { cmd: 'md5sum /bin/* /usr/bin/* 2>/dev/null > /evidence/bin-hashes.txt', desc: '记录关键二进制哈希，比对是否被替换' },
        { cmd: 'ausearch -m USER_AUTH --start recent 2>/dev/null | tail -40', desc: '审计登录认证记录', note: '需 auditd' },
        { cmd: "find / -newermt '2026-09-01' -ls 2>/dev/null | head -50", desc: '按时间线列出近期被修改的文件' },
        { cmd: "strings /path/to/suspect | grep -iE 'http|ip|user|pass'", desc: '从可疑文件中提取可疑字符串（C2 地址等）' },
      ],
    ),
    windows: P(
      [
        { cmd: 'whoami /all', desc: '查看当前用户、SID 与所属特权组' },
        { cmd: 'query user  # 或 qwinsta', desc: '查看当前登录会话与来源' },
        { cmd: 'net user', desc: '列出本地账户；配合 wmic useraccount get name,SID' },
        { cmd: 'tasklist /svc', desc: '查看进程及其关联的系统服务' },
        { cmd: 'netstat -ano | findstr ESTABLISHED', desc: '查看已建立的外连与对应 PID' },
        { cmd: "Get-ChildItem C:\\Windows\\Temp -Recurse | Sort LastWriteTime -Desc | Select -First 20", desc: '列出临时目录中最近写入的文件' },
        { cmd: 'wevtutil qe Security /c:50 /rd:true /f:text', desc: '读取最近 50 条安全日志（登录/审核）' },
      ],
      [
        { cmd: 'netsh advfirewall firewall add rule name="block-ip" dir=out remoteip=<IP> action=block', desc: '出站封禁恶意 IP' },
        { cmd: 'Disable-NetAdapter -Name "Ethernet" -Confirm:$false', desc: '断开网卡做物理隔离', note: '会断远程桌面' },
        { cmd: 'Stop-Process -Name <进程名> -Force', desc: '强制终止可疑进程（先记录 PID）' },
        { cmd: 'net user <账号> /active:no', desc: '禁用可疑账号' },
      ],
      [
        { cmd: 'Get-CimInstance Win32_StartupCommand', desc: '列出开机启动项' },
        { cmd: 'schtasks /query /fo LIST /v', desc: '列出所有计划任务' },
        { cmd: 'Get-ItemProperty "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"', desc: '查看注册表自启项（Run / RunOnce）' },
        { cmd: 'Remove-Item <可疑路径> -Force  # 先复制备份', desc: '删除前先备份样本' },
        { cmd: 'Get-ItemProperty HKLM:\\System\\CurrentControlSet\\Services\\* | Where {...}', desc: '排查伪装成服务的后门' },
      ],
      [
        { cmd: 'net user <账号> <新密码>', desc: '失陷后重置账号口令' },
        { cmd: 'netsh advfirewall set allprofiles state on', desc: '开启 Windows 防火墙' },
        { cmd: "Set-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server' -Name 'fDenyTSConnections' -Value 1", desc: '关闭远程桌面（RDP）' },
        { cmd: 'wuauclt /detectnow  # 或通过 Windows Update 打补丁', desc: '安装系统安全更新' },
        { cmd: 'Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa" -Name "LimitBlankPasswordUse" -Value 1', desc: '收紧本地安全策略' },
      ],
      [
        { cmd: "Get-ChildItem -Recurse C:\\ -ErrorAction SilentlyContinue | Where {$_.LastWriteTime -gt '2026-09-01'}", desc: '按时间线列出近期被修改的文件' },
        { cmd: 'wevtutil epl Security C:\\evidence\\sec.evtx', desc: '导出安全事件日志用于离线分析' },
        { cmd: 'Get-FileHash -Algorithm SHA256 <文件>', desc: '计算可疑文件 SHA256 哈希' },
        { cmd: 'fltmc', desc: '查看文件系统过滤驱动，排查 rootkit 迹象' },
        { cmd: 'Get-WinEvent -FilterHashtable @{LogName="Security";ID=4625} -MaxEvents 100', desc: '提取近期登录失败（4625）事件' },
      ],
    ),
  },

  // ───────────────────────── 2. 挖矿木马（CPU 异常） ─────────────────────────
  {
    id: 'miner',
    name: '挖矿木马（CPU / 负载异常）',
    summary: '服务器 CPU 或负载莫名飙高，多为植入挖矿程序；重点找高占用进程、守护进程与定时任务。',
    linux: P(
      [
        { cmd: 'top -b -n1 | head -15', desc: '查看 CPU/内存占用最高的进程' },
        { cmd: 'ps -eo pid,ppid,cmd,%cpu --sort=-%cpu | head', desc: '按 CPU 排序定位挖矿进程' },
        { cmd: "ps aux | grep -iE 'miner|xmrig|stratum|pool' | grep -v grep", desc: '直接搜常见挖矿/矿池关键词' },
        { cmd: 'ss -antup | grep -E ":(3333|8080|80|443)"', desc: '挖矿常连矿池 3333/8080 等端口' },
        { cmd: 'cat /proc/<pid>/cmdline | tr "\\0" " "; echo', desc: '查看可疑进程完整命令行参数' },
      ],
      [
        { cmd: 'kill -9 <pid>; pkill -9 -f xmrig', desc: '先终止挖矿主进程（含守护）' },
        { cmd: 'iptables -A OUTPUT -p tcp --dport 3333 -j DROP', desc: '阻断矿池端口外连' },
        { cmd: 'systemctl stop <服务名> && systemctl disable <服务名>', desc: '停止并禁用伪装成服务的守护进程', note: '仅 systemd' },
        { cmd: 'ifconfig eth0 down  # 必要时断网', desc: '高负载且无法定位时先断网保护' },
      ],
      [
        { cmd: 'systemctl list-unit-files --state=enabled | grep -iE "service|timer"', desc: '排查伪装系统服务/定时器' },
        { cmd: 'crontab -l; ls /etc/cron.d/ /etc/cron.hourly/', desc: '检查定时拉起的挖矿脚本' },
        { cmd: 'find / -name "*.sh" -newermt "-7 days" 2>/dev/null | xargs grep -l "pool\|miner" 2>/dev/null', desc: '近 7 天脚本中搜矿池特征' },
        { cmd: 'rm -f /tmp/<样本> /var/tmp/<样本>', desc: '删除样本（先备份取证）' },
      ],
      [
        { cmd: 'chmod 700 /tmp /var/tmp; mount -o remount,noexec /tmp', desc: '加固临时目录，禁止可执行', note: '视分区' },
        { cmd: 'apt-get install -y fail2ban && systemctl enable --now fail2ban', desc: '部署 fail2ban 防爆破' },
        { cmd: "sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config", desc: '关闭 root SSH 直登' },
        { cmd: 'pkill -9 sshd_x; passwd <用户>', desc: '重置口令、回收失陷凭证' },
      ],
      [
        { cmd: 'md5sum /usr/bin/* /usr/sbin/* > /evidence/bin.txt', desc: '记录二进制哈希，确认无替换' },
        { cmd: 'journalctl --since "2026-09-01" | grep -i "miner\\|pool"', desc: '按时间回溯挖矿活动日志' },
        { cmd: "strings /proc/<pid>/exe 2>/dev/null | grep -iE 'pool|wallet|stratum'", desc: '从进程内存映像提取钱包/矿池地址' },
      ],
    ),
    windows: P(
      [
        { cmd: 'Get-Process | Sort CPU -Descending | Select -First 15', desc: '按 CPU 排序查看进程' },
        { cmd: 'Get-Counter "\\Process(*)\\% Processor Time"', desc: '实时各进程 CPU 占用' },
        { cmd: 'tasklist /fi "MEMUSAGE gt 200000"', desc: '查看内存占用异常大的进程' },
        { cmd: 'netstat -ano | findstr "3333 8080"', desc: '查矿池常用端口外连' },
        { cmd: 'Get-CimInstance Win32_Process | ? {$_.CommandLine -match "pool|miner|xmrig"}', desc: '按命令行特征定位挖矿进程' },
      ],
      [
        { cmd: 'Stop-Process -Id <PID> -Force', desc: '终止挖矿主进程' },
        { cmd: 'netsh advfirewall firewall add rule name="blk-pool" dir=out protocol=tcp remoteport=3333 action=block', desc: '阻断矿池出站端口' },
        { cmd: 'Get-Service | ? {$_.Status -eq "Running"} | Stop-Service -Force', desc: '停止可疑服务（确认后）' },
      ],
      [
        { cmd: 'Get-CimInstance Win32_StartupCommand | ? {$_.Command -match "miner|pool"}', desc: '排查开机启动中的挖矿项' },
        { cmd: 'schtasks /query /fo LIST | findstr "miner\\|pool"', desc: '搜索计划任务中的矿池特征' },
        { cmd: 'Get-ItemProperty "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"', desc: '当前用户注册表自启' },
        { cmd: 'Remove-Item <样本路径> -Force', desc: '删除样本（先备份）' },
      ],
      [
        { cmd: 'Set-MpPreference -DisableRealtimeMonitoring $false', desc: '确保 Windows Defender 实时防护开启' },
        { cmd: 'netsh advfirewall set allprofiles state on', desc: '开启防火墙' },
        { cmd: 'net user <账号> <新密码>', desc: '重置口令' },
      ],
      [
        { cmd: 'Get-FileHash -Algorithm SHA256 <样本>', desc: '记录样本哈希提交威胁情报' },
        { cmd: 'wevtutil epl System C:\\evidence\\sys.evtx', desc: '导出系统日志' },
        { cmd: 'Get-Process -Id <PID> | Select-Object Path,StartTime', desc: '记录进程路径与启动时间' },
      ],
    ),
  },

  // ───────────────────────── 3. 勒索病毒 ─────────────────────────
  {
    id: 'ransomware',
    name: '勒索病毒',
    summary: '文件被加密、出现勒索信时，第一原则是「止损 + 保全证据」，切勿盲目重装或付款。',
    linux: P(
      [
        { cmd: 'find / -name "README*" -o -name "*.txt" 2>/dev/null | xargs grep -li "bitcoin\\|decrypt\\|pay" 2>/dev/null | head', desc: '定位勒索信文件' },
        { cmd: 'find / -name "*.locked" -o -name "*.crypt" -o -name "*.encrypted" 2>/dev/null | head', desc: '统计被加密文件特征后缀' },
        { cmd: 'ps auxf | grep -iE "encrypt|ransom|crypt" | grep -v grep', desc: '查找仍在运行的加密进程' },
        { cmd: 'mount | grep -E "nfs|cifs|ext"', desc: '确认是否有共享/挂载盘也被加密' },
      ],
      [
        { cmd: 'ifconfig eth0 down  # 立即断网隔离', desc: '阻断横向扩散与回连 C2', note: '优先' },
        { cmd: 'pkill -9 -f <加密进程名>', desc: '终止正在进行的加密进程' },
        { cmd: "iptables -A OUTPUT -d 0.0.0.0/0 -j DROP  # 仅保留管理通道", desc: '禁止对外通信（谨慎，需保留运维入口）' },
      ],
      [
        { cmd: 'cp -a /evidence/ransom-note.txt /evidence/', desc: '备份勒索信（含比特币地址、联系方式）' },
        { cmd: 'find / -newermt "-1 hour" -name "*.locked" 2>/dev/null > /evidence/encrypted-list.txt', desc: '列出被加密文件清单' },
        { cmd: 'sha256sum /evidence/ransom-note.txt', desc: '对勒索信做哈希，用于家族识别' },
      ],
      [
        { cmd: '从干净备份恢复数据（切勿覆盖原始加密盘）', desc: '恢复前先离线备份加密盘镜像' },
        { cmd: 'umount <被挂载的共享>; 修改 SMB/ NFS 口令', desc: '断开并加固被波及的共享存储' },
        { cmd: '更新系统补丁并更换所有凭证', desc: '修复入侵入口' },
      ],
      [
        { cmd: 'dd if=/dev/sda of=/evidence/disk.img bs=4M  # 或 tar 关键分区', desc: '对受影响磁盘做镜像保全（需空间）' },
        { cmd: 'tar czf /evidence/encrypted-sample.tar.gz -C / <若干加密样本>', desc: '保留少量加密样本供解密工具分析' },
        { cmd: '提交样本哈希到 https://www.nomoreransom.org 查询解密工具', desc: '通过威胁情报查找可用解密器' },
      ],
    ),
    windows: P(
      [
        { cmd: 'Get-ChildItem -Recurse C:\\ -Include README*,*.txt -ErrorAction SilentlyContinue | Select-String -Pattern "bitcoin|decrypt|pay" | Select -First 10', desc: '搜索勒索信关键词' },
        { cmd: 'Get-ChildItem -Recurse C:\\ -ErrorAction SilentlyContinue | ? {$_.Extension -match "locked|crypt|encrypted"} | Measure', desc: '统计被加密文件数量' },
        { cmd: 'Get-Process | ? {$_.Name -match "encrypt|ransom"}', desc: '查找加密进程' },
        { cmd: 'net use', desc: '查看已映射的网络驱动器（可能也被加密）' },
      ],
      [
        { cmd: 'Disable-NetAdapter -Name "Ethernet" -Confirm:$false', desc: '立即断网隔离' },
        { cmd: 'Stop-Process -Name <加密进程> -Force', desc: '终止加密进程' },
        { cmd: 'netsh advfirewall firewall add rule name="blk-all" dir=out action=block', desc: '阻断所有出站（保留本地运维）' },
      ],
      [
        { cmd: 'Copy-Item <勒索信路径> C:\\evidence\\ -Force', desc: '备份勒索信' },
        { cmd: "Get-ChildItem -Recurse C:\\ -ErrorAction SilentlyContinue | Where {$_.LastWriteTime -gt (Get-Date).AddHours(-1)} | Export-Csv C:\\evidence\\encrypted-list.csv", desc: '导出近 1 小时被改文件清单' },
        { cmd: 'Get-FileHash -Algorithm SHA256 <勒索信>', desc: '计算勒索信哈希' },
      ],
      [
        { cmd: '从离线备份还原（先对加密盘做镜像）', desc: '还原前务必保全证据盘' },
        { cmd: 'net use * /delete /y', desc: '断开被波及的网络共享' },
        { cmd: 'net user <账号> <新密码>; 启用 BitLocker', desc: '重置口令并开启磁盘加密' },
      ],
      [
        { cmd: 'wbadmin start backup -backuptarget:D: -include:C: -quiet', desc: '若系统可用，先备份受影响卷' },
        { cmd: 'wevtutil epl Security C:\\evidence\\sec.evtx', desc: '导出安全日志' },
        { cmd: '提交样本到 https://www.nomoreransom.org', desc: '查询对应家族解密工具' },
      ],
    ),
  },

  // ───────────────────────── 4. WebShell / 网页后门 ─────────────────────────
  {
    id: 'webshell',
    name: 'WebShell / 网页后门',
    summary: '网站目录下出现可疑脚本、被挂马或管理员账号异常时，定位后门文件与注入入口。',
    linux: P(
      [
        { cmd: "find /var/www -type f \\( -name '*.php' -o -name '*.jsp' -o -name '*.asp' \\) -newermt '-7 days' 2>/dev/null", desc: '列出近 7 天新增/改动的网页脚本' },
        { cmd: "grep -rniE \"eval\\(|base64_decode|assert\\(|\\\\\$_(GET|POST|REQUEST)\" /var/www --include='*.php' 2>/dev/null | head", desc: '搜索常见 WebShell 危险函数' },
        { cmd: 'ls -lat /var/www/html/  # 替换为实际站点根目录', desc: '查看站点根目录最近改动' },
        { cmd: 'grep -i "POST" /var/log/nginx/access.log 2>/dev/null | tail -30', desc: '查看访问日志中的可疑 POST 请求', note: '按 Web 服务调整路径' },
        { cmd: 'stat /var/www/html/<可疑文件>', desc: '查看后门文件的创建/修改时间' },
      ],
      [
        { cmd: 'mv /var/www/html/<后门> /quarantine/  # 移出 web 目录隔离', desc: '先移出而非直接删除，保留取证' },
        { cmd: 'chmod 000 /quarantine/<后门>', desc: '禁止执行被隔离文件' },
        { cmd: 'iptables -A INPUT -s <攻击者IP> -j DROP', desc: '封禁确认的攻击者来源 IP' },
        { cmd: 'systemctl stop nginx  # 必要时临时停站', desc: '无法快速清理时先停服止损' },
      ],
      [
        { cmd: 'grep -rniE "eval\\(|system\\(|passthru\\(|shell_exec\\(" /var/www --include="*.php" > /evidence/webshell-hits.txt', desc: '全量扫描危险函数调用并留存' },
        { cmd: 'diff -r <干净备份> /var/www/html/  # 对比备份找差异', desc: '与干净备份对比发现篡改' },
        { cmd: 'rm -f /quarantine/<后门>  # 确认无用后删除', desc: '从隔离区彻底删除' },
      ],
      [
        { cmd: '从 git / 干净备份重新部署站点代码', desc: '覆盖被篡改的文件' },
        { cmd: "find /var/www -type d -exec chmod 755 {} \\; ; find /var/www -type f -exec chmod 644 {} \\;", desc: '收紧文件权限，取消可执行' },
        { cmd: '升级 CMS / 框架到最新安全版本', desc: '修复被利用的上传/反序列化漏洞' },
        { cmd: '定期 diff 站点与 git 基线并告警', desc: '建立文件完整性监控' },
      ],
      [
        { cmd: 'tar czf /evidence/www-$(date +%s).tar.gz /var/www/html 2>/dev/null', desc: '打包整站做快照' },
        { cmd: "strings /quarantine/<后门> | grep -iE 'pass|ip|http'", desc: '提取后门中的密码/C2 信息' },
        { cmd: 'grep -iE "<攻击者IP>" /var/log/nginx/access.log', desc: '回溯攻击者访问路径与上传入口' },
      ],
    ),
    windows: P(
      [
        { cmd: "Get-ChildItem -Recurse C:\\inetpub\\wwwroot -ErrorAction SilentlyContinue | Where {$_.LastWriteTime -gt (Get-Date).AddDays(-7)}", desc: '列出近 7 天改动的站点文件（按实际路径）' },
        { cmd: "Get-ChildItem -Recurse C:\\inetpub\\wwwroot -Include *.aspx,*.php,*.jsp | Select-String -Pattern 'eval\\(|base64|Request\\(' | Select -First 20", desc: '搜索危险函数调用' },
        { cmd: 'Get-Content C:\\inetpub\\wwwroot\\web.config | Select-String "handler\\|upload"', desc: '检查上传相关配置' },
        { cmd: 'Get-WinEvent -FilterHashtable @{LogName="IIS";Id=0} -MaxEvents 50', desc: '查看 IIS 访问日志', note: '需 IIS 日志' },
      ],
      [
        { cmd: 'Move-Item C:\\inetpub\\wwwroot\\<后门> C:\\quarantine\\ -Force', desc: '移出 web 目录隔离' },
        { cmd: 'netsh advfirewall firewall add rule name="blk-atk" dir=in remoteip=<IP> action=block', desc: '封禁攻击者来源 IP' },
        { cmd: 'Stop-WebSite -Name "Default Web Site"', desc: '必要时停站止损', note: '需 WebAdministration 模块' },
      ],
      [
        { cmd: "Get-ChildItem -Recurse C:\\inetpub\\wwwroot | Select-String -Pattern 'eval\\(|system\\(' | Export-Csv C:\\evidence\\hits.csv", desc: '全量扫描危险函数并留存' },
        { cmd: 'Remove-Item C:\\quarantine\\<后门> -Force', desc: '确认后删除' },
      ],
      [
        { cmd: '从干净备份重新发布站点', desc: '覆盖被篡改文件' },
        { cmd: 'icacls C:\\inetpub\\wwwroot /reset /T', desc: '重置目录 ACL 权限' },
        { cmd: 'Update-Module / 升级应用框架', desc: '修复漏洞' },
      ],
      [
        { cmd: 'Compress-Archive -Path C:\\inetpub\\wwwroot -DestinationPath C:\\evidence\\www.zip', desc: '打包整站快照' },
        { cmd: 'Get-FileHash -Algorithm SHA256 <后门>', desc: '记录后门哈希' },
        { cmd: 'Get-WinEvent -FilterHashtable @{LogName="IIS";} | Where {...}', desc: '回溯攻击者请求路径' },
      ],
    ),
  },

  // ───────────────────────── 5. 异常外连 / 数据泄露 ─────────────────────────
  {
    id: 'exfiltration',
    name: '异常外连 / 数据泄露',
    summary: '发现服务器主动外连陌生 IP、流量异常或疑似数据外发时，定位外连进程与泄露通道。',
    linux: P(
      [
        { cmd: 'ss -antup | grep ESTABLISHED', desc: '查看所有已建立的外连及对应进程' },
        { cmd: "netstat -anp | awk '$6==\"ESTAB\" {print}'", desc: '列出 ESTABLISHED 连接与 PID' },
        { cmd: 'lsof -i -P -n | grep -i estab', desc: '查看打开网络连接的具体文件/进程' },
        { cmd: "ps -p <pid> -o pid,cmd  # 用上一步的 PID 反查进程", desc: '根据连接定位发起进程' },
        { cmd: 'iftop -nNP  # 或 nload', desc: '实时观察哪个连接占用带宽', note: '需安装' },
      ],
      [
        { cmd: 'iptables -A OUTPUT -d <恶意IP> -j DROP', desc: '阻断到恶意 IP 的出站' },
        { cmd: 'iptables -A OUTPUT -p tcp --dport 443 -m owner --uid-owner <可疑用户> -j DROP', desc: '按进程所属用户阻断其外连' },
        { cmd: 'kill -9 <pid>', desc: '终止发起异常外连的进程' },
        { cmd: 'tcpdump -i any -w /evidence/exfil.pcap host <恶意IP>', desc: '抓包留存泄露证据（跳 tcpdump 工具）' },
      ],
      [
        { cmd: 'find / -size +100M -newermt "-3 days" 2>/dev/null', desc: '找近期产生的大文件（疑似打包外发）' },
        { cmd: "tar tzf /tmp/<打包>.tar.gz 2>/dev/null | head", desc: '检查可疑打包内容' },
        { cmd: 'history | grep -iE "scp|rsync|curl|wget|ftp"', desc: '从命令历史找数据外发动作' },
        { cmd: 'rm -f /tmp/<打包样本>', desc: '删除用于外发的临时包' },
      ],
      [
        { cmd: 'rpm -Va  # 或 debsums -c', desc: '校验系统文件完整性，发现被篡改' },
        { cmd: '修改数据库 / API 密钥等所有外发凭证', desc: '泄露风险凭证立即轮换' },
        { cmd: '启用出口白名单：仅允许必要域名/IP 出站', desc: '收敛服务器出方向' },
      ],
      [
        { cmd: 'cp /evidence/exfil.pcap /evidence/  # 已抓取则保留', desc: '保存抓包证据' },
        { cmd: "strings /proc/<pid>/exe | grep -iE 'http|ftp|s3|ip'", desc: '从进程提取外连目标' },
        { cmd: 'ausearch -m NETWORK_ACCEPT -ts recent', desc: '审计网络连接事件', note: '需 auditd' },
      ],
    ),
    windows: P(
      [
        { cmd: 'netstat -ano | findstr ESTABLISHED', desc: '查看已建立外连及 PID' },
        { cmd: 'Get-NetTCPConnection -State Established | Sort OwningProcess', desc: 'PowerShell 列出外连（需 nettcpip 模块）' },
        { cmd: 'Get-CimInstance Win32_Process | ? {$_.ProcessId -eq <PID>}', desc: '根据 PID 反查进程路径' },
        { cmd: 'Get-Counter "\\Network Interface(*)\\Bytes Total/sec"', desc: '观察网卡实时流量' },
      ],
      [
        { cmd: 'netsh advfirewall firewall add rule name="blk-out" dir=out remoteip=<IP> action=block', desc: '阻断到恶意 IP 出站' },
        { cmd: 'Stop-Process -Id <PID> -Force', desc: '终止异常外连进程' },
        { cmd: 'New-NetQosPolicy -Name "block" -DestinationPort 443 -ThrottleRateActionBitsPerSecond 0', desc: '限速/阻断特定出站（需 PowerShell 网络模块）' },
      ],
      [
        { cmd: 'Get-ChildItem -Recurse C:\\ -ErrorAction SilentlyContinue | Where {$_.Length -gt 100MB -and $_.LastWriteTime -gt (Get-Date).AddDays(-3)}', desc: '找近期大文件（疑似外发包）' },
        { cmd: 'Get-History | ? {$_ -match "scp|curl|ftp|copy"}', desc: '从 PowerShell 历史找外发动作' },
        { cmd: 'Remove-Item <可疑包> -Force', desc: '删除外发临时包' },
      ],
      [
        { cmd: 'Reset-ComputerMachinePassword', desc: '重置机器账号密码' },
        { cmd: '轮换数据库/API 等外发凭证', desc: '泄露风险凭证立即轮换' },
        { cmd: 'netsh advfirewall set allprofiles state on', desc: '确保防火墙开启' },
      ],
      [
        { cmd: 'wevtutil epl Security C:\\evidence\\sec.evtx', desc: '导出安全日志' },
        { cmd: 'Get-FileHash -Algorithm SHA256 <可疑样本>', desc: '记录样本哈希' },
        { cmd: 'Get-WinEvent -FilterHashtable @{LogName="Microsoft-Windows-Windows Firewall With Advanced Security/Firewall"}', desc: '查看防火墙放行记录' },
      ],
    ),
  },

  // ───────────────────────── 6. 容器内入侵（Docker / K8s） ─────────────────────────
  {
    id: 'container',
    name: '容器内入侵（Docker / K8s）',
    summary: '容器/集群中进程异常、被提权或挖矿时，从宿主机视角快速定位容器与镜像问题。',
    linux: P(
      [
        { cmd: 'docker ps -a', desc: '列出所有容器（含异常退出/新增）' },
        { cmd: 'docker stats --no-stream', desc: '查看各容器实时 CPU/内存，定位异常容器' },
        { cmd: 'kubectl get pods -A', desc: '列出全部命名空间的 Pod' },
        { cmd: 'kubectl top pods -A', desc: '查看 Pod 资源占用，定位异常负载' },
        { cmd: 'docker exec <容器> ps aux', desc: '进入可疑容器查看内部进程' },
      ],
      [
        { cmd: 'docker stop <容器>; docker rm <容器>', desc: '停止并删除恶意容器' },
        { cmd: 'kubectl delete pod <pod> -n <ns> --force', desc: '强制删除异常 Pod' },
        { cmd: 'iptables -A FORWARD -s <容器IP> -j DROP', desc: '阻断容器网桥侧恶意流量' },
        { cmd: 'docker network disconnect <网络> <容器>', desc: '断开容器网络做隔离' },
      ],
      [
        { cmd: 'docker images | grep -iE "none|malware|miner"', desc: '排查可疑/恶意镜像' },
        { cmd: 'docker rmi <恶意镜像>', desc: '删除恶意镜像' },
        { cmd: "kubectl get cronjob,pod -A | grep -iE 'miner|http'", desc: '排查 K8s 定时任务后门' },
        { cmd: 'kubectl exec <pod> -- ls -lat /tmp', desc: '查看 Pod 内可疑文件' },
      ],
      [
        { cmd: '更新镜像到已审计的干净版本并重新部署', desc: '覆盖被篡改镜像' },
        { cmd: 'kubectl apply -f <修复后的 yaml>', desc: '按安全基线重新下发配置' },
        { cmd: '为容器添加 securityContext（readonlyRootfs / drop CAP）', desc: '收紧容器权限，防提权' },
      ],
      [
        { cmd: 'docker save <镜像> -o /evidence/img.tar', desc: '导出可疑镜像保全' },
        { cmd: 'kubectl logs <pod> --previous > /evidence/pod.log', desc: '导出 Pod 前一次崩溃日志' },
        { cmd: 'docker inspect <容器> > /evidence/container.json', desc: '保存容器配置与挂载信息' },
      ],
    ),
    windows: P(
      [
        { cmd: 'docker ps -a', desc: '列出所有容器' },
        { cmd: 'docker stats --no-stream', desc: '查看容器资源占用' },
        { cmd: 'kubectl get pods -A', desc: '列出全部 Pod' },
        { cmd: 'kubectl top pods -A', desc: '查看 Pod 资源占用' },
      ],
      [
        { cmd: 'docker stop <容器>; docker rm <容器>', desc: '停止并删除恶意容器' },
        { cmd: 'kubectl delete pod <pod> -n <ns> --force', desc: '强制删除异常 Pod' },
        { cmd: 'docker network disconnect <网络> <容器>', desc: '断开容器网络隔离' },
      ],
      [
        { cmd: 'docker images | findstr "none miner"', desc: '排查可疑镜像' },
        { cmd: 'docker rmi <恶意镜像>', desc: '删除恶意镜像' },
        { cmd: 'kubectl get cronjob -A', desc: '排查 K8s 定时任务' },
      ],
      [
        { cmd: '更新并重新部署干净镜像', desc: '覆盖被篡改镜像' },
        { cmd: '为容器添加 securityContext 收紧权限', desc: '防提权' },
      ],
      [
        { cmd: 'docker save <镜像> -o C:\\evidence\\img.tar', desc: '导出可疑镜像保全' },
        { cmd: 'kubectl logs <pod> --previous > C:\\evidence\\pod.log', desc: '导出 Pod 日志' },
        { cmd: 'docker inspect <容器> > C:\\evidence\\container.json', desc: '保存容器配置' },
      ],
    ),
  },
];
