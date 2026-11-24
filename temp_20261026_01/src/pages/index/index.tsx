import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import PackageCard from '@/components/PackageCard';
import EmptyState from '@/components/EmptyState';
import { usePackageStore } from '@/store/packageStore';
import { ExpressPackage, PackageStatus } from '@/types/package';
import { formatSyncTime } from '@/utils/format';

type FilterKey = 'all' | 'moving' | 'delivering' | 'signed';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'moving', label: '在途' },
  { key: 'delivering', label: '派送中' },
  { key: 'signed', label: '已签收' }
];

const STATUS_ORDER: Record<PackageStatus, number> = {
  delivering: 0,
  transit: 1,
  exception: 2,
  pending: 3,
  signed: 4
};

const matchFilter = (item: ExpressPackage, key: FilterKey): boolean => {
  if (key === 'all') return true;
  if (key === 'moving') return item.status === 'pending' || item.status === 'transit' || item.status === 'exception';
  if (key === 'delivering') return item.status === 'delivering';
  return item.status === 'signed';
};

const IndexPage: React.FC = () => {
  const packages = usePackageStore((state) => state.packages);
  const lastSyncAt = usePackageStore((state) => state.lastSyncAt);
  const syncAll = usePackageStore((state) => state.syncAll);

  const [filter, setFilter] = useState<FilterKey>('all');
  const [syncing, setSyncing] = useState(false);

  const stats = useMemo(() => {
    let moving = 0;
    let todayArrive = 0;
    let signed = 0;
    packages.forEach((item) => {
      if (item.status === 'signed') {
        signed += 1;
      } else if (item.status === 'delivering') {
        todayArrive += 1;
        moving += 1;
      } else {
        moving += 1;
      }
    });
    return { moving, todayArrive, signed };
  }, [packages]);

  const visible = useMemo(() => {
    return packages
      .filter((item) => matchFilter(item, filter))
      .sort((a, b) => {
        const gap = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        return gap !== 0 ? gap : b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [packages, filter]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    Taro.showLoading({ title: '同步物流中', mask: true });
    try {
      const changed = await syncAll();
      Taro.hideLoading();
      Taro.showToast({
        title: changed > 0 ? `更新了 ${changed} 个包裹` : '暂时没有新的物流',
        icon: 'none'
      });
    } catch (error) {
      console.error('[Index] 同步物流失败', error);
      Taro.hideLoading();
      Taro.showToast({ title: '同步失败，请稍后重试', icon: 'none' });
    } finally {
      setSyncing(false);
    }
  };

  usePullDownRefresh(async () => {
    await handleSync();
    Taro.stopPullDownRefresh();
  });

  const goDetail = (item: ExpressPackage) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerRow}>
          <View className={styles.headerLeft}>
            <Text className={styles.headerTitle}>我的包裹</Text>
            <Text className={styles.headerSub}>
              {`${stats.moving} 件在路上 · 今日必达 ${stats.todayArrive} 件`}
            </Text>
          </View>
          <View className={styles.syncBtn} onClick={handleSync}>
            <Text className={styles.syncText}>{syncing ? '同步中' : '同步'}</Text>
          </View>
        </View>
        <Text className={styles.syncHint}>{`最近同步：${formatSyncTime(lastSyncAt)}`}</Text>
      </View>

      <View className={styles.stats}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{stats.moving}</Text>
          <Text className={styles.statLabel}>在途</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={classnames(styles.statNum, styles.statNumAccent)}>{stats.todayArrive}</Text>
          <Text className={styles.statLabel}>今日必达</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{stats.signed}</Text>
          <Text className={styles.statLabel}>已签收</Text>
        </View>
      </View>

      <ScrollView scrollX className={styles.filters} showScrollbar={false}>
        {FILTERS.map((item) => (
          <View
            key={item.key}
            className={classnames(styles.chip, filter === item.key && styles.chipActive)}
            onClick={() => setFilter(item.key)}
          >
            <Text className={classnames(styles.chipText, filter === item.key && styles.chipTextActive)}>
              {item.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.list}>
        {visible.length > 0 ? (
          visible.map((item) => <PackageCard key={item.id} item={item} onClick={goDetail} />)
        ) : (
          <EmptyState
            title="这里还没有包裹"
            desc="粘贴拼多多、淘宝、京东等平台的运单号，就能自动跟进物流"
            actionText="添加包裹"
            onAction={() => Taro.navigateTo({ url: '/pages/add/index' })}
          />
        )}
      </View>

      <View className={styles.fab} onClick={() => Taro.navigateTo({ url: '/pages/add/index' })}>
        <Text className={styles.fabText}>+</Text>
      </View>
    </View>
  );
};

export default IndexPage;
