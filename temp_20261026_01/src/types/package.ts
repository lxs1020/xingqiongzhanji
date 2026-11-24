/** 物流状态 */
export type PackageStatus = 'pending' | 'transit' | 'delivering' | 'signed' | 'exception';

/** 来源电商平台 */
export type PlatformCode = 'pdd' | 'taobao' | 'jd' | 'tmall' | 'other';

/** 单条物流轨迹 */
export interface TraceNode {
  id: string;
  /** YYYY-MM-DD HH:mm:ss */
  time: string;
  desc: string;
  city: string;
}

/** 包裹 */
export interface ExpressPackage {
  id: string;
  trackingNo: string;
  carrier: string;
  carrierCode: string;
  platform: PlatformCode;
  title: string;
  status: PackageStatus;
  /** 最新轨迹在最前 */
  traces: TraceNode[];
  etaText: string;
  /** YYYY-MM-DD HH:mm:ss */
  createdAt: string;
  /** YYYY-MM-DD HH:mm:ss */
  updatedAt: string;
  starred: boolean;
}

/** 新增包裹表单 */
export interface AddPackageInput {
  trackingNo: string;
  carrier: string;
  carrierCode: string;
  platform: PlatformCode;
  title: string;
}

/** 快递公司 */
export interface CarrierOption {
  code: string;
  name: string;
  /** 单号前缀特征（大写） */
  prefixes: string[];
}

/** 平台展示信息 */
export interface PlatformMeta {
  name: string;
  short: string;
  color: string;
  soft: string;
}

/** 状态展示信息 */
export interface PackageStatusMeta {
  label: string;
  /** 进度条所处节点 0~3，异常状态为 -1 */
  step: number;
}
