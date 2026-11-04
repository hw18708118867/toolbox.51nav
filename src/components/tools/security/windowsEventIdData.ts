// Windows 事件 ID 速查数据
// log     = 表格里显示的日志简称
// channel = 完整 LogName，用于生成查询命令（缺省时取 log）
// level   = 应急响应关注度：高危 / 关注 / 信息

export interface EventItem {
  id: number;
  log: string;
  channel?: string;
  name: string;
  en: string;
  cat: string;
  desc: string;
  tip?: string;
  fields?: string;
  level?: '高危' | '关注' | '信息';
}

export const EVENT_CATEGORIES = [
  '登录与认证',
  '账户与组管理',
  '进程与服务',
  '软件安装与卸载',
  '对象与共享访问',
  '策略与审计',
  '系统启动与关机',
  '远程桌面',
  'PowerShell 与脚本',
  '日志清除与篡改',
  '域控与 Kerberos',
  'Sysmon',
  '其他与排错',
];

const CH = {
  tsLocal: 'Microsoft-Windows-TerminalServices-LocalSessionManager/Operational',
  tsRemote: 'Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational',
  psOp: 'Microsoft-Windows-PowerShell/Operational',
  psClassic: 'Windows PowerShell',
  wmi: 'Microsoft-Windows-WMI-Activity/Operational',
  sysmon: 'Microsoft-Windows-Sysmon/Operational',
  wu: 'Microsoft-Windows-WindowsUpdateClient/Operational',
  appx: 'Microsoft-Windows-AppXDeploymentServer/Operational',
  appxPkg: 'Microsoft-Windows-AppXPackaging/Operational',
};

