import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, AppText, Button, Card, CatChip, Icon, ImageSlot } from '../../../components/ui';
import { colors, fonts, radius, statusColors, type StatusKey } from '../../../theme';
import { officerReports } from '../mocks/officerMock';

const CAT_COLOR: Record<string, string> = {
  coral: colors.coral,
  mustard: colors.mustard,
  brand: colors.brand,
  mint: colors.mint,
};

const STATUS_OPTIONS: StatusKey[] = ['wait', 'prog', 'done'];

export function OfficerReportDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const report = officerReports.find((r) => r.id === reportId) ?? officerReports[0];

  const [status, setStatus] = useState<StatusKey>(report.status);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const info: [string, string][] = [
    ['접수 번호', report.id],
    ['위치', `서울 강남구 ${report.location}`],
    ['제보 시간', report.occurredAt],
    ['유형', report.type],
  ];

  const handleUpdate = () => {
    setToast(`'${statusColors[status].label}'(으)로 변경되었습니다`);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  return (
    <View style={styles.flex}>
      <AppBar
        title={report.id}
        logo={false}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(officer)/inbox'))}
        right={<Icon name="info" size={20} color={colors.body} />}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ImageSlot height={132} label="제보자 첨부 이미지" />

        <View>
          <CatChip icon={report.cat} label={`${report.type} 파손`} color={CAT_COLOR[report.catColor]} />
          <AppText variant="heading" color={colors.ink} style={styles.title}>{report.title}</AppText>
        </View>

        <Card padded={false} style={styles.infoCard}>
          {info.map(([k, v], i) => (
            <View key={k} style={[styles.infoRow, i > 0 && styles.infoDivider]}>
              <AppText style={styles.infoKey}>{k}</AppText>
              <AppText style={[styles.infoVal, i === 0 && styles.mono]}>{v}</AppText>
            </View>
          ))}
        </Card>

        {/* status change */}
        <View>
          <AppText style={styles.sectionLabel}>상태 변경</AppText>
          <AppText style={styles.sectionHint}>변경 시 시민에게 알림이 전송돼요</AppText>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((s) => {
              const st = statusColors[s];
              const on = s === status;
              return (
                <Pressable
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.statusBtn,
                    { borderColor: on ? st.dot : colors.hairline, backgroundColor: on ? st.bg : colors.canvas },
                  ]}
                >
                  <AppText style={[styles.statusBtnText, { color: on ? st.fg : colors.muted }]}>{st.label}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* processing note */}
        <View>
          <AppText style={styles.sectionLabel}>처리 내용 등록</AppText>
          <View style={styles.noteRow}>
            <Pressable style={styles.photoSlot}>
              <Icon name="camera" size={20} color={colors.muted} />
              <AppText style={styles.photoSlotText}>처리 사진</AppText>
            </Pressable>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="처리 내용을 입력하세요…"
              placeholderTextColor={colors.faint}
              multiline
              textAlignVertical="top"
              style={styles.noteInput}
            />
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button label="업데이트" icon="check" onPress={handleUpdate} />
      </SafeAreaView>

      {toast ? (
        <View style={[styles.toastWrap, { top: insets.top + 56 }]} pointerEvents="none">
          <View style={styles.toast}>
            <View style={styles.toastIcon}>
              <Icon name="check" size={14} color={colors.white} strokeWidth={2.6} />
            </View>
            <AppText style={styles.toastText}>{toast}</AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, gap: 13 },
  title: { marginTop: 7, lineHeight: 23 },

  infoCard: { paddingHorizontal: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  infoDivider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  infoKey: { fontSize: 13, color: colors.muted },
  infoVal: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  mono: { fontFamily: fonts.semibold },

  sectionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, marginBottom: 8 },
  sectionHint: { fontSize: 12.5, color: colors.muted, marginTop: -4, marginBottom: 10 },
  statusRow: { flexDirection: 'row', gap: 7 },
  statusBtn: { flex: 1, borderRadius: radius.sm, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5 },
  statusBtnText: { fontFamily: fonts.bold, fontSize: 13 },

  noteRow: { flexDirection: 'row', gap: 10 },
  photoSlot: {
    width: 70,
    height: 70,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  photoSlotText: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.muted },
  noteInput: {
    flex: 1,
    height: 70,
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.ink,
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.soft,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },

  toastWrap: { position: 'absolute', left: 16, right: 16 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  toastIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: statusColors.done.dot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white, flex: 1 },
});
