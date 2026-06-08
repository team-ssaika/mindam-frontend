import { createContext, useContext, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

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
};

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (!visible) {
      sheetTranslateY.setValue(SCREEN_HEIGHT);
      return;
    }

    sheetTranslateY.setValue(SCREEN_HEIGHT);
    Animated.timing(sheetTranslateY, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, sheetTranslateY]);

  const requestClose = () => {
    Animated.timing(sheetTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 240,
      useNativeDriver: true,
    }).start(onClose);
  };

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={requestClose}
          accessibilityRole="button"
          accessibilityLabel="바텀시트 닫기"
        />

        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <View style={styles.handle} />
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
    backgroundColor: 'rgba(17,24,39,0.22)',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '38%',
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
