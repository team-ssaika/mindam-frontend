import { useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { colors, fonts, radius, fontSize } from '../../../theme';
import type { TermsAgreementState, TermsItem } from '../types/auth.types';
import { TermsAgreementItem } from './TermsAgreementItem';

const TERMS_ITEMS: TermsItem[] = [
  { key: 'location', label: '위치기반 서비스 이용약관 (필수)' },
  { key: 'privacy', label: '민감정보 처리방침 (필수)' },
];

type TermsAgreementBottomSheetProps = {
  errorMessage: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onToggleAll: () => void;
  onToggleItem: (key: TermsItem['key']) => void;
  state: TermsAgreementState;
  visible: boolean;
};

export function TermsAgreementBottomSheet({
  errorMessage,
  isSubmitting,
  onClose,
  onSubmit,
  onToggleAll,
  onToggleItem,
  state,
  visible,
}: TermsAgreementBottomSheetProps) {
  const isAllChecked = useMemo(() => Object.values(state).every(Boolean), [state]);
  const isConfirmEnabled = isAllChecked && !isSubmitting;

  const handlePressDetail = (label: string) => {
    console.log(`[Auth] open terms detail: ${label}`);
    Alert.alert('준비 중', `${label} 상세 화면은 추후 연결 예정입니다.`);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      backdropOpacity={0.68}
      minHeight="42%"
      showHandle={false}
      containerStyle={styles.sheetContainer}
    >
      <View style={styles.content}>
        <Text style={styles.title}>이용 약관 동의</Text>

        <View style={styles.list}>
          <TermsAgreementItem
            checked={isAllChecked}
            label="약관 전체 동의"
            onToggle={onToggleAll}
            onPressLabel={onToggleAll}
            isAll
          />

          {TERMS_ITEMS.map((item) => (
            <TermsAgreementItem
              key={item.key}
              checked={state[item.key]}
              label={item.label}
              onToggle={() => onToggleItem(item.key)}
              onPressLabel={() => handlePressDetail(item.label)}
            />
          ))}
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity
          disabled={!isConfirmEnabled}
          onPress={onSubmit}
          style={[
            styles.confirmButton,
            isConfirmEnabled ? styles.confirmButtonEnabled : styles.confirmButtonDisabled,
          ]}
        >
          <Text style={styles.confirmButtonText}>
            {isSubmitting ? '처리 중...' : '확인'}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 26,
    paddingTop: 40,
  },
  content: {
    flex: 1,
    paddingBottom: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize['2xl'],
    color: '#000000',
    marginBottom: 34,
  },
  list: {
    gap: 14,
  },
  errorText: {
    marginTop: 16,
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.danger,
  },
  confirmButton: {
    height: 56,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  confirmButtonEnabled: {
    backgroundColor: colors.brand,
  },
  confirmButtonDisabled: {
    backgroundColor: '#B5B5B5',
  },
  confirmButtonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
});
