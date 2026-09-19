# Tcpdump 由浅入深：从抓第一个包到企业实战排障

> 本文从一个真实的“数据库连不上”凌晨排障现场讲起，系统讲透 tcpdump 的安装与基础命令、每一列输出的含义、BPF 表达式怎么写，并手把手演示如何逐字段分析抓包输出，以及企业中在故障排查、性能分析、安全自查与容器网络里的真实用法。
>
> 如果对你有帮助，欢迎 **点赞 + 收藏**。完整可交互版本（含动画演示与在线命令生成器）见文末原文链接。

## 一次"数据库连不上"的凌晨

去年有天凌晨，一个服务突然连不上同机房的另一台数据库，应用日志只报 `connect timeout`，但两台机器互相 `ping` 都通、防火墙规则看着也没动过。我在应用服务器上敲了一行：

```bash
sudo tcpdump -i any -nn host 10.20.3.15 and tcp port 3306
```

盯着输出看了十秒就明白了：来自应用的 `SYN` 包一直在往外发，但从来没收到回包——说明包压根没到数据库那一侧，是被中间某个东西（后来定位是交换机上一条误配的 ACL）悄悄丢了。应用层和 `ping` 都看不出这点，但 tcpdump 一眼就现了原形。

这篇就把 tcpdump 从"怎么抓第一个包"到"企业里到底怎么用"完整讲透。它和 [Wireshark](https://toolbox.51nav.com/tools/security/wireshark) 一样，只用于你**有权限、有授权**管理的网络与主机。

## tcpdump 到底能干什么

一句话：它是 Linux/Unix 上最经典的**命令行抓包工具**，底层基于 `libpcap`，直接从网卡把每一个原始数据包抓下来，可以按规则过滤、打印到屏幕，或存成 `.pcap` 文件。

和 Wireshark 的区别很关键：Wireshark 是带 GUI 的"显微镜"，适合在本地慢慢分析；**tcpdump 是无图形界面服务器的"手术刀"**——线上机器大多没有桌面环境，你只能 SSH 上去敲命令。实际工作中两者常配合：tcpdump 在服务器上 `-w` 抓成文件，下载到本地用 Wireshark 的 Follow Stream 慢慢看。

## 基础使用方法

### 1. 先跑起来：第一个命令

最朴素的入门命令：

```bash
sudo tcpdump -i any -nn
```

- `sudo`：抓包要 root 权限，否则会 `Permission denied`。
- `-i any`：监听**所有网卡**（生产机常有多张网卡，先 any 最省事）。
- `-nn`：**不解析主机名、也不把端口号翻译成服务名**（比如直接显示 `443` 而不是 `https`）。强烈建议永远带 `-n` 或 `-nn`，既快又不会让输出满屏 `unknown`。

不加任何过滤时，它会把所有经过的包哗哗地打印出来。想停就 `Ctrl+C`。

### 2. 输出长什么样：读懂每一行

tcpdump 默认把每个包打印成一行文本，典型长这样：

```
14:32:01.123456 IP 192.168.1.100.54321 > 93.184.216.34.443: Flags [S], seq 0, win 64240, length 0
14:32:01.123890 IP 93.184.216.34.443 > 192.168.1.100.54321: Flags [S.], seq 0, ack 1, win 65535, length 0
14:32:01.124002 IP 192.168.1.100.54321 > 93.184.216.34.443: Flags [.], ack 1, win 64240, length 0
```

一行里每个字段的含义，是排错的基本功：

> 🖼️ **图 1：tcpdump 一行输出逐字段拆解**
> 默认每个包打印成一行，从左到右依次是时间、协议、源、目的、标志位与长度。读懂时间戳、源/目的（IP.端口）、标志位和窗口字段，是后面所有排障动作的基础。（原文站点里这段配有可点击播放的逐字段下钻动画，详见文末原文链接。）

TCP 标志位的缩写一定要记牢，它们是判断连接状态的关键：

| 缩写 | 含义 | 典型场景 |
|---|---|---|
| `S` | SYN | 握手发起，[S] 是连接第一步 |
| `S.` | SYN + ACK | 对端响应握手，正常就接着 [.] |
| `.` | 纯 ACK | 无数据的确认包，连接建立后最常见 |
| `P` | PSH | 携带应用数据（如 HTTP 请求体） |
| `F` | FIN | 正常关闭连接 |
| `R` | RST | 连接被重置，常见于端口无人监听/被拒 |
| `S+` / `.+` | 带 URG | 紧急数据，少见 |

### 3. 常用抓包选项

下面这些选项几乎每次都要用到，建议直接存进肌肉记忆：

| 选项 | 作用 |
|---|---|
| `-i <网卡>` | 指定监听网卡，`any` 监听全部 |
| `-n` / `-nn` | 不解析主机名 / 同时不解析端口服务名（强烈建议常开） |
| `-v` / `-vv` / `-vvv` | 输出更详细（如 TTL、分片、校验和） |
| `-X` | 同时以十六进制和 ASCII 打印包内容 |
| `-A` | 仅以 ASCII 打印（看 HTTP 明文最方便） |
| `-e` | 打印链路层（MAC）头 |
| `-q` | 简洁模式，少打无关信息 |
| `-c <N>` | 抓满 N 个包自动停止 |
| `-s <N>` | 快照长度，`-s 0` 抓完整包（默认可能只抓前 96/262 字节） |
| `-w <文件>` | 写入 `.pcap` 文件，供 Wireshark 离线分析 |
| `-r <文件>` | 读取已存的 `.pcap` 文件 |
| `-tttt` | 打印可读的完整时间戳 |
| `-l` | 行缓冲，配合管道（`grep`）实时过滤输出 |
| `-C <MB>` / `-G <秒>` | 按大小 / 时间轮转输出文件，长时间抓包必备 |

### 4. 表达式（BPF）：到底抓哪些包

tcpdump 真正强大的地方在它最后的**表达式**——用 BPF（Berkeley Packet Filter）语法描述"我要哪些包"。记住一条铁律：**表达式里有空格或括号时，一定要用单引号包起来**，否则 shell 会把它们拆成别的参数。

表达式由"原语"和"连接符"组成：

- **主机/网段**：`host 1.1.1.1`、`src host 1.1.1.1`、`dst host 8.8.8.8`、`net 10.0.0.0/8`
- **端口**：`port 443`、`tcp port 80`、`udp src port 53`、`tcp dst port 3306`
- **协议**：`tcp`、`udp`、`icmp`、`arp`
- **连接符**：`and`（且）、`or`（或）、`not`/`!`（非）

例如"只看去往数据库 3306 的流量"：

```bash
sudo tcpdump -i any -nn 'host 10.20.3.15 and tcp port 3306'
```

> 🖼️ **图 2：一条 tcpdump 命令的拼装逻辑**
> 一条命令 = `sudo` + `tcpdump` + 选项段 + 单引号包裹的 BPF 表达式段。选项段控制“怎么抓”，表达式段控制“抓什么”，两者拼起来就能直接运行，或加 `-w` 存盘交给 Wireshark。（原文站点配有播放动画，详见文末链接。）

站内的 [Tcpdump 命令生成器](https://toolbox.51nav.com/tools/security/tcpdump) 把选项段和表达式段都做成了可视化表单，选好网卡、过滤条件直接生成可复制命令，还能在"常用抓包命令"里一键拷贝，不用每次手敲。

## 实战：拿到一段抓包输出，怎么分析

假设你执行了上面的命令，屏幕上蹦出这几行，代表一次完整的 TCP 建连：

```
14:32:01.123456 IP 192.168.1.100.54321 > 10.20.3.15.3306: Flags [S], seq 12345, win 64240, length 0
14:32:01.123890 IP 10.20.3.15.3306 > 192.168.1.100.54321: Flags [S.], seq 9981, ack 12346, win 65535, length 0
14:32:01.124002 IP 192.168.1.100.54321 > 10.20.3.15.3306: Flags [.], ack 9982, win 64240, length 0
```

怎么读？

1. 第一行 `[S]`：客户端向 `10.20.3.15:3306` 发了 SYN，握手开始，`win 64240` 是它通告的接收窗口。
2. 第二行 `[S.]`：数据库回了 `SYN+ACK`，且 `ack 12346`（= 客户端 seq+1），**说明数据库收到了 SYN 且愿意建立连接**——如果这里没出现，问题就在网络路径或防火墙。
3. 第三行 `[.]`：客户端回 ACK，三次握手完成，后面就可以传 MySQL 报文了。

反过来，如果只看到第一行 `[S]` 不停重发、却永远等不到 `[S.]`，那就是开头的"连不上数据库"场景：SYN 出去了但没回包，问题在中间链路/ACL，而不是应用代码。

## 进阶：高级过滤技巧

基础够用了，但遇到刁钻问题还得上更狠的过滤。

### TCP 标志位精确过滤

想抓"只发 SYN、不带 ACK"的包（典型半开连接 / 端口扫描特征）：

```bash
sudo tcpdump -i any -nn 'tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn'
```

`tcp[tcpflags]` 是 TCP 头里的标志字节，用位与运算精确匹配。同理，RST 洪水看 `tcp[tcpflags] & tcp-rst != 0`，FIN 扫描看 `tcp[tcpflags] & tcp-fin != 0`。

### 按包大小过滤

```bash
sudo tcpdump -i any -nn greater 1000     # 大于等于 1000 字节的包
sudo tcpdump -i any -nn less 64          # 小包，常见于攻击或分片
sudo tcpdump -i any -nn 'ip[2:2] > 1000' # IP 总长度字段 > 1000
```

### 抓 HTTP 明文看内容

```bash
sudo tcpdump -i any -nn -A -l 'tcp port 80' | grep -i 'password\|token'
```

`-A` 把载荷当 ASCII 打印，`-l` 行缓冲让 `grep` 能实时过滤——内部还在用 HTTP 传明文口令/Token 的系统，一抓一个准（也是安全自查的高频动作）。

## 企业里 tcpdump 到底用在哪

别把它当"黑客工具"。在正规企业里，它是运维、网络、安全、开发都在用的**无 GUI 服务器排障标配**。下面这张决策流，对应最常见的几类场景：

> 🖼️ **图 3：企业排障决策流**
> 先明确现象，在贴近故障点的网卡抓包，用 BPF 表达式收敛范围，再按故障类（TCP 健康度）、安全类（异常/明文）、性能类（握手/响应时延）三个方向下钻定位根因。（原文站点配有播放动画，详见文末链接。）

### 1. 网络故障排查

连接时通时断、文件传一半卡住、VPN 老掉线——这类问题日志往往无能为力。抓包后重点看 TCP 的"健康指标"：

- **SYN 发出去却没 SYN+ACK 回来**：八成是中间防火墙/ACL/安全组把包丢了，或目的端口根本没监听（会回 `RST`）。
- **重传（retransmission）/ 重复 ACK**：链路在丢包，网络质量或中间设备有问题。
- **RTT 突然变大**：某一跳延迟飙升，结合 `ping`/`mtr` 能锁定是哪段链路。
- **Zero Window / Window Full**：对端接收窗口被占满，发送方被迫停等——常见于后端处理慢、或应用没及时读 socket。

### 2. 服务间调用慢 / 接口问题定位

"接口很慢"到底慢在哪？抓包能直接看到：TCP 握手花了多久、请求什么时候发出、对端多久才回数据。配合 [安全常见端口](https://toolbox.51nav.com/tools/security/security-ports) 先确认服务跑在哪个端口，过滤起来更快。一句常用组合：

```bash
sudo tcpdump -i any -nn -tttt 'host 10.20.3.15 and tcp port 8080' -w svc.pcap
```

抓完下载到本地，用 Wireshark 的 Follow Stream 把完整请求/响应拼出来看。

### 3. 安全分析与入侵排查

- **异常外联**：某台内网机器频繁连陌生公网 IP？抓包看它到底在和谁通信、传了什么。
- **明文凭据**：内部系统用 HTTP 传密码、Token，上文 `-A | grep` 一抓原形毕露，是合规自查的高频动作。
- **端口扫描特征**：源 IP 对大量不同目的端口发 `[S]`、却大多无 `[S.]` 回来，基本就是扫描行为。

排查时配合 [Iptables 命令生成器](https://toolbox.51nav.com/tools/security/iptables) 在边界做丢包/限流、[Nmap](https://toolbox.51nav.com/tools/security/nmap) 做主机发现，能形成"发现→阻断→验证"的闭环。

### 4. 抓包存盘、交接与长时间轮转

现场排障常需要把证据留给同事或事后复盘：

```bash
# 写文件，供 Wireshark 离线分析
sudo tcpdump -i eth0 -nn -s 0 -w capture.pcap 'tcp port 443'

# 长时间抓包：每 100MB 或每 3600 秒轮转一个新文件
sudo tcpdump -i eth0 -nn -G 3600 -C 100 -w /data/cap_%Y%m%d_%H%M.pcap

# 抓完用 -r 离线回看，不必再上机
tcpdump -nn -r capture.pcap 'host 1.1.1.1'
```

`-G` 按时间、`-C` 按大小轮转，是长时间抓包（比如复现一个偶发问题）的救命参数，避免单个文件把磁盘撑爆。

### 5. 容器 / K8s 网络排障

容器网络是 tcpdump 的高频战场，关键是**抓对那一层**：

- **Pod 内部**：`kubectl exec` 进容器，`tcpdump -i eth0` 抓容器网卡。
- **节点层面**：在 Node 上抓 `cni0`/`docker0` 网桥，或对应的 `veth` 虚拟网卡，能看到跨 Pod 流量。
- **Service / 负载均衡**：ClusterIP 的 NAT 发生在节点上，要在 Node 的网桥侧才能看到真实目的地。

### 6. 自动化巡检脚本

把 tcpdump 写进脚本做常态化巡检，比如每隔一段时间抓一段、用 `-G` 轮转、再用 `-z` 在文件轮转时触发后处理脚本（如自动上传到日志平台或跑分析）。这比人工蹲守靠谱得多。

## 排错 FAQ

**Q：Permission denied / 抓不到包？**
普通用户没权限，加 `sudo`；若仍不行，可给 `dumpcap`/`tcpdump` 设 capability：`sudo setcap cap_net_raw,cap_net_admin=eip /usr/sbin/tcpdump`。

**Q：明明有流量却抓不到？**
九成是**网卡选错了**——无线/有线搞混、云服务器抓了错误的虚拟网卡、或抓在了流量不经过的一侧。容器场景记得抓网桥或 veth，而不是宿主机物理网卡。必要时用交换机端口镜像（SPAN）把流量引过来。

**Q：包太多刷屏看不过来？**
别裸抓全量。要么用 BPF 表达式收敛（如 `host 1.2.3.4`），要么 `-c 100` 只抓一百个，要么 `-w` 存盘后用 `-r` 或 Wireshark 慢慢筛。

**Q：表达式为什么一定要加单引号？**
表达式里的空格、`(`、`)`、`>` 会被 shell 当作特殊字符拆词或重定向。用单引号包起来，tcpdump 才能原样收到。另外连接符要写大写 `and`/`or`/`not`，小写也可能被当成别的意思。

**Q：tcpdump 和 Wireshark 怎么分工？**
一个命令行、一个 GUI，底层都是 libpcap。实战里通常是：**tcpdump 在无桌面服务器上 `-w` 抓包 → 拷到本地 → Wireshark 用 Follow Stream 详细分析**。站内的 [Tcpdump 命令生成器](https://toolbox.51nav.com/tools/security/tcpdump) 负责把命令写对，[Wireshark 过滤命令生成器](https://toolbox.51nav.com/tools/security/wireshark) 负责写对 Wireshark 那边的过滤器。

## 相关工具

- [Tcpdump 命令生成器](https://toolbox.51nav.com/tools/security/tcpdump)：可视化拼装选项段与 BPF 表达式，并内置常用抓包命令速查。
- [Wireshark 过滤命令生成器](https://toolbox.51nav.com/tools/security/wireshark)：抓到 `.pcap` 后，用它生成显示/捕获过滤器做精细分析。
- [Iptables 命令生成器](https://toolbox.51nav.com/tools/security/iptables)：在边界做丢包、限流、端口转发的命令生成与速查。
- [Nmap 命令生成器](https://toolbox.51nav.com/tools/security/nmap)：主机发现与端口扫描，和抓包配合做"发现→验证"。
- [安全常见端口](https://toolbox.51nav.com/tools/security/security-ports)：排错时快速确认服务跑在哪个端口、对应什么风险。
- [Linux 常用命令](https://toolbox.51nav.com/tools/security/linux-commands)：抓包主机上的系统/网络/权限等配套运维命令。


---

**相关工具（在线版，免安装，数据本地处理）**

- Tcpdump 命令生成器：https://toolbox.51nav.com/tools/security/tcpdump
- Wireshark 过滤命令生成器：https://toolbox.51nav.com/tools/security/wireshark
- Iptables / Nmap / 常用端口 / Linux 命令：https://toolbox.51nav.com/tools/security/

> 📎 原文链接（含可播放的图示动画）：https://toolbox.51nav.com/tutorials/tcpdump
