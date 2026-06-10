import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppBar, AppText, Button, Card, CatChip, Icon, ImageSlot, StatusBadge } from '../../../components/ui';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { colors, fonts, radius, shadow } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { fetchAdminIssues } from '../api/adminIssueApi';
import type { AdminIssueItem, AdminIssueSortType } from '../types/adminIssue';
import type { ReportStatus } from '../../report/types/myReport';
import {
  formatReportDate,
  getReportStatusLabel,
  getReportStatusTone,
} from '../../report/utils/reportStatus';

type ViewMode = 'list' | 'grid';
type OpenDropdown = 'sort' | 'status' | null;

const SORT_OPTIONS: { value: AdminIssueSortType; label: string }[] = [
  { value: 'LATEST', label: '최신순' },
  { value: 'RISK_DESC', label: '위험도순' },
];

const STATUS_FILTER_OPTIONS: { value: ReportStatus | null; label: string }[] = [
  { value: null, label: '상태 전체' },
  { value: 'RECEIVED', label: '접수 완료' },
  { value: 'CHECKING', label: '확인 중' },
  { value: 'IN_PROGRESS', label: '처리 중' },
  { value: 'COMPLETED', label: '처리 완료' },
  { value: 'REJECTED', label: '반려' },
  { value: 'SUBMITTED', label: '접수 전' },
  { value: 'TRANSFERRED', label: '이관' },
  { value: 'MERGED', label: '병합' },
];

export function OfficerInboxScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const [view, setView] = useState<ViewMode>('list');
  const [issues, setIssues] = useState<AdminIssueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<AdminIssueSortType>('LATEST');
  const [reportStatus, setReportStatus] = useState<ReportStatus | null>(null);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadIssues = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchAdminIssues({
        myDepartmentOnly: true,
        sort,
        ...(keyword ? { keyword } : {}),
        ...(reportStatus ? { reportStatus } : {}),
      });
      setIssues(Array.isArray(data.issues) ? data.issues : []);
    } catch (error) {
      let message = '제보 목록을 불러오지 못했습니다.';
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        message = typeof apiMessage === 'string' ? apiMessage : error.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      if (axios.isAxiosError(error) && !error.response) {
        message = `${message}\n\n요청 주소: ${resolveApiBaseUrl()}`;
      }
      setIssues([]);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, sort, reportStatus]);

  const isFirstFocusRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        loadIssues();
        return;
      }

      loadIssues();
    }, [loadIssues])
  );

  const sortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? '최신순';
  const statusLabel =
    STATUS_FILTER_OPTIONS.find((option) => option.value === reportStatus)?.label ?? '상태 전체';

  const openDetail = (issueGroupId: number) => {
    router.push(`/officer-report/${issueGroupId}`);
  };

  return (
    <View style={styles.flex}>
      <AppBar title="제보함" logo={false} right={<Icon name="bell" size={20} color={colors.body} />} />

      <View style={[styles.controls, openDropdown ? styles.controlsRaised : null]}>
        <View style={styles.searchBar}>
          <Icon name="search" size={19} color={colors.muted} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="제보 번호·제목·위치 검색"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => setKeyword(searchInput.trim())}
            onFocus={() => setOpenDropdown(null)}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchInput.length > 0 ? (
            <Pressable onPress={() => setSearchInput('')} hitSlop={8} accessibilityLabel="검색어 지우기">
              <Icon name="x" size={16} color={colors.faint} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.controlRow}>
          <InlineDropdown
            icon="sort"
            label={sortLabel}
            open={openDropdown === 'sort'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'sort' ? null : 'sort'))}
            options={SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            selectedValue={sort}
            onSelect={(value) => {
              setSort(value as AdminIssueSortType);
              setOpenDropdown(null);
            }}
          />
          <InlineDropdown
            icon="filter"
            label={statusLabel}
            open={openDropdown === 'status'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'status' ? null : 'status'))}
            options={STATUS_FILTER_OPTIONS.map((option) => ({
              value: option.value ?? 'ALL',
              label: option.label,
            }))}
            selectedValue={reportStatus ?? 'ALL'}
            onSelect={(value) => {
              setReportStatus(value === 'ALL' ? null : (value as ReportStatus));
              setOpenDropdown(null);
            }}
            menuMinWidth={148}
            scrollable
          />
          <Pressable style={styles.flex} onPress={() => setOpenDropdown(null)} />
          <View style={styles.viewToggle}>
            <ViewButton
              icon="list"
              on={view === 'list'}
              onPress={() => {
                setOpenDropdown(null);
                setView('list');
              }}
            />
            <ViewButton
              icon="grid"
              on={view === 'grid'}
              onPress={() => {
                setOpenDropdown(null);
                setView('grid');
              }}
            />
          </View>
        </View>
      </View>

      {openDropdown ? (
        <Pressable style={styles.dropdownBackdrop} onPress={() => setOpenDropdown(null)} />
      ) : null}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <AppText style={styles.errorText}>{errorMessage}</AppText>
          <View style={styles.retryWrap}>
            <Button label="다시 시도" icon="refresh" onPress={loadIssues} />
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            view === 'list' ? styles.listContent : styles.gridContent,
            { paddingBottom: tabBarOffset + 24 },
            issues.length === 0 && styles.emptyContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setOpenDropdown(null)}
        >
          {issues.length === 0 ? (
            <AppText style={styles.emptyText}>
              {keyword || reportStatus ? '검색·필터 조건에 맞는 제보가 없어요.' : '관할 제보가 없어요.'}
            </AppText>
          ) : view === 'list' ? (
            issues.map((item) => (
              <ListCard key={item.issueGroup.id} item={item} onPress={() => openDetail(item.issueGroup.id)} />
            ))
          ) : (
            issues.map((item) => (
              <GridCard key={item.issueGroup.id} item={item} onPress={() => openDetail(item.issueGroup.id)} />
            ))
          )}
        </ScrollView>
      )}

    </View>
  );
}