export const EVENT_ITEMS: EventItem[] = [
  // ── 登录与认证（Security）──
  { id: 4624, log: 'Security', cat: '登录与认证', name: '登录成功', en: 'An account was successfully logged on', level: '关注', desc: '记录每次成功登录，含登录类型、源 IP、目标账户，是排查横向移动的第一入口', fields: 'TargetUserName / LogonType / IpAddress / WorkstationName / ProcessName', tip: '重点看 LogonType=3（SMB/psexec/wmic 网络登录）与 10（RDP），以及非工作时段、陌生源 IP、异常账户' },
  { id: 4625, log: 'Security', cat: '登录与认证', name: '登录失败', en: 'An account failed to log on', level: '关注', desc: '暴力破解、密码喷洒、口令猜测的直接证据', fields: 'TargetUserName / LogonType / IpAddress / Status / SubStatus', tip: 'Status 0xC000006D 为用户名或密码错误，0xC0000234 为账户已锁定；短时间大量 4625 基本可判爆破' },
  { id: 4634, log: 'Security', cat: '登录与认证', name: '注销成功', en: 'An account was logged off', level: '信息', desc: '会话结束，配合 4624 可还原一次登录的完整时长', tip: '与 4647 的区别：4634 是会话被系统结束，4647 是用户主动点注销' },
  { id: 4647, log: 'Security', cat: '登录与认证', name: '用户主动注销', en: 'User initiated logoff', level: '信息', desc: '用户主动发起注销，常用于判断是否是人为操作' },
  { id: 4648, log: 'Security', cat: '登录与认证', name: '使用显式凭据登录', en: 'A logon was attempted using explicit credentials', level: '高危', desc: 'runas /netonly、psexec、映射网络驱动器时使用他人凭据，横向移动强 Indicator', fields: 'SubjectUserName / TargetUserName / TargetServerName / ProcessName / IpAddress', tip: '结合 4624 的 LogonType=9 判断凭据替换；关注来自非管理员主机、指向多台机器的 4648' },
  { id: 4672, log: 'Security', cat: '登录与认证', name: '特殊权限已分配', en: 'Special privileges assigned to new logon', level: '关注', desc: '高权限账户登录，通常紧随 4624 出现，可用于快速定位管理员会话', fields: 'SubjectUserName / PrivilegeList', tip: '普通账号出现 SeDebugPrivilege、SeTakeOwnershipPrivilege、SeLoadDriverPrivilege 需重点核查' },
  { id: 4649, log: 'Security', cat: '登录与认证', name: '检测到重放攻击', en: 'A replay attack was detected', level: '高危', desc: 'Kerberos / NTLM 凭据被重放，可能对应 Pass-the-Hash、Pass-the-Ticket', tip: '一旦出现应立刻排查同时间段的 4624、4768、4769' },
  { id: 4778, log: 'Security', cat: '登录与认证', name: '会话重新连接', en: 'A session was reconnected to a Window Station', level: '信息', desc: '常见于 RDP 断开后重连，可辅助判断攻击者在主机上的停留时长' },
  { id: 4779, log: 'Security', cat: '登录与认证', name: '会话断开', en: 'A session was disconnected from a Window Station', level: '信息', desc: '会话断开（未注销），RDP 场景下常与 4778 成对出现' },
  { id: 4800, log: 'Security', cat: '登录与认证', name: '工作站已锁定', en: 'The workstation was locked', level: '信息', desc: '锁屏事件，可用于还原人员操作时间线' },
  { id: 4801, log: 'Security', cat: '登录与认证', name: '工作站已解锁', en: 'The workstation was unlocked', level: '信息', desc: '解锁事件，配合 4800 使用' },

  // ── 账户与组管理（Security）──
  { id: 4720, log: 'Security', cat: '账户与组管理', name: '创建用户账户', en: 'A user account was created', level: '高危', desc: '新建账户，最常见的后门账户手法', fields: 'SubjectUserName / TargetUserName / SamAccountName', tip: '核对创建者与账户命名规律（如结尾带 $、仿冒系统名），并检查是否随后被加入管理员组' },
  { id: 4722, log: 'Security', cat: '账户与组管理', name: '启用用户账户', en: 'A user account was enabled', level: '关注', desc: '启用原本禁用的账户，Guest、Administrator 被启用尤其可疑' },
  { id: 4723, log: 'Security', cat: '账户与组管理', name: '尝试更改账户密码', en: "An attempt was made to change an account's password", level: '信息', desc: '用户自己改密码（需知道旧密码）' },
  { id: 4724, log: 'Security', cat: '账户与组管理', name: '尝试重置账户密码', en: "An attempt was made to reset an account's password", level: '关注', desc: '管理员强制重置他人密码，可能是账户接管或持久化', tip: '与 4723 区分：4724 不需要原密码，攻击者拿到管理员权限后常用' },
  { id: 4725, log: 'Security', cat: '账户与组管理', name: '禁用用户账户', en: 'A user account was disabled', level: '信息', desc: '禁用账户，有时用于干扰正常运维' },
  { id: 4726, log: 'Security', cat: '账户与组管理', name: '删除用户账户', en: 'A user account was deleted', level: '关注', desc: '删除账户，常见于痕迹清理' },
  { id: 4728, log: 'Security', cat: '账户与组管理', name: '成员加入全局组', en: 'A member was added to a security-enabled global group', level: '关注', desc: '域全局组变更，如加入 Domain Admins 的间接路径', fields: 'MemberName / TargetUserName / SubjectUserName' },
  { id: 4732, log: 'Security', cat: '账户与组管理', name: '成员加入本地组', en: 'A member was added to a security-enabled local group', level: '高危', desc: '本地组提权的关键事件，加入 Administrators、Remote Desktop Users 等于直接拿到权限', fields: 'MemberName / TargetUserName / SubjectUserName', tip: '重点看 TargetUserName 是否为 Administrators / Remote Desktop Users / Backup Operators' },
  { id: 4735, log: 'Security', cat: '账户与组管理', name: '本地组属性变更', en: 'A security-enabled local group was changed', level: '关注', desc: '本地组本身属性被修改' },
  { id: 4737, log: 'Security', cat: '账户与组管理', name: '全局组属性变更', en: 'A security-enabled global group was changed', level: '关注', desc: '域全局组属性被修改' },
  { id: 4738, log: 'Security', cat: '账户与组管理', name: '用户账户已更改', en: 'A user account was changed', level: '关注', desc: '账户属性变更，含 UserAccountControl、SPN 等字段', tip: '攻击者为普通账号添加 SPN 以便 Kerberoasting；关注 ServicePrincipalName 字段变化' },
  { id: 4740, log: 'Security', cat: '账户与组管理', name: '用户账户被锁定', en: 'A user account was locked out', level: '关注', desc: '口令爆破或密码喷洒常导致批量锁定', fields: 'TargetUserName / CallerComputerName' },
  { id: 4756, log: 'Security', cat: '账户与组管理', name: '成员加入通用组', en: 'A member was added to a security-enabled universal group', level: '关注', desc: '域通用组成员变更，可影响跨域权限' },
  { id: 4741, log: 'Security', cat: '账户与组管理', name: '创建计算机账户', en: 'A computer account was created', level: '关注', desc: '域内新增机器账户，常被用于 Kerberoasting 或基于资源的约束委派攻击', tip: '默认域用户也能创建最多 10 个机器账户，需关注非管理员创建的记录' },
  { id: 4742, log: 'Security', cat: '账户与组管理', name: '计算机账户已更改', en: 'A computer account was changed', level: '关注', desc: '计算机账户属性变更，含 msDS-AllowedToActOnBehalfOfOtherIdentity（委派后门）' },
  { id: 4767, log: 'Security', cat: '账户与组管理', name: '用户账户已解锁', en: 'A user account was unlocked', level: '信息', desc: '管理员解锁被锁定的账户' },
  { id: 4798, log: 'Security', cat: '账户与组管理', name: '枚举本地组成员', en: "A user's local group membership was enumerated", level: '信息', desc: '常伴随 net localgroup administrators / net group 等侦察命令' },

  // ── 进程与服务 ──
  { id: 4688, log: 'Security', cat: '进程与服务', name: '创建新进程', en: 'A new process has been created', level: '关注', desc: '应急响应最核心的进程来源，开启「审核进程创建」并勾选命令行后可看到完整 CommandLine', fields: 'NewProcessName / CommandLine / ParentProcessName / SubjectUserName / TokenElevationType', tip: '关注 powershell -enc、cmd /c、wscript、mshta、rundll32、regsvr32、certutil、bitsadmin 等；父进程异常（如 IIS w3wp 起 cmd）是 WebShell 强信号' },
  { id: 4689, log: 'Security', cat: '进程与服务', name: '进程已退出', en: 'A process has exited', level: '信息', desc: '进程结束，配合 4688 计算进程存活时长' },
  { id: 4697, log: 'Security', cat: '进程与服务', name: '安装服务', en: 'A service was installed in the system', level: '高危', desc: 'Security 日志中的服务安装记录（需开启对应审计子类别）', fields: 'ServiceName / ServiceFileName / SubjectUserName', tip: '与 System 日志的 7045 交叉验证' },
  { id: 4698, log: 'Security', cat: '进程与服务', name: '创建计划任务', en: 'A scheduled task was created', level: '高危', desc: '最常见的持久化手法之一，事件里直接带任务 XML 内容', fields: 'TaskName / TaskContent / SubjectUserName', tip: '重点读 TaskContent 里的 <Command> 与 <Arguments>，以及触发器时间' },
  { id: 4699, log: 'Security', cat: '进程与服务', name: '删除计划任务', en: 'A scheduled task was deleted', level: '关注', desc: '任务被删除，常见于痕迹清理' },
  { id: 4700, log: 'Security', cat: '进程与服务', name: '启用计划任务', en: 'A scheduled task was enabled', level: '关注', desc: '原本禁用的任务被启用' },
  { id: 4702, log: 'Security', cat: '进程与服务', name: '更新计划任务', en: 'A scheduled task was updated', level: '高危', desc: '篡改已有的正常任务来隐藏恶意命令，比新建任务更隐蔽', tip: '关注系统自带任务被修改，对比 TaskContent 前后的命令行' },
  { id: 7045, log: 'System', cat: '进程与服务', name: '系统已安装服务', en: 'A service was installed in the system', level: '高危', desc: 'PsExec、Metasploit、勒索软件落地服务的经典痕迹，默认即记录', fields: 'ServiceName / ServiceFileName / ServiceType / ServiceStartType', tip: '看 ServiceFileName 是否指向临时目录、用户目录或可疑 exe；结合随机服务名判断' },
  { id: 7036, log: 'System', cat: '进程与服务', name: '服务状态变更', en: 'The service entered the running or stopped state', level: '信息', desc: '服务启动/停止，可用于还原服务执行时间线' },
  { id: 7040, log: 'System', cat: '进程与服务', name: '服务启动类型变更', en: 'The start type of the service was changed', level: '关注', desc: '服务被改为自动启动 / 禁用，可用于持久化或关闭防护软件' },
  { id: 7034, log: 'System', cat: '进程与服务', name: '服务意外终止', en: 'The service terminated unexpectedly', level: '关注', desc: '服务崩溃，安全软件被强制结束时常出现' },
  { id: 7023, log: 'System', cat: '进程与服务', name: '服务因错误终止', en: 'The service terminated with the following error', level: '关注', desc: '服务报错退出，含错误码' },

  // ── 软件安装与卸载 ──
  { id: 1033, log: 'Application', cat: '软件安装与卸载', name: 'MSI 产品安装成功', en: 'Windows Installer installed the product', level: '关注', desc: 'Windows Installer 安装了一个产品，消息里直接带产品名、版本、语言与安装状态，是查「装了什么软件」最常用的一条', fields: 'Product Name / Product Version / Product Language / Installation success or error status', tip: '来源为 MsiInstaller。只覆盖 MSI 类安装包，绿色软件、自解压 exe、脚本投递不产生此事件，需配合 4688、Sysmon 1/11、卸载注册表项与 Amcache 一起还原' },
  { id: 1034, log: 'Application', cat: '软件安装与卸载', name: 'MSI 产品卸载', en: 'Windows Installer removed the product', level: '关注', desc: 'Windows Installer 卸载了一个产品，含产品名与卸载状态', fields: 'Product Name / Product Version / Removal success or error status', tip: '攻击者清理工具或植入物后会留下卸载记录；也可反推某软件是否在事件时间线之前被移除' },
  { id: 1035, log: 'Application', cat: '软件安装与卸载', name: 'MSI 产品重新配置', en: 'Windows Installer reconfigured the product', level: '信息', desc: '修复安装、更改安装选项或应用变换时产生', fields: 'Product Name / Product Version / Reconfiguration success or error status' },
  { id: 1022, log: 'Application', cat: '软件安装与卸载', name: 'MSI 产品更新安装成功', en: 'Product - Update installed successfully', level: '信息', desc: '某个产品的 MSP 更新 / 小补丁安装成功' },
  { id: 1023, log: 'Application', cat: '软件安装与卸载', name: 'MSI 产品更新安装失败', en: 'Product - Update could not be installed', level: '信息', desc: '产品更新安装失败，消息里带错误码与详细日志文件路径' },
  { id: 11707, log: 'Application', cat: '软件安装与卸载', name: '安装操作成功完成', en: 'Installation operation completed successfully', level: '关注', desc: 'Windows Installer 一次安装操作整体成功，常与 1033 成对出现', tip: '一次安装通常同时有 11707 与 1033：用 1033 拿产品名和版本，用 11707 拿操作结论' },
  { id: 11708, log: 'Application', cat: '软件安装与卸载', name: '安装操作失败', en: 'Installation operation failed', level: '关注', desc: '安装操作失败，消息带产品信息与错误码', tip: '反复失败后突然成功，可能是权限提升成功或载荷换了安装方式重试' },
  { id: 11724, log: 'Application', cat: '软件安装与卸载', name: '卸载操作完成', en: 'Product removal completed', level: '关注', desc: 'Windows Installer 产品移除（卸载）操作完成' },
  { id: 19, log: 'WUClient', channel: CH.wu, cat: '软件安装与卸载', name: '补丁安装成功', en: 'Installation successful: Windows successfully installed the following update', level: '信息', desc: 'Windows Update 成功装上一个更新，消息里含更新标题 / KB 号', fields: 'update title / KB number', tip: '用于确认某个补丁是否真的落地，可配合 Windows 补丁漏洞审计工具判断补丁缺失情况' },
  { id: 20, log: 'WUClient', channel: CH.wu, cat: '软件安装与卸载', name: '补丁安装失败', en: 'Installation failure: Windows failed to install the following update', level: '关注', desc: '更新安装失败，含错误码与更新标题 / KB 号', fields: 'error code / update title' },
  { id: 21, log: 'WUClient', channel: CH.wu, cat: '软件安装与卸载', name: '需要重启以完成安装', en: 'Reboot required to complete the installation', level: '信息', desc: '补丁已安装但必须重启才生效，重启前不会再搜索或下载新更新' },
  { id: 23, log: 'WUClient', channel: CH.wu, cat: '软件安装与卸载', name: '补丁卸载成功', en: 'Uninstallation successful: Windows successfully uninstalled the following update', level: '关注', desc: '已安装的更新被卸载，攻击者可能借此回退安全补丁恢复可利用漏洞', tip: '非运维时段出现补丁卸载应重点核查，并立即复核该 KB 对应的漏洞' },
  { id: 24, log: 'WUClient', channel: CH.wu, cat: '软件安装与卸载', name: '补丁卸载失败', en: 'Uninstallation failure: Windows failed to uninstall the following update', level: '信息', desc: '更新卸载失败，含错误码与更新标题' },
  { id: 400, log: 'AppXDeploy', channel: CH.appx, cat: '软件安装与卸载', name: 'AppX / MSIX 包部署操作', en: 'AppX Deployment package deployment operation', level: '关注', desc: 'Microsoft Store 或侧载的 AppX / MSIX 包部署记录，含包全名与部署结果；部署失败也会记录', fields: 'PackageFullName / Deployment operation / ErrorCode', tip: '重点看 Full Trust（完全信任）包与非商店来源的侧载包，是 MSIX 武器化载荷的常见落地点' },
  { id: 171, log: 'AppXPkg', channel: CH.appxPkg, cat: '软件安装与卸载', name: 'MSIX 包被读取 / 双击', en: 'The reader was created successfully for app package', level: '关注', desc: '用户双击或系统读取过一个 MSIX 包，即使最终没装成功也会留痕', fields: 'PackageFullName', tip: 'AppXDeployment 里没有安装记录时，这个通道能补上「包文件确实到过这台主机」的证据' },

  // ── 对象与共享访问 ──
  { id: 4656, log: 'Security', cat: '对象与共享访问', name: '请求对象句柄', en: 'A handle to an object was requested', level: '信息', desc: '进程申请访问文件/注册表等对象，需开启对象访问审计', fields: 'ObjectName / AccessMask / ProcessName / SubjectUserName' },
  { id: 4663, log: 'Security', cat: '对象与共享访问', name: '尝试访问对象', en: 'An attempt was made to access an object', level: '关注', desc: '敏感文件/目录被读写，配合 SACL 使用', tip: '通过 AccessMask 判断是读取还是写入/删除；对 Web 目录、启动目录、SAM/NTDS.dit 位置重点审计' },
  { id: 4660, log: 'Security', cat: '对象与共享访问', name: '对象已删除', en: 'An object was deleted', level: '关注', desc: '文件被删除，痕迹清理或勒索加密的辅助证据' },
  { id: 4670, log: 'Security', cat: '对象与共享访问', name: '对象权限已更改', en: 'Permissions on an object were changed', level: '关注', desc: '文件/注册表 ACL 被修改，可用于隐藏后门或赋予Everyone权限' },
  { id: 5140, log: 'Security', cat: '对象与共享访问', name: '访问网络共享', en: 'A network share object was accessed', level: '关注', desc: 'SMB 共享被访问，横向移动侦察与文件投递的证据', fields: 'ShareName / ShareLocalPath / IpAddress / SubjectUserName', tip: '关注 C$、ADMIN$、IPC$ 被非运维主机访问' },
  { id: 5145, log: 'Security', cat: '对象与共享访问', name: '检查共享访问权限', en: 'A network share object was checked to see whether client can be granted desired access', level: '关注', desc: '短时间内大量 5145 通常意味着共享枚举 / 文件批量扫描（勒索软件常见）', fields: 'ShareName / RelativeTargetName / IpAddress / AccessMask' },
  { id: 5142, log: 'Security', cat: '对象与共享访问', name: '添加网络共享', en: 'A network share object was added', level: '关注', desc: '新建共享，可能为数据外传或横向移动做准备' },
  { id: 5144, log: 'Security', cat: '对象与共享访问', name: '删除网络共享', en: 'A network share object was deleted', level: '关注', desc: '共享被删除，痕迹清理' },

  // ── 策略与审计 ──
  { id: 4719, log: 'Security', cat: '策略与审计', name: '系统审计策略已更改', en: 'System audit policy was changed', level: '高危', desc: '攻击者关闭审计以隐藏后续动作，是很强的入侵 Indicator', fields: 'SubjectUserName / CategoryId / SubcategoryId / AuditPolicyChanges', tip: '关注由非预期管理员发起、或批量关闭多个子类别的变更；变更后日志量骤降尤其可疑' },
  { id: 4907, log: 'Security', cat: '策略与审计', name: '对象审核设置已更改', en: 'Auditing settings on object were changed', level: '关注', desc: '文件或注册表对象的 SACL 被改，用于让敏感操作不再留痕' },
  { id: 4704, log: 'Security', cat: '策略与审计', name: '分配用户权限', en: 'A user right was assigned', level: '关注', desc: '为账户授予特权，如 SeDebugPrivilege、SeRemoteInteractiveLogonRight、SeLoadDriverPrivilege' },
  { id: 4705, log: 'Security', cat: '策略与审计', name: '移除用户权限', en: 'A user right was removed', level: '信息', desc: '账户特权被移除' },
  { id: 4739, log: 'Security', cat: '策略与审计', name: '域策略已更改', en: 'Domain Policy was changed', level: '关注', desc: '域级密码策略/锁定策略/ Kerberos 策略被修改', tip: '密码长度被调小、锁定阈值被取消，常为爆破做准备' },
  { id: 4902, log: 'Security', cat: '策略与审计', name: '创建每用户审核策略表', en: 'The Per-user audit policy table was created', level: '信息', desc: '高级审计策略生效时产生，本身不代表恶意' },

  // ── 系统启动与关机 ──
  { id: 4608, log: 'Security', cat: '系统启动与关机', name: 'Windows 正在启动', en: 'Windows is starting up', level: '信息', desc: 'Security 日志中的开机标记' },
  { id: 4609, log: 'Security', cat: '系统启动与关机', name: 'Windows 正在关闭', en: 'Windows is shutting down', level: '信息', desc: 'Security 日志中的关机标记' },
  { id: 6005, log: 'System', cat: '系统启动与关机', name: '事件日志服务已启动', en: 'The Event log service was started', level: '信息', desc: '最常用的开机时间点标记', tip: '与 6006 配对可快速还原开机/关机时间线，判断入侵期间的重启行为' },
  { id: 6006, log: 'System', cat: '系统启动与关机', name: '事件日志服务已停止', en: 'The Event log service was stopped', level: '关注', desc: '正常关机标记；出现在非计划时间需关注' },
  { id: 6008, log: 'System', cat: '系统启动与关机', name: '上次关机意外', en: 'The previous system shutdown was unexpected', level: '关注', desc: '意外断电、强制重启、系统崩溃，勒索软件或内核攻击常留下此记录' },
  { id: 1074, log: 'System', cat: '系统启动与关机', name: '用户/进程发起关机或重启', en: 'The process has initiated the restart / shutdown of computer', level: '关注', desc: '能直接看到是谁、以什么理由发起重启，横向移动与勒索投递阶段常出现', fields: 'param1 (进程) / param5 (原因) / param7 (用户)' },
  { id: 41, log: 'System', cat: '系统启动与关机', name: 'Kernel-Power 意外断电', en: 'The system has rebooted without cleanly shutting down first', level: '关注', desc: 'Critical 级别，非正常重启' },
  { id: 1001, log: 'System', cat: '系统启动与关机', name: '蓝屏 BugCheck', en: 'The computer has rebooted from a bugcheck', level: '信息', desc: '含 BugcheckCode 与 dump 路径，内核利用失败时可出现' },

  // ── 远程桌面 ──
  { id: 1149, log: 'TS-RemoteConnectionManager', channel: CH.tsRemote, cat: '远程桌面', name: 'RDP 用户认证成功', en: 'Remote Desktop Services: User authentication succeeded', level: '关注', desc: 'RDP 连接前置认证，能看到源 IP，即使 Security 日志被清也可能保留', fields: 'User / Domain / Source Network Address', tip: '与安全日志的 4624 LogonType=10 交叉验证，是最可靠的 RDP 来源 IP 证据之一' },
  { id: 21, log: 'TS-LocalSessionManager', channel: CH.tsLocal, cat: '远程桌面', name: 'RDP 会话登录成功', en: 'Remote Desktop Services: Session logon succeeded', level: '关注', desc: '会话真正建立，含账户与会话 ID', fields: 'User / SessionID / Address' },
  { id: 22, log: 'TS-LocalSessionManager', channel: CH.tsLocal, cat: '远程桌面', name: 'RDP Shell 启动通知', en: 'Remote Desktop Services: Shell start notification received', level: '信息', desc: '桌面 Shell 启动，说明会话已可用' },
  { id: 23, log: 'TS-LocalSessionManager', channel: CH.tsLocal, cat: '远程桌面', name: 'RDP 会话注销成功', en: 'Remote Desktop Services: Session logoff succeeded', level: '信息', desc: '会话正常注销' },
  { id: 24, log: 'TS-LocalSessionManager', channel: CH.tsLocal, cat: '远程桌面', name: 'RDP 会话已断开', en: 'Remote Desktop Services: Session has been disconnected', level: '信息', desc: '会话断开但未注销' },
  { id: 25, log: 'TS-LocalSessionManager', channel: CH.tsLocal, cat: '远程桌面', name: 'RDP 会话重新连接', en: 'Remote Desktop Services: Session reconnection succeeded', level: '关注', desc: '断线重连，配合 21/24 可推算攻击者在主机上的停留时长' },

  // ── PowerShell 与脚本 ──
  { id: 4104, log: 'PowerShell/Operational', channel: CH.psOp, cat: 'PowerShell 与脚本', name: '脚本块日志', en: 'PowerShell Script Block Logging', level: '高危', desc: '记录实际执行的脚本内容（含 Base64 解码后的原文），应急响应中最有价值的单一事件', fields: 'ScriptBlockText / Path / MessageNumber / MessageTotal', tip: '需开启「PowerShell 脚本块日志记录」；搜索 -enc、FromBase64String、IEX、Invoke-Expression、DownloadString、Add-Type' },
  { id: 4103, log: 'PowerShell/Operational', channel: CH.psOp, cat: 'PowerShell 与脚本', name: '模块日志', en: 'PowerShell Module Logging', level: '关注', desc: '记录管道执行细节与调用的命令/参数', fields: 'ContextInfo / Payload / CommandLine' },
  { id: 400, log: 'Windows PowerShell', channel: CH.psClassic, cat: 'PowerShell 与脚本', name: 'PowerShell 引擎启动', en: 'Engine state is changed from None to Available', level: '关注', desc: '即使没开 4104，此事件也能证明 PowerShell 被运行过，含 HostApplication', fields: 'HostApplication / HostName / EngineVersion', tip: '关注 HostApplication 里带的 -EncodedCommand、-nop、-w hidden、ExecutionPolicy Bypass' },
  { id: 403, log: 'Windows PowerShell', channel: CH.psClassic, cat: 'PowerShell 与脚本', name: 'PowerShell 引擎停止', en: 'Engine state is changed from Available to Stopped', level: '信息', desc: 'PowerShell 会话结束，配合 400 计算执行时长' },
  { id: 800, log: 'Windows PowerShell', channel: CH.psClassic, cat: 'PowerShell 与脚本', name: '管道执行细节', en: 'Pipeline Execution Details', level: '关注', desc: '旧版 PowerShell 的命令执行记录（v2 常见）', tip: 'PowerShell v2 不产生 4104，降级攻击排查要看这里' },
  { id: 5857, log: 'WMI-Activity', channel: CH.wmi, cat: 'PowerShell 与脚本', name: 'WMI 提供程序已启动', en: 'WMI provider started', level: '信息', desc: 'WMI 活动开始，wmic / Invoke-WmiMethod 横向移动会留下', fields: 'ProviderName / ProcessID / HostProcess' },
  { id: 5858, log: 'WMI-Activity', channel: CH.wmi, cat: 'PowerShell 与脚本', name: 'WMI 操作错误', en: 'WMI operation failed', level: '关注', desc: '含调用方进程、用户与错误码，可暴露失败的横向移动尝试', fields: 'Operation / User / ClientMachine / PossibleCause' },

  // ── 日志清除与篡改 ──
  { id: 1100, log: 'Security', cat: '日志清除与篡改', name: '事件日志服务已关闭', en: 'The event logging service has shut down', level: '高危', desc: '日志服务被停止，常伴随清日志或日志替换攻击', tip: '与 1102、6006 一起看，区分正常关机与人为停服务' },
  { id: 1102, log: 'Security', cat: '日志清除与篡改', name: '安全日志已清除', en: 'The audit log was cleared', level: '高危', desc: '最明确的痕迹清理证据，事件本身会记录是谁清的', fields: 'SubjectUserName / SubjectDomainName / LogIsBeingCleared', tip: '第一时间保全其他通道（RDP、PowerShell、Sysmon）与内存/磁盘镜像，攻击者常只清 Security 日志' },
  { id: 104, log: 'System', cat: '日志清除与篡改', name: '日志文件已清除', en: 'The log file was cleared', level: '高危', desc: 'System / Application 日志被清空', fields: 'Channel / SubjectUserName' },

  // ── 域控与 Kerberos ──
  { id: 4768, log: 'Security', cat: '域控与 Kerberos', name: 'Kerberos TGT 请求', en: 'A Kerberos authentication ticket (TGT) was requested', level: '信息', desc: '域登录起点，记录在域控上，黄金票据排查入口', fields: 'TargetUserName / IpAddress / TicketEncryptionType / Status', tip: '关注 TicketEncryptionType=0x17 (RC4) 与无对应 4768 却出现的 4769（伪造票据）' },
  { id: 4769, log: 'Security', cat: '域控与 Kerberos', name: 'Kerberos 服务票据请求', en: 'A Kerberos service ticket was requested', level: '关注', desc: 'Kerberoasting 重点：单一主机短时间内请求大量不同 ServiceName 的服务票据', fields: 'ServiceName / TargetUserName / TicketEncryptionType / IpAddress', tip: '重点看 RC4 (0x17) 加密 + 大量不同 SPN + 来自普通用户主机' },
  { id: 4770, log: 'Security', cat: '域控与 Kerberos', name: 'Kerberos 服务票据续订', en: 'A Kerberos service ticket was renewed', level: '信息', desc: '票据续订，长时间票据活动可辅助判断持久化' },
  { id: 4771, log: 'Security', cat: '域控与 Kerberos', name: 'Kerberos 预认证失败', en: 'Kerberos pre-authentication failed', level: '关注', desc: '域账号爆破与 Kerberos 用户枚举的痕迹', fields: 'TargetUserName / IpAddress / FailureCode / PreAuthType', tip: 'FailureCode 0x18 为密码错误，0x12 为账户禁用/过期；短时间大量 = 密码喷洒' },
  { id: 4776, log: 'Security', cat: '域控与 Kerberos', name: 'NTLM 凭据验证', en: 'The computer attempted to validate the credentials for an account', level: '关注', desc: '域控上记录 NTLM 认证，Pass-the-Hash 与 NTLM 爆破的排查入口', fields: 'TargetUserName / Workstation / Status', tip: '关注来自异常主机的大量成功/失败验证；Status 0xC000006A 为密码错误' },
  { id: 4662, log: 'Security', cat: '域控与 Kerberos', name: '目录服务对象操作', en: 'An operation was performed on an object', level: '高危', desc: 'DCSync 的关键 Indicator：非域控机器请求目录复制权限', fields: 'SubjectUserName / ObjectServer / AccessMask / Properties', tip: '关注 AccessMask 含 DS-Replication-Get-Changes / Get-Changes-All，且发起者不是 DC 机器账户或同步服务账号' },
  { id: 5136, log: 'Security', cat: '域控与 Kerberos', name: '目录服务对象已修改', en: 'A directory service object was modified', level: '高危', desc: 'AD 对象属性变更（GPO、ACL、SIDHistory、SPN），DCShadow / 权限持久化排查重点', fields: 'SubjectUserName / ObjectDN / AttributeLDAPDisplayName / AttributeValue', tip: '关注 AdminSDHolder、SIDHistory、msDS-AllowedToActOnBehalfOfOtherIdentity、GPO 链接被改' },
  { id: 5137, log: 'Security', cat: '域控与 Kerberos', name: '目录服务对象已创建', en: 'A directory service object was created', level: '关注', desc: '新建 AD 对象，如新增 GPO、用户、组织单位' },
  { id: 5141, log: 'Security', cat: '域控与 Kerberos', name: '目录服务对象已删除', en: 'A directory service object was deleted', level: '关注', desc: 'AD 对象被删，痕迹清理或破坏' },

  // ── Sysmon ──
  { id: 1, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '进程创建', en: 'Process Create', level: '关注', desc: '含完整命令行、文件哈希、父进程、进程 GUID，比 4688 更详细', fields: 'Image / CommandLine / ParentImage / Hashes / User / ProcessGuid' },
  { id: 2, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '文件创建时间被篡改', en: 'File creation time changed', level: '高危', desc: 'Timestomping：攻击者修改文件时间戳伪装成系统老文件', fields: 'TargetFilename / CreationUtcTime / PreviousCreationUtcTime' },
  { id: 3, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '网络连接', en: 'Network connection detected', level: '关注', desc: '记录进程发起的每一条连接（源/目的 IP、端口、协议）', fields: 'Image / SourceIp / DestinationIp / DestinationPort / User', tip: '外连 C2、内网横向扫描、异常端口回连都从这里看' },
  { id: 4, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: 'Sysmon 服务状态变更', en: 'Sysmon service state changed', level: '关注', desc: '服务被停止或配置重载，攻击者常先停 Sysmon 再动手', tip: '出现 State=Stopped 应视为高危信号' },
  { id: 5, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '进程终止', en: 'Process terminated', level: '信息', desc: '配合事件 1 计算进程存活时长' },
  { id: 6, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '驱动程序已加载', en: 'Driver loaded', level: '关注', desc: 'BYOVD（自带易受攻击驱动）攻击、EDR 致盲的排查点', fields: 'ImageLoaded / Hashes / Signature / Signed' },
  { id: 7, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '映像已加载', en: 'Image loaded', level: '关注', desc: '进程加载的 DLL，可发现 DLL 侧加载与 LSASS 凭据窃取插件', tip: '关注 lsass.exe 加载非系统 DLL（如 dbghelp、mimidrv 相关）' },
  { id: 8, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: 'CreateRemoteThread', en: 'CreateRemoteThread detected', level: '高危', desc: '经典进程注入手法，跨进程创建远程线程', fields: 'SourceImage / TargetImage / StartAddress / StartModule' },
  { id: 9, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: 'RawAccessRead', en: 'RawAccessRead detected', level: '关注', desc: '绕过文件系统直接读磁盘，常用于读取 SAM / NTDS.dit' },
  { id: 10, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '进程访问', en: 'Process accessed', level: '高危', desc: '访问 lsass.exe 抓取凭据的关键 Indicator（mimikatz / procdump）', fields: 'SourceImage / TargetImage / GrantedAccess / CallTrace', tip: 'TargetImage 为 lsass.exe 且 GrantedAccess 含 0x1010 / 0x1410 / 0x1438 时高度可疑' },
  { id: 11, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '文件创建', en: 'File created', level: '关注', desc: '落盘文件记录，可追踪载荷、WebShell、临时脚本', fields: 'Image / TargetFilename / CreationUtcTime' },
  { id: 12, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '注册表对象创建/删除', en: 'Registry object added or deleted', level: '关注', desc: '注册表键的创建与删除' },
  { id: 13, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '注册表值设置', en: 'Registry value set', level: '高危', desc: 'Run 键、服务、COM 劫持、IFEO 等注册表持久化都从这里看', fields: 'Image / TargetObject / Details', tip: '关注 HKLM\\...\\Run、Image File Execution Options、Services、AppInit_DLLs 等位置' },
  { id: 14, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '注册表键/值重命名', en: 'Registry key or value renamed', level: '关注', desc: '注册表项被重命名，较少见但值得关注' },
  { id: 15, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '文件流创建哈希', en: 'FileCreateStreamHash', level: '信息', desc: '备用数据流 (ADS) 与 Zone.Identifier（MOTW 来源）记录', tip: '可看到下载文件的原始 URL，追踪钓鱼附件来源' },
  { id: 17, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '命名管道创建', en: 'Pipe created', level: '关注', desc: 'C2 通道、凭据窃取、横向移动工具常使用命名管道', fields: 'Image / PipeName' },
  { id: 18, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '命名管道连接', en: 'Pipe connected', level: '关注', desc: '客户端连接到命名管道' },
  { id: 19, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: 'WMI 事件筛选器注册', en: 'WmiEventFilter activity detected', level: '高危', desc: 'WMI 持久化第一步：注册事件筛选器', fields: 'User / EventNamespace / Name / Query' },
  { id: 20, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: 'WMI 事件使用者注册', en: 'WmiEventConsumer activity detected', level: '高危', desc: 'WMI 持久化第二步：注册使用者，通常直接包含恶意命令行', fields: 'Name / Type / Destination', tip: '重点读 CommandLineEventConsumer / ActiveScriptEventConsumer 里的命令' },
  { id: 21, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: 'WMI 使用者绑定筛选器', en: 'WmiEventConsumerToFilter activity detected', level: '高危', desc: 'WMI 订阅正式生效，19+20+21 齐全基本可确认无文件落地后门' },
  { id: 22, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: 'DNS 查询', en: 'Dns query', level: '关注', desc: '进程发起的域名解析，可发现 C2 域名、DGA、DNS 隧道', fields: 'Image / QueryName / QueryResults' },
  { id: 23, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '文件删除（已归档）', en: 'File deleted (archived)', level: '关注', desc: '文件被删除且内容已归档，可用于恢复被清理的载荷' },
  { id: 24, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '剪贴板变更', en: 'Clipboard changed', level: '关注', desc: '剪贴板内容变化，部分窃密木马会记录' },
  { id: 25, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '进程篡改', en: 'Process tampering', level: '高危', desc: 'Process Hollowing / Herpaderping 等进程映像伪装' },
  { id: 26, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: '文件删除（已检测）', en: 'File delete detected', level: '关注', desc: '文件被删除但不归档内容，勒索软件加密/清理时大量出现' },
  { id: 255, log: 'Sysmon', channel: CH.sysmon, cat: 'Sysmon', name: 'Sysmon 错误 / 配置重载', en: 'Sysmon error', level: '信息', desc: '配置重载或驱动报错，可判断审计是否曾被改动' },

  // ── 其他与排错 ──
  { id: 1000, log: 'Application', cat: '其他与排错', name: '应用程序错误', en: 'Application Error', level: '信息', desc: '应用崩溃，含异常代码与出错模块，可辅助判断利用是否失败', fields: 'Application Name / Exception Code / Faulting Module' },
  { id: 1026, log: 'Application', cat: '其他与排错', name: '.NET 运行时未处理异常', en: '.NET Runtime unhandled exception', level: '信息', desc: '.NET 程序崩溃堆栈，部分利用工具会留下' },
];

