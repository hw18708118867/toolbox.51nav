// 系统日志分析器数据：Windows / Linux 双平台、场景化的日志分析流程
// 每个场景 = 一组有序步骤；每步同时给出两侧「看哪个日志源 → 跑什么命令 → 读什么字段」

export interface SourceSide {
  src: string;   // 日志源（事件通道 / 日志文件）
  cmd: string;   // 可直接复制执行的命令
  read: string;  // 这一步要读的字段与判断依据
}

export interface FlowStep {
  title: string;
  goal: string;
  win: SourceSide;
  linux: SourceSide;
}

export interface Scenario {
  id: string;
  name: string;
  summary: string;
  signs: string[];        // 什么迹象下启用这个剧本
  tags: string[];         // 搜索关键词
  steps: FlowStep[];
  chainWin: string;       // Windows 侧典型事件链
  chainLinux: string;     // Linux 侧典型日志链
  conclusions: string[];  // 研判结论与处置
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'bruteforce',
    name: '暴力破解 / 密码喷洒',
    summary: '从大量失败登录中定位爆破源，并判断有没有「失败洪流之后紧跟着成功」的那一条。',
    signs: ['安全日志短时间涌现大量 4625', 'SSH 日志大量 Failed password / Invalid user', '收到账户锁定告警'],
    tags: ['爆破', '密码喷洒', '4625', 'Failed password', 'RDP', 'SSH', '锁定'],
    steps: [
      {
        title: '确认规模与时间窗口',
        goal: '先分清是零星输错密码还是持续爆破，锁定起止时间与被针对的账号。',
        win: {
          src: 'Security / 4625',
          cmd: 'wevtutil qe Security /q:"*[System[(EventID=4625)]]" /f:text /c:20',
          read: '读 TimeCreated 密度、TargetUserName、IpAddress、LogonType、Status/SubStatus；0xC000006A 为密码错误，0xC0000234 为账号已锁定。',
        },
        linux: {
          src: '/var/log/auth.log（Debian/Ubuntu）或 /var/log/secure（RHEL）',
          cmd: 'grep -E "Failed password|Invalid user" /var/log/auth.log | awk \'{print $1,$2,$3,$11}\' | sort | uniq -c | sort -nr | head -20',
          read: '按来源 IP 聚合计数，快速找出爆破源；Invalid user 密集说明在做用户名枚举。RHEL 系把 auth.log 换成 secure。',
        },
      },
      {
        title: '查找失败之后的成功登录',
        goal: '这是全场景最关键的一步：爆破是否得手，就看同一 IP / 同账号在失败洪流后有没有成功记录。',
        win: {
          src: 'Security / 4624',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4624} -MaxEvents 100 | Where-Object { $_.Message -like "*<爆破IP>*" } | Format-List TimeCreated, Message',
          read: '把上一步的 IP 代入过滤；重点看 LogonType=10（RDP）与 3（SMB/WinRM），成功之后紧跟 4672 说明拿到了高权限。',
        },
        linux: {
          src: '/var/log/auth.log 或 /var/log/secure',
          cmd: 'grep -E "Accepted (password|publickey)" /var/log/auth.log | tail -30',
          read: '比对爆破时间段内是否出现 Accepted，核对来源 IP 与用户名；公钥登录同样要记，不要只筛 password。',
        },
      },
      {
        title: '判断是否为多目标喷洒 / 横向',
        goal: '区分「打一台」和「拿一个密码打一片」，后者往往意味着已经进入内网扩散阶段。',
        win: {
          src: 'Security / 4648 + 域控 4771、4776',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4648,4771,4776} -MaxEvents 40 | Format-List TimeCreated, Id, Message',
          read: '4648 是使用显式凭据（runas /netonly、psexec）；4771 预认证失败、4776 NTLM 验证在域控上能看到全域的喷洒尝试。',
        },
        linux: {
          src: '/var/log/btmp（lastb）',
          cmd: 'lastb -a | head -30',
          read: 'btmp 是二进制失败登录记录，即使文本日志被轮转或清空也可能保留；配合 last 看成功会话。',
        },
      },
      {
        title: '影响面与溯源收口',
        goal: '列出被影响账号，并检查成功登录后有没有后续动作。',
        win: {
          src: 'Security / 4740 + 4688',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4740,4688} -MaxEvents 30 | Format-List TimeCreated, Id, Message',
          read: '4740 账户被锁定可量化影响面；把成功登录时间点往后看 4688 的 CommandLine，有后续动作就升级为已失陷事件。',
        },
        linux: {
          src: '/var/log/lastlog + wtmp',
          cmd: 'lastlog | grep -v "Never logged in"; last -a | head -30',
          read: 'lastlog 能发现长期不用的账号突然登录；last 还原会话时长与来源主机。',
        },
      },
    ],
    chainWin: '4625（大量失败）→ 4624（同 IP 成功）→ 4672（特权）→ 4688 / 7045（后续动作）',
    chainLinux: 'auth.log Failed password → auth.log Accepted → btmp/wtmp → sudo / su → bash_history',
    conclusions: [
      '输出三张清单：爆破源 IP、起止时间、被针对的账号',
      '重点复核「最后一次失败之后紧跟着成功」的记录，这一条基本就是失陷起点',
      '立即改口令或禁用被攻破账号，限制来源 IP，检查账户锁定策略是否生效',
      '若成功登录后出现进程创建、服务安装、计划任务事件，按已失陷事件升级处置',
    ],
  },
  {
    id: 'abnormal-logon',
    name: '异常登录与横向移动',
    summary: '从一条可疑登录出发，判断凭据从哪来、会话做了什么、有没有扩散到其它主机。',
    signs: ['非工作时段出现 4624', '陌生 IP 建立 RDP 会话', '内网主机之间出现 SMB / WinRM 登录'],
    tags: ['异常登录', '横向移动', '4624', 'LogonType', '4648', 'RDP', 'psexec', 'SSH'],
    steps: [
      {
        title: '定位这条登录并读懂 LogonType',
        goal: '先确定登录方式，Type 决定了它是本地操作、网络访问还是远程桌面。',
        win: {
          src: 'Security / 4624',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4624} -MaxEvents 50 | Format-List TimeCreated, Message',
          read: 'LogonType：2 本地、3 网络（SMB/psexec/wmic/WinRM）、9 runas /netonly、10 RDP、11 缓存凭据；核对 IpAddress、WorkstationName 是否为已知资产。',
        },
        linux: {
          src: '/var/log/auth.log 或 /var/log/secure',
          cmd: 'grep -E "Accepted|session opened" /var/log/auth.log | tail -40',
          read: '看 Accepted 行的 from IP 与端口；session opened 对应 PAM 会话建立，能确认会话真的打开。',
        },
      },
      {
        title: '判断凭据来源（横向特征）',
        goal: '横向移动几乎都会留下「用了别人的凭据」或多主机同源登录的痕迹。',
        win: {
          src: 'Security / 4648 + 4672',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4648,4672} -MaxEvents 30 | Format-List TimeCreated, Id, Message',
          read: '4648 表示显式凭据（runas /netonly、psexec），是横向移动强信号；4672 说明该会话被分配了特权。',
        },
        linux: {
          src: '/var/log/wtmp + 各主机 auth.log',
          cmd: 'last -a -i | head -30',
          read: '同一账号从多台内网主机登录，或某台主机突然登录多台机器，都是横向特征；把时间窗口对齐到分钟级。',
        },
      },
      {
        title: '还原这个会话做了什么',
        goal: '登录本身不等于恶意，要看登录后紧接着发生了什么。',
        win: {
          src: 'Security / 4688 + Sysmon 1、3',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4688} -MaxEvents 30 | Format-List TimeCreated, Message',
          read: '按登录时间往后看 CommandLine 与 ParentProcessName；powershell -enc、cmd /c、wmic、net use、psexec 在这里显形。',
        },
        linux: {
          src: '/var/log/audit/audit.log + ~/.bash_history',
          cmd: 'ausearch -m USER_CMD,EXECVE -ts recent 2>/dev/null | tail -60; tail -50 ~/.bash_history',
          read: 'auditd 需事先配置 execve 规则；bash_history 可能被清空或绕过（非交互式 shell），优先以 audit.log 为准。',
        },
      },
      {
        title: '用旁路通道交叉验证',
        goal: '主日志可能被清，旁路通道常常还留着证据。',
        win: {
          src: 'TerminalServices-LocalSessionManager / 21、25',
          cmd: 'wevtutil qe Microsoft-Windows-TerminalServices-LocalSessionManager/Operational /q:"*[System[(EventID=21)]]" /f:text /c:20',
          read: '21 是 RDP 会话登录成功、25 是重连；Security 日志被清时这个通道往往仍在，还能看到源 IP。',
        },
        linux: {
          src: 'journalctl -u sshd',
          cmd: 'journalctl -u sshd --since "today" | grep -E "Accepted|Disconnected" | tail -40',
          read: 'systemd 日志是 auth.log 被清空或轮转后的重要补充；注意 journald 是否配置为持久化存储。',
        },
      },
    ],
    chainWin: '4648（显式凭据）→ 4624 Type=3/10 → 4672 → 4688 / 5140 → 7045 / 4698',
    chainLinux: 'auth.log Accepted → sudo / su → audit.log EXECVE → 对外连接 / 新进程',
    conclusions: [
      '把登录时间与后续进程/服务/文件事件串成一条分钟级时间线',
      'LogonType=5（服务）与系统自动产生的 Type=3 属常见误报，需结合账户与来源判断',
      '确认横向后要同步排查同网段其它主机的同一账号与源 IP',
      '封禁来源、轮换凭据，并检查共享、WinRM、RDP 的暴露面',
    ],
  },
  {
    id: 'account-privilege',
    name: '账号与权限异常（后门账户 / 提权）',
    summary: '排查新建账号、加组提权、密码重置与 sudo 授权，判断是不是攻击者留的后门。',
    signs: ['突然出现陌生本地账户', '普通账号被加入 Administrators', 'sudoers 或 authorized_keys 被改动'],
    tags: ['后门账户', '4720', '4732', '提权', 'sudo', 'useradd', 'authorized_keys', 'passwd'],
    steps: [
      {
        title: '列出账号创建与变更',
        goal: '先找出「什么时候、谁创建/改了哪个账号」。',
        win: {
          src: 'Security / 4720、4722、4738、4724',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4720,4722,4738,4724} -MaxEvents 30 | Format-List TimeCreated, Id, Message',
          read: '4720 新建、4722 启用（Guest/Administrator 被启用尤其可疑）、4724 重置他人密码、4738 属性变更（含 SPN 添加）；核对 SubjectUserName 这个操作者。',
        },
        linux: {
          src: '/var/log/auth.log + /etc/passwd',
          cmd: 'grep -E "useradd|adduser|usermod|passwd" /var/log/auth.log | tail -40; awk -F: \'$3>=1000 {print $1,$3,$6,$7}\' /etc/passwd',
          read: 'auth.log 里的 useradd/usermod 会带操作进程；passwd 里 UID≥1000 且 shell 非 nologin 的账户逐个核对。',
        },
      },
      {
        title: '检查提权与加组',
        goal: '后门账户本身不致命，被加进特权组才致命。',
        win: {
          src: 'Security / 4732、4728、4672',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4732,4728} -MaxEvents 30 | Format-List TimeCreated, Id, Message',
          read: '重点看 TargetUserName 是不是 Administrators / Remote Desktop Users / Domain Admins；MemberName 被加入的是谁。',
        },
        linux: {
          src: '/var/log/auth.log（sudo / su）+ /etc/sudoers.d',
          cmd: 'grep -E "sudo:|su:" /var/log/auth.log | tail -40; ls -la /etc/sudoers.d/; stat /etc/passwd /etc/shadow /etc/group',
          read: '看 sudo 提权是否来自异常账号；对比 /etc/passwd、/etc/shadow、/etc/group 的 mtime，被批量改过要警惕。',
        },
      },
      {
        title: '核查免密登录与凭据文件',
        goal: '公钥后门和凭据篡改不会写进「账号创建」日志，必须单独查。',
        win: {
          src: 'Security / 4738 + 注册表/凭据相关审计',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4738} -MaxEvents 20 | Format-List TimeCreated, Message; net localgroup administrators',
          read: '4738 里 ServicePrincipalName 被添加是 Kerberoasting 前置；net localgroup 直接列出当前管理员组成员做交叉验证。',
        },
        linux: {
          src: '~/.ssh/authorized_keys + SSH 日志',
          cmd: 'find /home /root -name authorized_keys -exec sh -c \'echo "== $1"; cat "$1"\' _ {} \\;; grep "Accepted publickey" /var/log/auth.log | tail -20',
          read: '逐个用户核对公钥；Accepted publickey 能告诉你哪把钥匙在什么时候被用过。',
        },
      },
    ],
    chainWin: '4720 / 4722 → 4732（加入管理员组）→ 4672 → 4688 / 7045',
    chainLinux: 'auth.log useradd → usermod -aG → sudo 提权 → authorized_keys 写入 → Accepted publickey',
    conclusions: [
      '把账号创建者（SubjectUserName）、创建时间、加组时间串起来，判断是运维操作还是入侵',
      '确认后门账号后先禁用而非立刻删除，便于保留证据与观察关联会话',
      '同步轮换该账号可触达的所有凭据与密钥',
      '检查是否伴随计划任务/服务创建，避免只删账号留下持久化',
    ],
  },
  {
    id: 'webshell-process',
    name: '可疑进程与 WebShell 落地',
    summary: '以 Web 访问日志的时间点为锚，反查同一时刻的进程创建，找到命令执行入口。',
    signs: ['Web 目录出现陌生脚本', 'Web 服务进程派生了 cmd / sh', 'access.log 出现可疑 POST 或异常路径'],
    tags: ['WebShell', '4688', 'Sysmon 1', 'execve', 'nginx', 'access.log', '命令执行'],
    steps: [
      {
        title: '从访问日志锁定可疑请求',
        goal: 'WebShell 分析要从「哪个 URL、哪一秒」开始，而不是先翻系统日志。',
        win: {
          src: 'IIS 日志（%SystemRoot%\\inetpub\\logs\\LogFiles）',
          cmd: 'findstr /i /c:"POST" /c:"cmd" /c:"eval" C:\\inetpub\\logs\\LogFiles\\W3SVC1\\u_ex*.log | findstr /i /c:" 200 "',
          read: '筛出返回 200 的可疑 POST 与带命令参数的请求，记下精确到秒的时间与客户端 IP。',
        },
        linux: {
          src: '/var/log/nginx/access.log 或 /var/log/apache2/access.log',
          cmd: 'grep -E "POST|\\.php\\?|/uploads/|cmd=|exec=|base64" /var/log/nginx/access.log | grep " 200 " | tail -40',
          read: '记录时间、URI、状态码、UA 与来源 IP；上传目录被直接访问且返回 200 是典型 WebShell 特征。',
        },
      },
      {
        title: '按时间点反查进程创建',
        goal: '父进程是 Web 服务进程（w3wp / php-fpm / nginx / java）时，基本可确认是 Web 入口的命令执行。',
        win: {
          src: 'Security / 4688 + Sysmon 1',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4688} -MaxEvents 50 | Where-Object { $_.Message -like "*w3wp*" -or $_.Message -like "*cmd.exe*" } | Format-List TimeCreated, Message',
          read: '看 ParentProcessName 与 CommandLine；w3wp.exe 起 cmd.exe / powershell.exe 是最经典的 WebShell 信号。',
        },
        linux: {
          src: '/var/log/audit/audit.log（EXECVE）',
          cmd: 'ausearch -m EXECVE -ts <起始时间> 2>/dev/null | grep -E "proctitle|uid=|exe=" | tail -60',
          read: 'auditd 需预先配置 execve 规则；按访问日志时间窗口过滤，看 www-data / nginx / apache 用户起 sh、bash、curl、wget。',
        },
      },
      {
        title: '查落盘文件与脚本内容',
        goal: '确认 WebShell 文件本体，并判断它后续又下载了什么。',
        win: {
          src: 'Sysmon 11、15 + PowerShell 4104',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Microsoft-Windows-PowerShell/Operational\'; Id=4104} -MaxEvents 20 | Format-List TimeCreated, Message',
          read: '脚本块日志能看到解码后的实际命令；Sysmon 11 的 TargetFilename 可定位 Web 目录新文件。',
        },
        linux: {
          src: 'Web 目录 + audit.log 文件写事件',
          cmd: 'find /var/www -type f -mtime -3 -printf "%TY-%Tm-%Td %TH:%TM %p\\n" | sort; grep -rlnE "eval\\(|base64_decode|system\\(|assert\\(" /var/www --include=*.php | head -20',
          read: '按 mtime 找最近被写入的文件，再扫危险函数；注意攻击者可能把时间戳改成与正常文件一致（timestomping）。',
        },
      },
    ],
    chainWin: 'IIS 日志可疑 POST → 4688（w3wp → cmd）→ Sysmon 1/11 → 4104 → 7045 / 4698',
    chainLinux: 'access.log 可疑 POST → audit.log EXECVE（www-data → sh）→ 落盘文件 → 反弹连接',
    conclusions: [
      '以「可疑请求时间 ±30 秒」为窗口做关联，这是 WebShell 溯源最有效的锚点',
      '确认后先隔离样本与 Web 目录，再查是否已被植入计划任务/服务',
      '检查数据库连接串与配置文件是否被读取，评估数据泄露面',
      '修复入口（上传校验、中间件漏洞）后再恢复服务，避免反复被植入',
    ],
  },
  {
    id: 'persistence',
    name: '持久化排查（服务 / 计划任务 / 启动项）',
    summary: '把「装了什么自启动」的日志和当前配置对照，找出攻击者留下的复活点。',
    signs: ['出现 7045 陌生服务', '计划任务被新建或更新', 'crontab / systemd 出现陌生条目'],
    tags: ['持久化', '7045', '4698', '4702', 'crontab', 'systemd', 'Run 键', '自启动'],
    steps: [
      {
        title: '查新建服务与驱动',
        goal: '服务类持久化在 Windows 上默认就会留痕，优先看。',
        win: {
          src: 'System / 7045 + Security / 4697',
          cmd: 'wevtutil qe System /q:"*[System[(EventID=7045)]]" /f:text /c:20',
          read: '读 ServiceName 与 ServiceFileName；路径在临时目录、用户目录或随机命名都要重点核查。',
        },
        linux: {
          src: '/etc/systemd/system + journalctl',
          cmd: 'systemctl list-unit-files --type=service --state=enabled; find /etc/systemd/system -type f -mtime -7 -printf "%TY-%Tm-%Td %p\\n"',
          read: '列出开机自启服务，再按 mtime 找最近新增/修改的 unit 文件；别漏掉 /etc/rc.local 与 /etc/init.d。',
        },
      },
      {
        title: '查计划任务的时间线',
        goal: '「更新已有任务」比「新建任务」隐蔽，两者都要看。',
        win: {
          src: 'Security / 4698、4702、4699',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4698,4702,4699} -MaxEvents 30 | Format-List TimeCreated, Id, Message',
          read: 'TaskContent 里直接带 <Command> 与 <Arguments>；4702 更新系统自带任务尤其可疑，4699 删除常是清理痕迹。',
        },
        linux: {
          src: '/var/log/cron 或 syslog + 各用户 crontab',
          cmd: 'grep CRON /var/log/cron | tail -40; for u in $(cut -d: -f1 /etc/passwd); do echo "== $u"; crontab -l -u "$u" 2>/dev/null; done; ls -la /etc/cron.d/ /etc/cron.daily/',
          read: '日志看任务何时被执行，配置看任务内容；务必遍历所有用户，不要只看 root。',
        },
      },
      {
        title: '查注册表 / 启动项与登录脚本',
        goal: '补齐日志覆盖不到的自启动位置。',
        win: {
          src: 'Sysmon 12、13、14',
          cmd: 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"; reg query "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"',
          read: 'Run / RunOnce、Image File Execution Options、AppInit_DLLs 是高频位置；Sysmon 13 能给出是谁在什么时候写的。',
        },
        linux: {
          src: 'profile / 启动脚本',
          cmd: 'grep -rniE "curl|wget|nc |bash -i|/dev/tcp" /etc/profile.d/ /etc/rc.local ~/.bashrc ~/.profile 2>/dev/null | head -30',
          read: '登录脚本里塞一行反弹 shell 很常见；同时核对 ~/.ssh/authorized_keys 是否被加公钥。',
        },
      },
    ],
    chainWin: '4688（落地）→ 7045 / 4697（服务）→ 4698 / 4702（任务）→ Sysmon 13（Run 键）',
    chainLinux: 'audit.log EXECVE → systemd unit / crontab 写入 → /var/log/cron 周期执行',
    conclusions: [
      '先记录所有可疑项再清理，避免删掉一处、另一处又把载荷拉回来',
      '清理顺序：断网/禁账号 → 删持久化 → 杀进程 → 删文件 → 重启验证',
      '重启后复查服务与任务列表，确认没有复活',
    ],
  },
  {
    id: 'log-clearing',
    name: '痕迹清理与日志被删',
    summary: '日志「突然变少」本身就是强信号：确认谁清了、什么时候清的，并转到旁路证据。',
    signs: ['Security 日志出现 1102', '某段时间日志出现明显缺口', 'bash_history 被清空或 auditd 被停'],
    tags: ['痕迹清理', '1102', '104', '4719', '清日志', 'history -c', '时间缺口', '取证'],
    steps: [
      {
        title: '确认清日志动作与操作者',
        goal: 'Windows 侧这个动作本身会被记录，先把人和时间钉住。',
        win: {
          src: 'Security / 1100、1102 + System / 104',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=1100,1102} -MaxEvents 20 | Format-List TimeCreated, Id, Message',
          read: '1102 会记录清除者 SubjectUserName；1100 是日志服务被关闭。System 里 104 表示其它日志被清。',
        },
        linux: {
          src: '日志文件 mtime / 大小 + auditd 状态',
          cmd: 'ls -la --time-style=full-iso /var/log/ | head -30; journalctl --verify 2>&1 | tail -20; systemctl status auditd 2>/dev/null',
          read: '找大小骤减、mtime 与当前时间不符或时间戳整齐得反常的文件；auditd 被停是典型前置动作。',
        },
      },
      {
        title: '检查审计策略是否被改',
        goal: '攻击者常先关审计再动手，比直接清日志更隐蔽。',
        win: {
          src: 'Security / 4719、4907',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4719} -MaxEvents 20 | Format-List TimeCreated, Message; auditpol /get /category:*',
          read: '4719 是系统审计策略变更；再用 auditpol 看当前哪些子类别被关掉了。',
        },
        linux: {
          src: 'audit 规则 + rsyslog 配置',
          cmd: 'auditctl -l; ls -la /etc/audit/rules.d/; grep -rn "auth\\|secure" /etc/rsyslog.conf /etc/rsyslog.d/ 2>/dev/null | head -20',
          read: '规则被清空、日志转发被改到别处，都会造成「看起来没日志」的假象。',
        },
      },
      {
        title: '转旁路证据与时间缺口',
        goal: '主日志没了，就从其它通道把同一时间段拼回来。',
        win: {
          src: 'RDP / PowerShell / Sysmon 通道',
          cmd: 'wevtutil qe Microsoft-Windows-PowerShell/Operational /q:"*[System[(EventID=4104)]]" /f:text /c:20',
          read: '攻击者常只清 Security；RDP 会话、PowerShell 脚本块、Sysmon、DNS/防火墙日志往往还在。先只读导出：wevtutil epl Security C:\\Temp\\Security.evtx。',
        },
        linux: {
          src: 'journald / btmp / wtmp / 网络侧日志',
          cmd: 'journalctl --since "<缺口开始>" --until "<缺口结束>" | head -50; lastb -a | head -20; tar czf /tmp/log_backup.tgz /var/log/ 2>/dev/null',
          read: '先打包保全 /var/log 再分析；btmp/wtmp 是二进制、常被忽略，journald 持久化时也可能保留。',
        },
      },
    ],
    chainWin: '4719（关审计）→ 1100 / 1102（清 Security）→ 104（清其它）→ 4699（删任务）',
    chainLinux: 'auditd 停止 → auth.log 出现时间缺口 → history -c → 文件时间戳被改',
    conclusions: [
      '把「日志缺口」的起止时间当作攻击发生窗口，重点查这个区间内的旁路证据',
      '第一时间只读导出/打包日志，避免在目标机上继续操作覆盖证据',
      '结合网络侧（防火墙、DNS、NetFlow、EDR）与内存取证补全链路',
    ],
  },
  {
    id: 'c2-connection',
    name: '异常外连与 C2 通信',
    summary: '从连接记录反查是哪个进程发起的，再用 DNS / 时间规律判断是不是 C2。',
    signs: ['主机周期性外连陌生 IP', 'DNS 查询出现奇怪域名', 'EDR 报可疑出站流量'],
    tags: ['C2', '外连', 'Sysmon 3', 'Sysmon 22', 'ss', 'netstat', 'DNS', '心跳'],
    steps: [
      {
        title: '抓当前连接并锁定进程',
        goal: 'Linux 默认不记录每条连接，得先抓现场；Windows 有 Sysmon 就能直接回溯。',
        win: {
          src: 'Sysmon / 3、22',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Microsoft-Windows-Sysmon/Operational\'; Id=3,22} -MaxEvents 40 | Format-List TimeCreated, Id, Message',
          read: '事件 3 含 Image、SourceIp、DestinationIp、DestinationPort；事件 22 是 DNS 查询，能拿到域名。没装 Sysmon 时用 netstat -ano 配合 4688 反查 PID。',
        },
        linux: {
          src: 'ss / lsof + /proc',
          cmd: 'ss -tunap | grep -v "127.0.0.1" ; lsof -i -P -n | head -30',
          read: '记录 PID/进程名与远端地址；连接是短连接时容易漏，需配合 auditd connect 规则或抓包。',
        },
      },
      {
        title: '找发起连接的进程来源',
        goal: '一个陌生外连要能追到「哪个可执行文件、被谁启动」才算闭环。',
        win: {
          src: 'Security / 4688 + Sysmon 1',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4688} -MaxEvents 40 | Format-List TimeCreated, Message',
          read: '按连接时间往前查父进程链；powershell、rundll32、mshta、wscript、svchost 异常子进程都是重点。',
        },
        linux: {
          src: 'audit.log（connect）+ bash_history',
          cmd: 'ausearch -m SYSCALL -sc connect -ts recent 2>/dev/null | tail -40; grep -rniE "curl|wget|nc |/dev/tcp|bash -i" /home/*/.bash_history 2>/dev/null | tail -30',
          read: 'auditd 需配置 connect 规则；历史命令里出现下载器或反弹 shell 要立即核对时间点。',
        },
      },
      {
        title: '判断心跳规律与持久化',
        goal: 'C2 通常有固定间隔，且一定有复活点。',
        win: {
          src: 'Sysmon 3 时间序列 + 计划任务/服务',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Microsoft-Windows-Sysmon/Operational\'; Id=3} -MaxEvents 200 | Select-Object TimeCreated, Message | Format-Table -AutoSize',
          read: '看同一目的地是否按固定间隔重复出现；再到 7045 / 4698 找是谁在定时把它拉起来。',
        },
        linux: {
          src: '/var/log/cron + DNS / 防火墙日志',
          cmd: 'grep CRON /var/log/cron | tail -40; grep -iE "query|DNS" /var/log/syslog | tail -40',
          read: 'cron 里的定时下载任务、syslog 里的重复 DNS 查询都能印证心跳；有集中 DNS 日志时优先用那边的历史数据。',
        },
      },
    ],
    chainWin: '4688（载荷运行）→ Sysmon 1 / 3（进程与连接）→ 22（DNS）→ 7045 / 4698（定时拉起）',
    chainLinux: 'audit.log EXECVE → ss 外连 → DNS 查询 → crontab / systemd 周期性执行',
    conclusions: [
      '先隔离主机或阻断目的 IP/域名，再查落地文件，避免继续外传数据',
      '记录目的 IP、端口、域名、首次出现时间与心跳间隔，作为 IOC',
      '同步检查同网段其它主机是否有相同目的地',
    ],
  },
  {
    id: 'ransomware',
    name: '勒索与批量文件改写',
    summary: '从「大量文件被改写」倒推首个恶意进程与加密开始时间，评估影响范围。',
    signs: ['大量文件后缀被批量修改', '出现勒索说明文件', '文件服务器 IO 异常飙升'],
    tags: ['勒索', '批量改写', 'Sysmon 11', '4663', 'timestomp', 'inotify', '卷影'],
    steps: [
      {
        title: '确定加密起点与范围',
        goal: '首个被改写文件的时间往往就是加密开始时间，用它做后续关联锚点。',
        win: {
          src: 'Sysmon 11、23、26 + Security 4663',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Microsoft-Windows-Sysmon/Operational\'; Id=11,23,26} -MaxEvents 50 | Format-List TimeCreated, Id, Message',
          read: '11 是文件创建、23/26 是删除；按 TargetFilename 的后缀聚类，找出最早一批异常文件与对应进程。',
        },
        linux: {
          src: '文件 mtime + audit.log',
          cmd: 'find /data -type f -mmin -120 -printf "%TY-%Tm-%Td %TH:%TM:%TS %p\\n" | sort | head -40; ausearch -m SYSCALL -sc open,unlink -ts recent 2>/dev/null | tail -40',
          read: '按 mtime 排序找最早的批量改写；auditd 需配置文件写规则，否则只能靠文件系统与备份对比。',
        },
      },
      {
        title: '定位执行加密的进程',
        goal: '找到那个进程，才能判断它从哪来、是否还在跑。',
        win: {
          src: 'Security 4688 + Sysmon 1、10',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4688} -MaxEvents 50 | Format-List TimeCreated, Message',
          read: '按加密起点时间往前查；留意 vssadmin delete shadows、wmic shadowcopy delete、bcdedit 等删除卷影的命令。',
        },
        linux: {
          src: '进程 + audit.log EXECVE',
          cmd: 'ps auxf | head -40; ausearch -m EXECVE -ts <起始时间> 2>/dev/null | grep proctitle | tail -40',
          read: '确认加密进程是否仍在运行（先别急着杀，评估是否需要内存取证）。',
        },
      },
      {
        title: '查入口与横向扩散',
        goal: '勒索 rarely 只打一台，共享目录与登录日志能说明扩散路径。',
        win: {
          src: 'Security 4624、5140、5145 + 卷影事件',
          cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4624,5145} -MaxEvents 50 | Format-List TimeCreated, Id, Message',
          read: '5145 大量出现说明在扫描/遍历共享；4624 Type=3 结合 4672 看是否用高权限账户访问了其它主机。',
        },
        linux: {
          src: 'auth.log + Samba/NFS 日志',
          cmd: 'grep -E "Accepted|session opened" /var/log/auth.log | tail -40; grep -iE "connect|open" /var/log/samba/log.* 2>/dev/null | tail -30',
          read: '确认加密主机在事发前是否有异常登录，以及是否挂载/访问了共享目录。',
        },
      },
    ],
    chainWin: '4624 / 4648（进入）→ 4688（vssadmin / 加密进程）→ Sysmon 11/23/26（批量改写）→ 5145（共享遍历）',
    chainLinux: 'auth.log 异常登录 → audit.log EXECVE → 批量 mtime 变更 → Samba/NFS 访问',
    conclusions: [
      '先断网隔离，保留加密样本、勒索说明与内存镜像，不要急着重启',
      '核查卷影副本与离线备份是否完好，再决定恢复路径',
      '把加密起点之前的登录/进程事件作为入侵入口调查重点',
    ],
  },
];

