import React, { useState } from 'react';
import { Text, View } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import StatusTag from '@/components/StatusTag';
import ProgressSteps from '@/components/ProgressSteps';
import TraceTimeline from '@/components/TraceTimeline';
import EmptyState from '@/components/EmptyState';
import { usePackageStore } from '@/store/packageStore';
import { PLATFORM_META, STATUS_META } from '@/data/constants';
import { formatDateTime } from '@/utils/format';

const DetailPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id || '';
  const pkg = usePackageStore((state) => state.packages.find((item) => item.id === id));
  const refreshPackage = usePackageStore((state) => state.refreshPackage);
  const markSigned = usePackageStore((state) => state.markSigned);
  const [refreshing, setRefreshing] = useState(false);

  if (!pkg) {
    return (
      <View className={styles.page}>
        <EmptyState
          title="包裹不存在"
          desc="该包裹可能已被清除，返回首页看看其他包裹"
          actionText="返回首页"
          onAction={() => Taro.switchTab({ url: '/pages/index/index' })}
        />
      </View>
    );
  }

  const platform = PLATFORM_META[pkg.platform];

  const copyTrackingNo = () => {
    Taro.setClipboardData({ data: pkg.trackingNo });
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    Taro.showLoading({ title: '刷新物流中', mask: true });
    try {
      const changed = await refreshPackage(pkg.id);
      Taro.hideLoading();
      Taro.showToast({ title: changed ? '物流已更新' : '暂时没有新的物流', icon: 'none' });
    } catch (error) {
      console.error('[Detail] 刷新物流失败', error);
      Taro.hideLoading();
      Taro.showToast({ title: '刷新失败，请稍后重试', icon: 'none' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkSigned = async () => {
    if (pkg.status === 'signed') {
      Taro.showToast({ title: '包裹已签收', icon: 'none' });
      return;
    }
    const res = await Taro.showModal({
      title: '标记为已签收',
      content: '用于提前关闭提醒，确认包裹已经拿到手了吗？'
    });
    if (!res.confirm) return;
    markSigned(pkg.id);
    Taro.showToast({ title: '已标记签收', icon: 'success' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <View className={styles.heroTop}>
          <View className={styles.heroLeft}>
            <Text className={styles.heroStatus}>{STATUS_META[pkg.status].label}</Text>
            <Text className={styles.heroEta}>{pkg.etaText}</Text>
          </View>
          <StatusTag status={pkg.status} size="md" />
        </View>

        <View className={styles.trackingRow}>
          <Text className={styles.trackingText}>{`${pkg.carrier} · ${pkg.trackingNo}`}</Text>
          <View className={styles.copyChip} onClick={copyTrackingNo}>
            <Text className={styles.copyText}>复制</Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <ProgressSteps status={pkg.status} />
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>包裹信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>商品</Text>
          <Text className={styles.infoValue}>{pkg.title}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>来源</Text>
          <View className={styles.platformChip} style={{ background: platform.soft }}>
            <Text className={styles.platformText} style={{ color: platform.color }}>
              {platform.name}
            </Text>
          </View>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>快递</Text>
          <Text className={styles.infoValue}>{pkg.carrier}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>添加</Text>
          <Text className={styles.infoValue}>{formatDateTime(pkg.createdAt)}</Text>
        </View>
        {pkg.status !== 'signed' ? (
          <View className={styles.actionRow} onClick={handleMarkSigned}>
            <Text className={styles.actionText}>标记为已签收</Text>
          </View>
        ) : null}
      </View>

      <View className={styles.card}>
        <View className={styles.cardHead}>
          <Text className={styles.cardTitle}>物流轨迹</Text>
          <Text className={styles.cardExtra}>{`${pkg.traces.length} 条`}</Text>
        </View>
        <TraceTimeline traces={pkg.traces} />
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.ghostBtn} onClick={copyTrackingNo}>
          <Text className={styles.ghostText}>复制单号</Text>
        </View>
        {pkg.status === 'signed' ? (
          <View className={styles.disabledBtn}>
            <Text className={styles.disabledText}>包裹已签收</Text>
          </View>
        ) : (
          <View className={styles.primaryBtn} onClick={handleRefresh}>
            <Text className={styles.primaryText}>{refreshing ? '刷新中…' : '刷新物流'}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default DetailPage;
