import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, AppText, Card, CatChip, Icon, ImageSlot, StatusBadge } from '../../../components/ui';
import { colors, fonts, radius } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { officerReports, type OfficerReport } from '../mocks/officerMock';

const CAT_COLOR: Record<string, string> = {
  coral: colors.coral,
  mustard: colors.mustard,
  brand: colors.brand,
  mint: colors.mint,
};

type ViewMode = 'list' | 'grid';

export function OfficerInboxScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const [view, setView] = useState<ViewMode>('list');

  const openDetail = (id: string) => {
    router.push(`/officer-report/${encodeURIComponent(id)}`);
  };

  return (
    <View style={styles.flex}>
      <AppBar title="제보함" logo={false} right={<Icon name="bell" size={20} color={colors.body} />} />

      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Icon name="search" size={19} color={colors.muted} />
          <AppText style={styles.searchPlaceholder}>제보 번호·제목·위치 검색</AppText>
        </View>
        <View style={styles.controlRow}>
          <Dropdown icon="sort" label="최신순" />
          <Dropdown icon="filter" label="상태 전체" />
          <View style={styles.flex} />
          <View style={styles.viewToggle}>
            <ViewButton icon="list" on={view === 'list'} onPress={() => setView('list')} />
            <ViewButton icon="grid" on={view === 'grid'} onPress={() => setView('grid')} />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          view === 'list' ? styles.listContent : styles.gridContent,
          { paddingBottom: tabBarOffset + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {view === 'list'
          ? officerReports.map((r) => <ListCard key={r.id} report={r} onPress={() => openDetail(r.id)} />)
          : officerReports.map((r) => <GridCard key={r.id} report={r} onPress={() => openDetail(r.id)} />)}
      </ScrollView>
    </View>
  );
}

function Dropdown({ icon, label }: { icon: 'sort' | 'filter'; label: string }) {
  return (
    <View style={styles.dropdown}>
      <Icon name={icon} size={15} color={colors.body} />
      <AppText style={styles.dropdownLabel}>{label}</AppText>
      <Icon name="chevD" size={14} color={colors.faint} />
    </View>
  );
}

function ViewButton({ icon, on, onPress }: { icon: 'list' | 'grid'; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.viewButton, on && styles.viewButtonOn]}>
      <Icon name={icon} size={18} color={on ? colors.white : colors.faint} />
    </Pressable>
  );
}

function ListCard({ report, onPress }: { report: OfficerReport; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.listCard}>
        <View style={styles.listTop}>
          <AppText style={styles.mono}>{report.id}</AppText>
          <StatusBadge status={report.status} size="sm" />
        </View>
        <AppText style={styles.listTitle}>{report.title}</AppText>
        <View style={styles.listMeta}>
          <View style={styles.locRow}>
            <Icon name="location" size={14} color={colors.faint} />
            <AppText style={styles.locText}>{report.location}</AppText>
          </View>
          <CatChip icon={report.cat} label={report.type} color={CAT_COLOR[report.catColor]} />
        </View>
      </Card>
    </Pressable>
  );
}

function GridCard({ report, onPress }: { report: OfficerReport; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.gridItem}>
      <Card padded={false} style={styles.gridCard}>
        <ImageSlot height={78} label="" />
        <View style={styles.gridBody}>
          <StatusBadge status={report.status} size="sm" />
          <AppText style={styles.gridTitle} numberOfLines={2}>{report.title}</AppText>
          <CatChip icon={report.cat} label={report.type} color={CAT_COLOR[report.catColor]} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },

  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.soft,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
  },
  searchPlaceholder: { fontSize: 14.5, color: colors.muted },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 10,
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  dropdownLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
  viewButton: { width: 38, height: 36, alignItems: 'center', justifyContent: 'center' },
  viewButtonOn: { backgroundColor: colors.ink },

  listContent: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  listCard: { gap: 0, padding: 14 },
  listTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  mono: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  listTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, lineHeight: 20 },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 9 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 12.5, color: colors.muted },

  gridContent: { paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47.5%' },
  gridCard: { overflow: 'hidden' },
  gridBody: { padding: 11, gap: 8 },
  gridTitle: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink, lineHeight: 18, minHeight: 36 },
});
