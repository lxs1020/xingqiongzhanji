import React, { useMemo, useState } from 'react';
import { Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { usePackageStore } from '@/store/packageStore';
import { CARRIERS, PLATFORM_META, PLATFORM_OPTIONS } from '@/data/constants';
import { detectCarrier } from '@/services/logistics';
import { PlatformCode } from '@/types/package';

const AddPage: React.FC = () => {
  const packages = usePackageStore((state) => state.packages);
  const addPackage = usePackageStore((state) => state.addPackage);
  const syncFromPhone = usePackageStore((state) => state.syncFromPhone);

  const [trackingNo, setTrackingNo] = useState('');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<PlatformCode>('taobao');
  const [carrierIndex, setCarrierIndex] = useState<number | null>(null);
  const [phone, setPhone] = useState('');

  const carrier = useMemo(() => {
    if (carrierIndex !== null) return CARRIERS[carrierIndex];
    return detectCarrier(trackingNo);
  }, [carrierIndex, trackingNo]);

  const canSubmit = trackingNo.trim().length >= 8;

  const chooseCarrier = async () => {
    try {
      const res = await Taro.showActionSheet({ itemList: CARRIERS.map((item) => item.name) });
      setCarrierIndex(res.tapIndex);
    } catch (error) {
      console.info('[Add] 取消选择快递公司', error);
    }
  };

  const handleSubmit = () => {
    const no = trackingNo.trim().toUpperCase();
    if (no.length < 8) {
      Taro.showToast({ title: '请填写完整的运单号', icon: 'none' });
      return;
    }
    if (packages.some((item) => item.trackingNo.toUpperCase() === no)) {
      Taro.showToast({ title: '这个运单号已经在列表里了', icon: 'none' });
      return;
    }
    addPackage({
      trackingNo: no,
      carrier: carrier.name,
      carrierCode: carrier.code,
      platform,
      title
    });
    Taro.showToast({ title: '包裹已添加', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 600);
  };

  const handlePhoneSync = async () => {
    if (!/^1\d{10}$/.test(phone.trim())) {
      Taro.showToast({ title: '请输入 11 位手机号', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '汇总中', mask: true });
    try {
      const count = await syncFromPhone(phone.trim());
      Taro.hideLoading();
      Taro.showToast({ title: `已同步 ${count} 个包裹`, icon: 'none' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 800);
    } catch (error) {
      console.error('[Add] 手机号同步失败', error);
      Taro.hideLoading();
      Taro.showToast({ title: '同步失败，请稍后重试', icon: 'none' });
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>添加快递</Text>
        <Text className={styles.headerSub}>粘贴运单号，自动识别快递公司并开始跟进物流</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.fieldLabel}>运单号</Text>
        <View className={styles.inputWrap}>
          <Input
            className={styles.input}
            value={trackingNo}
            placeholder="例如 SF1388225510973"
            placeholderClass={styles.placeholder}
            onInput={(event) => setTrackingNo(event.detail.value)}
          />
        </View>

        <View className={styles.inlineRow} onClick={chooseCarrier}>
          <Text className={styles.inlineLabel}>快递公司</Text>
          <View className={styles.carrierChip}>
            <Text className={styles.carrierText}>{carrier.name}</Text>
            <Text className={styles.carrierHint}>切换</Text>
          </View>
        </View>

        <Text className={styles.fieldLabel}>来源平台</Text>
        <View className={styles.platformRow}>
          {PLATFORM_OPTIONS.map((code) => (
            <View
              key={code}
              className={classnames(styles.platformChip, platform === code && styles.platformChipActive)}
              onClick={() => setPlatform(code)}
            >
              <Text
                className={classnames(styles.platformText, platform === code && styles.platformTextActive)}
                style={{ color: platform === code ? PLATFORM_META[code].color : undefined }}
              >
                {PLATFORM_META[code].name}
              </Text>
            </View>
          ))}
        </View>

        <Text className={styles.fieldLabel}>商品名称（选填）</Text>
        <View className={styles.inputWrap}>
          <Input
            className={styles.input}
            value={title}
            placeholder="例如 纯棉四件套 1.8m 床"
            placeholderClass={styles.placeholder}
            onInput={(event) => setTitle(event.detail.value)}
          />
        </View>

        <View
          className={classnames(styles.submitBtn, !canSubmit && styles.submitBtnDisabled)}
          onClick={handleSubmit}
        >
          <Text className={classnames(styles.submitText, !canSubmit && styles.submitTextDisabled)}>
            添加并跟进物流
          </Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>按手机号一键汇总</Text>
        <Text className={styles.sectionDesc}>
          同一个收件手机号下的快递会自动汇总，不用逐个小程序去查
        </Text>
        <View className={styles.inputWrap}>
          <Input
            className={styles.input}
            type="number"
            maxlength={11}
            value={phone}
            placeholder="填写收件手机号"
            placeholderClass={styles.placeholder}
            onInput={(event) => setPhone(event.detail.value)}
          />
        </View>
        <View className={styles.phoneBtn} onClick={handlePhoneSync}>
          <Text className={styles.phoneText}>同步我手机号下的包裹</Text>
        </View>
        <Text className={styles.notice}>演示环境使用模拟物流数据，正式版需接入快递查询服务</Text>
      </View>
    </View>
  );
};

export default AddPage;
