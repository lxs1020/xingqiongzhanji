import React from 'react';
import { Text, View } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { PackageStatus } from '@/types/package';
import { STATUS_META } from '@/data/constants';

interface StatusTagProps {
  status: PackageStatus;
  size?: 'sm' | 'md';
}

const StatusTag: React.FC<StatusTagProps> = ({ status, size = 'sm' }) => {
  return (
    <View className={classnames(styles.tag, styles[status], size === 'md' && styles.large)}>
      <View className={styles.dot} />
      <Text className={styles.label}>{STATUS_META[status].label}</Text>
    </View>
  );
};

export default StatusTag;
