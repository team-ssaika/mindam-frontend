import { createContext, useContext, useEffect, useRef } from 'react';
import {
  Animated,
  type DimensionValue,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const BottomSheetCloseContext = createContext<(() => void) | null>(null);

export function useBottomSheetClose() {
  const requestClose = useContext(BottomSheetCloseContext);
  if (!requestClose) {
    throw new Error('useBottomSheetClose must be used within BottomSheet');
  }
  return requestClose;
}

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  backdropOpacity?: number;
  containerStyle?: StyleProp<ViewStyle>;
  minHeight?: DimensionValue;
  showHandle?: boolean;
  dismissable?: boolean;
  onHardwareBackPress?: () => void;
};

export function BottomSheet({
  visible,
  onClose,
  children,
  backdropOpacity = 0.22,
  containerStyle,
  minHeight = '38%',
  showHandle = true,
  dismissable = true,
  onHardwareBackPress,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacityValue = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  const closeTranslateY = SCREEN_HEIGHT;

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!visible) {
      sheetTranslateY.setValue(closeTranslateY);
      backdropOpacityValue.setValue(0);
      return;
    }

    sheetTranslateY.setValue(closeTranslateY);
    backdropOpacityValue.setValue(0);
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacityValue, {
        toValue: backdropOpacity,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, visible, sheetTranslateY, backdropOpacityValue, closeTranslateY]);

  const requestClose = () => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: closeTranslateY,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacityValue, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onCloseRef.current();
    });
  };

  const handleHardwareBackPress = () => {
    if (dismissable) {
      requestClose();
      return;
    }
    onHardwareBackPress?.();
  };

  const backdrop = (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.backdropFill,
        {
          backgroundColor: '#111827',
          opacity: backdropOpacityValue,
        },
      ]}
    />
  );

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={handleHardwareBackPress}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {dismissable ? (
          <Pressable
            style={styles.backdrop}
            onPress={requestClose}
            accessibilityRole="button"
            accessibilityLabel="바텀시트 닫기"
            accessibilityHint="현재 열려 있는 바텀시트를 닫습니다"
          >
            {backdrop}
          </Pressable>
        ) : (
          <View style={styles.backdrop} pointerEvents="auto">
            {backdrop}
          </View>
        )}

        <Animated.View
          style={[
            styles.container,
            { minHeight },
            { transform: [{ translateY: sheetTranslateY }] },
            containerStyle,
            { paddingBottom: 24 + insets.bottom },
          ]}
        >
          {showHandle ? <View style={styles.handle} /> : null}
          <BottomSheetCloseContext.Provider value={requestClose}>
            {children}
          </BottomSheetCloseContext.Provider>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d1d5db',
    marginBottom: 16,
  },
});
