// Windows 补丁漏洞审计 —— 漏洞数据库 + systeminfo 解析 / 匹配逻辑
//
// 数据来源：微软安全更新指南（MSRC）与各漏洞官方公告。本文件为**精选快照**，
// 仅收录「有公开提权/远程代码执行利用」且**可凭 systeminfo 的补丁(KB)列表判断是否缺失**的
// Windows 操作系统级漏洞（内核 / 打印后台处理 / SMB / CLFS / Win32k 等）。
// 配置类弱点（无引号服务路径、可写服务等）不在本工具范围内，请配合 PowerUp / winpeas 使用。
//
// 字段说明：
//   cve        漏洞编号
//   titleZh    中文名称
//   titleEn    英文名称
//   type       'EoP' 提权 / 'RCE' 远程代码执行
//   exploit    是否存在公开可用利用代码
//   osMatch    命中条件：系统信息中「OS 名称/版本」行需包含其中任一子串（小写比较）
//   buildMin   可选，OS Build 下限（含）；缺省不限制
//   buildMax   可选，OS Build 上限（含）；缺省不限制
//   patchKbs   修复该漏洞的补丁 KB 列表，**任意一个已安装即视为已修补**
//   note       备注（触发条件 / 影响范围）
//   ref        MSRC 参考链接

export type VulnType = 'EoP' | 'RCE';

export interface VulnEntry {
  cve: string;
  titleZh: string;
  titleEn: string;
  type: VulnType;
  exploit: boolean;
  osMatch: string[];
  buildMin?: number;
  buildMax?: number;
  patchKbs: number[];
  note: string;
  ref: string;
}

