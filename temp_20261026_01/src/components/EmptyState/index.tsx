import React from 'react';
import { Text, View } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  title: string;
  desc?: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, desc, actionText, onAction }) => {
  return (
    <View className={styles.wrap}>
      <View className={styles.icon}>
        <View className={styles.boxTop} />
        <View className={styles.boxBody} />
      </View>
      <Text className={styles.title}>{title}</Text>
      {desc ? <Text className={styles.desc}>{desc}</Text> : null}
      {actionText && onAction ? (
        <View className={styles.action} onClick={onAction}>
          <Text className={styles.actionText}>{actionText}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default EmptyState;
