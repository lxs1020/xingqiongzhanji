import React from 'react';
import { Text, View } from '@tarojs/components';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { TraceNode } from '@/types/package';
import { dayLabel } from '@/utils/format';

interface TraceTimelineProps {
  traces: TraceNode[];
}

const TraceTimeline: React.FC<TraceTimelineProps> = ({ traces }) => {
  if (!traces.length) {
    return (
      <View className={styles.empty}>
        <Text className={styles.emptyText}>暂无物流轨迹</Text>
      </View>
    );
  }

  return (
    <View className={styles.timeline}>
      {traces.map((trace, index) => {
        const isLatest = index === 0;
        return (
          <View className={styles.node} key={trace.id}>
            <View className={styles.axis}>
              <View className={classnames(styles.dot, isLatest && styles.dotLatest)} />
              {index !== traces.length - 1 && <View className={styles.line} />}
            </View>
            <View className={styles.content}>
              <Text className={classnames(styles.time, isLatest && styles.timeLatest)}>
                {`${dayLabel(trace.time)} ${dayjs(trace.time).format('HH:mm')}`}
              </Text>
              <Text className={classnames(styles.desc, isLatest && styles.descLatest)}>{trace.desc}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default TraceTimeline;