export const vulnerabilityDb: VulnEntry[] = [
  {
    cve: 'CVE-2021-36934',
    titleZh: 'HiveNightmare / SeriousSAM 权限提升',
    titleEn: 'HiveNightmare / SeriousSAM Privilege Escalation',
    type: 'EoP',
    exploit: true,
    osMatch: ['windows 10', 'windows 11', 'windows server 2019'],
    patchKbs: [5004945, 5004237, 5004238, 5004244, 5004245, 5004253, 5004263, 5004296, 5005043, 5005189],
    note: 'SAM 等注册表配置单元默认 ACL 过宽，普通用户可读出并提取本地账户哈希。影响 Win10 1809–21H1、Server 2019、Win11 21H2。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2021-36934',
  },
  {
    cve: 'CVE-2021-34527',
    titleZh: 'PrintNightmare 打印后台处理程序 RCE',
    titleEn: 'PrintNightmare Print Spooler RCE',
    type: 'RCE',
    exploit: true,
    osMatch: ['windows'],
    patchKbs: [5004945, 5004946, 5004948, 4950621, 5004951, 5004953, 5004954, 5004958, 5004960, 5004237, 5004244, 5004245, 5004238, 5004296, 5004253, 5004263, 5003711, 5003709],
    note: 'Windows 打印后台处理程序远程代码执行，未授权攻击者可借 Spooler 以 SYSTEM 执行任意代码。影响全部受支持 Windows 版本。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2021-34527',
  },
  {
    cve: 'CVE-2022-21999',
    titleZh: 'SpoolFool 打印后台处理程序权限提升',
    titleEn: 'SpoolFool Print Spooler Elevation of Privilege',
    type: 'EoP',
    exploit: true,
    osMatch: ['windows 10', 'windows 11', 'windows server 2019', 'windows server 2022'],
    patchKbs: [5009543, 5009546, 5009554, 5009555, 5009557, 5009566, 5009569, 5009570, 5009595, 5009611],
    note: '利用 Spooler 目录欺骗以 SYSTEM 写文件实现提权。影响 Win10/11 及 Server 2019/2022。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2022-21999',
  },
  {
    cve: 'CVE-2020-0796',
    titleZh: 'SMBGhost / CoronaBlue SMBv3 RCE',
    titleEn: 'SMBGhost / CoronaBlue SMBv3 Remote Code Execution',
    type: 'RCE',
    exploit: true,
    osMatch: ['windows'],
    buildMin: 18362,
    buildMax: 18363,
    patchKbs: [4551762],
    note: 'SMBv3 压缩处理缓冲区溢出，仅影响 Windows 10 / Server 1903 与 1909（Build 18362/18363）。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2020-0796',
  },
  {
    cve: 'CVE-2020-1472',
    titleZh: 'Zerologon Netlogon 权限提升',
    titleEn: 'Zerologon Netlogon Elevation of Privilege',
    type: 'EoP',
    exploit: true,
    osMatch: ['windows server'],
    patchKbs: [4557222, 4556441, 4557446, 4557463, 4557450, 4557453, 4557455, 4557458, 4565349],
    note: '域控 Netlogon 安全通道认证可伪造，攻击者可重置域控机器账户密码、接管整个域。影响全部 Windows Server 域控。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2020-1472',
  },
  {
    cve: 'CVE-2019-0708',
    titleZh: 'BlueKeep 远程桌面服务 RCE',
    titleEn: 'BlueKeep Remote Desktop Services RCE',
    type: 'RCE',
    exploit: true,
    osMatch: ['windows 7', 'windows server 2008'],
    patchKbs: [4499164, 4499175, 4499180, 4499195, 4500331, 4500705, 4500714, 4500745, 4499149, 4499151, 4499153],
    note: '远程桌面服务预身份认证 RCE，可蠕虫化传播。影响 Windows 7 / Server 2008 R2 / 2008（及 XP/2003）。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2019-0708',
  },
  {
    cve: 'CVE-2017-0143',
    titleZh: 'EternalBlue / MS17-010 SMB RCE',
    titleEn: 'EternalBlue / MS17-010 SMB Remote Code Execution',
    type: 'RCE',
    exploit: true,
    osMatch: ['windows 7', 'windows server 2008', 'windows 10', 'windows server 2016'],
    patchKbs: [4012212, 4012213, 4012215, 4012216, 4012217, 4012598, 4012606, 4013429, 4019472, 4019473, 4019474],
    note: 'SMBv1 远程代码执行，WannaCry 利用的漏洞。影响 Win7/2008/2003/XP 及早期 Win10/Server 2016。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2017-0143',
  },
  {
    cve: 'CVE-2021-40444',
    titleZh: 'MSHTML 组件远程代码执行',
    titleEn: 'MSHTML Remote Code Execution',
    type: 'RCE',
    exploit: true,
    osMatch: ['windows 10', 'windows 11', 'windows server 2016', 'windows server 2019'],
    patchKbs: [5005565, 5005566, 5005567, 5005568, 5005569, 5005573, 5005613, 5005621, 5005625, 5005626, 5006696],
    note: '通过特制 Office 文档（ActiveX/cab）触发 MSHTML 远程代码执行。影响 Win10/11 及 Server 2016/2019。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2021-40444',
  },
  {
    cve: 'CVE-2021-31956',
    titleZh: 'Windows 通用日志文件系统(CLFS) 权限提升',
    titleEn: 'Windows Common Log File System (CLFS) Elevation of Privilege',
    type: 'EoP',
    exploit: true,
    osMatch: ['windows 10', 'windows server 2019'],
    patchKbs: [5004237, 5004238, 5004244, 5004245, 5004253, 5004263, 5004296, 5004285, 5004289],
    note: 'CLFS 驱动内存损坏导致内核提权。影响 Win10 / Server 2019 多个版本。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2021-31956',
  },
  {
    cve: 'CVE-2021-40449',
    titleZh: 'Windows CLFS 权限提升',
    titleEn: 'Windows CLFS Elevation of Privilege',
    type: 'EoP',
    exploit: true,
    osMatch: ['windows 10', 'windows 11', 'windows server 2019', 'windows server 2022'],
    patchKbs: [5006670, 5006669, 5006672, 5006685, 5006696, 5006703, 5006714, 5006735],
    note: 'CLFS 权限提升，常被勒索软件用于内核提权。影响 Win10/11 及 Server 2019/2022。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2021-40449',
  },
  {
    cve: 'CVE-2022-24521',
    titleZh: 'Windows CNG 密钥隔离服务权限提升',
    titleEn: 'Windows CNG Key Isolation Service Elevation of Privilege',
    type: 'EoP',
    exploit: true,
    osMatch: ['windows 10', 'windows 11', 'windows server 2019', 'windows server 2022'],
    patchKbs: [5012599, 5012604, 5012625, 5012637, 5012653, 5012666, 5012671, 5012687],
    note: 'CNG 密钥隔离服务提权，可与 NTLM 中继链配合拿下域控。影响 Win10/11 及 Server 2019/2022。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2022-24521',
  },
  {
    cve: 'CVE-2018-8120',
    titleZh: 'Win32k 权限提升',
    titleEn: 'Win32k Elevation of Privilege',
    type: 'EoP',
    exploit: true,
    osMatch: ['windows 7', 'windows server 2008'],
    patchKbs: [4103712, 4103718, 4103725, 4103730, 4103721, 4103715, 4103717],
    note: 'Win32k 空指针解引用内核提权。常被用于从普通用户提到 SYSTEM。影响 Win7 / Server 2008。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2018-8120',
  },
  {
    cve: 'CVE-2019-0803',
    titleZh: 'Win32k 权限提升',
    titleEn: 'Win32k Elevation of Privilege',
    type: 'EoP',
    exploit: true,
    osMatch: ['windows 7', 'windows server 2008'],
    patchKbs: [4493472, 4493448, 4493451, 4493464, 4493470, 4493458, 4493459],
    note: 'Win32k 提权，多个恶意软件家族使用。影响 Win7 / Server 2008。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2019-0803',
  },
  {
    cve: 'CVE-2023-29336',
    titleZh: 'Win32k 权限提升',
    titleEn: 'Win32k Elevation of Privilege',
    type: 'EoP',
    exploit: true,
    osMatch: ['windows 10', 'windows 11', 'windows server 2019', 'windows server 2022'],
    patchKbs: [5027219, 5027230, 5027215, 5027222, 5027231, 5027244, 5027252, 5027269],
    note: 'Win32k 提权，Nokoyawa 等勒索软件使用。影响 Win10/11 及 Server 2019/2022。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2023-29336',
  },
  {
    cve: 'CVE-2022-41073',
    titleZh: 'Windows 打印后台处理程序权限提升',
    titleEn: 'Windows Print Spooler Elevation of Privilege',
    type: 'EoP',
    exploit: true,
    osMatch: ['windows 10', 'windows 11', 'windows server 2019', 'windows server 2022'],
    patchKbs: [5018410, 5018411, 5018419, 5018422, 5018425, 5018428, 5018417, 5018418],
    note: '打印后台处理程序提权，点刻攻击(Point-and-Print)相关。影响 Win10/11 及 Server 2019/2022。',
    ref: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2022-41073',
  },
];

