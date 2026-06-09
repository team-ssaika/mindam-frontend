import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, AppText, Card, Icon, SectionLabel } from '../../../components/ui';
import { colors, fonts, radius, statusColors } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { officerProfile, officerStats } from '../mocks/officerMock';

const MENU: { icon: 'doc' | 'headset' | 'info'; label: string }[] = [
  { icon: 'doc', label: '처리 이력' },
  { icon: 'headset', label: '내부 문의' },
  { icon: 'info', label: '담당 구역 설정' },
];

export function OfficerProfileScreen() {
  const { contentOffset: tabBarOffset } = useTabBarMetrics();

  return (
    <View style={styles.flex}>
      <AppBar title="내 정보" logo={false} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarOffset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* profile */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Icon name="user" size={28} color={colors.white} />
          </View>
          <View style={styles.profileInfo}>
            <AppText variant="heading" color={colors.ink}>{officerProfile.name}</AppText>
            <AppText style={styles.dept}>{officerProfile.department}</AppText>
          </View>
          <View style={styles.roleBadge}>
            <AppText style={styles.roleBadgeText}>담당자</AppText>
          </View>
        </Card>

        {/* stats */}
        <View>
          <SectionLabel title="담당 제보 처리 현황" right="이번 달 142건" />
          <View style={styles.statRow}>
            {officerStats.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <AppText style={[styles.statCount, { color: statusColors[s.tone].dot }]}>{s.count}</AppText>
                <AppText style={styles.statLabel}>{s.label}</AppText>
              </View>
            ))}
          </View>
        </View>

        {/* avg time */}
        <View style={styles.avgCard}>
          <View style={styles.avgText}>
            <AppText style={styles.avgLabel}>평균 처리 시간</AppText>
            <View style={styles.avgValueRow}>
              <AppText style={styles.avgValue}>1.8일</AppText>
              <AppText style={styles.avgDelta}>▼ 0.4일</AppText>
            </View>
          </View>
          <View style={styles.avgIcon}>
            <Icon name="clock" size={24} color={colors.forest} />
          </View>
        </View>

        {/* menu */}
        <Card padded={false}>
          {MENU.map((m, i) => (
            <View key={m.label} style={[styles.menuRow, i > 0 && styles.menuDivider]}>
              <Icon name={m.icon} size={20} color={colors.brand} />
              <AppText style={styles.menuLabel}>{m.label}</AppText>
              <Icon name="chevR" size={18} color={colors.faint} />
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },
  content: { paddingHorizontal: 18, paddingTop: 18, gap: 16 },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  dept: { fontSize: 13, color: colors.muted, marginTop: 3 },
  roleBadge: { backgroundColor: colors.brandSoft, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 9 },
  roleBadgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.brand },

  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statCount: { fontFamily: fonts.bold, fontSize: 26, letterSpacing: -0.5 },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, marginTop: 3 },

  avgCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avgText: { flex: 1 },
  avgLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.forest },
  avgValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  avgValue: { fontFamily: fonts.bold, fontSize: 26, color: colors.forest, letterSpacing: -0.6 },
  avgDelta: { fontFamily: fonts.semibold, fontSize: 13, color: statusColors.done.fg },
  avgIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(10,46,14,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 16 },
  menuDivider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  menuLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink },
});