function InlineDropdown<T extends string>({
  icon,
  label,
  open,
  onToggle,
  options,
  selectedValue,
  onSelect,
  menuMinWidth = 128,
  scrollable = false,
}: {
  icon: 'sort' | 'filter';
  label: string;
  open: boolean;
  onToggle: () => void;
  options: { value: T; label: string }[];
  selectedValue: T;
  onSelect: (value: T) => void;
  menuMinWidth?: number;
  scrollable?: boolean;
}) {
  const menuBody = options.map((option, index) => {
    const selected = option.value === selectedValue;
    const isFirst = index === 0;
    const isLast = index === options.length - 1;
    return (
      <Pressable
        key={option.value}
        style={[
          styles.menuOption,
          selected && styles.menuOptionSelected,
          isFirst && styles.menuOptionFirst,
          isLast && styles.menuOptionLast,
        ]}
        onPress={() => onSelect(option.value)}
      >
        <AppText style={[styles.menuOptionLabel, selected && styles.menuOptionLabelSelected]}>
          {option.label}
        </AppText>
        {selected ? <Icon name="check" size={14} color={colors.brand} /> : null}
      </Pressable>
    );
  });

  const menuMaxHeight = scrollable ? Math.min(options.length * 40 + 4, 320) : undefined;

  return (
    <View style={styles.dropdownWrap}>
      <Pressable
        onPress={onToggle}
        style={[styles.dropdown, open && styles.dropdownOpen]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Icon name={icon} size={15} color={open ? colors.brand : colors.body} />
        <AppText style={[styles.dropdownLabel, open && styles.dropdownLabelOpen]} numberOfLines={1}>
          {label}
        </AppText>
        <Icon name="chevD" size={14} color={open ? colors.brand : colors.faint} />
      </Pressable>

      {open ? (
        <View style={[styles.dropdownMenu, { minWidth: menuMinWidth }]}>
          {scrollable ? (
            <ScrollView
              style={[styles.dropdownMenuScroll, menuMaxHeight ? { maxHeight: menuMaxHeight } : null]}
              contentContainerStyle={styles.dropdownMenuScrollContent}
              nestedScrollEnabled
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {menuBody}
            </ScrollView>
          ) : (
            <View style={styles.dropdownMenuContent}>{menuBody}</View>
          )}
        </View>
      ) : null}
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

function ListCard({ item, onPress }: { item: AdminIssueItem; onPress: () => void }) {
  const report = item.representativeReport.report;
  const reportStatus = report.status as ReportStatus;
  const location =
    report.roadAddress || `${report.sigungu} ${report.eupmyeondong}`.trim() || '위치 정보 없음';

  return (
    <Pressable onPress={onPress}>
      <Card bordered={false} style={styles.listCard}>
        <View style={styles.cardTopRow}>
          <CatChip icon="alert" label={item.category.categoryName} color={colors.brand} />
          <StatusBadge
            status={getReportStatusTone(reportStatus)}
            size="sm"
            label={getReportStatusLabel(reportStatus)}
          />
        </View>
        <AppText style={styles.listTitle} numberOfLines={2}>
          {item.issueGroup.title || report.title}
        </AppText>
        <View style={styles.addressRow}>
          <Icon name="location" size={15} color={colors.faint} />
          <AppText style={styles.locText} numberOfLines={1}>
            {location}
          </AppText>
        </View>
        <View style={styles.metaRow}>
          <AppText style={styles.metaText}>제보 {item.issueGroup.reportCount}건</AppText>
          <AppText style={styles.metaDot}>·</AppText>
          <AppText style={styles.metaText}>
            {formatReportDate(item.issueGroup.recentReportedAt)}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

function GridCard({ item, onPress }: { item: AdminIssueItem; onPress: () => void }) {
  const report = item.representativeReport.report;
  const reportStatus = report.status as ReportStatus;
  const thumb = item.representativeReport.reportImages[0]?.imageUrl;

  return (
    <Pressable onPress={onPress} style={styles.gridItem}>
      <Card padded={false} style={styles.gridCard}>
        <ImageSlot height={78} label="" uri={thumb} />
        <View style={styles.gridBody}>
          <View style={styles.cardTopRow}>
            <CatChip icon="alert" label={item.category.categoryName} color={colors.brand} />
            <StatusBadge
              status={getReportStatusTone(reportStatus)}
              size="sm"
              label={getReportStatusLabel(reportStatus)}
            />
          </View>
          <AppText style={styles.gridTitle} numberOfLines={2}>
            {item.issueGroup.title || report.title}
          </AppText>
          <AppText style={styles.gridMeta}>
            제보 {item.issueGroup.reportCount}건 · {formatReportDate(item.issueGroup.recentReportedAt)}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  errorText: { fontSize: 14.5, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  retryWrap: { width: '100%', maxWidth: 220 },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  emptyText: { fontSize: 14.5, color: colors.muted, textAlign: 'center' },

  controls: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: colors.soft,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    overflow: 'visible',
  },
  controlsRaised: {
    zIndex: 50,
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
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
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.ink,
    paddingVertical: 0,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    overflow: 'visible',
    zIndex: 40,
  },
  dropdownWrap: {
    position: 'relative',
    zIndex: 50,
    overflow: 'visible',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 104,
    maxWidth: 118,
    height: 36,
    paddingHorizontal: 10,
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  dropdownOpen: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  dropdownLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  dropdownLabelOpen: { color: colors.brand },
  dropdownMenu: {
    position: 'absolute',
    top: 38,
    left: 0,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    ...shadow.float,
  },
  dropdownMenuContent: {
    paddingVertical: 0,
  },
  dropdownMenuScroll: {
    flexGrow: 0,
  },
  dropdownMenuScrollContent: {
    paddingTop: 0,
    paddingBottom: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  menuOptionFirst: {
    borderTopLeftRadius: radius.md - 1,
    borderTopRightRadius: radius.md - 1,
  },
  menuOptionLast: {
    borderBottomLeftRadius: radius.md - 1,
    borderBottomRightRadius: radius.md - 1,
  },
  menuOptionSelected: {
    backgroundColor: colors.brandSoft,
  },
  menuOptionLabel: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.body,
  },
  menuOptionLabelSelected: {
    fontFamily: fonts.semibold,
    color: colors.brand,
  },
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
  listCard: { gap: 10, padding: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  listTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, lineHeight: 21 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locText: { flex: 1, fontSize: 13.5, color: colors.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.faint },
  metaDot: { marginHorizontal: 6, fontSize: 12.5, color: colors.faint },

  gridContent: { paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47.5%' },
  gridCard: { overflow: 'hidden' },
  gridBody: { padding: 12, gap: 8 },
  gridTitle: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink, lineHeight: 18, minHeight: 36 },
  gridMeta: { fontFamily: fonts.medium, fontSize: 12, color: colors.faint },
});
