// app/(tabs)/settings.tsx
import { View, Text } from "react-native";

export default function Settings() {
    return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>설정</Text>
      <Text>알림설정 / 지도설정 / 기타</Text>
    </View>
    );
  }