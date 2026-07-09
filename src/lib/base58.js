// Bitcoin-style Base58 / Base58Check — pure JS, no dependencies.

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP = {};
for (let i = 0; i < ALPHABET.length; i++) ALPHABET_MAP[ALPHABET[i]] = i;

export function decodeBase58(str) {
  if (str.length === 0) return new Uint8Array(0);
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const val = ALPHABET_MAP[str[i]];
    if (val === undefined) throw new Error('包含非法的 Base58 字符: ' + str[i]);
    let carry = val;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // 前导 1 对应前导 0x00（小端构建，故补到末尾，最后整体反转）
  for (let i = 0; i < str.length && str[i] === '1'; i++) bytes.push(0);
  bytes.reverse();
  return Uint8Array.from(bytes);
}

export function encodeBase58(bytes) {
  if (bytes.length === 0) return '';
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let result = '';
  for (let i = 0; i < bytes.length - 1 && bytes[i] === 0; i++) result += '1';
  for (let j = digits.length - 1; j >= 0; j--) result += ALPHABET[digits[j]];
  return result;
}