export interface LogSource {
  os: 'Windows' | 'Linux';
  name: string;
  path: string;
  content: string;
  enabled: string;
  cmd: string;
}

export const LOG_SOURCES: LogSource[] = [
  { os: 'Windows', name: '安全日志', path: '%SystemRoot%\\System32\\Winevt\\Logs\\Security.evtx', content: '登录/注销、账户与组、对象访问、审计策略、进程创建', enabled: '默认记录核心类别；4688 命令行、4663 对象访问需另开审计', cmd: 'wevtutil qe Security /f:text /c:20' },
  { os: 'Windows', name: '系统日志', path: '...\\Logs\\System.evtx', content: '服务安装/状态、驱动、开关机、Kernel-Power、BugCheck', enabled: '默认开启', cmd: 'wevtutil qe System /q:"*[System[(EventID=7045)]]" /f:text /c:20' },
  { os: 'Windows', name: '应用程序日志', path: '...\\Logs\\Application.evtx', content: '应用崩溃、MsiInstaller 软件安装/卸载、.NET 异常', enabled: '默认开启', cmd: 'Get-WinEvent -LogName Application -MaxEvents 20 | Format-List TimeCreated, Id, Message' },
  { os: 'Windows', name: 'PowerShell / Operational', path: 'Microsoft-Windows-PowerShell/Operational', content: '4103 模块日志、4104 脚本块原文（含解码后命令）', enabled: '需开启「脚本块日志记录」', cmd: 'wevtutil qe Microsoft-Windows-PowerShell/Operational /q:"*[System[(EventID=4104)]]" /f:text /c:20' },
  { os: 'Windows', name: 'Windows PowerShell', path: 'Windows PowerShell', content: '400/403 引擎启停、800 管道执行细节（v2 排查）', enabled: '默认开启', cmd: 'Get-WinEvent -LogName "Windows PowerShell" -MaxEvents 20 | Format-List TimeCreated, Id, Message' },
  { os: 'Windows', name: 'Sysmon / Operational', path: 'Microsoft-Windows-Sysmon/Operational', content: '进程、网络、文件、注册表、管道、DNS、WMI 持久化', enabled: '需安装 Sysmon 并加载配置', cmd: 'Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" -MaxEvents 20 | Format-List TimeCreated, Id, Message' },
  { os: 'Windows', name: 'RDP 会话管理器', path: 'Microsoft-Windows-TerminalServices-LocalSessionManager/Operational', content: '21/23/24/25 会话登录、注销、断开、重连', enabled: '默认开启，Security 被清时常仍保留', cmd: 'wevtutil qe Microsoft-Windows-TerminalServices-LocalSessionManager/Operational /q:"*[System[(EventID=21)]]" /f:text /c:20' },
  { os: 'Windows', name: 'RDP 连接管理器', path: 'Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational', content: '1149 RDP 认证成功，带源 IP', enabled: '默认开启', cmd: 'wevtutil qe Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational /q:"*[System[(EventID=1149)]]" /f:text /c:20' },
  { os: 'Windows', name: 'WMI-Activity / Operational', path: 'Microsoft-Windows-WMI-Activity/Operational', content: '5857 提供程序启动、5858 操作失败（横向移动线索）', enabled: '默认开启', cmd: 'Get-WinEvent -LogName "Microsoft-Windows-WMI-Activity/Operational" -MaxEvents 20 | Format-List TimeCreated, Id, Message' },
  { os: 'Windows', name: 'WindowsUpdateClient / Operational', path: 'Microsoft-Windows-WindowsUpdateClient/Operational', content: '19/20 补丁安装成功/失败、23/24 补丁卸载', enabled: '默认开启', cmd: 'Get-WinEvent -LogName "Microsoft-Windows-WindowsUpdateClient/Operational" -MaxEvents 20 | Format-List TimeCreated, Id, Message' },
  { os: 'Windows', name: 'TaskScheduler / Operational', path: 'Microsoft-Windows-TaskScheduler/Operational', content: '计划任务注册、启动、完成与失败', enabled: '默认开启（视版本）', cmd: 'Get-WinEvent -LogName "Microsoft-Windows-TaskScheduler/Operational" -MaxEvents 20 | Format-List TimeCreated, Id, Message' },
  { os: 'Windows', name: 'AppXDeploymentServer / Operational', path: 'Microsoft-Windows-AppXDeploymentServer/Operational', content: '400 AppX/MSIX 包部署（含侧载与失败）', enabled: '默认开启', cmd: 'Get-WinEvent -LogName "Microsoft-Windows-AppXDeploymentServer/Operational" -MaxEvents 20 | Format-List TimeCreated, Message' },
  { os: 'Linux', name: '认证日志（Debian/Ubuntu）', path: '/var/log/auth.log', content: 'SSH 登录成功/失败、sudo、su、PAM、useradd', enabled: '默认开启，注意 logrotate 轮转（.1 / .gz）', cmd: 'grep -E "Failed|Accepted|sudo|useradd" /var/log/auth.log | tail -50' },
  { os: 'Linux', name: '认证日志（RHEL/CentOS）', path: '/var/log/secure', content: '同上，RedHat 系路径不同', enabled: '默认开启', cmd: 'grep -E "Failed|Accepted|sudo|useradd" /var/log/secure | tail -50' },
  { os: 'Linux', name: '系统日志', path: '/var/log/syslog（Debian）/ /var/log/messages（RHEL）', content: '系统全局、服务、cron、部分内核消息', enabled: '默认开启', cmd: 'tail -100 /var/log/syslog' },
  { os: 'Linux', name: 'auditd 审计日志', path: '/var/log/audit/audit.log', content: 'EXECVE 命令执行、文件读写、connect、用户命令', enabled: '需安装并配置 auditd 规则（分析能力最强但默认常关闭）', cmd: 'ausearch -m EXECVE -ts recent; aureport -au' },
  { os: 'Linux', name: '失败登录记录（二进制）', path: '/var/log/btmp', content: '所有失败登录，文本日志被清后仍可能保留', enabled: '默认开启', cmd: 'lastb -a | head -30' },
  { os: 'Linux', name: '登录/重启记录（二进制）', path: '/var/log/wtmp', content: '成功登录、注销、重启历史', enabled: '默认开启', cmd: 'last -a | head -30' },
  { os: 'Linux', name: '最后登录记录', path: '/var/log/lastlog', content: '每个用户最后一次登录时间与来源', enabled: '默认开启', cmd: 'lastlog | grep -v "Never logged in"' },
  { os: 'Linux', name: '计划任务日志', path: '/var/log/cron（RHEL）/ syslog（Debian）', content: 'cron 任务的执行记录（不含任务内容）', enabled: '默认开启', cmd: 'grep CRON /var/log/cron | tail -40' },
  { os: 'Linux', name: '内核日志', path: '/var/log/kern.log、dmesg', content: '驱动、USB、内核异常、OOM', enabled: '默认开启', cmd: 'dmesg -T | tail -50' },
  { os: 'Linux', name: 'systemd 日志', path: 'journalctl（/run/log/journal 或 /var/log/journal）', content: '所有 unit、内核、按时间/服务过滤的统一视图', enabled: '默认开启；是否持久化取决于 Storage 配置', cmd: 'journalctl -u sshd --since "today" | tail -50' },
  { os: 'Linux', name: '命令历史', path: '~/.bash_history（每个用户）', content: '交互式 shell 命令历史', enabled: '默认记录，但可被清空/绕过，非可靠审计源', cmd: 'tail -50 ~/.bash_history' },
  { os: 'Linux', name: 'Web 访问日志', path: '/var/log/nginx/access.log、/var/log/apache2/access.log', content: 'HTTP 请求、URL、状态码、来源 IP（WebShell 溯源锚点）', enabled: '随 Web 服务开启', cmd: 'grep -E "POST| 200 " /var/log/nginx/access.log | tail -40' },
];

