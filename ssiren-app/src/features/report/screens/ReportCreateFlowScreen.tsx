import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { reportSubmissionMock } from '../mocks/reportSubmissionMock';
import { ReportStepIndicator } from '../components/ReportStepIndicator';

type FlowStep = 1 | 2 | 3;

type ReportImage = {
  id: string;
  uri: string;
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

export function ReportCreateFlowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<FlowStep>(1);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<ReportImage[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isExitConfirmVisible, setIsExitConfirmVisible] = useState(false);
  const [isScreenshotToastVisible, setIsScreenshotToastVisible] = useState(false);
  const [editableReview, setEditableReview] = useState<EditableReviewData>({
    ...reportSubmissionMock,
    location: { ...reportSubmissionMock.location },
    details: { ...reportSubmissionMock.details },
    detectedTags: [...reportSubmissionMock.detectedTags],
    completion: { ...reportSubmissionMock.completion },
  });
  const [activeEditor, setActiveEditor] = useState<DetailFieldKey | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({ primary: '', secondary: '' });
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const screenshotToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNextEnabled = content.trim().length > 0;

  const resetFlow = () => {
    setStep(1);
    setContent('');
    setImages([]);
    setIsExitConfirmVisible(false);
    setEditableReview({
      ...reportSubmissionMock,
      location: { ...reportSubmissionMock.location },
      details: { ...reportSubmissionMock.details },
      detectedTags: [...reportSubmissionMock.detectedTags],
      completion: { ...reportSubmissionMock.completion },
    });
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
    }));

    setImages((prev) => [...prev, ...nextImages].slice(0, MAX_IMAGES));
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((image) => image.id !== id));
  };

  const handleNext = () => {
    if (!isNextEnabled) {
      Alert.alert('내용을 입력해주세요.', '상황을 간단히 적어주시면 다음 단계로 넘어갈 수 있어요.');
      return;
    }

    setStep(2);
  };

  const handleEditField = (field: DetailFieldKey) => {
    setEditDraft(getDraftFromField(field, editableReview));
    setActiveEditor(field);
    console.log(`[ReportFlow] edit requested: ${field}`);
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
            location: {
              address: trimmedPrimary,
              detail: trimmedSecondary,
            },
          };
        case 'occurredAt':
          return {
            ...prev,
            details: {
              ...prev.details,
              occurredAt: trimmedPrimary,
            },
          };
        case 'issue':
          return {
            ...prev,
            details: {
              ...prev.details,
              issue: trimmedPrimary,
            },
          };
        case 'risk':
          return {
            ...prev,
            details: {
              ...prev.details,
              risk: trimmedPrimary,
            },
          };
      }
    });

    setActiveEditor(null);
  };

  const handleFillCurrentLocation = async () => {
    try {
      setIsResolvingLocation(true);

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('위치 권한이 필요해요.', '현재 위치를 불러오려면 위치 권한을 허용해주세요.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const primaryAddress = address
        ? [address.region, address.city ?? address.subregion, address.district, address.street]
            .filter(Boolean)
            .join(' ')
        : '';

      const secondaryAddress = address
        ? [address.streetNumber, address.name]
            .filter(Boolean)
            .join(' ')
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

  const handleSubmit = () => {
    setStep(3);
  };

  const handleGoToInbox = () => {
    // TODO: navigate to the report inbox route when it is available
    console.log('[ReportFlow] navigate to report inbox');
  };

  const handleGoHome = () => {
    // TODO: replace with the home route once the app flow is finalized
    console.log('[ReportFlow] navigate home');
    router.push('/(tabs)');
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

      console.log(`[ReportFlow] screenshot detected on ${Platform.OS}`);
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

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.safeArea}
      >
        <View style={styles.container}>
          <FlowHeader step={step} onBack={handleBack} />
          <View
            style={[
              styles.contentArea,
              step === 2 || step === 3 ? styles.tintedContentArea : null,
            ]}
          >
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                step === 1
                  ? isKeyboardVisible
                    ? styles.scrollContentWithKeyboardBar
                    : styles.scrollContentWithBottomStack
                  : null,
              ]}
              showsVerticalScrollIndicator={false}
            >
              <ReportStepIndicator currentStep={step} />
              {step === 1 ? (
                <WriteStep
                  content={content}
                  images={images}
                  onChangeContent={setContent}
                  onPickImages={handlePickImages}
                  onRemoveImage={handleRemoveImage}
                />
              ) : null}
              {step === 2 ? (
                <ReviewStep reviewData={reviewData} onEditField={handleEditField} />
              ) : null}
              {step === 3 ? <CompleteStep completion={reviewData.completion} /> : null}
            </ScrollView>
            {step === 1 ? (
              <View
                style={[
                  styles.composeBottomStack,
                  { paddingBottom: isKeyboardVisible ? 0 : insets.bottom + 12 },
                ]}
              >
                <WriteAccessoryBar onPickImages={handlePickImages} />
                {!isKeyboardVisible ? (
                  <ActionButton
                    label="다음"
                    onPress={handleNext}
                    variant="primary"
                    disabled={!isNextEnabled}
                  />
                ) : null}
              </View>
            ) : (
              <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
                {step === 2 ? (
                  <ActionButton label="제출" onPress={handleSubmit} variant="primary" />
                ) : null}
                {step === 3 ? (
                  <>
                    <ActionButton
                      label="내 민원함 보기"
                      onPress={handleGoToInbox}
                      variant="primary"
                    />
                    <ActionButton label="홈으로" onPress={handleGoHome} variant="secondary" />
                  </>
                ) : null}
              </View>
            )}
          </View>
        </View>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getDraftFromField(field: DetailFieldKey, reviewData: EditableReviewData): EditDraft {
  switch (field) {
    case 'title':
      return { primary: reviewData.title, secondary: '' };
    case 'category':
      return { primary: reviewData.category, secondary: '' };
    case 'location':
      return {
        primary: reviewData.location.address,
        secondary: reviewData.location.detail,
      };
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
      return {
        title: '제목 수정',
        primaryLabel: '제목',
        primaryPlaceholder: '민원 제목을 입력해주세요',
        multiline: false,
      };
    case 'category':
      return {
        title: '카테고리 수정',
        primaryLabel: '카테고리',
        primaryPlaceholder: '카테고리를 입력해주세요',
        multiline: false,
      };
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
      return {
        title: '발생 시각 수정',
        primaryLabel: '발생 시각',
        primaryPlaceholder: '예) 26.05.28 (수) 07:40 AM',
        multiline: false,
      };
    case 'issue':
      return {
        title: '문제 내용 수정',
        primaryLabel: '문제 내용',
        primaryPlaceholder: '무슨 문제가 있었는지 적어주세요',
        multiline: true,
      };
    case 'risk':
      return {
        title: '위험 이유 수정',
        primaryLabel: '위험 이유',
        primaryPlaceholder: '왜 위험한지 적어주세요',
        multiline: true,
      };
    default:
      return null;
  }
}

function FlowHeader({ step, onBack }: { step: FlowStep; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerIconButton}>
        <Ionicons name="chevron-back" size={24} color="#1E1E25" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>민원 신고 작성</Text>
      <TouchableOpacity
        onPress={() => console.log(`[ReportFlow] notification tapped at step ${step}`)}
        style={styles.headerIconButton}
      >
        <Ionicons name="notifications-outline" size={24} color="#1E1E25" />
      </TouchableOpacity>
    </View>
  );
}

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
      <Text style={styles.heroTitle}>상황을 편하게 적어주세요.</Text>

      <View style={styles.section}>
        <View style={styles.textAreaWrapper}>
          {content.length === 0 ? (
            <View pointerEvents="none" style={styles.textGuideBlock}>
              <Text style={styles.textGuideText}>
                AI가 민원 형식에 맞게 정리해드릴게요.
                {'\n\n'}
                예) 맨홀 뚜껑이 깨져있어요.
                {'\n\n'}
                정확하고 빠른 처리를 위해 사실 위주로 작성해주세요.
                {'\n'}
                같은 내용의 반복 제출이나 욕설·비방·개인정보가 포함된 내용은 접수에 제한될 수 있어요.
              </Text>
            </View>
          ) : null}
          <TextInput
            value={content}
            onChangeText={(text) => onChangeContent(text.slice(0, MAX_CONTENT_LENGTH))}
            multiline
            textAlignVertical="top"
            style={styles.textArea}
          />
          {content.length > 0 ? (
            <Text style={styles.remainingCounter}>{MAX_CONTENT_LENGTH - content.length}</Text>
          ) : null}
        </View>
      </View>

      {images.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>첨부한 사진</Text>
          <View style={styles.imagePreviewGrid}>
          {images.map((image) => (
            <View key={image.id} style={styles.imageCard}>
              <Image source={{ uri: image.uri }} style={styles.imageThumbnail} />
              <Pressable
                onPress={() => onRemoveImage(image.id)}
                style={styles.removeImageButton}
              >
                <Ionicons name="close" size={16} color="#4A4A54" />
              </Pressable>
            </View>
          ))}
          {images.length < MAX_IMAGES ? (
            <Pressable onPress={onPickImages} style={styles.inlineAddImageCard}>
              <Ionicons name="add" size={20} color="#6E7585" />
            </Pressable>
          ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function WriteAccessoryBar({ onPickImages }: { onPickImages: () => Promise<void> }) {
  return (
    <View style={styles.inputAccessoryBar}>
      <TouchableOpacity onPress={onPickImages} style={styles.accessoryButton}>
        <Ionicons name="image-outline" size={18} color="#5A6273" />
        <Text style={styles.accessoryButtonText}>사진</Text>
      </TouchableOpacity>
      <View style={styles.accessoryRightGroup}>
        <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.keyboardButton}>
          <Ionicons name="chevron-down" size={18} color="#AAB1BE" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ReviewStep({
  reviewData,
  onEditField,
}: {
  reviewData: EditableReviewData & { sourceContent: string; images: ReportImage[] };
  onEditField: (field: DetailFieldKey) => void;
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.heroTitle}>AI가 이렇게 정리했어요</Text>
      <Text style={styles.heroSubtitle}>틀린 내용이 있으면 수정해주세요.</Text>

      <View style={styles.aiSummaryCard}>
        <View style={styles.aiSummaryHeader}>
          <Ionicons name="sparkles" size={16} color="#6257FF" />
          <Text style={styles.aiSummaryTitle}>AI 요약</Text>
        </View>
        <Text style={styles.aiSummaryText}>{reviewData.aiSummary}</Text>
      </View>

      <EditableRow label="제목" value={reviewData.title} onPress={() => onEditField('title')} />
      <EditableRow
        label="카테고리"
        value={reviewData.category}
        onPress={() => onEditField('category')}
      />

      <View style={styles.reviewSection}>
        <View style={styles.reviewSectionHeader}>
          <Text style={styles.reviewSectionTitle}>위치</Text>
          <EditTextButton onPress={() => onEditField('location')} />
        </View>
        <View style={styles.locationCard}>
          <Ionicons name="location" size={20} color="#2B2B33" style={styles.locationIcon} />
          <View style={styles.locationTextWrapper}>
            <Text style={styles.locationPrimary}>{reviewData.location.address}</Text>
            <Text style={styles.locationSecondary}>{reviewData.location.detail}</Text>
          </View>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>상세 내용</Text>
        <DetailItem
          icon="calendar-outline"
          label="발생 시각"
          value={reviewData.details.occurredAt}
          onPress={() => onEditField('occurredAt')}
        />
        <DetailItem
          icon="alert-circle-outline"
          label="문제 내용"
          value={reviewData.details.issue}
          onPress={() => onEditField('issue')}
        />
        <DetailItem
          icon="shield-checkmark-outline"
          label="위험 이유"
          value={reviewData.details.risk}
          onPress={() => onEditField('risk')}
        />
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>사진에서 감지된 내용</Text>
        <View style={styles.tagList}>
          {reviewData.detectedTags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {reviewData.images.length > 0 ? (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>첨부 사진</Text>
          <View style={styles.imageGrid}>
            {reviewData.images.map((image) => (
              <View key={image.id} style={styles.imageCard}>
                <Image source={{ uri: image.uri }} style={styles.imageThumbnail} />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function CompleteStep({
  completion,
}: {
  completion: EditableReviewData['completion'];
}) {
  return (
    <View style={styles.stepContent}>
      <View style={styles.completeHeroTextBlock}>
        <Text style={styles.completeTitle}>제보 접수 완료 !</Text>
        <Text style={styles.completeId}>{completion.reportId}</Text>
      </View>

      <Text style={styles.sectionTitle}>담당 기관</Text>
      <View style={styles.infoCard}>
        <View style={styles.organizationHeader}>
          <View style={styles.organizationIconCircle}>
            <Ionicons name="business-outline" size={26} color="#6257FF" />
          </View>
          <View>
            <Text style={styles.organizationName}>{completion.organization}</Text>
            <Text style={styles.organizationDept}>{completion.department}</Text>
          </View>
        </View>

        <InfoRow icon="receipt-outline" label="접수번호" value={completion.receiptNumber} />
        <InfoRow icon="time-outline" label="예상 처리 기간" value={completion.eta} />
        <View style={styles.infoRow}>
          <Ionicons name="git-compare-outline" size={18} color="#6257FF" />
          <View style={styles.infoReasonBlock}>
            <Text style={styles.infoRowLabel}>자동 배정 사유</Text>
            <Text style={styles.assignmentReason}>{completion.assignmentReason}</Text>
          </View>
        </View>
      </View>

      <View style={styles.noticeCard}>
        <Ionicons name="megaphone-outline" size={18} color="#33A66F" />
        <Text style={styles.noticeText}>
          처리 상태는 <Text style={styles.noticeAccent}>‘내 민원함’</Text>에서 확인할 수 있어요.
          {'\n'}
          처리 과정에서 담당 기관이 연락드릴 수 있습니다.
        </Text>
      </View>
    </View>
  );
}

function EditableRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.reviewSection}>
      <View style={styles.reviewSectionHeader}>
        <Text style={styles.reviewSectionTitle}>{label}</Text>
        <EditTextButton onPress={onPress} />
      </View>
      <View style={styles.valueCard}>
        <Text style={styles.valueText}>{value}</Text>
      </View>
    </View>
  );
}

function DetailItem({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={18} color="#2B2B33" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <View style={styles.detailRight}>
        <Text style={styles.detailValue}>{value}</Text>
        <EditTextButton onPress={onPress} />
      </View>
    </View>
  );
}

function EditTextButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.editButton}>
      <Ionicons name="create-outline" size={14} color="#6257FF" />
      <Text style={styles.editButtonText}>수정</Text>
    </TouchableOpacity>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#6257FF" />
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={styles.infoRowValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  variant,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionButton,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabledButton,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          variant === 'secondary' && styles.secondaryButtonText,
          disabled && styles.disabledButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.exitModalCard}>
          <Text style={styles.exitModalTitle}>다음에 남길까요?</Text>
          <Text style={styles.exitModalDescription}>
            지금까지 쓴 내용은 저장되지 않아요.
          </Text>
          <View style={styles.exitModalActions}>
            <TouchableOpacity onPress={onClose} style={styles.exitSecondaryButton}>
              <Text style={styles.exitSecondaryButtonText}>닫기</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onExit} style={styles.exitPrimaryButton}>
              <Text style={styles.exitPrimaryButtonText}>나가기</Text>
            </TouchableOpacity>
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
          <Text style={styles.sheetTitle}>{meta.title}</Text>

          <View style={styles.sheetForm}>
            <Text style={styles.sheetFieldLabel}>{meta.primaryLabel}</Text>
            {field === 'location' ? (
              <View style={styles.locationInputRow}>
                <TextInput
                  value={draft.primary}
                  onChangeText={(value) => onChangeDraft('primary', value)}
                  placeholder={meta.primaryPlaceholder}
                  placeholderTextColor="#A1A1AE"
                  style={[styles.sheetInput, styles.locationInput]}
                />
                <TouchableOpacity
                  onPress={onUseCurrentLocation}
                  style={styles.currentLocationButton}
                  disabled={isResolvingLocation}
                >
                  {isResolvingLocation ? (
                    <ActivityIndicator size="small" color="#6257FF" />
                  ) : (
                    <Ionicons name="locate-outline" size={20} color="#6257FF" />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                value={draft.primary}
                onChangeText={(value) => onChangeDraft('primary', value)}
                placeholder={meta.primaryPlaceholder}
                placeholderTextColor="#A1A1AE"
                multiline={meta.multiline}
                textAlignVertical={meta.multiline ? 'top' : 'center'}
                style={[
                  styles.sheetInput,
                  meta.multiline ? styles.sheetTextArea : null,
                ]}
              />
            )}

            {meta.secondaryLabel ? (
              <>
                <Text style={styles.sheetFieldLabel}>{meta.secondaryLabel}</Text>
                <TextInput
                  value={draft.secondary}
                  onChangeText={(value) => onChangeDraft('secondary', value)}
                  placeholder={meta.secondaryPlaceholder}
                  placeholderTextColor="#A1A1AE"
                  style={styles.sheetInput}
                />
              </>
            ) : null}
          </View>

          <View style={styles.sheetActions}>
            <TouchableOpacity onPress={onClose} style={styles.sheetSecondaryButton}>
              <Text style={styles.sheetSecondaryButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} style={styles.sheetPrimaryButton}>
              <Text style={styles.sheetPrimaryButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ScreenshotToast({
  visible,
  bottomInset,
}: {
  visible: boolean;
  bottomInset: number;
}) {
  if (!visible || Platform.OS === 'web') {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[
        styles.screenshotToastWrapper,
        { bottom: Platform.OS === 'ios' ? bottomInset + 18 : 26 },
      ]}
    >
      <View style={styles.screenshotToast}>
        <View style={styles.screenshotToastIcon}>
          <Ionicons name="alert" size={16} color="#3B3B42" />
        </View>
        <Text style={styles.screenshotToastText}>화면 캡처를 감지했어요.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F4',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111119',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tintedContentArea: {
    backgroundColor: '#F5F6FA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  scrollContentWithBottomStack: {
    paddingBottom: 188,
  },
  scrollContentWithKeyboardBar: {
    paddingBottom: 60,
  },
  stepContent: {
    gap: 22,
  },
  heroTitle: {
    fontSize: 31,
    lineHeight: 40,
    fontWeight: '800',
    color: '#17171F',
    marginTop: 6,
  },
  heroSubtitle: {
    marginTop: -12,
    fontSize: 17,
    lineHeight: 24,
    color: '#6D6D78',
  },
  section: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17171F',
  },
  textArea: {
    minHeight: 340,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 34,
    fontSize: 17,
    lineHeight: 29,
    color: '#252531',
  },
  textAreaWrapper: {
    position: 'relative',
    minHeight: 340,
    borderTopWidth: 1,
    borderTopColor: '#E7EAF0',
    paddingTop: 14,
    backgroundColor: '#FFFFFF',
  },
  textGuideBlock: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
  },
  textGuideText: {
    fontSize: 19,
    lineHeight: 31,
    color: '#B1B1BC',
  },
  remainingCounter: {
    position: 'absolute',
    right: 0,
    bottom: 30,
    fontSize: 14,
    color: '#9B9BA6',
  },
  composeBottomStack: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  inputAccessoryBar: {
    minHeight: 42,
    paddingHorizontal: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F1F5',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accessoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accessoryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A6273',
  },
  accessoryRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  keyboardButton: {
    width: 42,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imagePreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  imageCard: {
    width: 96,
    height: 96,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F3F4F8',
    position: 'relative',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageCard: {
    width: 96,
    height: 96,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CACBDA',
    backgroundColor: '#FBFBFE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addImageText: {
    fontSize: 14,
    color: '#7E7E8F',
    fontWeight: '600',
  },
  inlineAddImageCard: {
    width: 96,
    height: 96,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CACBDA',
    backgroundColor: '#FBFBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSummaryCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#F3F0FF',
    gap: 10,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#282842',
  },
  aiSummaryText: {
    fontSize: 16,
    lineHeight: 25,
    color: '#343447',
  },
  reviewSection: {
    gap: 10,
  },
  reviewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#17171F',
  },
  valueCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  valueText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2A2A38',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6257FF',
  },
  locationCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 10,
  },
  locationTextWrapper: {
    flex: 1,
    gap: 4,
  },
  locationPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#242433',
  },
  locationSecondary: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5F5F6C',
  },
  detailItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#232331',
  },
  detailRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#484855',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EFF3FF',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4665B5',
  },
  completeHeroTextBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#17171F',
    textAlign: 'center',
  },
  completeId: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C39',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#181820',
    marginTop: 8,
    marginBottom: -8,
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    gap: 18,
  },
  organizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  organizationIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizationName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191925',
  },
  organizationDept: {
    marginTop: 4,
    fontSize: 15,
    color: '#5E5E6C',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoRowLabel: {
    flex: 1,
    fontSize: 15,
    color: '#5B5B68',
  },
  infoRowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D29',
  },
  infoReasonBlock: {
    flex: 1,
    gap: 8,
  },
  assignmentReason: {
    fontSize: 15,
    lineHeight: 24,
    color: '#2F2F3D',
  },
  noticeCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: '#2D4738',
  },
  noticeAccent: {
    color: '#1F9A63',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F4',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  actionButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#6257FF',
  },
  secondaryButton: {
    backgroundColor: '#F4F4F7',
  },
  disabledButton: {
    backgroundColor: '#D6D5E8',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#20202B',
  },
  disabledButtonText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 25, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  exitModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 22,
  },
  exitModalTitle: {
    fontSize: 27,
    lineHeight: 36,
    fontWeight: '800',
    color: '#31384A',
  },
  exitModalDescription: {
    marginTop: 18,
    fontSize: 18,
    lineHeight: 28,
    color: '#7D8697',
  },
  exitModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  exitSecondaryButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 24,
    backgroundColor: '#F2F3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitSecondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667085',
  },
  exitPrimaryButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 24,
    backgroundColor: '#6257FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitPrimaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 25, 0.32)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D8D8E2',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#181820',
  },
  sheetForm: {
    gap: 12,
    marginTop: 20,
  },
  sheetFieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#31313F',
  },
  sheetInput: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E3EB',
    backgroundColor: '#F9F9FC',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#232330',
  },
  sheetTextArea: {
    minHeight: 120,
    paddingTop: 16,
    paddingBottom: 16,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationInput: {
    flex: 1,
  },
  currentLocationButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9DBE8',
    backgroundColor: '#F5F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  sheetSecondaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSecondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#555568',
  },
  sheetPrimaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#6257FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  screenshotToastWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 50,
    elevation: 50,
  },
  screenshotToast: {
    minHeight: 60,
    borderRadius: 999,
    backgroundColor: 'rgba(122, 126, 139, 0.96)',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    alignSelf: 'center',
    maxWidth: '94%',
  },
  screenshotToastIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFC94D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenshotToastText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
