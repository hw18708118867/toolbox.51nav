<template>
  <div class="space-y-3">
    <div class="flex gap-2">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索字符名称或 U+ 编码..."
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none "

        @keyup.escape="searchQuery = ''"
      />
      <button
        v-if="searchQuery"
        @click="searchQuery = ''"
        class="px-3 py-2 rounded-md border text-xs"
        style="background-color: var(--color-bg-secondary); color: var(--color-text-muted); border-color: var(--color-border);"
      >
        清除
      </button>
    </div>

    <TabView :tabs="blockTabs">
      <template v-for="(block, idx) in unicodeBlocks" :key="idx" #[`tab-${idx}`]>
        <div class="space-y-3">
          <div class="text-xs" style="color: var(--color-text-muted);">
            {{ block.name }} — 范围 {{ block.start }}..{{ block.end }} (共 {{ block.end - block.start + 1 }} 字符)
          </div>

          <div
            v-if="getFilteredChars(block).length === 0"
            class="py-8 text-center text-sm"
            style="color: var(--color-text-muted);"
          >
            没有匹配的字符
          </div>

          <div class="rounded-md border overflow-auto max-h-[480px]" style="border-color: var(--color-border);">
            <table class="w-full text-sm" style="border-collapse: collapse;">
              <thead class="sticky top-0 z-10" style="background-color: var(--color-bg-secondary);">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium" style="color: var(--color-text-secondary); border-bottom: 2px solid var(--color-border); width: 80px;">编码</th>
                  <th class="px-3 py-2 text-center text-xs font-medium" style="color: var(--color-text-secondary); border-bottom: 2px solid var(--color-border); width: 60px;">字符</th>
                  <th class="px-3 py-2 text-left text-xs font-medium" style="color: var(--color-text-secondary); border-bottom: 2px solid var(--color-border); width: 80px;">Dec</th>
                  <th class="px-3 py-2 text-left text-xs font-medium" style="color: var(--color-text-secondary); border-bottom: 2px solid var(--color-border);">名称</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="char in getFilteredChars(block)"
                  :key="char.codepoint"
                  class="transition-colors"
                  @mouseenter="hoveredCodepoint = char.codepoint"
                  @mouseleave="hoveredCodepoint = ''"
                  :style="{ backgroundColor: hoveredCodepoint === char.codepoint ? 'var(--color-bg-tertiary)' : 'transparent' }"
                >
                  <td class="px-3 py-2 font-mono text-xs" style="color: var(--color-primary);">U+{{ char.hex }}</td>
                  <td class="px-3 py-2 text-center font-mono" style="font-size: 1.3em; color: var(--color-text);">{{ char.char }}</td>
                  <td class="px-3 py-2 font-mono text-xs" style="color: var(--color-text-muted);">{{ char.codepoint }}</td>
                  <td class="px-3 py-2 text-xs" style="color: var(--color-text-secondary);">{{ char.name }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));">
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TabView from '../../common/TabView.vue';

const searchQuery = ref('');
const hoveredCodepoint = ref('');

interface UnicodeChar {
  codepoint: number;
  hex: string;
  char: string;
  name: string;
}

interface UnicodeBlock {
  name: string;
  start: string;
  end: string;
  chars: UnicodeChar[];
}

function generateChars(startHex: string, endHex: string, getName: (cp: number) => string): UnicodeChar[] {
  const start = parseInt(startHex, 16);
  const end = parseInt(endHex, 16);
  const chars: UnicodeChar[] = [];
  const maxChars = 256;
  const range = end - start;
  let step = 1;
  if (range > maxChars) {
    step = Math.ceil(range / maxChars);
  }
  for (let i = start; i <= end; i += step) {
    chars.push({
      codepoint: i,
      hex: i.toString(16).toUpperCase().padStart(4, '0'),
      char: String.fromCodePoint(i),
      name: getName(i),
    });
  }
  return chars;
}

