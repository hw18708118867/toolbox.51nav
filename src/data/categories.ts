export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}

export const categories: Category[] = [
  {
    id: 'encoding',
    name: '编码解码',
    description: 'Base64、URL、Hex、Unicode 等常见编码格式转换',
    icon: 'binary',
    order: 1,
  },
  {
    id: 'encryption',
    name: '加密解密',
    description: 'AES、DES、RSA、SM4 等对称与非对称加密',
    icon: 'lock',
    order: 2,
  },
  {
    id: 'hashing',
    name: '哈希散列',
    description: 'MD5、SHA、SM3、HMAC 等哈希算法计算',
    icon: 'hash',
    order: 3,
  },
  {
    id: 'text',
    name: '文本处理',
    description: '大小写转换、字数统计、文本对比、去重等',
    icon: 'type',
    order: 4,
  },
  {
    id: 'regex',
    name: '正则表达式',
    description: '正则测试、速查表、正则生成',
    icon: 'regex',
    order: 5,
  },
  {
    id: 'data-format',
    name: '数据格式',
    description: 'JSON、XML、YAML、CSV、TOML 格式转换',
    icon: 'braces',
    order: 6,
  },
  {
    id: 'network',
    name: '网络工具',
    description: 'IP 查询、URL 解析、DNS 查询、子网计算',
    icon: 'globe',
    order: 7,
  },
  {
    id: 'security',
    name: '安全工具',
    description: '密码生成、泄露检测、证书解析、TOTP',
    icon: 'shield',
    order: 8,
  },
  {
    id: 'converter',
    name: '编程转换',
    description: '时间戳、进制、颜色、单位转换',
    icon: 'repeat',
    order: 9,
  },
  {
    id: 'image',
    name: '图片工具',
    description: '图片压缩、格式转换、水印、EXIF 查看',
    icon: 'image',
    order: 10,
  },
  {
    id: 'css',
    name: 'CSS 工具',
    description: '渐变生成、阴影编辑、Flexbox/Grid 演练',
    icon: 'palette',
    order: 11,
  },
  {
    id: 'javascript',
    name: 'JS 工具',
    description: 'JS 压缩、格式化、混淆、在线运行',
    icon: 'file-code',
    order: 12,
  },
  {
    id: 'generator',
    name: '生成工具',
    description: 'UUID、NanoID、随机字符串、模拟数据',
    icon: 'sparkles',
    order: 13,
  },
  {
    id: 'math',
    name: '数学计算',
    description: '进制计算、位运算、表达式求值',
    icon: 'calculator',
    order: 14,
  },
  {
    id: 'document',
    name: '文档转换',
    description: 'HTML/Markdown 互转、JSON 转代码类型',
    icon: 'file-text',
    order: 15,
  },
  {
    id: 'analysis',
    name: '数据分析',
    description: '频率分析、信息熵、编码检测',
    icon: 'bar-chart',
    order: 16,
  },
];

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
