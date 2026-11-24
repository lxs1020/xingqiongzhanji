import { CarrierOption, PackageStatus, PackageStatusMeta, PlatformCode, PlatformMeta } from '@/types/package';

/** 平台展示信息 */
export const PLATFORM_META: Record<PlatformCode, PlatformMeta> = {
  pdd: { name: '拼多多', short: '拼', color: '#e22e1f', soft: '#fdecea' },
  taobao: { name: '淘宝', short: '淘', color: '#ff5000', soft: '#fff1e8' },
  jd: { name: '京东', short: '京', color: '#e1251b', soft: '#ffefef' },
  tmall: { name: '天猫', short: '猫', color: '#ff0036', soft: '#ffe9ee' },
  other: { name: '其他平台', short: '包', color: '#4e5969', soft: '#f2f3f5' }
};

/** 可选平台（添加包裹时使用） */
export const PLATFORM_OPTIONS: PlatformCode[] = ['pdd', 'taobao', 'jd', 'tmall', 'other'];

/** 状态展示信息 */
export const STATUS_META: Record<PackageStatus, PackageStatusMeta> = {
  pending: { label: '待揽收', step: 0 },
  transit: { label: '运输中', step: 1 },
  delivering: { label: '派送中', step: 2 },
  signed: { label: '已签收', step: 3 },
  exception: { label: '物流异常', step: -1 }
};

/** 进度条节点顺序 */
export const STATUS_STEPS: PackageStatus[] = ['pending', 'transit', 'delivering', 'signed'];

/** 进度条节点文案 */
export const STEP_LABELS: string[] = ['已揽收', '运输中', '派送中', '已签收'];

/** 常见快递公司及单号前缀特征 */
export const CARRIERS: CarrierOption[] = [
  { code: 'SF', name: '顺丰速运', prefixes: ['SF'] },
  { code: 'YTO', name: '圆通速递', prefixes: ['YT', 'D'] },
  { code: 'ZTO', name: '中通快递', prefixes: ['ZTO', '75', '78'] },
  { code: 'JTSD', name: '极兔速递', prefixes: ['JT'] },
  { code: 'JD', name: '京东物流', prefixes: ['JD', 'JDV'] },
  { code: 'STO', name: '申通快递', prefixes: ['STO', '88'] },
  { code: 'YUNDA', name: '韵达速递', prefixes: ['YD', '43'] },
  { code: 'EMS', name: 'EMS', prefixes: ['EMS', 'E'] },
  { code: 'OTHER', name: '其他快递', prefixes: [] }
];
