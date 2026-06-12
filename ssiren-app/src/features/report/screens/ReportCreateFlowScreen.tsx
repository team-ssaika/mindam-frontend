import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getAppCurrentPosition, requestAppLocationPermission } from '../../../lib/location/appLocation';
import { useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AxiosError } from 'axios';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppBar,
  AppText,
  Button,
  Card,
  CatChip,
  Icon,
  ImageSlot,
  Stepper,
  Tag,
} from '../../../components/ui';
import { colors, fonts, radius, shadow, statusColors, fontSize } from '../../../theme';
import { createReport, createReportDraft } from '../api/reportApi';
import { reportSubmissionMock } from '../mocks/reportSubmissionMock';
import type {
  CreateReportRequest,
  CreateReportResponse,
  ReportDraftResponse,
} from '../types/reportSubmission';

type FlowStep = 1 | 2 | 3;

type ReportImage = {
  id: string;
  uri: string;
  name?: string | null;
  type?: string | null;
};

type DetailFieldKey = 'title' | 'category' | 'location' | 'occurredAt' | 'issue' | 'risk';
type DraftFieldKey = 'primary' | 'secondary';

type EditableReviewData = {
  aiSummary: string;
  title: string;
  category: string;
  location: {
    address: string;
    detail: string;
  };
  details: {
    occurredAt: string;
    issue: string;
    risk: string;
  };
  detectedTags: string[];
  completion: {
    reportId: string;
    organization: string;
    department: string;
    receiptNumber: string;
    eta: string;
    assignmentReason: string;
  };
};

type EditDraft = {
  primary: string;
  secondary: string;
};

const MAX_CONTENT_LENGTH = 1000;
const MAX_IMAGES = 5;
const SCREENSHOT_TOAST_DURATION = 2200;
const ANALYZE_DURATION = 1800;

const ANALYZE_STEPS = ['제목 생성', '카테고리 분류', '육하원칙 정리', '담당 기관 매칭'];

function makeReviewState(): EditableReviewData {
  return {
    ...reportSubmissionMock,
    location: { ...reportSubmissionMock.location },
    details: { ...reportSubmissionMock.details },
    detectedTags: [...reportSubmissionMock.detectedTags],
    completion: { ...reportSubmissionMock.completion },
  };
}

function toLocalDateTimeString(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 19);
}

function getSummary(contents: ReportDraftResponse['reportDraft']['contents']) {
  return contents.summary ?? contents.what ?? contents.how ?? '';
}

function makeReviewStateFromDraft(data: ReportDraftResponse): EditableReviewData {
  const { reportDraft, category, department, agencyType, analysis } = data;
  const contents = reportDraft.contents ?? {};

  return {
    aiSummary: getSummary(contents),
    title: reportDraft.title,
    category: category?.categoryName ?? '',
    location: {
      address: reportDraft.roadAddress ?? '',
      detail: reportDraft.jibunAddress ?? '',
    },
    details: {
      occurredAt: reportDraft.occurredAt,
      issue: contents.what ?? contents.how ?? contents.summary ?? '',
      risk: contents.why ?? `위험 점수 ${reportDraft.riskScore}`,
    },
    detectedTags: analysis?.detectedObjects ?? [],
    completion: {
      reportId: '',
      organization: agencyType?.name ?? '',
      department: department?.name ?? '',
      receiptNumber: '',
      eta: '처리 상태는 내 제보에서 확인해주세요.',
      assignmentReason: analysis?.falseReport?.reason ?? '',
    },
  };
}

function makeCompletionFromCreateResponse(data: CreateReportResponse): EditableReviewData['completion'] {
  return {
    reportId: `#${data.report.id}`,
    organization: data.agencyType?.name ?? '',
    department: data.department?.name ?? '',
    receiptNumber: `SR-${data.report.id}`,
    eta: '처리 상태는 내 제보에서 확인해주세요.',
    assignmentReason: data.issueGroup?.title ?? data.category?.categoryName ?? '',
  };
}

function parseRiskScore(value: string, fallback: number) {
  const parsed = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }

  return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
}

function isInsufficientCategory(draft: ReportDraftResponse | null) {
  const categoryCode = draft?.category?.categoryCode?.toUpperCase() ?? '';

  return categoryCode === 'INSUFFICIENT';
}

