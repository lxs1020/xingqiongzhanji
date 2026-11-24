import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import EmptyState from '@/components/EmptyState';
import StatusTag from '@/components/StatusTag';
import { usePackageStore } from '@/store/packageStore';
import { PackageStatus, PlatformCode } from '@/types/package';
import { PLATFORM_META } from '@/data/constants';
import { dayKey, formatClock } from '@/utils/format';

interface FeedEntry {
  id: string;
  time: string;
  desc: string;
  packageId: string;
  title: string;
  platform: PlatformCode;
  status: PackageStatus;
}

const DAY_TABS = [
  { offset: 0, label: '今天' },
  { offset: 1, label: '昨天' },
  { offset: 2, label: '前天' }
];

const FeedPage: React.FC = () => {
  const packages = usePackageStore((state) => state.packages);
  const [dayOffset, setDayOffset] = useState(0);

  const targetKey = dayjs().subtract(dayOffset, 'day').format('YYYY-MM-DD');

  const entries = useMemo(() => {
    const list: FeedEntry[] = [];
    packages.forEach((pkg) => {
      pkg.traces.forEach((trace) => {
        if (dayKey(trace.time) === targetKey) {
          list.push({
            id: trace.id,
            time: trace.time,
            desc: trace.desc,
            packageId: pkg.id,
            title: pkg.title,
            platform: pkg.platform,
            status: pkg.status
          });
        }
      });
    });
    return list.sort((a, b) => b.time.localeCompare(a.time));
  }, [packages, targetKey]);

  const packageCount = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((entry) => set.add(entry.packageId));
    return set.size;
  }, [entries]);

  const dayLabelText = DAY_TABS.find((tab) => tab.offset === dayOffset)?.label || '今天';

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>物流动态</Text>
        <Text className={styles.headerSub}>每天自动汇总所有包裹的最新进展</Text>
      </View>

      <ScrollView scrollX className={styles.tabs} showScrollbar={false}>
        {DAY_TABS.map((tab) => (
          <View
            key={tab.offset}
            className={classnames(styles.tab, dayOffset === tab.offset && styles.tabActive)}
            onClick={() => setDayOffset(tab.offset)}
          >
            <Text className={classnames(styles.tabText, dayOffset === tab.offset && styles.tabTextActive)}>
              {tab.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.summary}>
        <Text className={styles.summaryMain}>{`${dayLabelText} 共 ${entries.length} 条更新`}</Text>
        <Text className={styles.summarySub}>{`涉及 ${packageCount} 个包裹`}</Text>
      </View>

      <View className={styles.list}>
        {entries.length > 0 ? (
          entries.map((entry, index) => {
            const platform = PLATFORM_META[entry.platform];
            return (
              <View
                className={styles.item}
                key={entry.id}
                onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${entry.packageId}` })}
              >
                <View className={styles.timeCol}>
                  <Text className={styles.timeText}>{formatClock(entry.time)}</Text>
                  <View className={classnames(styles.dot, index === 0 && styles.dotLatest)} />
                  {index !== entries.length - 1 ? <View className={styles.line} /> : null}
                </View>

                <View className={styles.card}>
                  <View className={styles.cardTop}>
                    <View className={styles.badge} style={{ background: platform.soft, color: platform.color }}>
                      <Text className={styles.badgeText}>{platform.short}</Text>
                    </View>
                    <Text className={styles.title}>{entry.title}</Text>
                    <StatusTag status={entry.status} />
                  </View>
                  <Text className={styles.desc}>{entry.desc}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <EmptyState title={`${dayLabelText}还没有更新`} desc="下拉首页即可同步一次全部包裹的物流" />
        )}
      </View>
    </View>
  );
};

export default FeedPage;
