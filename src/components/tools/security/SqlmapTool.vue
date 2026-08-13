<template>
  <div class="space-y-4">
    <!-- 目标 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">目标 URL（-u / --url）</label>
      <input
        v-model="target"
        type="text"
        placeholder="http://example.com/page.php?id=1"
        class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      />
      <p class="text-xs mt-1" style="color: var(--color-text-muted);">目标必须包含可注入的参数（如 ?id=1）。也可使用 -r 请求文件或 -l 代理日志（见下方"输入源"）</p>
    </div>

    <!-- 输入源 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">Burp/ZAP 请求文件 (-r)</label>
        <input
          v-model="requestFile"
          type="text"
          placeholder="request.txt"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">请求日志文件 (-l)</label>
        <input
          v-model="logFile"
          type="text"
          placeholder="proxy.log"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">Google 批量目标 (-g)</label>
        <input
          v-model="googleDork"
          type="text"
          placeholder='inurl:".php?id=1"'
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
    </div>

    <!-- 注入参数与位置 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">指定注入参数 (-p)</label>
        <input
          v-model="param"
          type="text"
          placeholder="id,name 或 '!id' 排除"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">指定注入位置 (--suffix / --prefix)</label>
        <input
          v-model="prefix"
          type="text"
          placeholder="前缀如 ')"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
    </div>

    <!-- 请求与连接 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">POST 数据 (--data)</label>
        <input
          v-model="data"
          type="text"
          placeholder="username=admin&password=1"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">Cookie (--cookie)</label>
        <input
          v-model="cookie"
          type="text"
          placeholder="PHPSESSID=abc123; auth=1"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">User-Agent (--user-agent)</label>
        <input
          v-model="userAgent"
          type="text"
          placeholder="Mozilla/5.0 ..."
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">HTTP 代理 (--proxy)</label>
        <input
          v-model="proxy"
          type="text"
          placeholder="http://127.0.0.1:8080"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">随机 UA/伪造 (--random-agent)</label>
        <label class="flex items-center gap-2 text-sm mt-2.5" style="color: var(--color-text);">
          <input type="checkbox" v-model="randomAgent" />
          使用随机 User-Agent
        </label>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">请求方法 (--method)</label>
        <select
          v-model="method"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        >
          <option value="">默认(GET/自动)</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">超时 (--timeout, 秒)</label>
        <input
          v-model="timeout"
          type="text"
          placeholder="10"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">重试次数 (--retries)</label>
        <input
          v-model="retries"
          type="text"
          placeholder="3"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
    </div>

    <!-- 检测选项 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">检测等级与风险</label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="text-xs block mb-1" style="color: var(--color-text-muted);">测试等级 --level (1-5)</label>
          <select
            v-model="level"
            class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
            style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
          >
            <option value="1">1 默认</option>
            <option value="2">2 + cookie</option>
            <option value="3">3 + User-Agent/Referer</option>
            <option value="4">4 + host</option>
            <option value="5">5 全部</option>
          </select>
        </div>
        <div>
          <label class="text-xs block mb-1" style="color: var(--color-text-muted);">风险等级 --risk (1-3)</label>
          <select
            v-model="risk"
            class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
            style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
          >
            <option value="1">1 默认(无风险)</option>
            <option value="2">2 + 时间盲注</option>
            <option value="3">3 + OR 堆叠/报错</option>
          </select>
        </div>
        <div>
          <label class="text-xs block mb-1" style="color: var(--color-text-muted);">线程数 --threads</label>
          <input
            v-model="threads"
            type="text"
            placeholder="1 (建议≤10)"
            class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
            style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">指定 DBMS (--dbms)</label>
        <input
          v-model="dbms"
          type="text"
          placeholder="MySQL / MSSQL / PostgreSQL / Oracle"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">指定 tamper 脚本 (--tamper)</label>
        <input
          v-model="tamper"
          type="text"
          placeholder="space2comment,charencode,between"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
    </div>

    <!-- 开关组 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">注入技术 (--technique)</label>
      <div class="flex flex-wrap gap-3 mb-2">
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="tech.B" /> B 布尔盲注</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="tech.E" /> E 报错注入</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="tech.U" /> U 联合查询</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="tech.S" /> S 堆叠查询</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="tech.T" /> T 时间盲注</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="techAll" @change="toggleTechAll" /> 全部</label>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.batch" /> 非交互 (-–batch)</label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.forms" /> 自动搜表单 (--forms)</label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.crawl" /> 爬取 (-–crawl)</label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.freshQueries" /> 刷新缓存 (--fresh-queries)</label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.flushSession" /> 清空会话 (--flush-session)</label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.ssl" /> 强制 HTTPS (--force-ssl)</label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.verbose" /> 详细输出 (-v)</label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.hex" /> 十六进制 (--hex)</label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.noEscape" /> 不转义 (--no-escape)</label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.identifyWaf" /> 识别 WAF (--identify-waf)</label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.checkWaf" /> 检测 WAF (--check-waf)</label>
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="opts.dummy" /> 假请求 (--dummy)</label>
    </div>

    <!-- 枚举动作 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">枚举目标（进入数据库后做什么）</label>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.banner" /> 数据库横幅 (--banner)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.dbs" /> 列出库 (--dbs)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.tables" /> 列出表 (--tables)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.columns" /> 列出列 (--columns)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.dump" /> 拖库 (--dump)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.dumpAll" /> 全库拖 (--dump-all)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.currentUser" /> 当前用户 (--current-user)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.currentDb" /> 当前库 (--current-db)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.users" /> 列出用户 (--users)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.passwords" /> 破解密码 (--passwords)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.privileges" /> 权限 (--privileges)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.roles" /> 角色 (--roles)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.isDba" /> 是否 DBA (--is-dba)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.schema" /> 架构 (--schema)</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="checkbox" v-model="enumOpts.count" /> 计数 (--count)</label>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">指定库 (-D)</label>
        <input v-model="dbName" type="text" placeholder="my_db" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">指定表 (-T)</label>
        <input v-model="tblName" type="text" placeholder="users" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">指定列 (-C)</label>
        <input v-model="colName" type="text" placeholder="username,password" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
    </div>

    <!-- 高级：OS / 文件 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">OS 访问 (--os-shell / --os-cmd)</label>
        <input v-model="osCmd" type="text" placeholder="--os-shell 或 whoami" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">读文件 (--file-read)</label>
        <input v-model="fileRead" type="text" placeholder="/etc/passwd" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">输出目录 (--output-dir)</label>
        <input v-model="outputDir" type="text" placeholder="./output" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">保存会话名 (-–session)</label>
        <input v-model="session" type="text" placeholder="scan1" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">详细级别 (-v)</label>
        <select v-model="verboseLv" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);">
          <option value="">默认</option>
          <option value="0">0 仅关键</option>
          <option value="1">1 错误+警告</option>
          <option value="2">2 信息</option>
          <option value="3">3 调试</option>
          <option value="4">4 详情</option>
          <option value="5">5 最详</option>
        </select>
      </div>
    </div>

    <!-- 自定义额外参数 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">额外参数（可选，追加到命令末尾）</label>
      <input v-model="extra" type="text" placeholder="如 --sql-query=&quot;SELECT version()&quot; --search" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
    </div>

    <!-- 生成结果 -->
    <div class="reveal-item rounded-md border p-3" style="border-color: var(--color-border); backgroundColor: var(--color-bg-secondary);">
      <div class="flex items-center justify-between gap-2 mb-1">
        <span class="text-xs font-medium" style="color: var(--color-text-secondary);">生成的 sqlmap 命令</span>
        <CopyButton :text="command" />
      </div>
      <pre class="text-sm font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ command }}</pre>
    </div>

    <p class="text-xs" style="color: var(--color-text-muted);">
      仅用于合法授权的安全测试与学习。未经目标系统所有者书面授权的扫描可能违反法律法规与服务条款。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const target = ref('');
