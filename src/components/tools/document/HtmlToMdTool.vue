<template>
  <div class="space-y-4">
    <TextInput v-model="htmlInput" label="输入 HTML" placeholder="<h1>标题</h1><p>这是一段<b>文字</b></p>" :rows="10" show-count />
    <div class="flex justify-end">
      <button @click="convert" class="btn-primary">转换</button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="Markdown 结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const htmlInput = ref('');
const output = ref('');
const error = ref('');

function convert() {
  error.value = '';
  output.value = '';
  try {
    let html = htmlInput.value;

    // Remove script and style tags
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Replace <br> tags
    html = html.replace(/<br\s*\/?>/gi, '\n');

    // Headings
    for (let i = 6; i >= 1; i--) {
      const regex = new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, 'gi');
      html = html.replace(regex, (_, content) => {
        return '\n\n' + '#'.repeat(i) + ' ' + stripTags(content).trim() + '\n\n';
      });
    }

    // Paragraphs
    html = html.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, content) => {
      return '\n\n' + convertInline(content) + '\n\n';
    });

    // Unordered lists
    html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
      const items: string[] = [];
      content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__: string, liContent: string) => {
        items.push('- ' + convertInline(liContent).trim());
        return '';
      });
      return '\n\n' + items.join('\n') + '\n\n';
    });

    // Ordered lists
    html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, content) => {
      const items: string[] = [];
      let idx = 1;
      content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__: string, liContent: string) => {
        items.push(idx + '. ' + convertInline(liContent).trim());
        idx++;
        return '';
      });
      return '\n\n' + items.join('\n') + '\n\n';
    });

    // Pre / code blocks
    html = html.replace(/<pre[^>]*>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, (_, content) => {
      return '\n\n```\n' + decodeEntities(content).trim() + '\n```\n\n';
    });
    html = html.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, content) => {
      return '`' + stripTags(content).trim() + '`';
    });

    // Images
    html = html.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)');
    html = html.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi, '![$1]($2)');
    html = html.replace(/<img[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, '![]($1)');

    // Links
    html = html.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

    // Convert remaining inline elements
    html = convertInline(html);

    // Decode entities
    html = decodeEntities(html);

    // Clean up extra whitespace
    html = html.replace(/\n{3,}/g, '\n\n');
    html = html.trim();

    output.value = html;
  } catch (e: any) {
    error.value = '转换失败: ' + e.message;
  }
}

function convertInline(html: string): string {
  html = html.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  html = html.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  html = html.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  html = html.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  html = html.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  html = stripTags(html);
  return html;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function decodeEntities(html: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };
  return html.replace(/&[#a-zA-Z0-9]+;/g, (match) => entities[match] || match);
}
</script>
