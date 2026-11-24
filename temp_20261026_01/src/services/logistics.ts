import dayjs from 'dayjs';
import { AddPackageInput, CarrierOption, ExpressPackage, PackageStatus, PlatformCode, TraceNode } from '@/types/package';
import { CARRIERS } from '@/data/constants';

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const CITIES = ['杭州', '苏州', '上海', '广州', '成都', '武汉', '南京', '深圳'];

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const makeId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

/** 根据单号特征识别快递公司 */
export const detectCarrier = (trackingNo: string): CarrierOption => {
  const no = trackingNo.trim().toUpperCase();
  const matched = CARRIERS.find(
    (carrier) => carrier.prefixes.length > 0 && carrier.prefixes.some((prefix) => no.startsWith(prefix))
  );
  return matched || CARRIERS[CARRIERS.length - 1];
};

/** 根据状态推算预计送达文案 */
export const etaForStatus = (status: PackageStatus): string => {
  switch (status) {
    case 'pending':
      return '预计 2 天内送达';
    case 'transit':
      return '预计明天送达';
    case 'delivering':
      return '预计今天送达';
    case 'signed':
      return '已签收';
    default:
      return '预计延误 1 天';
  }
};

/** 根据输入创建新包裹（首次生成两条模拟轨迹） */
export const createPackage = (input: AddPackageInput): ExpressPackage => {
  const now = dayjs();
  const nowStr = now.format(DATE_TIME_FORMAT);
  const city = pick(CITIES);
  const pickUpTime = now.subtract(2, 'hour').format(DATE_TIME_FORMAT);

  const traces: TraceNode[] = [
    {
      id: makeId('trace'),
      time: nowStr,
      desc: `【${city}】快件已到达${city}转运中心，正在分拣`,
      city
    },
    {
      id: makeId('trace'),
      time: pickUpTime,
      desc: `【${city}】${input.carrier}已揽收快件`,
      city
    }
  ];

  console.info('[Logistics] 创建包裹', input.trackingNo, input.carrier);

  return {
    id: makeId('pkg'),
    trackingNo: input.trackingNo.trim().toUpperCase(),
    carrier: input.carrier,
    carrierCode: input.carrierCode,
    platform: input.platform,
    title: input.title.trim() || '未命名包裹',
    status: 'transit',
    traces,
    etaText: etaForStatus('transit'),
    createdAt: nowStr,
    updatedAt: nowStr,
    starred: false
  };
};

/**
 * 模拟一次物流同步：可能推进状态、追加轨迹
 * 接入真实接口后，这里替换为「按单号查询物流」的请求即可
 */
export const advancePackage = (pkg: ExpressPackage): { pkg: ExpressPackage; changed: boolean } => {
  if (pkg.status === 'signed') {
    return { pkg, changed: false };
  }

  const roll = Math.random();
  const city = pick(CITIES);
  const nowStr = dayjs().format(DATE_TIME_FORMAT);
  let nextStatus: PackageStatus = pkg.status;
  let desc = '';

  if (pkg.status === 'pending') {
    nextStatus = 'transit';
    desc = `【${city}】${pkg.carrier}已揽收快件，正在发往转运中心`;
  } else if (pkg.status === 'transit') {
    if (roll < 0.35) {
      nextStatus = 'delivering';
      desc = `【${city}】快件已到达${city}派送网点，快递员正在派送，请保持电话畅通`;
    } else if (roll < 0.9) {
      desc = `【${city}】快件已到达${city}转运中心，正在发往下一站`;
    } else {
      return { pkg, changed: false };
    }
  } else if (pkg.status === 'delivering') {
    if (roll < 0.4) {
      nextStatus = 'signed';
      desc = `【${city}】快件已签收，签收人：本人。感谢使用${pkg.carrier}`;
    } else {
      desc = `【${city}】快递员已取件出发，预计 2 小时内送达`;
    }
  } else if (pkg.status === 'exception') {
    if (roll < 0.35) {
      nextStatus = 'transit';
      desc = `【${city}】滞留问题已处理，快件恢复运输`;
    } else {
      return { pkg, changed: false };
    }
  }

  const trace: TraceNode = { id: makeId('trace'), time: nowStr, desc, city };

  return {
    changed: true,
    pkg: {
      ...pkg,
      status: nextStatus,
      traces: [trace, ...pkg.traces].slice(0, 12),
      updatedAt: nowStr,
      etaText:
        nextStatus === 'signed'
          ? `已于今天 ${dayjs().format('HH:mm')} 签收`
          : etaForStatus(nextStatus)
    }
  };
};

/** 模拟「手机号一键汇总」：返回该手机号下全网包裹 */
export const simulatePhoneSync = (phone: string): ExpressPackage[] => {
  const pool = [
    { title: '加厚珊瑚绒睡衣 秋冬款', platform: 'pdd' as PlatformCode, trackingNo: 'JT3066227810093', carrier: '极兔速递', carrierCode: 'JTSD' },
    { title: '便携折叠椅 户外露营', platform: 'taobao' as PlatformCode, trackingNo: 'YT8890123345671', carrier: '圆通速递', carrierCode: 'YTO' },
    { title: '陶瓷马克杯 350ml 带盖', platform: 'jd' as PlatformCode, trackingNo: 'JDVA00231887765', carrier: '京东物流', carrierCode: 'JD' },
    { title: 'Type-C 快充数据线 1.5m', platform: 'tmall' as PlatformCode, trackingNo: 'SF1390217745228', carrier: '顺丰速运', carrierCode: 'SF' }
  ];

  const count = 2 + Math.floor(Math.random() * 2);
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count);

  console.info('[Logistics] 手机号同步', phone, '命中包裹数', picked.length);

  return picked.map((item) => {
    const base = createPackage({
      trackingNo: item.trackingNo,
      carrier: item.carrier,
      carrierCode: item.carrierCode,
      platform: item.platform,
      title: item.title
    });
    const delivering = Math.random() < 0.4;
    return {
      ...base,
      status: delivering ? 'delivering' : 'transit',
      etaText: etaForStatus(delivering ? 'delivering' : 'transit'),
      traces: [
        {
          id: makeId('trace'),
          time: dayjs().format(DATE_TIME_FORMAT),
          desc: delivering
            ? `【${base.traces[0].city}】快递员正在派送，请保持电话畅通`
            : `【${base.traces[0].city}】快件已到达${base.traces[0].city}转运中心`,
          city: base.traces[0].city
        },
        ...base.traces
      ]
    };
  });
};
