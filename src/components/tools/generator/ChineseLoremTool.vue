<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">段落数量: {{ count }}</label>
        <input
          v-model.number="count"
          type="range"
          :min="1"
          :max="10"
          class="w-40"
        />
      </div>
      <div class="pt-4">
        <button
          @click="generate"
          class="btn-primary"
        >
          生成
        </button>
      </div>
    </div>

    <div v-if="output">
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">生成结果</label>
        <CopyButton :text="output" />
      </div>
      <div
        class="w-full rounded-md border px-3 py-2 text-sm leading-relaxed"
        style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
      >
        <p v-for="(para, idx) in paragraphs" :key="idx" class="mb-2 last:mb-0" style="text-indent: 2em;">{{ para }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const count = ref(3);
const output = ref('');
const paragraphs = ref<string[]>([]);

const PHRASES = [
  '春色满园关不住，一枝红杏出墙来。',
  '问渠那得清如许，为有源头活水来。',
  '书山有路勤为径，学海无涯苦作舟。',
  '山重水复疑无路，柳暗花明又一村。',
  '海内存知己，天涯若比邻。',
  '长风破浪会有时，直挂云帆济沧海。',
  '宝剑锋从磨砺出，梅花香自苦寒来。',
  '业精于勤，荒于嬉；行成于思，毁于随。',
  '天行健，君子以自强不息。',
  '地势坤，君子以厚德载物。',
  '生活中的每一天都是崭新的开始，充满了无限的可能与希望。',
  '科技的进步使得我们的生活更加便捷，同时也带来了新的挑战。',
  '学习是一个持续不断的过程，需要我们保持好奇心和求知欲。',
  '理论与实践相结合，才能更好地理解和掌握知识。',
  '沟通是解决问题的关键，良好的沟通能够消除误解和矛盾。',
  '创新是推动社会进步的重要动力，敢于尝试才能发现新的机遇。',
  '团队合作能够产生一加一大于二的效果，集思广益往往能得出更好的方案。',
  '时间是最宝贵的资源，合理安排时间能够提高工作和学习效率。',
  '面对困难时保持积极的心态，往往能够找到解决问题的新思路。',
  '健康的生活方式是幸福生活的基础，身体是革命的本钱。',
  '每一次失败都是通往成功的一步，重要的是从中吸取教训。',
  '阅读是开拓视野的最佳途径之一，书籍是人类进步的阶梯。',
  '坚持做正确的事情，哪怕进展缓慢，最终也会达到目标。',
  '尊重他人就是尊重自己，相互理解是和谐社会的基础。',
  '细节决定成败，关注每一个细节能够避免很多不必要的问题。',
];

function generate() {
  paragraphs.value = [];
  for (let i = 0; i < count.value; i++) {
    const phraseCount = 3 + Math.floor(Math.random() * 5);
    const selected: string[] = [];
    for (let j = 0; j < phraseCount; j++) {
      const idx = Math.floor(Math.random() * PHRASES.length);
      selected.push(PHRASES[idx]);
    }
    paragraphs.value.push(selected.join(''));
  }
  output.value = paragraphs.value.join('\n\n');
}
</script>