const requestFile = ref('');
const logFile = ref('');
const googleDork = ref('');
const param = ref('');
const prefix = ref('');
const data = ref('');
const cookie = ref('');
const userAgent = ref('');
const proxy = ref('');
const randomAgent = ref(false);
const method = ref('');
const timeout = ref('');
const retries = ref('');
const level = ref('1');
const risk = ref('1');
const threads = ref('');
const dbms = ref('');
const tamper = ref('');

const tech = reactive({ B: false, E: false, U: false, S: false, T: false });
const techAll = ref(false);
function toggleTechAll() {
  const v = techAll.value;
  (['B', 'E', 'U', 'S', 'T'] as const).forEach((k) => { tech[k] = v; });
}
function syncTechAll() {
  const allOn = ['B', 'E', 'U', 'S', 'T'].every((k) => tech[k as keyof typeof tech]);
  const none = !['B', 'E', 'U', 'S', 'T'].some((k) => tech[k as keyof typeof tech]);
  techAll.value = allOn && !none ? false : (allOn ? true : false);
  if (none) techAll.value = false;
}

const opts = reactive({
  batch: false, forms: false, crawl: false, freshQueries: false, flushSession: false,
  ssl: false, verbose: false, hex: false, noEscape: false, identifyWaf: false,
  checkWaf: false, dummy: false,
});