export interface AttackChain {
  name: string;
  win: string;
  linux: string;
  note: string;
}

export const ATTACK_CHAINS: AttackChain[] = [
  { name: '外部爆破 → 凭据失陷 → 提权落地', win: '4625 → 4624(Type 10/3) → 4672 → 4732 → 4688 → 7045/4698 → 1102', linux: 'auth.log Failed → Accepted → sudo/su → audit.log EXECVE → crontab/systemd → history -c', note: '锚点是「失败洪流之后紧跟成功」的那一条；成功时间点之后的所有事件都是重点。' },
  { name: 'WebShell 入口 → 命令执行 → 持久化', win: 'IIS 日志可疑 POST → 4688(w3wp→cmd) → Sysmon 1/3/11 → 4104 → 4732 → 7045', linux: 'access.log 可疑 POST → audit.log EXECVE(www-data→sh) → 落盘文件 → 反弹连接', note: '用 Web 请求的精确时间 ±30 秒反查进程创建，父进程是 Web 服务进程即为强信号。' },
  { name: '横向移动 → 内网扩散', win: '4648 → 4624(Type=3) → 5140/5145(C$/ADMIN$) → 7045(PSEXESVC) → 4698', linux: 'ssh Accepted from 内网 IP → 同账号登录多台 → authorized_keys 新增 → 批量 EXECVE', note: '关注同一账号/同一源 IP 在短时间内出现在多台主机，单台日志看不出这个模式。' },
  { name: '痕迹清理 → 转旁路取证', win: '4719(关审计) → 1100/1102(清 Security) → 104(清其它) → 4699(删任务)', linux: 'auditd 停止 → auth.log 出现时间缺口 → history -c → 文件时间戳被改', note: '日志「突然变少」本身就是信号；缺口起止时间即攻击窗口，改查 RDP/PowerShell/Sysmon/journald/btmp 与网络侧日志。' },
];

