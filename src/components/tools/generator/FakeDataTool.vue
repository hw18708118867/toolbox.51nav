<template>
  <div class="space-y-4">
    <div class="space-y-3">
      <div>
        <label class="text-xs font-medium block mb-2" style="color: var(--color-text-secondary);">数据类型</label>
        <div class="flex flex-wrap gap-3">
          <label v-for="t in dataTypes" :key="t.key" class="flex items-center gap-1.5 text-sm" style="color: var(--color-text);">
            <input type="checkbox" v-model="t.enabled" class="rounded" />
            {{ t.label }}
          </label>
        </div>
      </div>

      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">数量</label>
        <select
          v-model="count"
          class="rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option v-for="c in counts" :key="c" :value="c">{{ c }} 条</option>
        </select>
      </div>

      <div class="flex gap-2 justify-end">
        <button
          @click="generate"
          :disabled="!hasEnabledType"
          class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          生成
        </button>
        <button
          v-if="rows.length > 0"
          @click="copyAll"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors border"
          style="background-color: var(--color-bg-secondary); color: var(--color-text); border-color: var(--color-border);"
        >
          复制全部
        </button>
      </div>
    </div>

    <div v-if="rows.length > 0" class="rounded-md border overflow-x-auto" style="border-color: var(--color-border);">
      <table class="w-full text-sm whitespace-nowrap">
        <thead>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">#</th>
            <th v-for="t in enabledTypes" :key="t.key" class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">{{ t.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="index" :style="index < rows.length - 1 ? 'border-bottom: 1px solid var(--color-border);' : ''">
            <td class="px-4 py-2" style="color: var(--color-text-muted);">{{ index + 1 }}</td>
            <td v-for="t in enabledTypes" :key="t.key" class="px-4 py-2" style="color: var(--color-text);">
              {{ row[t.key] }}
              <CopyButton :text="row[t.key]" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

interface DataTypeItem {
  key: string;
  label: string;
  enabled: boolean;
}

interface DataRow {
  [key: string]: string;
}

const counts = [5, 10, 20, 50];
const count = ref(10);
const rows = ref<DataRow[]>([]);

const dataTypes = ref<DataTypeItem[]>([
  { key: 'name', label: '姓名', enabled: true },
  { key: 'phone', label: '手机号', enabled: true },
  { key: 'email', label: '邮箱', enabled: true },
  { key: 'address', label: '地址', enabled: true },
  { key: 'idCard', label: '身份证号', enabled: true },
  { key: 'company', label: '公司名', enabled: true },
]);

const enabledTypes = computed(() => dataTypes.value.filter(t => t.enabled));
const hasEnabledType = computed(() => enabledTypes.value.length > 0);

// --- Data generators ---

const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕'];