const enumOpts = reactive({
  banner: false, dbs: false, tables: false, columns: false, dump: false, dumpAll: false,
  currentUser: false, currentDb: false, users: false, passwords: false, privileges: false,
  roles: false, isDba: false, schema: false, count: false,
});

const dbName = ref('');
const tblName = ref('');
const colName = ref('');
const osCmd = ref('');
const fileRead = ref('');
const outputDir = ref('');
const session = ref('');
const verboseLv = ref('');
const extra = ref('');

const command = computed(() => {
  syncTechAll();
  const args: string[] = ['sqlmap'];

  // 输入源
  if (target.value.trim()) args.push(`-u "${target.value.trim()}"`);
  if (requestFile.value.trim()) args.push(`-r ${requestFile.value.trim()}`);
  if (logFile.value.trim()) args.push(`-l ${logFile.value.trim()}`);
  if (googleDork.value.trim()) args.push(`-g "${googleDork.value.trim()}"`);

  if (param.value.trim()) args.push(`-p ${param.value.trim()}`);
  if (prefix.value.trim()) args.push(`--prefix "${prefix.value.trim()}"`);
  if (data.value.trim()) args.push(`--data "${data.value.trim()}"`);
  if (cookie.value.trim()) args.push(`--cookie "${cookie.value.trim()}"`);
  if (userAgent.value.trim()) args.push(`--user-agent "${userAgent.value.trim()}"`);
  if (randomAgent.value) args.push('--random-agent');
  if (proxy.value.trim()) args.push(`--proxy ${proxy.value.trim()}`);
  if (method.value) args.push(`--method ${method.value}`);
  if (timeout.value.trim()) args.push(`--timeout ${timeout.value.trim()}`);
  if (retries.value.trim()) args.push(`--retries ${retries.value.trim()}`);

  if (level.value && level.value !== '1') args.push(`--level=${level.value}`);
  if (risk.value && risk.value !== '1') args.push(`--risk=${risk.value}`);
  if (threads.value.trim()) args.push(`--threads ${threads.value.trim()}`);
  if (dbms.value.trim()) args.push(`--dbms ${dbms.value.trim()}`);
  if (tamper.value.trim()) args.push(`--tamper=${tamper.value.trim()}`);

  // 注入技术
  const techSel = ['B', 'E', 'U', 'S', 'T'].filter((k) => tech[k as keyof typeof tech]).join('');
  if (techSel && techSel.length < 5) args.push(`--technique=${techSel}`);

  // 通用开关
  if (opts.batch) args.push('--batch');
  if (opts.forms) args.push('--forms');
  if (opts.crawl) args.push('--crawl=2');
  if (opts.freshQueries) args.push('--fresh-queries');
  if (opts.flushSession) args.push('--flush-session');
  if (opts.ssl) args.push('--force-ssl');
  if (opts.verbose) args.push('-v');
  if (opts.hex) args.push('--hex');
  if (opts.noEscape) args.push('--no-escape');
  if (opts.identifyWaf) args.push('--identify-waf');
  if (opts.checkWaf) args.push('--check-waf');
  if (opts.dummy) args.push('--dummy');

  // 枚举
  const e = enumOpts;
  if (e.banner) args.push('--banner');
  if (e.dbs) args.push('--dbs');
  if (e.tables) args.push('--tables');
  if (e.columns) args.push('--columns');
  if (e.dump) args.push('--dump');
  if (e.dumpAll) args.push('--dump-all');
  if (e.currentUser) args.push('--current-user');
  if (e.currentDb) args.push('--current-db');
  if (e.users) args.push('--users');
  if (e.passwords) args.push('--passwords');
  if (e.privileges) args.push('--privileges');
  if (e.roles) args.push('--roles');
  if (e.isDba) args.push('--is-dba');
  if (e.schema) args.push('--schema');
  if (e.count) args.push('--count');

  if (dbName.value.trim()) args.push(`-D ${dbName.value.trim()}`);
  if (tblName.value.trim()) args.push(`-T ${tblName.value.trim()}`);
  if (colName.value.trim()) args.push(`-C ${colName.value.trim()}`);

  // OS / 文件
  if (osCmd.value.trim()) {
    if (osCmd.value.trim().toLowerCase() === '--os-shell') args.push('--os-shell');
    else args.push(`--os-cmd "${osCmd.value.trim()}"`);
  }
  if (fileRead.value.trim()) args.push(`--file-read "${fileRead.value.trim()}"`);

  // 输出/会话
  if (outputDir.value.trim()) args.push(`--output-dir=${outputDir.value.trim()}`);
  if (session.value.trim()) args.push(`--session=${session.value.trim()}`);
  if (verboseLv.value) args.push(`-v ${verboseLv.value}`);

  if (extra.value.trim()) args.push(extra.value.trim());

  return args.join(' ');
});
</script>