export function ReportCreateFlowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<FlowStep>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<ReportImage[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isExitConfirmVisible, setIsExitConfirmVisible] = useState(false);
  const [isScreenshotToastVisible, setIsScreenshotToastVisible] = useState(false);
  const [editableReview, setEditableReview] = useState<EditableReviewData>(makeReviewState);
  const [reportDraft, setReportDraft] = useState<ReportDraftResponse | null>(null);
  const [activeEditor, setActiveEditor] = useState<DetailFieldKey | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({ primary: '', secondary: '' });
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const screenshotToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNextEnabled = content.trim().length > 0;
  const isReportBlockedByInsufficient = isInsufficientCategory(reportDraft);

  const resetFlow = () => {
    setStep(1);
    setIsAnalyzing(false);
    setContent('');
    setImages([]);
    setIsExitConfirmVisible(false);
    setEditableReview(makeReviewState());
    setReportDraft(null);
    setActiveEditor(null);
    setEditDraft({ primary: '', secondary: '' });
    setIsResolvingLocation(false);
    setIsKeyboardVisible(false);
  };

  const reviewData = {
    ...editableReview,
    sourceContent: content,
    images,
  };

  const handleBack = () => {
    if (step === 1) {
      if (content.trim().length > 0 || images.length > 0) {
        setIsExitConfirmVisible(true);
        return;
      }

      router.back();
      return;
    }

    setStep((prev) => (prev === 3 ? 2 : 1));
  };

  const handleCloseExitConfirm = () => {
    setIsExitConfirmVisible(false);
  };

  const handleExitFlow = () => {
    resetFlow();
    router.back();
  };

  const handlePickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('사진은 최대 5장까지 첨부할 수 있어요.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('사진 접근 권한이 필요해요.', '설정에서 사진 권한을 허용한 뒤 다시 시도해주세요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - images.length,
    });

    if (result.canceled) {
      return;
    }

    const nextImages = result.assets.map((asset, index) => ({
      id: `${asset.assetId ?? asset.uri}-${Date.now()}-${index}`,
      uri: asset.uri,
      name: asset.fileName,
      type: asset.mimeType,
    }));

    setImages((prev) => [...prev, ...nextImages].slice(0, MAX_IMAGES));
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((image) => image.id !== id));
  };

  const handleCreateDraft = async () => {
    if (!isNextEnabled) {
      Alert.alert('내용을 입력해주세요.', '상황을 간단히 적어주시면 다음 단계로 넘어갈 수 있어요.');
      return;
    }

    Keyboard.dismiss();
    setIsAnalyzing(true);

    try {
      const granted = await requestAppLocationPermission();
      if (!granted) {
        Alert.alert('위치 권한이 필요해요.', '제보 위치를 확인하려면 위치 권한을 허용해주세요.');
        return;
      }

      const position = await getAppCurrentPosition();

      const draft = await createReportDraft({
        images,
        content: content.trim(),
        latitude: position.latitude,
        longitude: position.longitude,
        occurredAt: toLocalDateTimeString(new Date()),
      });

      console.log('[ReportFlow] draft created', draft.reportDraft.title, draft.category?.categoryCode);
      setReportDraft(draft);
      setEditableReview(makeReviewStateFromDraft(draft));
      setStep(2);
    } catch (error) {
      console.log('[ReportFlow] draft create error', error);
      Alert.alert('AI 정리 실패', '제보 초안을 생성하지 못했습니다. 로그인/네트워크 상태를 확인하고 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditField = (field: DetailFieldKey) => {
    setEditDraft(getDraftFromField(field, editableReview));
    setActiveEditor(field);
  };

  const handleCloseEditor = () => {
    setActiveEditor(null);
  };

  const handleChangeDraft = (key: DraftFieldKey, value: string) => {
    setEditDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEditor = () => {
    if (!activeEditor) {
      return;
    }

    const trimmedPrimary = editDraft.primary.trim();
    const trimmedSecondary = editDraft.secondary.trim();

    if (!trimmedPrimary) {
      Alert.alert('내용을 입력해주세요.');
      return;
    }

    if (activeEditor === 'location' && !trimmedSecondary) {
      Alert.alert('상세 위치를 입력해주세요.');
      return;
    }

    setEditableReview((prev) => {
      switch (activeEditor) {
        case 'title':
          return { ...prev, title: trimmedPrimary };
        case 'category':
          return { ...prev, category: trimmedPrimary };
        case 'location':
          return {
            ...prev,
            location: { address: trimmedPrimary, detail: trimmedSecondary },
          };
        case 'occurredAt':
          return { ...prev, details: { ...prev.details, occurredAt: trimmedPrimary } };
        case 'issue':
          return { ...prev, details: { ...prev.details, issue: trimmedPrimary } };
        case 'risk':
          return { ...prev, details: { ...prev.details, risk: trimmedPrimary } };
      }
    });

    setActiveEditor(null);
  };

  const handleFillCurrentLocation = async () => {
    try {
      setIsResolvingLocation(true);

      const granted = await requestAppLocationPermission();
      if (!granted) {
        Alert.alert('위치 권한이 필요해요.', '현재 위치를 불러오려면 위치 권한을 허용해주세요.');
        return;
      }

      const position = await getAppCurrentPosition();

      const [address] = await Location.reverseGeocodeAsync({
        latitude: position.latitude,
        longitude: position.longitude,
      });

      const primaryAddress = address
        ? [address.region, address.city ?? address.subregion, address.district, address.street]
            .filter(Boolean)
            .join(' ')
        : '';

      const secondaryAddress = address
        ? [address.streetNumber, address.name].filter(Boolean).join(' ')
        : '';

      if (!primaryAddress) {
        Alert.alert('현재 위치를 주소로 변환하지 못했어요.', '잠시 후 다시 시도해주세요.');
        return;
      }

      setEditDraft({
        primary: primaryAddress,
        secondary: secondaryAddress || '현재 위치 주변',
      });
    } catch (error) {
      console.log('[ReportFlow] current location error', error);
      Alert.alert('현재 위치를 가져오지 못했어요.', '위치 서비스 상태를 확인한 뒤 다시 시도해주세요.');
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleCreateReport = async () => {
    if (!reportDraft) {
      Alert.alert('AI 정리 정보가 없어요.', '다시 AI 정리를 시도해주세요.');
      setStep(1);
      return;
    }

    setIsAnalyzing(true);

    try {
      if (isInsufficientCategory(reportDraft)) {
        setIsAnalyzing(false);
        Alert.alert('제보로 접수하기엔 내용이 부족해요.', '상황, 위치, 발생 내용을 조금 더 구체적으로 작성한 뒤 다시 AI 정리를 진행해 주세요.');
        return;
      }

      const draft = reportDraft.reportDraft;
      const request: CreateReportRequest = {
        title: editableReview.title,
        contents: {
          ...draft.contents,
          summary: editableReview.aiSummary || draft.contents.summary,
          what: editableReview.details.issue || draft.contents.what,
          why: editableReview.details.risk || draft.contents.why,
        },
        latitude: draft.latitude,
        longitude: draft.longitude,
        roadAddress: editableReview.location.address || draft.roadAddress,
        jibunAddress: editableReview.location.detail || draft.jibunAddress,
        sido: draft.sido,
        sigungu: draft.sigungu,
        eupmyeondong: draft.eupmyeondong,
        occurredAt: editableReview.details.occurredAt || draft.occurredAt,
        riskScore: parseRiskScore(editableReview.details.risk, draft.riskScore),
        visibility: draft.visibility,
        categoryId: draft.categoryId,
        departmentId: draft.departmentId,
        issueGroupId: draft.issueGroupId,
        embedding: draft.embedding,
      };

      const createdReport = await createReport({
        images,
        request,
      });

      console.log('[ReportFlow] report created', createdReport.report.id);
      setEditableReview((prev) => ({
        ...prev,
        completion: makeCompletionFromCreateResponse(createdReport),
      }));
      setStep(3);
    } catch (error) {
      console.log('[ReportFlow] report create error', getApiErrorMessage(error), error);
      Alert.alert('제보 등록 실패', '제보를 등록하지 못했습니다. 로그인/네트워크 상태를 확인하고 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGoToInbox = () => {
    router.push('/my-reports');
  };

  const handleStartNewReport = () => {
    resetFlow();
  };

  const showScreenshotToast = () => {
    if (screenshotToastTimerRef.current) {
      clearTimeout(screenshotToastTimerRef.current);
    }

    setIsScreenshotToastVisible(true);
    screenshotToastTimerRef.current = setTimeout(() => {
      setIsScreenshotToastVisible(false);
    }, SCREENSHOT_TOAST_DURATION);
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let isMounted = true;

    const preparePermissions = async () => {
      try {
        await ScreenCapture.requestPermissionsAsync();
      } catch (error) {
        console.log('[ReportFlow] screenshot permission request skipped', error);
      }
    };

    preparePermissions();

    const subscription = ScreenCapture.addScreenshotListener(() => {
      if (!isMounted) {
        return;
      }
      showScreenshotToast();
    });

    return () => {
      isMounted = false;
      subscription.remove();
      if (screenshotToastTimerRef.current) {
        clearTimeout(screenshotToastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (isAnalyzing) {
    return <AnalyzingScreen onBack={handleBack} />;
  }

  const tinted = step === 2 || step === 3;
  return (
    <View style={[styles.flex, tinted && styles.tinted]}>
      <AppBar
        title={step === 2 ? 'AI 정리 확인' : '민원 신고 작성'}
        logo={false}
        onBack={step === 3 ? undefined : handleBack}
        right={
          <Pressable accessibilityRole="button" hitSlop={8}>
            <Icon name="bell" size={22} color={colors.ink} />
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.flex}>
          {step !== 3 ? (
            <View style={styles.stepperWrap}>
              <Stepper
                step={step}
                total={3}
                labels={['작성', '확인/수정', '완료']}
              />
            </View>
          ) : null}
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: insets.bottom + 120 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 ? (
              <WriteStep
                content={content}
                images={images}
                onChangeContent={setContent}
                onPickImages={handlePickImages}
                onRemoveImage={handleRemoveImage}
              />
            ) : null}
            {step === 2 ? <ReviewStep reviewData={reviewData} onEditField={handleEditField} /> : null}
            {step === 3 ? <CompleteStep completion={reviewData.completion} /> : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
            {step === 1 ? (
              <Button
                label="AI로 정리하기"
                icon="sparkle"
                onPress={handleCreateDraft}
                disabled={!isNextEnabled}
              />
            ) : null}
            {step === 2 ? (
              <View style={styles.footerStack}>
                {isReportBlockedByInsufficient ? (
                  <AppText style={styles.blockedSubmitText}>
                    제보로 접수하기엔 내용이 부족해요. 내용을 더 구체적으로 작성한 뒤 다시 AI 정리를 진행해 주세요.
                  </AppText>
                ) : null}
                <Button
                  label="이대로 제보하기"
                  onPress={handleCreateReport}
                  disabled={isReportBlockedByInsufficient}
                />
              </View>
            ) : null}
            {step === 3 ? (
              <View style={styles.footerStack}>
                <Button label="내 민원함 보기" onPress={handleGoToInbox} />
                <Button label="새 제보하기" variant="secondary" color={colors.muted} onPress={handleStartNewReport} />
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>

      <ExitConfirmModal
        visible={isExitConfirmVisible}
        onClose={handleCloseExitConfirm}
        onExit={handleExitFlow}
      />
      <EditFieldModal
        field={activeEditor}
        draft={editDraft}
        onChangeDraft={handleChangeDraft}
        onUseCurrentLocation={handleFillCurrentLocation}
        onClose={handleCloseEditor}
        onSave={handleSaveEditor}
        isResolvingLocation={isResolvingLocation}
      />
      <ScreenshotToast visible={isScreenshotToastVisible} bottomInset={insets.bottom} />
    </View>
  );
}

function getDraftFromField(field: DetailFieldKey, reviewData: EditableReviewData): EditDraft {
  switch (field) {
    case 'title':
      return { primary: reviewData.title, secondary: '' };
    case 'category':
      return { primary: reviewData.category, secondary: '' };
    case 'location':
      return { primary: reviewData.location.address, secondary: reviewData.location.detail };
    case 'occurredAt':
      return { primary: reviewData.details.occurredAt, secondary: '' };
    case 'issue':
      return { primary: reviewData.details.issue, secondary: '' };
    case 'risk':
      return { primary: reviewData.details.risk, secondary: '' };
  }
}

function getEditorMeta(field: DetailFieldKey | null) {
  switch (field) {
    case 'title':
      return { title: '제목 수정', primaryLabel: '제목', primaryPlaceholder: '민원 제목을 입력해주세요', multiline: false };
    case 'category':
      return { title: '카테고리 수정', primaryLabel: '카테고리', primaryPlaceholder: '카테고리를 입력해주세요', multiline: false };
    case 'location':
      return {
        title: '위치 수정',
        primaryLabel: '주소',
        secondaryLabel: '상세 위치',
        primaryPlaceholder: '예) 대전 서구 둔산동 1036',
        secondaryPlaceholder: '예) 갤러리아타임월드 정문 앞 보도',
        multiline: false,
      };
    case 'occurredAt':
      return { title: '발생 시각 수정', primaryLabel: '발생 시각', primaryPlaceholder: '예) 26.05.28 (수) 07:40 AM', multiline: false };
    case 'issue':
      return { title: '문제 내용 수정', primaryLabel: '문제 내용', primaryPlaceholder: '무슨 문제가 있었는지 적어주세요', multiline: true };
    case 'risk':
      return { title: '위험 이유 수정', primaryLabel: '위험 이유', primaryPlaceholder: '왜 위험한지 적어주세요', multiline: true };
    default:
      return null;
  }
}

// ── AI 정리중 (loading) ──
function AnalyzingScreen({ onBack }: { onBack: () => void }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const stepMs = ANALYZE_DURATION / (ANALYZE_STEPS.length + 1);
    const timers = ANALYZE_STEPS.map((_, i) =>
      setTimeout(() => setDone(i + 1), stepMs * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <View style={styles.flex}>
      <AppBar title="제보하기" logo={false} onBack={onBack} right={<AppText style={styles.stepBadge}>1 / 2</AppText>} />
      <View style={styles.analyzeBody}>
        <View style={styles.analyzeSpinner}>
          <ActivityIndicator size="large" color={colors.accent} />
          <View style={styles.analyzeSpark}>
            <Icon name="sparkle" size={30} color={colors.accent} fill />
          </View>
        </View>
        <AppText variant="title" color={colors.ink} style={styles.analyzeTitle}>
          AI가 제보를 정리하고 있어요
        </AppText>
        <AppText style={styles.analyzeSub}>
          제목·카테고리·육하원칙을 자동으로{'\n'}채우는 중이에요. 잠시만요…
        </AppText>
        <View style={styles.analyzeList}>
          {ANALYZE_STEPS.map((label, i) => {
            const isDone = i < done;
            return (
              <View key={label} style={[styles.analyzeRow, { opacity: isDone ? 1 : 0.5 }]}>
                <View style={[styles.analyzeCheck, { backgroundColor: isDone ? colors.brand : colors.soft2 }]}>
                  {isDone ? (
                    <Icon name="check" size={14} color={colors.white} strokeWidth={2.6} />
                  ) : (
                    <View style={styles.analyzeDot} />
                  )}
                </View>
                <AppText style={[styles.analyzeRowText, { color: isDone ? colors.ink : colors.muted }]}>
                  {label}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ── 1. 입력 ──
function WriteStep({
  content,
  images,
  onChangeContent,
  onPickImages,
  onRemoveImage,
}: {
  content: string;
  images: ReportImage[];
  onChangeContent: (text: string) => void;
  onPickImages: () => Promise<void>;
  onRemoveImage: (id: string) => void;
}) {
  return (
    <View style={styles.stepContent}>
      <AppText variant="display" color={colors.ink}>무슨 일이{'\n'}있었나요?</AppText>
      <AppText style={styles.heroSub}>한두 줄이면 충분해요. 나머지는 AI가 정리해 드려요.</AppText>

      <View style={styles.textAreaWrap}>
        <TextInput
          value={content}
          onChangeText={(text) => onChangeContent(text.slice(0, MAX_CONTENT_LENGTH))}
          multiline
          textAlignVertical="top"
          placeholder={'예) 역삼로 124 앞 인도에 보도블록이 깨져서\n사람들이 자꾸 걸려 넘어져요.'}
          placeholderTextColor={colors.faint}
          style={styles.textArea}
        />
      </View>
      <AppText style={styles.counter}>{content.length} / {MAX_CONTENT_LENGTH}</AppText>

      <Pressable style={styles.attachRow} onPress={onPickImages}>
        <View style={styles.attachLeft}>
          <Icon name="image" size={20} color={colors.ink} />
          <AppText variant="section" color={colors.ink}>사진</AppText>
          <AppText style={styles.attachOptional}>선택</AppText>
        </View>
        <Icon name="chevD" size={18} color={colors.muted} />
      </Pressable>
      <View style={styles.imageRow}>
        {images.map((image) => (
          <View key={image.id} style={styles.imageCard}>
            <Image source={{ uri: image.uri }} style={styles.imageThumb} />
            <Pressable onPress={() => onRemoveImage(image.id)} style={styles.removeImage} hitSlop={6}>
              <Icon name="x" size={13} color={colors.white} strokeWidth={2.4} />
            </Pressable>
          </View>
        ))}
        {images.length < MAX_IMAGES ? (
          <Pressable onPress={onPickImages} style={styles.addImage}>
            <Icon name="camera" size={24} color={colors.muted} />
            <AppText style={styles.addImageText}>추가</AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ── 2. AI 정리 확인 ──
function ReviewStep({
  reviewData,
  onEditField,
}: {
  reviewData: EditableReviewData & { sourceContent: string; images: ReportImage[] };
  onEditField: (field: DetailFieldKey) => void;
}) {
  return (
    <View style={styles.stepContent}>
      <View style={styles.aiLine}>
        <Icon name="sparkle" size={16} color={colors.accent} fill />
        <AppText style={styles.aiLineText}>AI가 정리했어요 · 수정할 수 있어요</AppText>
      </View>

      <Card style={styles.gap}>
        <View style={styles.cardHeadRow}>
          <CatChip icon="alert" label={reviewData.category} color={colors.coral} />
          <EditButton onPress={() => onEditField('category')} />
        </View>
        <View style={styles.titleRow}>
          <AppText variant="heading" color={colors.ink} style={styles.reviewTitle}>
            {reviewData.title}
          </AppText>
          <EditButton onPress={() => onEditField('title')} />
        </View>
        {reviewData.detectedTags.length > 0 ? (
          <View style={styles.tagRow}>
            {reviewData.detectedTags.map((tag) => (
              <Tag key={tag} label={tag.startsWith('#') ? tag : `#${tag}`} />
            ))}
          </View>
        ) : null}
      </Card>

      {reviewData.aiSummary ? (
        <Card style={styles.gap}>
          <AppText style={styles.cardLabel}>AI 요약</AppText>
          <AppText style={styles.summaryText}>{reviewData.aiSummary}</AppText>
        </Card>
      ) : null}

      <Card style={styles.gap}>
        <View style={styles.cardHeadRow}>
          <View style={styles.rowCenter}>
            <Icon name="location" size={15} color={colors.muted} />
            <AppText style={styles.cardLabel}> 위치</AppText>
          </View>
          <EditButton onPress={() => onEditField('location')} />
        </View>
        <AppText style={styles.locationPrimary}>{reviewData.location.address}</AppText>
        <AppText style={styles.locationSecondary}>{reviewData.location.detail}</AppText>
      </Card>

      <Card style={styles.gap}>
        <AppText style={[styles.cardLabel, styles.detailHead]}>상세 내용</AppText>
        <DetailItem icon="clock" label="발생 시각" value={reviewData.details.occurredAt} onPress={() => onEditField('occurredAt')} />
        <DetailItem icon="alert" label="문제 내용" value={reviewData.details.issue} onPress={() => onEditField('issue')} />
        <DetailItem icon="info" label="위험 이유" value={reviewData.details.risk} onPress={() => onEditField('risk')} />
      </Card>

      {reviewData.images.length > 0 ? (
        <Card style={styles.gap}>
          <AppText style={[styles.cardLabel, styles.detailHead]}>첨부 사진</AppText>
          <View style={styles.imageRow}>
            {reviewData.images.map((image) => (
              <View key={image.id} style={styles.imageCard}>
                <Image source={{ uri: image.uri }} style={styles.imageThumb} />
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

function DetailItem({
  icon,
  label,
  value,
  onPress,
}: {
  icon: 'clock' | 'alert' | 'info';
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailLeft}>
        <Icon name={icon} size={18} color={colors.faint} />
        <View style={styles.detailTextBlock}>
          <AppText style={styles.detailLabel}>{label}</AppText>
          <AppText style={styles.detailValue}>{value}</AppText>
        </View>
      </View>
      <EditButton onPress={onPress} />
    </View>
  );
}

function EditButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.editBtn}>
      <AppText style={styles.editBtnText}>수정</AppText>
    </Pressable>
  );
}

// ── 3. 접수 완료 ──
function CompleteStep({ completion }: { completion: EditableReviewData['completion'] }) {
  return (
    <View style={styles.completeContent}>
      <View style={styles.completeCheck}>
        <Icon name="checkCircle" size={42} color={statusColors.done.dot} strokeWidth={2} />
      </View>
      <AppText variant="title" color={colors.ink} style={styles.completeTitle}>제보가 접수되었어요</AppText>
      <AppText style={styles.completeSub}>
        담당 기관으로 자동 전달되었습니다.{'\n'}처리 현황은 알림으로 알려드릴게요.
      </AppText>

      <Card padded={false} style={styles.completeCard}>
        <View style={styles.completeRow}>
          <AppText style={styles.completeRowLabel}>접수 번호</AppText>
          <AppText style={styles.completeMono}>{completion.receiptNumber}</AppText>
        </View>
        <View style={styles.completeDivider} />
        <View style={styles.completeAgency}>
          <View style={styles.agencyIcon}>
            <Icon name="building" size={20} color={colors.brand} />
          </View>
          <View>
            <AppText style={styles.completeRowLabel}>담당 기관</AppText>
            <AppText style={styles.agencyName}>
              {completion.organization} · {completion.department}
            </AppText>
          </View>
        </View>
        <View style={styles.completeDivider} />
        <View style={styles.completeRow}>
          <AppText style={styles.completeRowLabel}>예상 처리 기간</AppText>
          <AppText style={styles.completeRowValue}>{completion.eta}</AppText>
        </View>
      </Card>

      <View style={styles.noticeCard}>
        <Icon name="info" size={18} color={colors.accent} />
        <AppText style={styles.noticeText}>
          처리 상태는 <AppText style={styles.noticeAccent}>‘내 민원함’</AppText>에서 확인할 수 있어요.
        </AppText>
      </View>
    </View>
  );
}

function ExitConfirmModal({
  visible,
  onClose,
  onExit,
}: {
  visible: boolean;
  onClose: () => void;
  onExit: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.exitCard}>
          <AppText variant="title" color={colors.ink} style={styles.center}>다음에 남길까요?</AppText>
          <AppText style={styles.exitDesc}>지금까지 쓴 내용은 저장되지 않아요.</AppText>
          <View style={styles.exitActions}>
            <View style={styles.exitBtn}>
              <Button label="닫기" variant="secondary" color={colors.muted} onPress={onClose} />
            </View>
            <View style={styles.exitBtn}>
              <Button label="나가기" bg={colors.accent} onPress={onExit} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditFieldModal({
  field,
  draft,
  onChangeDraft,
  onUseCurrentLocation,
  onClose,
  onSave,
  isResolvingLocation,
}: {
  field: DetailFieldKey | null;
  draft: EditDraft;
  onChangeDraft: (key: DraftFieldKey, value: string) => void;
  onUseCurrentLocation: () => Promise<void>;
  onClose: () => void;
  onSave: () => void;
  isResolvingLocation: boolean;
}) {
  const meta = getEditorMeta(field);

  if (!meta) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Pressable style={styles.sheetCard} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <AppText variant="heading" color={colors.ink}>{meta.title}</AppText>

          <View style={styles.sheetForm}>
            <AppText style={styles.sheetFieldLabel}>{meta.primaryLabel}</AppText>
            {field === 'location' ? (
              <View style={styles.locationInputRow}>
                <TextInput
                  value={draft.primary}
                  onChangeText={(value) => onChangeDraft('primary', value)}
                  placeholder={meta.primaryPlaceholder}
                  placeholderTextColor={colors.faint}
                  style={[styles.sheetInput, styles.flex]}
                />
                <Pressable
                  onPress={onUseCurrentLocation}
                  style={styles.currentLocationBtn}
                  disabled={isResolvingLocation}
                >
                  {isResolvingLocation ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Icon name="location" size={20} color={colors.accent} />
                  )}
                </Pressable>
              </View>
            ) : (
              <TextInput
                value={draft.primary}
                onChangeText={(value) => onChangeDraft('primary', value)}
                placeholder={meta.primaryPlaceholder}
                placeholderTextColor={colors.faint}
                multiline={meta.multiline}
                textAlignVertical={meta.multiline ? 'top' : 'center'}
                style={[styles.sheetInput, meta.multiline ? styles.sheetTextArea : null]}
              />
            )}

            {meta.secondaryLabel ? (
              <>
                <AppText style={styles.sheetFieldLabel}>{meta.secondaryLabel}</AppText>
                <TextInput
                  value={draft.secondary}
                  onChangeText={(value) => onChangeDraft('secondary', value)}
                  placeholder={meta.secondaryPlaceholder}
                  placeholderTextColor={colors.faint}
                  style={styles.sheetInput}
                />
              </>
            ) : null}
          </View>

          <View style={styles.sheetActions}>
            <View style={styles.exitBtn}>
              <Button label="취소" variant="secondary" color={colors.muted} onPress={onClose} />
            </View>
            <View style={styles.exitBtn}>
              <Button label="저장" onPress={onSave} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ScreenshotToast({ visible, bottomInset }: { visible: boolean; bottomInset: number }) {
  if (!visible || Platform.OS === 'web') {
    return null;
  }

  return (
    <SafeAreaView pointerEvents="none" style={[styles.toastWrap, { bottom: bottomInset + 18 }]}>
      <View style={styles.toast}>
        <Icon name="alert" size={16} color={colors.white} />
        <AppText style={styles.toastText}>화면 캡처를 감지했어요.</AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  tinted: { backgroundColor: colors.soft },
  stepBadge: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.muted },
  stepperWrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  stepContent: { gap: 12 },

  // write step
  heroSub: { fontSize: fontSize.mdLg, color: colors.muted, marginTop: 8, lineHeight: 22 },
  textAreaWrap: {
    marginTop: 8,
    minHeight: 130,
    paddingVertical: 4,
  },
  textArea: { fontFamily: fonts.regular, fontSize: 16, color: colors.ink, lineHeight: 24, minHeight: 120 },
  counter: { textAlign: 'right', fontSize: fontSize.xs, color: colors.faint, marginTop: 6 },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  attachLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attachOptional: { fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.muted },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  imageCard: { width: 92, height: 92, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.soft2 },
  imageThumb: { width: '100%', height: '100%' },
  removeImage: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(24,29,38,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImage: {
    width: 92,
    height: 92,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageText: { fontFamily: fonts.semibold, fontSize: fontSize.xs, color: colors.muted },

  // review step
  aiLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  aiLineText: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.accent },
  gap: { marginTop: 0 },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  reviewTitle: { flex: 1, lineHeight: 24 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  cardLabel: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.ink },
  summaryText: { fontSize: fontSize.mdLg, color: colors.body, lineHeight: 23, marginTop: 8 },
  locationPrimary: { fontSize: fontSize.mdLg, color: colors.body, fontFamily: fonts.medium, marginTop: 10 },
  locationSecondary: { fontSize: fontSize.md, color: colors.muted, marginTop: 3 },
  detailHead: { marginBottom: 4 },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    marginTop: 8,
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  detailTextBlock: { flex: 1 },
  detailLabel: { fontSize: fontSize.xs, color: colors.muted },
  detailValue: { fontSize: fontSize.mdLg, color: colors.body, fontFamily: fonts.medium, marginTop: 2, lineHeight: 22 },
  editBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  editBtnText: { fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.accent },

  // complete step
  completeContent: { alignItems: 'center', paddingTop: 24 },
  completeCheck: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: statusColors.done.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  completeTitle: { textAlign: 'center' },
  completeSub: { fontSize: fontSize.mdLg, color: colors.muted, marginTop: 8, lineHeight: 22, textAlign: 'center' },
  completeCard: { width: '100%', padding: 16, marginTop: 20, gap: 14 },
  completeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  completeRowLabel: { fontSize: fontSize.md, color: colors.muted },
  completeRowValue: { fontSize: fontSize.mdLg, color: colors.body, fontFamily: fonts.semibold },
  completeMono: { fontFamily: fonts.bold, fontSize: fontSize.mdLg, color: colors.ink },
  completeDivider: { height: 1, backgroundColor: colors.hairline },
  completeAgency: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agencyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agencyName: { fontSize: fontSize.mdLg, fontFamily: fonts.bold, color: colors.ink, marginTop: 2 },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 16,
    width: '100%',
  },
  noticeText: { flex: 1, fontSize: fontSize.md, color: colors.body, lineHeight: 22 },
  noticeAccent: { fontFamily: fonts.bold, color: colors.accent },

  // analyzing
  analyzeBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  analyzeSpinner: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  analyzeSpark: { position: 'absolute' },
  analyzeTitle: { textAlign: 'center' },
  analyzeSub: { fontSize: fontSize.mdLg, color: colors.muted, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  analyzeList: { width: '100%', marginTop: 30, gap: 12 },
  analyzeRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  analyzeCheck: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  analyzeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.faint },
  analyzeRowText: { fontFamily: fonts.semibold, fontSize: fontSize.mdLg },

  // footer
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.canvas,
  },
  footerStack: { gap: 10 },
  blockedSubmitText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    lineHeight: 23,
    color: colors.accent,
    textAlign: 'center',
  },

  // exit modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(24,29,38,0.5)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  exitCard: { width: '100%', backgroundColor: colors.canvas, borderRadius: 22, padding: 24 },
  center: { textAlign: 'center' },
  exitDesc: { fontSize: fontSize.mdLg, color: colors.muted, textAlign: 'center', marginTop: 10, lineHeight: 23 },
  exitActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  exitBtn: { flex: 1 },

  // edit sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(24,29,38,0.5)', justifyContent: 'flex-end' },
  sheetCard: { backgroundColor: colors.canvas, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 32, ...shadow.sheet },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#d8dbe1', alignSelf: 'center', marginBottom: 16 },
  sheetForm: { marginTop: 16, gap: 8 },
  sheetFieldLabel: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.muted, marginTop: 4 },
  sheetInput: {
    backgroundColor: colors.soft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  sheetTextArea: { minHeight: 96, textAlignVertical: 'top' },
  locationInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currentLocationBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 22 },

  // screenshot toast
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(24,29,38,0.92)',
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  toastText: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.white },
});