export const PITFALLS: { title: string; text: string }[] = [
  { title: '先统一时区再对齐时间线', text: 'Windows 事件查看器显示本地时间，但导出的 evtx / Get-WinEvent 的 TimeCreated 是 UTC；Linux syslog 多为本地时间，journalctl 可切 UTC。跨主机关联前先把所有时间归一到同一时区，否则会得出错误的先后顺序。' },
  { title: '确认日志保留窗口与轮转', text: 'Linux 有 auth.log.1、*.gz 等轮转文件；Windows evtx 默认按大小覆盖旧记录。分析前先确认日志是否覆盖案发时间，别把「没有记录」直接当成「没有发生」。' },
  { title: '别把正常系统行为当入侵', text: '4624 LogonType=5 是服务启动、Type=3 常来自监控/备份/漏洞扫描；svchost 会产生大量网络登录；公网主机的 SSH 失败日志常年不断。要结合账户、来源 IP、时间段与后续动作综合判断。' },
  { title: '单条日志不能定案', text: '4624 只说明登录成功，4720 只说明建了账号，7045 只说明装了服务。必须串起「进入 → 提权 → 执行 → 持久化 → 外连/清痕」的链条，或找到异常上下文，才能下结论。' },
  { title: 'Linux 默认审计能力有限', text: '没有 auditd 规则和 Sysmon 等价物时，Linux 只能看到认证与系统日志，进程命令行、网络连接、文件改写基本不留痕。事前配置 auditd / 集中日志 / EDR，远比事后补救有效。' },
  { title: '先保全再分析', text: '在目标机上大量查询本身会改变文件时间、产生新日志甚至覆盖证据。先只读导出：Windows 用 wevtutil epl，Linux 用 tar czf 打包 /var/log，最好同时留一份网络侧与内存证据。' },
];
