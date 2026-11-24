import dayjs from 'dayjs';
import { ExpressPackage } from '@/types/package';

const now = dayjs();

/** 生成「N 分钟前」的时间字符串，保证演示数据始终是新鲜的 */
const ts = (minutesAgo: number): string =>
  now.subtract(minutesAgo, 'minute').format('YYYY-MM-DD HH:mm:ss');

/** 首次进入小程序时的演示包裹（用户新增/修改后会写入本地缓存） */
export const initialPackages: ExpressPackage[] = [
  {
    id: 'pkg_1001',
    trackingNo: 'YT4833210961788',
    carrier: '圆通速递',
    carrierCode: 'YTO',
    platform: 'taobao',
    title: '纯棉四件套 1.8m 床 亲肤透气',
    status: 'delivering',
    etaText: '预计今天送达',
    createdAt: ts(4320),
    updatedAt: ts(18),
    starred: true,
    traces: [
      {
        id: 'trace_1001_1',
        time: ts(18),
        desc: '【杭州市余杭区】快递员王师傅正在派送途中，请保持电话畅通',
        city: '杭州'
      },
      {
        id: 'trace_1001_2',
        time: ts(230),
        desc: '【杭州市余杭区】快件已到达仓前网点，正在安排派送',
        city: '杭州'
      },
      {
        id: 'trace_1001_3',
        time: ts(700),
        desc: '【杭州市】快件已从杭州转运中心发出，下一站余杭分拨中心',
        city: '杭州'
      },
      {
        id: 'trace_1001_4',
        time: ts(1500),
        desc: '【苏州市】快件已到达苏州转运中心',
        city: '苏州'
      },
      {
        id: 'trace_1001_5',
        time: ts(2100),
        desc: '【苏州市】圆通速递已揽收快件',
        city: '苏州'
      }
    ]
  },
  {
    id: 'pkg_1002',
    trackingNo: 'JT3025678123456',
    carrier: '极兔速递',
    carrierCode: 'JTSD',
    platform: 'pdd',
    title: '无线蓝牙耳机 降噪长续航 白色',
    status: 'delivering',
    etaText: '预计今天送达',
    createdAt: ts(3600),
    updatedAt: ts(26),
    starred: false,
    traces: [
      {
        id: 'trace_1002_1',
        time: ts(26),
        desc: '【上海市闵行区】快递员已取出快件，预计 2 小时内送达',
        city: '上海'
      },
      {
        id: 'trace_1002_2',
        time: ts(320),
        desc: '【上海市闵行区】快件已到达莘庄营业部，正在安排派送',
        city: '上海'
      },
      {
        id: 'trace_1002_3',
        time: ts(980),
        desc: '【上海市】快件已到达上海转运中心，正在分拣',
        city: '上海'
      },
      {
        id: 'trace_1002_4',
        time: ts(1600),
        desc: '【义乌市】极兔速递已揽收快件',
        city: '义乌'
      }
    ]
  },
  {
    id: 'pkg_1003',
    trackingNo: 'JDVA00231589012',
    carrier: '京东物流',
    carrierCode: 'JD',
    platform: 'jd',
    title: '小米空气炸锅 4L 家用大容量',
    status: 'transit',
    etaText: '预计明天送达',
    createdAt: ts(2400),
    updatedAt: ts(95),
    starred: false,
    traces: [
      {
        id: 'trace_1003_1',
        time: ts(95),
        desc: '【南京市】快件已到达南京禄口分拨中心，正在发往杭州',
        city: '南京'
      },
      {
        id: 'trace_1003_2',
        time: ts(560),
        desc: '【廊坊市】快件已从廊坊亚洲一号仓发出',
        city: '廊坊'
      },
      {
        id: 'trace_1003_3',
        time: ts(1200),
        desc: '【廊坊市】京东物流已揽收快件',
        city: '廊坊'
      }
    ]
  },
  {
    id: 'pkg_1004',
    trackingNo: 'STO8823167900456',
    carrier: '申通快递',
    carrierCode: 'STO',
    platform: 'tmall',
    title: '轻量运动跑鞋 男款 42 码',
    status: 'transit',
    etaText: '预计 10月28日 送达',
    createdAt: ts(2880),
    updatedAt: ts(180),
    starred: false,
    traces: [
      {
        id: 'trace_1004_1',
        time: ts(180),
        desc: '【广州市】快件已到达广州白云转运中心',
        city: '广州'
      },
      {
        id: 'trace_1004_2',
        time: ts(880),
        desc: '【揭阳市】快件已从揭阳发往广州',
        city: '揭阳'
      },
      {
        id: 'trace_1004_3',
        time: ts(1560),
        desc: '【揭阳市】申通快递已揽收快件',
        city: '揭阳'
      }
    ]
  },
  {
    id: 'pkg_1005',
    trackingNo: 'ZTO70123456789',
    carrier: '中通快递',
    carrierCode: 'ZTO',
    platform: 'pdd',
    title: '无谷猫粮 10kg 成猫全价粮',
    status: 'transit',
    etaText: '预计 10月28日 送达',
    createdAt: ts(3000),
    updatedAt: ts(320),
    starred: false,
    traces: [
      {
        id: 'trace_1005_1',
        time: ts(320),
        desc: '【成都市】快件已到达成都双流转运中心，正在分拣',
        city: '成都'
      },
      {
        id: 'trace_1005_2',
        time: ts(1040),
        desc: '【重庆市】快件已从重庆发往成都',
        city: '重庆'
      },
      {
        id: 'trace_1005_3',
        time: ts(1900),
        desc: '【重庆市】中通快递已揽收快件',
        city: '重庆'
      }
    ]
  },
  {
    id: 'pkg_1006',
    trackingNo: 'YD4396210877451',
    carrier: '韵达速递',
    carrierCode: 'YUNDA',
    platform: 'taobao',
    title: '316 不锈钢保温杯 500ml 带滤网',
    status: 'transit',
    etaText: '预计明天送达',
    createdAt: ts(3300),
    updatedAt: ts(760),
    starred: false,
    traces: [
      {
        id: 'trace_1006_1',
        time: ts(760),
        desc: '【武汉市】快件已到达武汉分拨中心，等待发往杭州',
        city: '武汉'
      },
      {
        id: 'trace_1006_2',
        time: ts(1440),
        desc: '【武汉市】韵达速递已揽收快件',
        city: '武汉'
      }
    ]
  },
  {
    id: 'pkg_1007',
    trackingNo: 'SF1388225510973',
    carrier: '顺丰速运',
    carrierCode: 'SF',
    platform: 'jd',
    title: '机械键盘 87 键 热插拔轴体',
    status: 'signed',
    etaText: '已于昨天 15:20 签收',
    createdAt: ts(4200),
    updatedAt: ts(1020),
    starred: false,
    traces: [
      {
        id: 'trace_1007_1',
        time: ts(1020),
        desc: '【深圳市南山区】快件已签收，签收人：丰巢快递柜。感谢使用顺丰速运',
        city: '深圳'
      },
      {
        id: 'trace_1007_2',
        time: ts(1180),
        desc: '【深圳市南山区】快件已放入丰巢智能柜，取件码 8821',
        city: '深圳'
      },
      {
        id: 'trace_1007_3',
        time: ts(1500),
        desc: '【深圳市】快件已到达南山科技园营业点',
        city: '深圳'
      },
      {
        id: 'trace_1007_4',
        time: ts(2600),
        desc: '【东莞市】顺丰速运已揽收快件',
        city: '东莞'
      }
    ]
  },
  {
    id: 'pkg_1008',
    trackingNo: 'YT7712093456789',
    carrier: '圆通速递',
    carrierCode: 'YTO',
    platform: 'tmall',
    title: '烟酰胺护肤精华套装 30ml',
    status: 'signed',
    etaText: '已于昨天 11:06 签收',
    createdAt: ts(4500),
    updatedAt: ts(1500),
    starred: false,
    traces: [
      {
        id: 'trace_1008_1',
        time: ts(1500),
        desc: '【杭州市西湖区】快件已签收，签收人：本人',
        city: '杭州'
      },
      {
        id: 'trace_1008_2',
        time: ts(1700),
        desc: '【杭州市西湖区】快递员派送中，请保持电话畅通',
        city: '杭州'
      },
      {
        id: 'trace_1008_3',
        time: ts(2400),
        desc: '【杭州市】快件已到达西湖区网点',
        city: '杭州'
      }
    ]
  },
  {
    id: 'pkg_1009',
    trackingNo: 'JT3088123456701',
    carrier: '极兔速递',
    carrierCode: 'JTSD',
    platform: 'pdd',
    title: '儿童启蒙绘本 20 册 注音版',
    status: 'signed',
    etaText: '已于 10月24日 09:40 签收',
    createdAt: ts(6000),
    updatedAt: ts(2600),
    starred: false,
    traces: [
      {
        id: 'trace_1009_1',
        time: ts(2600),
        desc: '【杭州市拱墅区】快件已签收，签收人：本人',
        city: '杭州'
      },
      {
        id: 'trace_1009_2',
        time: ts(2800),
        desc: '【杭州市拱墅区】快递员正在派送途中',
        city: '杭州'
      },
      {
        id: 'trace_1009_3',
        time: ts(3600),
        desc: '【杭州市】极兔速递已揽收快件',
        city: '杭州'
      }
    ]
  },
  {
    id: 'pkg_1010',
    trackingNo: 'JDVA00230998871',
    carrier: '京东物流',
    carrierCode: 'JD',
    platform: 'jd',
    title: '移动硬盘 1TB USB3.2 高速传输',
    status: 'exception',
    etaText: '预计延误 1 天',
    createdAt: ts(3800),
    updatedAt: ts(420),
    starred: false,
    traces: [
      {
        id: 'trace_1010_1',
        time: ts(420),
        desc: '【杭州市】受暴雨天气影响，快件滞留杭州分拨中心，预计延误 1 天',
        city: '杭州'
      },
      {
        id: 'trace_1010_2',
        time: ts(1100),
        desc: '【上海市】快件已到达上海青浦分拨中心',
        city: '上海'
      },
      {
        id: 'trace_1010_3',
        time: ts(2200),
        desc: '【上海市】京东物流已揽收快件',
        city: '上海'
      }
    ]
  }
];
