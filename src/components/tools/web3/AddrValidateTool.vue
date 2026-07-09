<template>
  <div class="space-y-4">
    <div class="rounded-md border p-4" style="border-color: var(--color-border);">
      <label class="text-xs font-medium block mb-2" style="color: var(--color-text-secondary);">待校验的区块链地址</label>
      <textarea
        v-model="address"
        rows="2"
        placeholder="粘贴任意地址，例如 0x4e833... / 1A1zP1eP5... / T...
工具会自动识别并校验它能匹配的所有链"
        class="w-full rounded-md border px-3 py-2 text-sm font-mono resize-y focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      ></textarea>
      <p class="text-xs mt-2" style="color: var(--color-text-muted);">支持：以太坊（EIP-55 校验和）、比特币（Base58Check）、波场 TRON（Base58Check / T...）、Solana（Base58，32 字节公钥）。</p>
    </div>

    <div v-if="!address.trim()" class="text-sm text-center py-6" style="color: var(--color-text-muted);">
      输入地址后即可看到各链的校验结果
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="r in results"
        :key="r.chain"
        class="rounded-md border px-4 py-3"
        :style="r.level === 'valid' ? 'border-color: #86efac; background-color: #f0fdf4;' : r.level === 'invalid' ? 'border-color: #fecaca; background-color: #fef2f2;' : 'border-color: var(--color-border); background-color: var(--color-bg-secondary);'"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold" style="color: var(--color-text);">{{ r.name }}</span>
            <span
              class="text-[11px] font-bold px-2 py-0.5 rounded"
              :style="r.level === 'valid' ? 'background-color: #16a34a; color: #fff;' : r.level === 'invalid' ? 'background-color: #dc2626; color: #fff;' : 'background-color: #94a3b8; color: #fff;'"
            >{{ r.level === 'valid' ? '有效 ✓' : r.level === 'invalid' ? '无效 ✗' : '不适用' }}</span>
          </div>
          <span v-if="r.type" class="text-xs" style="color: var(--color-text-muted);">{{ r.type }}</span>
        </div>
        <ul v-if="r.details.length" class="mt-2 space-y-1">
          <li v-for="(d, i) in r.details" :key="i" class="text-xs" style="color: var(--color-text-secondary);">{{ d }}</li>
        </ul>
      </div>
    </div>

    <p class="text-xs leading-relaxed" style="color: var(--color-text-muted);">
      校验仅在本地进行，不会向任何节点发送请求。注意：通过格式/校验和校验仅说明地址“格式合法”，不代表该地址一定有余额或存在链上。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { keccak_256 } from '@noble/hashes/sha3';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { decodeBase58 } from '../../../lib/base58';

const address = ref('');

interface Result {
  chain: string;
  name: string;
  level: 'valid' | 'invalid' | 'na';
  type?: string;
  details: string[];
}

function sha256d(b: Uint8Array): Uint8Array {
  return sha256(sha256(b));
}

function validateEth(addr: string): Result {
  const m = addr.match(/^0x[0-9a-fA-F]{40}$/);
  if (!m) return { chain: 'eth', name: '以太坊 Ethereum', level: 'na', details: [] };
  const body = addr.slice(2); // 去掉 0x 前缀，40 个十六进制字符
  const lower = body.toLowerCase();
  const hashHex = bytesToHex(keccak_256(lower));
  let expected = '0x';
  for (let i = 0; i < 40; i++) {
    expected += parseInt(hashHex[i], 16) >= 8 ? body[i].toUpperCase() : body[i].toLowerCase();
  }
  if (addr === '0x' + lower) {
    return { chain: 'eth', name: '以太坊 Ethereum', level: 'valid', type: 'EIP-55 未启用（全小写）', details: ['地址格式合法，但未携带 EIP-55 校验和', '建议发送方使用带校验和的混大小写格式以便防错'] };
  }
  if (addr === expected) {
    return { chain: 'eth', name: '以太坊 Ethereum', level: 'valid', type: 'EIP-55 校验和正确', details: ['混大小写格式且校验和通过', '该地址与公钥哈希一致，未被误输入'] };
  }
  return { chain: 'eth', name: '以太坊 Ethereum', level: 'invalid', type: 'EIP-55 校验和错误', details: ['混大小写格式，但校验和不匹配', '说明地址中的字母大小写被改动了（常见复制粘贴错误）'] };
}

function validateBase58Check(addr: string, chain: string, name: string, versionName: (v: number) => string): Result {
  let all: Uint8Array;
  try {
    all = decodeBase58(addr);
  } catch (e: any) {
    return { chain, name, level: 'invalid', details: ['包含非法的 Base58 字符：' + (e.message || '')] };
  }
  if (all.length < 5) return { chain, name, level: 'invalid', details: ['长度过短，不是合法的 Base58Check 编码'] };
  const body = all.subarray(0, all.length - 4);
  const checksum = all.subarray(all.length - 4);
  const expected = sha256d(body).slice(0, 4);
  if (bytesToHex(checksum) !== bytesToHex(expected)) {
    return { chain, name, level: 'invalid', details: ['校验和错误：地址可能被截断或篡改'] };
  }
  const ver = body[0];
  return { chain, name, level: 'valid', type: versionName(ver), details: ['Base58Check 校验和正确', '载荷长度 ' + body.length + ' 字节'] };
}

const results = computed<Result[]>(() => {
  const a = address.value.trim();
  if (!a) return [];
  return [
    validateEth(a),
    validateBase58Check(a, 'btc', '比特币 Bitcoin', (v) =>
      v === 0x00 ? 'P2PKH（普通地址，1 开头）' : v === 0x05 ? 'P2SH（脚本哈希，3 开头）' : v === 0x6f ? '测试网 P2PKH' : '未知版本字节 0x' + v.toString(16)),
    validateBase58Check(a, 'trx', '波场 TRON', (v) =>
      v === 0x41 ? 'Tron 地址（41 + 20 字节）' : '版本字节应为 0x41，实际 0x' + v.toString(16)),
    validateSol(a),
  ].filter((r) => r.level !== 'na' || ['eth', 'btc', 'trx', 'sol'].includes(r.chain));
});

function validateSol(addr: string): Result {
  let all: Uint8Array;
  try {
    all = decodeBase58(addr);
  } catch (e: any) {
    return { chain: 'sol', name: 'Solana', level: 'na', details: [] };
  }
  if (all.length === 32) {
    return { chain: 'sol', name: 'Solana', level: 'valid', type: 'ed25519 公钥（32 字节）', details: ['Base58 解码为 32 字节，符合 Solana 地址长度', '注：Solana 地址无内置校验和，仅能验证长度与编码'] };
  }
  return { chain: 'sol', name: 'Solana', level: 'na', details: [] };
}
</script>
