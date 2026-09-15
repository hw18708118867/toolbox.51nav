const forge = require('node-forge');

// 生成 2048 位密钥对
const kp = forge.pki.rsa.generateKeyPair({ bits: 2048 });
const pubPem = forge.pki.publicKeyToPem(kp.publicKey);
const privPem = forge.pki.privateKeyToPem(kp.privateKey);

function getForgeMd(name) {
  switch (name) {
    case 'sha1': return forge.md.sha1;
    case 'sha512': return forge.md.sha512;
    default: return forge.md.sha256;
  }
}
function buildSchemeOptions(scheme, hash) {
  if (scheme === 'RSA-OAEP') {
    const md = getForgeMd(hash).create();
    return { md, mgf1: { md: getForgeMd(hash).create() } };
  }
  return {};
}

const tests = [
  { scheme: 'RSA-OAEP', hash: 'sha1' },
  { scheme: 'RSA-OAEP', hash: 'sha256' },
  { scheme: 'RSA-OAEP', hash: 'sha512' },
  { scheme: 'RSAES-PKCS1-V1_5', hash: 'sha256' },
];

const msg = 'hello rsa 你好';
for (const t of tests) {
  const enc = kp.publicKey.encrypt(msg, t.scheme, buildSchemeOptions(t.scheme, t.hash));
  const b64 = forge.util.encode64(enc);
  const hex = forge.util.bytesToHex(enc);
  // 解密（Base64 路径）
  const decB64 = kp.privateKey.decrypt(forge.util.decode64(b64), t.scheme, buildSchemeOptions(t.scheme, t.hash));
  // 解密（Hex 路径）
  const decHex = kp.privateKey.decrypt(forge.util.hexToBytes(hex), t.scheme, buildSchemeOptions(t.scheme, t.hash));
  console.log(`${t.scheme} / ${t.hash}: b64=${b64.length}B hex=${hex.length}B roundtripB64=${decB64 === msg} roundtripHex=${decHex === msg}`);
}
