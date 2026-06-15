<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-4">
      <select v-model="lang" class="px-3 py-2 rounded-md border text-sm focus:outline-none " >
        <option value="zh">中文</option>
        <option value="en">英文</option>
      </select>

      <div class="flex items-center gap-2">
        <label class="text-sm" style="color: var(--color-text-secondary);">段落数:</label>
        <input v-model.number="paragraphCount" type="number" min="1" max="10" class="w-20 rounded-md border px-3 py-2 text-sm focus:outline-none "  />
      </div>

    </div>

    <div v-if="output" class="relative">
      <TextOutput v-model="output" label="生成结果" :rows="12" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextOutput from '../../common/TextOutput.vue';

const lang = ref<'zh' | 'en'>('zh');
const paragraphCount = ref(3);
const output = ref('');

const loremEn = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
  'Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est.',
  'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.',
  'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?',
  'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.',
  'Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.',
];

const loremZh = [
  '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。闰余成岁，律吕调阳。云腾致雨，露结为霜。金生丽水，玉出昆冈。',
  '海咸河淡，鳞潜羽翔。龙师火帝，鸟官人皇。始制文字，乃服衣裳。推位让国，有虞陶唐。吊民伐罪，周发殷汤。坐朝问道，垂拱平章。',
  '知过必改，得能莫忘。罔谈彼短，靡恃己长。信使可覆，器欲难量。墨悲丝染，诗赞羔羊。景行维贤，克念作圣。德建名立，形端表正。',
  '空谷传声，虚堂习听。祸因恶积，福缘善庆。尺璧非宝，寸阴是竞。资父事君，曰严与敬。孝当竭力，忠则尽命。临深履薄，夙兴温凊。',
  '似兰斯馨，如松之盛。川流不息，渊澄取映。容止若思，言辞安定。笃初诚美，慎终宜令。荣业所基，籍甚无竟。学优登仕，摄职从政。',
  '人生若只如初见，何事秋风悲画扇。等闲变却故人心，却道故人心易变。骊山语罢清宵半，泪雨霖铃终不怨。何如薄幸锦衣郎，比翼连枝当日愿。',
  '山重水复疑无路，柳暗花明又一村。箫鼓追随春社近，衣冠简朴古风存。从今若许闲乘月，拄杖无时夜叩门。',
  '大江东去，浪淘尽，千古风流人物。故垒西边，人道是，三国周郎赤壁。乱石穿空，惊涛拍岸，卷起千堆雪。江山如画，一时多少豪杰。',
  '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
  '床前明月光，疑是地上霜。举头望明月，低头思故乡。远上寒山石径斜，白云深处有人家。停车坐爱枫林晚，霜叶红于二月花。',
];

function generate() {
  const count = Math.max(1, Math.min(10, paragraphCount.value));
  const source = lang.value === 'zh' ? loremZh : loremEn;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(source[i % source.length]);
  }
  output.value = result.join('\n\n');
}
</script>
