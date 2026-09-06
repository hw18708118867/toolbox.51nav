/**
 * 密文输入归一化
 *
 * 解决「从 URL 里复制出来的密文解不开」这类问题。Base64 里的 + / = 三个字符
 * 在 URL 中会被转义成 %2B %2F %3D，直接喂给 CryptoJS.enc.Base64.parse 不会报错，
 * 只会静默解析出错误的字节数，最终表现为「密钥或 IV 不正确」的误导性提示。
 *
 * 注意：只用于密文，不要用于密钥和 IV——密钥可能本身就是含 % 的普通字符串
 * （比如 my%secret），自动解码反而会把正确的密钥改坏。
 */

export interface NormalizedCipher {
  /** 归一化后的密文 */
  value: string;
  /** 对输入做了哪些处理，用于提示用户 */
  notes: string[];
}

/**
 * @param raw       用户粘贴的原始输入
 * @param isBase64  true 表示密文是 Base64（此时才会做空格 → + 的还原）
 */
export function normalizeCipherInput(raw: string, isBase64: boolean): NormalizedCipher {
  const notes: string[] = [];
  const stripBreaks = (s: string) => s.replace(/[\r\n\t\f\v]+/g, '');

  let s = stripBreaks(raw.trim());

  // URL 解码，循环几次以兼容被二次编码的情况
  for (let i = 0; i < 3; i++) {
    if (!/%[0-9a-fA-F]{2}/.test(s)) break;
    let next: string;
    try {
      next = decodeURIComponent(s);
    } catch {
      break; // 存在非法转义序列，保持原样，不硬解
    }
    if (next === s) break;
    s = stripBreaks(next);
    notes.push('已 URL 解码');
  }

  // 密文塞进 URL 时 + 常被顶替成空格
  if (isBase64 && s.includes(' ')) {
    s = s.replace(/ /g, '+');
    notes.push('空格已还原为 +');
  }

  s = s.replace(/\s+/g, ''); // 兜底去掉其余空白
  return { value: s, notes };
}

/** 把归一化结果转成给用户看的提示文案；输入未被改动时返回空串 */
export function describeCipherNormalization(notes: string[]): string {
  if (!notes.length) return '';
  return `已自动处理输入：${[...new Set(notes)].join('、')}`;
}
