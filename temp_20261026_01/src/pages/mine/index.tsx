import React, { useMemo, useState } from 'react';
import { Image, Switch, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { usePackageStore } from '@/store/packageStore';

const REMINDER_KEY = 'parcel_flow_daily_reminder';
const REMIND_TIME_KEY = 'parcel_flow_remind_time';

const MASK_PHONE = '138****6688';

const MinePage: React.FC = () => {
  const packages = usePackageStore((state) => state.packages);
  const clearSigned = usePackageStore((state) => state.clearSigned);

  const [reminder, setReminder] = useState<boolean>(() => {
    try {
      return Taro.getStorageSync(REMINDER_KEY) === true;
    } catch (error) {
      console.error('[Mine] 读取提醒设置失败', error);
      return false;
    }
  });
  const [remindTime, setRemindTime] = useState<string>(() => {
    try {
      return Taro.getStorageSync(REMIND_TIME_KEY) || '08:00';
    } catch (error) {
      console.error('[Mine] 读取提醒时间失败', error);
      return '08:00';
    }
  });
  const [phone, setPhone] = useState<string>(() => {
    try {
      return Taro.getStorageSync('parcel_flow_bound_phone') || '';
    } catch (error) {
      console.error('[Mine] 读取手机号失败', error);
      return '';
    }
  });

  const stats = useMemo(() => {
    const signed = packages.filter((item) => item.status === 'signed').length;
    return {
      total: packages.length,
      moving: packages.length - signed,
      signed
    };
  }, [packages]);

  const handleReminderChange = (value: boolean) => {
    setReminder(value);
    try {
      Taro.setStorageSync(REMINDER_KEY, value);
    } catch (error) {
      console.error('[Mine] 保存提醒设置失败', error);
    }
    Taro.showToast({
      title: value ? `已开启，每天 ${remindTime} 推送物流进展` : '已关闭每日提醒',
      icon: 'none'
    });
  };

  const handleRemindTime = async () => {
    const options = ['08:00', '12:00', '18:00', '21:00'];
    try {
      const res = await Taro.showActionSheet({ itemList: options.map((item) => `每天 ${item}`) });
      const picked = options[res.tapIndex];
      setRemindTime(picked);
      Taro.setStorageSync(REMIND_TIME_KEY, picked);
      Taro.showToast({ title: `提醒时间改为 ${picked}`, icon: 'none' });
    } catch (error) {
      console.info('[Mine] 取消选择提醒时间', error);
    }
  };

  const handleBindPhone = async () => {
    try {
      const res = await Taro.showModal({
        title: phone ? '更换手机号' : '绑定手机号',
        content: '绑定后可自动汇总该手机号下拼多多、淘宝、京东等平台的包裹。演示环境将直接使用示例号码。',
        confirmText: phone ? '更换' : '绑定'
      });
      if (!res.confirm) return;
      setPhone(MASK_PHONE);
      Taro.setStorageSync('parcel_flow_bound_phone', MASK_PHONE);
      Taro.showToast({ title: '绑定成功', icon: 'success' });
    } catch (error) {
      console.error('[Mine] 绑定手机号失败', error);
    }
  };

  const handleClearSigned = async () => {
    if (stats.signed === 0) {
      Taro.showToast({ title: '没有已签收的包裹', icon: 'none' });
      return;
    }
    const res = await Taro.showModal({
      title: '清除已签收',
      content: `将移除 ${stats.signed} 个已签收的包裹记录，是否继续？`
    });
    if (!res.confirm) return;
    const count = clearSigned();
    Taro.showToast({ title: `已清除 ${count} 个包裹`, icon: 'none' });
  };

  const handleAbout = () => {
    Taro.showModal({
      title: '关于包裹管家',
      content:
        '包裹管家把散落在拼多多、淘宝、京东、天猫的快递汇总到一处，每天定时刷新物流并提醒你哪件包裹今天到。',
      showCancel: false,
      confirmText: '知道了'
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.profile}>
          <Image className={styles.avatar} src="https://picsum.photos/id/64/200/200" mode="aspectFill" />
          <View className={styles.profileInfo}>
            <Text className={styles.name}>包裹管家用户</Text>
            <Text className={styles.phone}>{phone ? `已绑定 ${phone}` : '未绑定手机号，无法自动汇总包裹'}</Text>
          </View>
          <View className={styles.bindBtn} onClick={handleBindPhone}>
            <Text className={styles.bindText}>{phone ? '换绑' : '绑定'}</Text>
          </View>
        </View>

        <View className={styles.miniStats}>
          <View className={styles.miniItem}>
            <Text className={styles.miniNum}>{stats.total}</Text>
            <Text className={styles.miniLabel}>累计包裹</Text>
          </View>
          <View className={styles.miniDivider} />
          <View className={styles.miniItem}>
            <Text className={styles.miniNum}>{stats.moving}</Text>
            <Text className={styles.miniLabel}>在途</Text>
          </View>
          <View className={styles.miniDivider} />
          <View className={styles.miniItem}>
            <Text className={styles.miniNum}>{stats.signed}</Text>
            <Text className={styles.miniLabel}>已签收</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>推送与同步</Text>
        <View className={styles.card}>
          <View className={styles.row}>
            <View className={styles.rowMain}>
              <Text className={styles.rowTitle}>每日物流提醒</Text>
              <Text className={styles.rowDesc}>每天定时推送在途包裹的最新进展</Text>
            </View>
            <Switch checked={reminder} color="#2f6bff" onChange={(event) => handleReminderChange(event.detail.value)} />
          </View>
          <View className={styles.divider} />
          <View className={styles.row} onClick={handleRemindTime}>
            <View className={styles.rowMain}>
              <Text className={styles.rowTitle}>提醒时间</Text>
              <Text className={styles.rowDesc}>到点自动同步并提醒今天必达的包裹</Text>
            </View>
            <Text className={styles.rowValue}>{`每天 ${remindTime}`}</Text>
            <Text className={styles.arrow}>›</Text>
          </View>
          <View className={styles.divider} />
          <View className={styles.row} onClick={handleClearSigned}>
            <View className={styles.rowMain}>
              <Text className={styles.rowTitle}>清除已签收记录</Text>
              <Text className={styles.rowDesc}>让列表只保留在途包裹</Text>
            </View>
            <Text className={styles.arrow}>›</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>包裹是怎么汇总的</Text>
        <View className={styles.card}>
          <View className={styles.stepRow}>
            <View className={styles.stepIndex}><Text className={styles.stepIndexText}>1</Text></View>
            <View className={styles.rowMain}>
              <Text className={styles.rowTitle}>粘贴运单号</Text>
              <Text className={styles.rowDesc}>从拼多多、淘宝、京东复制单号，自动识别快递公司</Text>
            </View>
          </View>
          <View className={styles.divider} />
          <View className={styles.stepRow}>
            <View className={styles.stepIndex}><Text className={styles.stepIndexText}>2</Text></View>
            <View className={styles.rowMain}>
              <Text className={styles.rowTitle}>绑定手机号一键同步</Text>
              <Text className={styles.rowDesc}>按收件手机号拉取全网包裹，不用逐个平台查</Text>
            </View>
          </View>
          <View className={styles.divider} />
          <View className={styles.stepRow}>
            <View className={styles.stepIndex}><Text className={styles.stepIndexText}>3</Text></View>
            <View className={styles.rowMain}>
              <Text className={styles.rowTitle}>每天自动更新</Text>
              <Text className={styles.rowDesc}>按设定时间刷新物流，今日必达会高亮提醒</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.card}>
          <View className={styles.row} onClick={handleAbout}>
            <View className={styles.rowMain}>
              <Text className={styles.rowTitle}>关于包裹管家</Text>
            </View>
            <Text className={styles.arrow}>›</Text>
          </View>
        </View>
      </View>

      <View className={styles.version}>
        <Text className={styles.versionText}>包裹管家 v1.0.0 · 演示数据</Text>
      </View>
    </View>
  );
};

export default MinePage;
