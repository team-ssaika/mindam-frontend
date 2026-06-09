import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, AppText, Card, Icon, SectionLabel } from '../../../components/ui';
import { colors, fonts, radius, statusColors } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import {
  dashboardFunnel,
  dashboardTypes,
  officerProfile,
} from '../mocks/officerMock';

const TYPE_COLOR: Record<string, string> = {
  coral: colors.coral,
  mustard: colors.mustard,
  brand: colors.brand,
  mint: colors.mint,
  faint: colors.faint,
};

const MAX_TYPE = 48;

export function OfficerDashboardScreen() {
  const { contentOffset: tabBarOffset } = useTabBarMetrics();

  return (
    <View style={styles.flex}>
      <AppBar title="대시보드" logo={false} right={<Icon name="refresh" size={20} color={colors.body} />} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarOffset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <AppText style={styles.dept}>{officerProfile.department} · 2024.6.9</AppText>
          <AppText variant="title" color={colors.ink} style={styles.headline}>오늘 신규 제보 12건</AppText>
        </View>

        {/* funnel */}
        <View style={styles.funnelRow}>
          {dashboardFunnel.map((f, i) => {
            const color = f.tone === 'all' ? colors.ink : statusColors[f.tone].dot;
            return (
              <View key={f.label} style={styles.funnelItem}>
                <View style={styles.funnelTile}>
                  <AppText style={[styles.funnelCount, { color }]}>{f.count}</AppText>
                  <AppText style={styles.funnelLabel}>{f.label}</AppText>
                </View>
                {i < dashboardFunnel.length - 1 ? (
                  <Icon name="chevR" size={14} color={colors.faint} />
                ) : null}
              </View>
            );
          })}
        </View>

        {/* type graph */}
        <Card style={styles.graphCard}>
          <SectionLabel title="유형별 제보 수" right="최근 7일" />
          <View style={styles.graphRows}>
            {dashboardTypes.map((t) => (
              <View key={t.label} style={styles.graphRow}>
                <AppText style={styles.graphLabel}>{t.label}</AppText>
                <View style={styles.graphTrack}>
                  <View
                    style={[
                      styles.graphFill,
                      { width: `${(t.count / MAX_TYPE) * 100}%`, backgroundColor: TYPE_COLOR[t.color] },
                    ]}
                  />
                </View>
                <AppText style={styles.graphValue}>{t.count}</AppText>
              </View>
            ))}
          </View>
        </Card>

        {/* CTA */}
        <View style={styles.cta}>
          <View style={styles.ctaText}>
            <AppText style={styles.ctaTitle}>대기중 제보 38건</AppText>
            <AppText style={styles.ctaSub}>오래된 순으로 처리해 보세요</AppText>
          </View>
          <Pressable style={styles.ctaButton}>
            <AppText style={styles.ctaButtonText}>처리하기</AppText>
            <Icon name="chevR" size={15} color={colors.ink} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },
  content: { paddingHorizontal: 18, paddingTop: 16, gap: 16 },
  dept: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  headline: { marginTop: 3 },

  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  funnelItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  funnelTile: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 13,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  funnelCount: { fontFamily: fonts.bold, fontSize: 23, letterSpacing: -0.6 },
  funnelLabel: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.muted, marginTop: 3 },

  graphCard: {},
  graphRows: { gap: 13 },
  graphRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  graphLabel: { width: 64, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.body },
  graphTrack: { flex: 1, height: 18, backgroundColor: colors.soft2, borderRadius: 6, overflow: 'hidden' },
  graphFill: { height: '100%', borderRadius: 6 },
  graphValue: { width: 22, textAlign: 'right', fontFamily: fonts.bold, fontSize: 13, color: colors.ink },

  cta: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaText: { flex: 1 },
  ctaTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  ctaSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  ctaButtonText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
});
