<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要转换的中文文本" :rows="10" show-count />
    <div class="flex flex-wrap items-center gap-3">
      <select v-model="convertMode" class="px-3 py-2 rounded-md border text-sm focus:outline-none " >
        <option value="t2s">繁体 → 简体</option>
        <option value="s2t">简体 → 繁体</option>
      </select>
    </div>
    <TextOutput v-model="output" label="转换结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');
const convertMode = ref<'t2s' | 's2t'>('t2s');

// Common trad -> simp mapping
const tradToSimp: Record<string, string> = {
  '國': '国', '萬': '万', '與': '与', '說': '说', '開': '开', '關': '关',
  '對': '对', '門': '门', '時': '时', '書': '书', '會': '会', '來': '来',
  '個': '个', '們': '们', '為': '为', '從': '从', '這': '这', '還': '还',
  '實': '实', '學': '学', '發': '发', '現': '现', '長': '长', '問': '问',
  '見': '见', '兒': '儿', '頭': '头', '裡': '里', '後': '后', '樣': '样',
  '體': '体', '點': '点', '機': '机', '氣': '气', '電': '电', '話': '话',
  '網': '网', '馬': '马', '魚': '鱼', '鳥': '鸟', '龍': '龙', '風': '风',
  '飛': '飞', '車': '车', '東': '东', '過': '过', '種': '种', '業': '业',
  '經': '经', '結': '结', '給': '给', '總': '总', '變': '变', '讓': '让',
  '邊': '边', '愛': '爱', '義': '义', '動': '动', '進': '进', '當': '当',
  '無': '无', '爾': '尔', '處': '处', '樂': '乐', '極': '极', '親': '亲',
  '壓': '压', '應': '应', '據': '据', '題': '题', '組': '组', '導': '导',
  '術': '术', '際': '际', '質': '质', '價': '价', '認': '认', '識': '识',
  '議': '议', '護': '护', '際': '际', '標': '标', '線': '线', '號': '号',
  '聲': '声', '醫': '医', '寫': '写', '畫': '画', '類': '类', '顯': '显',
  '嚴': '严', '難': '难', '區': '区', '歷': '历', '確': '确', '驗': '验',
  '廠': '厂', '廣': '广', '達': '达', '運': '运', '遠': '远', '連': '连',
  '轉': '转', '輪': '轮', '較': '较', '輕': '轻', '際': '际', '戰': '战',
  '響': '响', '領': '领', '額': '额', '願': '愿', '顧': '顾', '類': '类',
  '觀': '观', '記': '记', '設': '设', '許': '许', '講': '讲', '該': '该',
  '謝': '谢', '讀': '读', '誰': '谁', '調': '调', '論': '论', '語': '语',
  '請': '请', '證': '证', '試': '试', '計': '计', '評': '评', '課': '课',
  '誤': '误', '訓': '训', '讓': '让', '詞': '词', '詩': '诗', '誠': '诚',
  '話': '话', '電': '电', '體': '体', '點': '点', '機': '机', '氣': '气',
};

const simpToTrad: Record<string, string> = {};
for (const [t, s] of Object.entries(tradToSimp)) {
  if (!simpToTrad[s]) {
    simpToTrad[s] = t;
  }
}

function convert() {
  if (input.value === '') {
    output.value = '';
    return;
  }
  const map = convertMode.value === 't2s' ? tradToSimp : simpToTrad;
  output.value = [...input.value].map(ch => map[ch] || ch).join('');
}
</script>
