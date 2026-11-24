import { create } from 'zustand';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import { AddPackageInput, ExpressPackage, PackageStatus } from '@/types/package';
import { initialPackages } from '@/data/packages';
import { advancePackage, createPackage, simulatePhoneSync } from '@/services/logistics';

const STORAGE_KEY = 'parcel_flow_packages_v1';
const LAST_SYNC_KEY = 'parcel_flow_last_sync_v1';

const readPackages = (): ExpressPackage[] => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (Array.isArray(raw)) {
      return raw as ExpressPackage[];
    }
  } catch (error) {
    console.error('[Store] 读取本地包裹失败', error);
  }
  return initialPackages;
};

const readLastSync = (): string => {
  try {
    const raw = Taro.getStorageSync(LAST_SYNC_KEY);
    if (typeof raw === 'string') return raw;
  } catch (error) {
    console.error('[Store] 读取同步时间失败', error);
  }
  return '';
};

const persist = (list: ExpressPackage[]): void => {
  try {
    Taro.setStorageSync(STORAGE_KEY, list);
  } catch (error) {
    console.error('[Store] 保存包裹失败', error);
  }
};

const nowStr = (): string => dayjs().format('YYYY-MM-DD HH:mm:ss');

interface PackageStore {
  packages: ExpressPackage[];
  lastSyncAt: string;
  syncAll: () => Promise<number>;
  syncFromPhone: (phone: string) => Promise<number>;
  refreshPackage: (id: string) => Promise<boolean>;
  addPackage: (input: AddPackageInput) => ExpressPackage;
  markSigned: (id: string) => void;
  removePackage: (id: string) => void;
  clearSigned: () => number;
}

export const usePackageStore = create<PackageStore>((set, get) => ({
  packages: readPackages(),
  lastSyncAt: readLastSync(),

  syncAll: async () => {
    const list = get().packages;
    let changed = 0;
    const next = list.map((item) => {
      const result = advancePackage(item);
      if (result.changed) changed += 1;
      return result.pkg;
    });
    const stamp = nowStr();
    set({ packages: next, lastSyncAt: stamp });
    persist(next);
    try {
      Taro.setStorageSync(LAST_SYNC_KEY, stamp);
    } catch (error) {
      console.error('[Store] 保存同步时间失败', error);
    }
    console.info('[Store] 全量同步完成，更新包裹数', changed);
    return changed;
  },

  syncFromPhone: async (phone: string) => {
    const added = simulatePhoneSync(phone);
    const next = [...added, ...get().packages];
    set({ packages: next, lastSyncAt: nowStr() });
    persist(next);
    return added.length;
  },

  refreshPackage: async (id: string) => {
    const target = get().packages.find((item) => item.id === id);
    if (!target) {
      console.error('[Store] 刷新失败，未找到包裹', id);
      return false;
    }
    const result = advancePackage(target);
    if (!result.changed) return false;
    const next = get().packages.map((item) => (item.id === id ? result.pkg : item));
    set({ packages: next });
    persist(next);
    return true;
  },

  addPackage: (input: AddPackageInput) => {
    const pkg = createPackage(input);
    const next = [pkg, ...get().packages];
    set({ packages: next });
    persist(next);
    return pkg;
  },

  markSigned: (id: string) => {
    const stamp = nowStr();
    const next = get().packages.map((item) => {
      if (item.id !== id) return item;
      const city = item.traces[0]?.city || '本地';
      return {
        ...item,
        status: 'signed' as PackageStatus,
        etaText: `已于今天 ${dayjs().format('HH:mm')} 签收`,
        updatedAt: stamp,
        traces: [
          {
            id: `trace_manual_${Date.now()}`,
            time: stamp,
            desc: `【${city}】快件已签收（手动标记），签收人：本人`,
            city
          },
          ...item.traces
        ]
      };
    });
    set({ packages: next });
    persist(next);
  },

  removePackage: (id: string) => {
    const next = get().packages.filter((item) => item.id !== id);
    set({ packages: next });
    persist(next);
  },

  clearSigned: () => {
    const list = get().packages;
    const next = list.filter((item) => item.status !== 'signed');
    set({ packages: next });
    persist(next);
    return list.length - next.length;
  }
}));