// 4624 / 4625 里的 LogonType 含义
export const LOGON_TYPES = [
  { type: '0', name: 'System', desc: '系统账户（如 LocalSystem）发起，通常可忽略' },
  { type: '2', name: 'Interactive', desc: '本地控制台 / 键盘交互登录' },
  { type: '3', name: 'Network', desc: '网络登录：SMB 共享、IPC$、psexec、wmic、WinRM、IIS 集成认证' },
  { type: '4', name: 'Batch', desc: '计划任务以批处理方式启动' },
  { type: '5', name: 'Service', desc: '服务以服务账户启动' },
  { type: '7', name: 'Unlock', desc: '解锁已锁定的工作站' },
  { type: '8', name: 'NetworkCleartext', desc: '明文口令的网络登录（如 IIS 基本认证）' },
  { type: '9', name: 'NewCredentials', desc: 'runas /netonly 等凭据替换，本地用原身份、对外用新凭据' },
  { type: '10', name: 'RemoteInteractive', desc: '远程桌面 RDP / 终端服务登录' },
  { type: '11', name: 'CachedInteractive', desc: '域控不可达时用缓存凭据离线登录' },
];

// 常用排查命令（可直接复制）
export const QUICK_COMMANDS = [
  { name: '最近的失败登录（爆破）', cmd: 'wevtutil qe Security /q:"*[System[(EventID=4625)]]" /f:text /c:20' },
  { name: '最近的登录成功', cmd: 'wevtutil qe Security /q:"*[System[(EventID=4624)]]" /f:text /c:20' },
  { name: '管理员 / 特殊权限登录', cmd: 'wevtutil qe Security /q:"*[System[(EventID=4672)]]" /f:text /c:20' },
  { name: '安全日志是否被清空', cmd: 'wevtutil qe Security /q:"*[System[(EventID=1102)]]" /f:text /c:20' },
  { name: '新安装的服务', cmd: 'wevtutil qe System /q:"*[System[(EventID=7045)]]" /f:text /c:20' },
  { name: 'PowerShell 脚本块内容', cmd: 'wevtutil qe Microsoft-Windows-PowerShell/Operational /q:"*[System[(EventID=4104)]]" /f:text /c:20' },
  { name: 'RDP 会话登录记录', cmd: 'wevtutil qe Microsoft-Windows-TerminalServices-LocalSessionManager/Operational /q:"*[System[(EventID=21)]]" /f:text /c:20' },
  { name: '按关键字搜某条事件', cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4624} -MaxEvents 50 | Where-Object { $_.Message -like "*10.0.0.*" } | Format-List TimeCreated, Id, Message' },
  { name: '导出安全日志用于离线分析', cmd: 'wevtutil epl Security C:\\Temp\\Security_backup.evtx' },
  { name: '查看某条事件的完整字段', cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4624} -MaxEvents 1 | Select-Object -ExpandProperty Properties' },
  { name: '查 MSI 软件安装 / 卸载记录', cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Application\'; ProviderName=\'MsiInstaller\'; Id=1033,1034,11707} -MaxEvents 30 | Format-List TimeCreated, Id, Message' },
  { name: '查补丁安装 / 卸载记录', cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Microsoft-Windows-WindowsUpdateClient/Operational\'; Id=19,20,23} -MaxEvents 30 | Format-List TimeCreated, Id, Message' },
  { name: '查 AppX / MSIX 包部署', cmd: 'Get-WinEvent -FilterHashtable @{LogName=\'Microsoft-Windows-AppXDeploymentServer/Operational\'; Id=400} -MaxEvents 30 | Format-List TimeCreated, Message' },
  { name: '补充：查卸载注册表项（含非 MSI 软件）', cmd: 'Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate' },
];