const unicodeBlocks = computed<UnicodeBlock[]>(() => {
  return [
    {
      name: '基本拉丁字母',
      start: 'U+0000',
      end: 'U+007F',
      chars: generateChars('0000', '007F', (cp) => {
        if (cp < 32) {
          const ctrl: Record<number, string> = {
            0: 'NULL', 1: 'START OF HEADING', 2: 'START OF TEXT', 3: 'END OF TEXT',
            4: 'END OF TRANSMISSION', 5: 'ENQUIRY', 6: 'ACKNOWLEDGE', 7: 'BELL',
            8: 'BACKSPACE', 9: 'HORIZONTAL TAB', 10: 'LINE FEED', 11: 'VERTICAL TAB',
            12: 'FORM FEED', 13: 'CARRIAGE RETURN', 14: 'SHIFT OUT', 15: 'SHIFT IN',
            16: 'DATA LINK ESCAPE', 17: 'DEVICE CONTROL 1', 18: 'DEVICE CONTROL 2',
            19: 'DEVICE CONTROL 3', 20: 'DEVICE CONTROL 4', 21: 'NEGATIVE ACKNOWLEDGE',
            22: 'SYNCHRONOUS IDLE', 23: 'END OF TRANSMISSION BLOCK', 24: 'CANCEL',
            25: 'END OF MEDIUM', 26: 'SUBSTITUTE', 27: 'ESCAPE', 28: 'FILE SEPARATOR',
            29: 'GROUP SEPARATOR', 30: 'RECORD SEPARATOR', 31: 'UNIT SEPARATOR',
          };
          return ctrl[cp] || 'CONTROL CHARACTER';
        }
        if (cp === 32) return 'SPACE';
        if (cp === 127) return 'DELETE';
        if (cp >= 48 && cp <= 57) return `DIGIT ${String.fromCodePoint(cp)}`;
        if (cp >= 65 && cp <= 90) return `LATIN CAPITAL LETTER ${String.fromCodePoint(cp)}`;
        if (cp >= 97 && cp <= 122) return `LATIN SMALL LETTER ${String.fromCodePoint(cp)}`;
        const names: Record<number, string> = {
          33: 'EXCLAMATION MARK', 34: 'QUOTATION MARK', 35: 'NUMBER SIGN',
          36: 'DOLLAR SIGN', 37: 'PERCENT SIGN', 38: 'AMPERSAND',
          39: 'APOSTROPHE', 40: 'LEFT PARENTHESIS', 41: 'RIGHT PARENTHESIS',
          42: 'ASTERISK', 43: 'PLUS SIGN', 44: 'COMMA', 45: 'HYPHEN-MINUS',
          46: 'FULL STOP', 47: 'SOLIDUS', 58: 'COLON', 59: 'SEMICOLON',
          60: 'LESS-THAN SIGN', 61: 'EQUALS SIGN', 62: 'GREATER-THAN SIGN',
          63: 'QUESTION MARK', 64: 'COMMERCIAL AT', 91: 'LEFT SQUARE BRACKET',
          92: 'REVERSE SOLIDUS', 93: 'RIGHT SQUARE BRACKET', 94: 'CIRCUMFLEX ACCENT',
          95: 'LOW LINE', 96: 'GRAVE ACCENT', 123: 'LEFT CURLY BRACKET',
          124: 'VERTICAL LINE', 125: 'RIGHT CURLY BRACKET', 126: 'TILDE',
        };
        return names[cp] || 'UNKNOWN';
      }),
    },
    {
      name: '拉丁字母补充',
      start: 'U+0080',
      end: 'U+00FF',
      chars: generateChars('0080', '00FF', (cp) => {
        const names: Record<number, string> = {
          0xA0: 'NO-BREAK SPACE', 0xA1: 'INVERTED EXCLAMATION MARK',
          0xA2: 'CENT SIGN', 0xA3: 'POUND SIGN', 0xA4: 'CURRENCY SIGN',
          0xA5: 'YEN SIGN', 0xA6: 'BROKEN BAR', 0xA7: 'SECTION SIGN',
          0xA8: 'DIAERESIS', 0xA9: 'COPYRIGHT SIGN', 0xAA: 'FEMININE ORDINAL INDICATOR',
          0xAB: 'LEFT-POINTING DOUBLE ANGLE QUOTATION MARK',
          0xAC: 'NOT SIGN', 0xAD: 'SOFT HYPHEN', 0xAE: 'REGISTERED SIGN',
          0xAF: 'MACRON', 0xB0: 'DEGREE SIGN', 0xB1: 'PLUS-MINUS SIGN',
          0xB2: 'SUPERSCRIPT TWO', 0xB3: 'SUPERSCRIPT THREE', 0xB4: 'ACUTE ACCENT',
          0xB5: 'MICRO SIGN', 0xB6: 'PILCROW SIGN', 0xB7: 'MIDDLE DOT',
          0xB8: 'CEDILLA', 0xB9: 'SUPERSCRIPT ONE', 0xBA: 'MASCULINE ORDINAL INDICATOR',
          0xBB: 'RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK',
          0xBC: 'VULGAR FRACTION ONE QUARTER', 0xBD: 'VULGAR FRACTION ONE HALF',
          0xBE: 'VULGAR FRACTION THREE QUARTERS', 0xBF: 'INVERTED QUESTION MARK',
          0xC0: 'LATIN CAPITAL LETTER A WITH GRAVE', 0xC1: 'LATIN CAPITAL LETTER A WITH ACUTE',
          0xC2: 'LATIN CAPITAL LETTER A WITH CIRCUMFLEX', 0xC3: 'LATIN CAPITAL LETTER A WITH TILDE',
          0xC4: 'LATIN CAPITAL LETTER A WITH DIAERESIS', 0xC5: 'LATIN CAPITAL LETTER A WITH RING ABOVE',
          0xC6: 'LATIN CAPITAL LETTER AE', 0xC7: 'LATIN CAPITAL LETTER C WITH CEDILLA',
          0xC8: 'LATIN CAPITAL LETTER E WITH GRAVE', 0xC9: 'LATIN CAPITAL LETTER E WITH ACUTE',
          0xCA: 'LATIN CAPITAL LETTER E WITH CIRCUMFLEX', 0xCB: 'LATIN CAPITAL LETTER E WITH DIAERESIS',
          0xCC: 'LATIN CAPITAL LETTER I WITH GRAVE', 0xCD: 'LATIN CAPITAL LETTER I WITH ACUTE',
          0xCE: 'LATIN CAPITAL LETTER I WITH CIRCUMFLEX', 0xCF: 'LATIN CAPITAL LETTER I WITH DIAERESIS',
          0xD0: 'LATIN CAPITAL LETTER ETH', 0xD1: 'LATIN CAPITAL LETTER N WITH TILDE',
          0xD2: 'LATIN CAPITAL LETTER O WITH GRAVE', 0xD3: 'LATIN CAPITAL LETTER O WITH ACUTE',
          0xD4: 'LATIN CAPITAL LETTER O WITH CIRCUMFLEX', 0xD5: 'LATIN CAPITAL LETTER O WITH TILDE',
          0xD6: 'LATIN CAPITAL LETTER O WITH DIAERESIS', 0xD7: 'MULTIPLICATION SIGN',
          0xD8: 'LATIN CAPITAL LETTER O WITH STROKE', 0xD9: 'LATIN CAPITAL LETTER U WITH GRAVE',
          0xDA: 'LATIN CAPITAL LETTER U WITH ACUTE', 0xDB: 'LATIN CAPITAL LETTER U WITH CIRCUMFLEX',
          0xDC: 'LATIN CAPITAL LETTER U WITH DIAERESIS', 0xDD: 'LATIN CAPITAL LETTER Y WITH ACUTE',
          0xDE: 'LATIN CAPITAL LETTER THORN', 0xDF: 'LATIN SMALL LETTER SHARP S',
          0xE0: 'LATIN SMALL LETTER A WITH GRAVE', 0xE1: 'LATIN SMALL LETTER A WITH ACUTE',
          0xE2: 'LATIN SMALL LETTER A WITH CIRCUMFLEX', 0xE3: 'LATIN SMALL LETTER A WITH TILDE',
          0xE4: 'LATIN SMALL LETTER A WITH DIAERESIS', 0xE5: 'LATIN SMALL LETTER A WITH RING ABOVE',
          0xE6: 'LATIN SMALL LETTER AE', 0xE7: 'LATIN SMALL LETTER C WITH CEDILLA',
          0xE8: 'LATIN SMALL LETTER E WITH GRAVE', 0xE9: 'LATIN SMALL LETTER E WITH ACUTE',
          0xEA: 'LATIN SMALL LETTER E WITH CIRCUMFLEX', 0xEB: 'LATIN SMALL LETTER E WITH DIAERESIS',
          0xEC: 'LATIN SMALL LETTER I WITH GRAVE', 0xED: 'LATIN SMALL LETTER I WITH ACUTE',
          0xEE: 'LATIN SMALL LETTER I WITH CIRCUMFLEX', 0xEF: 'LATIN SMALL LETTER I WITH DIAERESIS',
          0xF0: 'LATIN SMALL LETTER ETH', 0xF1: 'LATIN SMALL LETTER N WITH TILDE',
          0xF2: 'LATIN SMALL LETTER O WITH GRAVE', 0xF3: 'LATIN SMALL LETTER O WITH ACUTE',
          0xF4: 'LATIN SMALL LETTER O WITH CIRCUMFLEX', 0xF5: 'LATIN SMALL LETTER O WITH TILDE',
          0xF6: 'LATIN SMALL LETTER O WITH DIAERESIS', 0xF7: 'DIVISION SIGN',
          0xF8: 'LATIN SMALL LETTER O WITH STROKE', 0xF9: 'LATIN SMALL LETTER U WITH GRAVE',
          0xFA: 'LATIN SMALL LETTER U WITH ACUTE', 0xFB: 'LATIN SMALL LETTER U WITH CIRCUMFLEX',
          0xFC: 'LATIN SMALL LETTER U WITH DIAERESIS', 0xFD: 'LATIN SMALL LETTER Y WITH ACUTE',
          0xFE: 'LATIN SMALL LETTER THORN', 0xFF: 'LATIN SMALL LETTER Y WITH DIAERESIS',
        };
        return names[cp] || `LATIN EXTENDED ${cp.toString(16).toUpperCase()}`;
      }),
    },
    {
      name: 'CJK 统一表意文字',
      start: 'U+4E00',
      end: 'U+9FFF',
      chars: generateChars('4E00', '9FFF', (cp) => {
        return `CJK UNIFIED IDEOGRAPH-${cp.toString(16).toUpperCase()}`;
      }),
    },
    {
      name: '常用符号',
      start: 'U+2000',
      end: 'U+206F',
      chars: generateChars('2000', '206F', (cp) => {
        const names: Record<number, string> = {
          0x2013: 'EN DASH', 0x2014: 'EM DASH', 0x2018: 'LEFT SINGLE QUOTATION MARK',
          0x2019: 'RIGHT SINGLE QUOTATION MARK', 0x201C: 'LEFT DOUBLE QUOTATION MARK',
          0x201D: 'RIGHT DOUBLE QUOTATION MARK', 0x2020: 'DAGGER', 0x2021: 'DOUBLE DAGGER',
          0x2022: 'BULLET', 0x2026: 'HORIZONTAL ELLIPSIS',
          0x2030: 'PER MILLE SIGN', 0x2032: 'PRIME', 0x2033: 'DOUBLE PRIME',
          0x2039: 'SINGLE LEFT-POINTING ANGLE QUOTATION MARK',
          0x203A: 'SINGLE RIGHT-POINTING ANGLE QUOTATION MARK',
          0x203C: 'DOUBLE EXCLAMATION MARK', 0x203E: 'OVERLINE',
          0x2044: 'FRACTION SLASH', 0x204A: 'TIRONIAN SIGN ET',
        };
        return names[cp] || `GENERAL PUNCTUATION U+${cp.toString(16).toUpperCase()}`;
      }),
    },
    {
      name: 'Emoji 表情',
      start: 'U+1F600',
      end: 'U+1F64F',
      chars: generateChars('1F600', '1F64F', (cp) => {
        const names: Record<number, string> = {
          0x1F600: 'GRINNING FACE', 0x1F601: 'GRINNING FACE WITH SMILING EYES',
          0x1F602: 'FACE WITH TEARS OF JOY', 0x1F603: 'SMILING FACE WITH OPEN MOUTH',
          0x1F604: 'SMILING FACE WITH OPEN MOUTH AND SMILING EYES',
          0x1F605: 'SMILING FACE WITH OPEN MOUTH AND COLD SWEAT',
          0x1F606: 'SMILING FACE WITH OPEN MOUTH AND TIGHTLY-CLOSED EYES',
          0x1F607: 'SMILING FACE WITH HALO', 0x1F608: 'SMILING FACE WITH HORNS',
          0x1F609: 'WINKING FACE', 0x1F60A: 'SMILING FACE WITH SMILING EYES',
          0x1F60B: 'FACE SAVOURING DELICIOUS FOOD', 0x1F60C: 'RELIEVED FACE',
          0x1F60D: 'SMILING FACE WITH HEART-SHAPED EYES',
          0x1F60E: 'SMILING FACE WITH SUNGLASSES', 0x1F60F: 'SMIRKING FACE',
          0x1F610: 'NEUTRAL FACE', 0x1F611: 'EXPRESSIONLESS FACE',
          0x1F612: 'UNAMUSED FACE', 0x1F613: 'FACE WITH COLD SWEAT',
          0x1F614: 'PENSIVE FACE', 0x1F615: 'CONFUSED FACE',
          0x1F616: 'CONFOUNDED FACE', 0x1F617: 'KISSING FACE',
          0x1F618: 'FACE THROWING A KISS', 0x1F619: 'KISSING FACE WITH SMILING EYES',
          0x1F61A: 'KISSING FACE WITH CLOSED EYES', 0x1F61B: 'FACE WITH STUCK-OUT TONGUE',
          0x1F61C: 'FACE WITH STUCK-OUT TONGUE AND WINKING EYE',
          0x1F61D: 'FACE WITH STUCK-OUT TONGUE AND TIGHTLY-CLOSED EYES',
          0x1F61E: 'DISAPPOINTED FACE', 0x1F61F: 'WORRIED FACE',
          0x1F620: 'ANGRY FACE', 0x1F621: 'POUTING FACE',
          0x1F622: 'CRYING FACE', 0x1F623: 'PERSEVERING FACE',
          0x1F624: 'FACE WITH STEAM FROM NOSE', 0x1F625: 'DISAPPOINTED BUT RELIEVED FACE',
          0x1F626: 'FROWNING FACE', 0x1F627: 'ANGUISHED FACE',
          0x1F628: 'FEARFUL FACE', 0x1F629: 'WEARY FACE',
          0x1F62A: 'SLEEPY FACE', 0x1F62B: 'TIRED FACE',
          0x1F62C: 'GRIMACING FACE', 0x1F62D: 'LOUDLY CRYING FACE',
          0x1F62E: 'FACE WITH OPEN MOUTH', 0x1F62F: 'HUSHED FACE',
          0x1F630: 'FACE WITH OPEN MOUTH AND COLD SWEAT',
          0x1F631: 'FACE SCREAMING IN FEAR', 0x1F632: 'ASTONISHED FACE',
          0x1F633: 'FLUSHED FACE', 0x1F634: 'SLEEPING FACE',
          0x1F635: 'DIZZY FACE', 0x1F636: 'FACE WITHOUT MOUTH',
          0x1F637: 'FACE WITH MEDICAL MASK', 0x1F638: 'GRINNING CAT FACE WITH SMILING EYES',
          0x1F639: 'CAT FACE WITH TEARS OF JOY', 0x1F63A: 'SMILING CAT FACE WITH OPEN MOUTH',
          0x1F63B: 'SMILING CAT FACE WITH HEART-SHAPED EYES',
          0x1F63C: 'CAT FACE WITH WRY SMILE', 0x1F63D: 'KISSING CAT FACE WITH CLOSED EYES',
          0x1F63E: 'POUTING CAT FACE', 0x1F63F: 'CRYING CAT FACE',
          0x1F640: 'WEARY CAT FACE', 0x1F641: 'SLIGHTLY FROWNING FACE',
          0x1F642: 'SLIGHTLY SMILING FACE', 0x1F643: 'UPSIDE-DOWN FACE',
          0x1F644: 'FACE WITH ROLLING EYES',
        };
        return names[cp] || `EMOJI U+${cp.toString(16).toUpperCase()}`;
      }),
    },
    {
      name: '箭头符号',
      start: 'U+2190',
      end: 'U+21FF',
      chars: generateChars('2190', '21FF', (cp) => {
        const names: Record<number, string> = {
          0x2190: 'LEFTWARDS ARROW', 0x2191: 'UPWARDS ARROW',
          0x2192: 'RIGHTWARDS ARROW', 0x2193: 'DOWNWARDS ARROW',
          0x2194: 'LEFT RIGHT ARROW', 0x2195: 'UP DOWN ARROW',
          0x2196: 'NORTH WEST ARROW', 0x2197: 'NORTH EAST ARROW',
          0x2198: 'SOUTH EAST ARROW', 0x2199: 'SOUTH WEST ARROW',
          0x21A6: 'RIGHTWARDS ARROW FROM BAR', 0x21B5: 'DOWNWARDS ARROW WITH CORNER LEFTWARDS',
          0x21BA: 'ANTICLOCKWISE OPEN CIRCLE ARROW', 0x21BB: 'CLOCKWISE OPEN CIRCLE ARROW',
          0x21D2: 'RIGHTWARDS DOUBLE ARROW', 0x21D4: 'LEFT RIGHT DOUBLE ARROW',
          0x21E4: 'LEFTWARDS ARROW TO BAR', 0x21E5: 'RIGHTWARDS ARROW TO BAR',
        };
        return names[cp] || `ARROW U+${cp.toString(16).toUpperCase()}`;
      }),
    },
  ];
});

function getFilteredChars(block: UnicodeBlock): UnicodeChar[] {
  if (!searchQuery.value.trim()) return block.chars;
  const f = searchQuery.value.toLowerCase();
  return block.chars.filter(c =>
    c.hex.toLowerCase().includes(f) ||
    c.name.toLowerCase().includes(f) ||
    c.codepoint.toString().includes(f) ||
    c.char.includes(f)
  );
}

const blockTabs = computed(() => unicodeBlocks.value.map(b => {
  const shortName = b.name.length > 8 ? b.name.slice(0, 8) + '..' : b.name;
  return shortName;
}));
</script>