const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '文', '华', '慧', '建华', '玲', '建', '宇', '峰', '婷', '雪', '琳', '鑫', '博', '浩', '子涵', '梓涵', '欣怡', '雨萱', '诗涵', '可欣', '梦琪', '佳怡', '思源'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(n: number): string {
  let result = '';
  for (let i = 0; i < n; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function genName(): string {
  return randomItem(surnames) + randomItem(givenNames);
}

function genPhone(): string {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189', '191', '198', '199'];
  return randomItem(prefixes) + randomDigits(8);
}

function genEmail(): string {
  const pinyins = ['zhang', 'wang', 'li', 'liu', 'chen', 'yang', 'zhao', 'huang', 'zhou', 'wu', 'xu', 'sun', 'lin', 'he', 'guo', 'ma', 'luo', 'song', 'xiao', 'cao'];
  const domains = ['qq.com', '163.com', '126.com', 'gmail.com', 'outlook.com', 'sina.com', 'hotmail.com', 'foxmail.com'];
  const num = Math.floor(Math.random() * 9999);
  return randomItem(pinyins) + num + '@' + randomItem(domains);
}

const provinces: { name: string; cities: string[] }[] = [
  { name: '北京市', cities: ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '石景山区'] },
  { name: '上海市', cities: ['浦东新区', '黄浦区', '徐汇区', '长宁区', '静安区', '虹口区'] },
  { name: '广东省', cities: ['广州市', '深圳市', '东莞市', '佛山市', '珠海市', '中山市'] },
  { name: '浙江省', cities: ['杭州市', '宁波市', '温州市', '嘉兴市', '绍兴市', '金华市'] },
  { name: '江苏省', cities: ['南京市', '苏州市', '无锡市', '常州市', '南通市', '扬州市'] },
  { name: '四川省', cities: ['成都市', '绵阳市', '德阳市', '宜宾市', '泸州市', '达州市'] },
  { name: '湖北省', cities: ['武汉市', '宜昌市', '襄阳市', '荆州市', '黄冈市', '十堰市'] },
  { name: '湖南省', cities: ['长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市', '常德市'] },
  { name: '山东省', cities: ['济南市', '青岛市', '烟台市', '潍坊市', '临沂市', '济宁市'] },
  { name: '河南省', cities: ['郑州市', '洛阳市', '开封市', '南阳市', '安阳市', '新乡市'] },
  { name: '福建省', cities: ['福州市', '厦门市', '泉州市', '漳州市', '莆田市', '宁德市'] },
  { name: '陕西省', cities: ['西安市', '咸阳市', '宝鸡市', '渭南市', '汉中市', '延安市'] },
];

const roads = ['中山路', '人民路', '建设路', '解放路', '长安路', '和平路', '文化路', '科技路', '新华路', '学府路'];

function genAddress(): string {
  const province = randomItem(provinces);
  const city = randomItem(province.cities);
  const road = randomItem(roads);
  const num = Math.floor(Math.random() * 300) + 1;
  return province.name + city + road + num + '号';
}

const regionCodes = ['110101', '110102', '110105', '110106', '310101', '310104', '310105', '310115', '440103', '440104', '440106', '440305', '440306', '440307', '330102', '330106', '330108', '320102', '320104', '320106', '510104', '510105', '510107'];

function genIdCard(): string {
  const regionCode = randomItem(regionCodes);
  const year = 1960 + Math.floor(Math.random() * 50);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  const base = regionCode + year + month + day + seq;

  // Calculate checksum
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkChars = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(base[i], 10) * weights[i];
  }
  const checkChar = checkChars[sum % 11];
  return base + checkChar;
}

const industries = ['科技', '信息', '网络', '数据', '智能', '云计算', '互联网', '软件', '电子', '通信', '金融', '教育', '文化', '传媒', '医疗', '生物', '新能源', '环保', '物流', '贸易'];
const companyTypes = ['有限公司', '科技有限公司', '信息技术有限公司', '网络科技有限公司', '数据服务有限公司', '智能科技有限公司', '软件开发有限公司', '电子商务有限公司', '传媒有限公司', '咨询有限公司'];

function genCompany(): string {
  return randomItem(surnames) + randomItem(industries) + randomItem(companyTypes);
}

const generators: Record<string, () => string> = {
  name: genName,
  phone: genPhone,
  email: genEmail,
  address: genAddress,
  idCard: genIdCard,
  company: genCompany,
};

function generate() {
  if (!hasEnabledType.value) return;
  rows.value = [];
  const activeTypes = enabledTypes.value;
  for (let i = 0; i < count.value; i++) {
    const row: DataRow = {};
    for (const t of activeTypes) {
      row[t.key] = generators[t.key]();
    }
    rows.value.push(row);
  }
}

async function copyAll() {
  const activeTypes = enabledTypes.value;
  const json = JSON.stringify(rows.value.map(row => {
    const obj: Record<string, string> = {};
    for (const t of activeTypes) {
      obj[t.label] = row[t.key];
    }
    return obj;
  }), null, 2);
  try {
    await navigator.clipboard.writeText(json);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = json;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
</script>
