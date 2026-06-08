import { useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import type { TermsAgreementState, TermsItem } from '../types/auth.types';
import { TermsAgreementItem } from './TermsAgreementItem';

const TERMS_ITEMS: TermsItem[] = [
  { key: 'service', label: '서비스 이용약관' },
  { key: 'location', label: '위치기반 서비스 이용약관' },
  { key: 'privacy', label: '개인정보 처리방침' },
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
  const isAllChecked = useMemo(
    () => Object.values(state).every(Boolean),
    [state]
  );

  const isConfirmEnabled = isAllChecked && !isSubmitting;

  const handlePressDetail = (label: string) => {
    // TODO: replace with terms detail screen or WebView route
    console.log(`[Auth] open terms detail: ${label}`);
    Alert.alert('준비 중', `${label} 상세 보기는 추후 연결할 예정이에요.`);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
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
          <Text
            style={[
              styles.confirmButtonText,
              !isConfirmEnabled && styles.confirmButtonTextDisabled,
            ]}
          >
            {isSubmitting ? '처리 중...' : '확인'}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111119',
    marginBottom: 28,
  },
  list: {
    gap: 12,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 21,
    color: '#E25353',
  },
  confirmButton: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  confirmButtonEnabled: {
    backgroundColor: '#6257FF',
  },
  confirmButtonDisabled: {
    backgroundColor: '#D4D6DC',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmButtonTextDisabled: {
    color: '#FFFFFF',
  },
});