// ───────────────────────── 解析 ─────────────────────────

export interface ParsedSystemInfo {
  osRaw: string;
  osLower: string;
  build: number | null;
  kbs: Set<number>;
  kbCount: number;
}

/** 从 systeminfo 文本中提取 OS 名称、Build 号与已安装的全部 KB。中英文输出均兼容。 */
export function parseSystemInfo(text: string): ParsedSystemInfo {
  const lines = text.split(/\r?\n/);

  // 提取 KB 列表：systeminfo 的“修补程序/热修复/Hotfix(s)”行形如 KB5001234
  const kbs = new Set<number>();
  for (const line of lines) {
    const m = line.match(/KB\s?(\d{5,7})/i);
    if (m) kbs.add(parseInt(m[1], 10));
  }

  // 提取 OS 名称 / 版本行（中英文表头）
  let osRaw = '';
  for (const line of lines) {
    if (/^\s*(OS\s*(名称|Name)|系统名称|System Name)/i.test(line)) {
      const idx = line.indexOf(':');
      if (idx >= 0) { osRaw = line.slice(idx + 1).trim(); break; }
    }
  }
  // 若没匹配到“名称”，退而取含 Microsoft Windows 的那行
  if (!osRaw) {
    for (const line of lines) {
      if (/microsoft windows/i.test(line)) { osRaw = line.trim(); break; }
    }
  }

  // 提取 Build 号：优先 “Build 19041”，其次 “10.0.19041”
  let build: number | null = null;
  const buildMatch = text.match(/Build\s+(\d{4,6})/i) || text.match(/(\d+)\.(\d+)\.(\d{4,6})/);
  if (buildMatch) {
    build = parseInt(buildMatch[buildMatch.length - 1], 10);
  }

  return {
    osRaw,
    osLower: osRaw.toLowerCase(),
    build,
    kbs,
    kbCount: kbs.size,
  };
}

// ───────────────────────── 匹配 ─────────────────────────

export interface AuditResult {
  cve: VulnEntry;
  missingKbs: number[]; // 推荐安装（任意一个即可修复）的补丁
}

/** 判断单条漏洞在当前系统上是否仍“未修补”。 */
function isVulnerable(v: VulnEntry, ctx: ParsedSystemInfo): boolean {
  const osOk = v.osMatch.some((m) => ctx.osLower.includes(m.toLowerCase()));
  if (!osOk) return false;

  if (v.buildMin != null && ctx.build != null && ctx.build < v.buildMin) return false;
  if (v.buildMax != null && ctx.build != null && ctx.build > v.buildMax) return false;

  const patched = v.patchKbs.some((kb) => ctx.kbs.has(kb));
  return !patched;
}

/** 审计：返回所有命中且未修补的漏洞，按“有公开利用”优先、再按类型排序。 */
export function audit(ctx: ParsedSystemInfo, db: VulnEntry[] = vulnerabilityDb): AuditResult[] {
  const hits = db.filter((v) => isVulnerable(v, ctx));
  return hits
    .map((v) => ({ cve: v, missingKbs: v.patchKbs.filter((kb) => !ctx.kbs.has(kb)) }))
    .sort((a, b) => {
      if (a.cve.exploit !== b.cve.exploit) return a.cve.exploit ? -1 : 1;
      return a.cve.cve.localeCompare(b.cve.cve);
    });
}

// 内置数据库快照更新时间（ISO 日期）。用于界面展示，帮助用户判断是否需要更新。
export const DB_UPDATED_DATE = '2026-10-25';

// 默认数据地址：站点同域托管的内置快照 JSON。与 public/windows-patch-audit-db.json 对应。
// 同域请求无跨域问题，部署后必然可达，用户点「一键更新」即可拉取，无需自己找地址。
export const DEFAULT_DB_URL = '/windows-patch-audit-db.json';
