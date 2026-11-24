import React from 'react';
import { Text, View } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { PackageStatus } from '@/types/package';
import { STATUS_META, STATUS_STEPS, STEP_LABELS } from '@/data/constants';

interface ProgressStepsProps {
  status: PackageStatus;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ status }) => {
  const activeIndex = STATUS_META[status].step;
  const lastIndex = STATUS_STEPS.length - 1;

  return (
    <View className={styles.wrap}>
      {STATUS_STEPS.map((step, index) => (
        <View className={styles.step} key={step}>
          <View className={styles.track}>
            <View
              className={classnames(
                styles.line,
                index === 0 && styles.lineHidden,
                index !== 0 && activeIndex >= index && styles.lineActive
              )}
            />
            <View
              className={classnames(
                styles.dot,
                activeIndex >= index && styles.dotActive,
                activeIndex === index && styles.dotCurrent
              )}
            />
            <View
              className={classnames(
                styles.line,
                index === lastIndex && styles.lineHidden,
                activeIndex > index && styles.lineActive
              )}
            />
          </View>
          <Text className={classnames(styles.stepLabel, activeIndex >= index && styles.stepLabelActive)}>
            {STEP_LABELS[index]}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default ProgressSteps;
