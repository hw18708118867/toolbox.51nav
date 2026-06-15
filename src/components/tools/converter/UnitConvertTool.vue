<template>
  <div class="space-y-4">
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">类别</label>
      <select
        v-model="category"
        class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
        
      >
        <option value="length">长度</option>
        <option value="weight">重量</option>
        <option value="temperature">温度</option>
        <option value="area">面积</option>
        <option value="volume">体积</option>
      </select>
    </div>

    <div class="flex items-end gap-3">
      <div class="flex-1">
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">输入</label>
        <input
          v-model.number="inputValue"
          type="number"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>
      <div>
        <select
          v-model="fromUnit"
          class="rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option v-for="u in currentUnits" :key="u.value" :value="u.value">{{ u.label }}</option>
        </select>
      </div>
    </div>

    <div class="flex items-end gap-3">
      <div class="flex-1">
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">输出</label>
        <input
          :value="outputValue"
          type="text"
          readonly
          class="w-full rounded-md border px-3 py-2 text-sm font-mono"
          style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <select
          v-model="toUnit"
          class="rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option v-for="u in currentUnits" :key="u.value" :value="u.value">{{ u.label }}</option>
        </select>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        @click="swapUnits"
        class="px-3 py-2 rounded-md text-xs font-medium transition-colors border"
        style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary); border-color: var(--color-border);"
      >
        交换单位
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface UnitDef {
  label: string;
  value: string;
  toBase: number;
  fromBase: number;
}

const lengthUnits: UnitDef[] = [
  { label: '千米 (km)', value: 'km', toBase: 1000, fromBase: 0.001 },
  { label: '米 (m)', value: 'm', toBase: 1, fromBase: 1 },
  { label: '厘米 (cm)', value: 'cm', toBase: 0.01, fromBase: 100 },
  { label: '毫米 (mm)', value: 'mm', toBase: 0.001, fromBase: 1000 },
  { label: '英里 (mi)', value: 'mi', toBase: 1609.344, fromBase: 1 / 1609.344 },
  { label: '英尺 (ft)', value: 'ft', toBase: 0.3048, fromBase: 1 / 0.3048 },
  { label: '英寸 (in)', value: 'in', toBase: 0.0254, fromBase: 1 / 0.0254 },
];

const weightUnits: UnitDef[] = [
  { label: '千克 (kg)', value: 'kg', toBase: 1, fromBase: 1 },
  { label: '克 (g)', value: 'g', toBase: 0.001, fromBase: 1000 },
  { label: '毫克 (mg)', value: 'mg', toBase: 0.000001, fromBase: 1000000 },
  { label: '吨 (t)', value: 't', toBase: 1000, fromBase: 0.001 },
  { label: '磅 (lb)', value: 'lb', toBase: 0.453592, fromBase: 1 / 0.453592 },
  { label: '盎司 (oz)', value: 'oz', toBase: 0.0283495, fromBase: 1 / 0.0283495 },
];

const temperatureUnits: UnitDef[] = [
  { label: '摄氏度 (C)', value: 'C', toBase: 1, fromBase: 1 },
  { label: '华氏度 (F)', value: 'F', toBase: 1, fromBase: 1 },
  { label: '开尔文 (K)', value: 'K', toBase: 1, fromBase: 1 },
];

const areaUnits: UnitDef[] = [
  { label: '平方公里 (km²)', value: 'km2', toBase: 1000000, fromBase: 0.000001 },
  { label: '平方米 (m²)', value: 'm2', toBase: 1, fromBase: 1 },
  { label: '平方厘米 (cm²)', value: 'cm2', toBase: 0.0001, fromBase: 10000 },
  { label: '公顷 (ha)', value: 'ha', toBase: 10000, fromBase: 0.0001 },
  { label: '英亩 (acre)', value: 'acre', toBase: 4046.856, fromBase: 1 / 4046.856 },
];

const volumeUnits: UnitDef[] = [
  { label: '立方米 (m³)', value: 'm3', toBase: 1, fromBase: 1 },
  { label: '升 (L)', value: 'L', toBase: 0.001, fromBase: 1000 },
  { label: '毫升 (mL)', value: 'mL', toBase: 0.000001, fromBase: 1000000 },
  { label: '加仑 (gal)', value: 'gal', toBase: 0.00378541, fromBase: 1 / 0.00378541 },
  { label: '夸脱 (qt)', value: 'qt', toBase: 0.000946353, fromBase: 1 / 0.000946353 },
];

const unitsMap: Record<string, UnitDef[]> = {
  length: lengthUnits,
  weight: weightUnits,
  temperature: temperatureUnits,
  area: areaUnits,
  volume: volumeUnits,
};

const category = ref('length');
const inputValue = ref(1);
const fromUnit = ref('m');
const toUnit = ref('cm');

const currentUnits = computed(() => unitsMap[category.value] || []);

watch(category, () => {
  const units = currentUnits.value;
  if (units.length > 0) {
    fromUnit.value = units[0].value;
    toUnit.value = units[Math.min(1, units.length - 1)].value;
  }
});

function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number;
  if (from === 'C') celsius = value;
  else if (from === 'F') celsius = (value - 32) * 5 / 9;
  else celsius = value - 273.15;

  if (to === 'C') return celsius;
  if (to === 'F') return celsius * 9 / 5 + 32;
  return celsius + 273.15;
}

const outputValue = computed(() => {
  if (inputValue.value === null || isNaN(inputValue.value)) return '';
  const units = currentUnits.value;
  if (!units.length) return '';

  if (category.value === 'temperature') {
    return convertTemperature(inputValue.value, fromUnit.value, toUnit.value).toFixed(2);
  }

  const fromDef = units.find(u => u.value === fromUnit.value);
  const toDef = units.find(u => u.value === toUnit.value);
  if (!fromDef || !toDef) return '';

  const baseValue = inputValue.value * fromDef.toBase;
  const result = baseValue * toDef.fromBase;
  return result.toFixed(6).replace(/\.?0+$/, '');
});

function swapUnits() {
  const tmp = fromUnit.value;
  fromUnit.value = toUnit.value;
  toUnit.value = tmp;
}
</script>
