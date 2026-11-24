import React from 'react';
import { Text, View } from '@tarojs/components';
import styles from './index.module.scss';
import StatusTag from '@/components/StatusTag';
import ProgressSteps from '@/components/ProgressSteps';
import { ExpressPackage } from '@/types/package';
import { PLATFORM_META } from '@/data/constants';
import { relativeText } from '@/utils/format';

interface PackageCardProps {
  item: ExpressPackage;
  onClick?: (item: ExpressPackage) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ item, onClick }) => {
  const platform = PLATFORM_META[item.platform];
  const latest = item.traces[0];

  return (
    <View className={styles.card} onClick={() => onClick && onClick(item)}>
      <View className={styles.top}>
        <View className={styles.badge} style={{ background: platform.soft, color: platform.color }}>
          <Text className={styles.badgeText}>{platform.short}</Text>
        </View>
        <View className={styles.info}>
          <Text className={styles.title}>{item.title}</Text>
          <Text className={styles.meta}>{`${platform.name} · ${item.carrier} · ${item.trackingNo}`}</Text>
        </View>
        <StatusTag status={item.status} />
      </View>

      {latest ? (
        <View className={styles.traceBox}>
          <Text className={styles.traceText}>{latest.desc}</Text>
        </View>
      ) : null}

      <View className={styles.steps}>
        <ProgressSteps status={item.status} />
      </View>

      <View className={styles.footer}>
        <Text className={styles.eta}>{item.etaText}</Text>
        <Text className={styles.updateAt}>{`${relativeText(item.updatedAt)}更新`}</Text>
      </View>
    </View>
  );
};

export default PackageCard;
