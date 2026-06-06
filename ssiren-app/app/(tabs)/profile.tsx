// app/(tabs)/Profile.tsx
import { View, Text } from "react-native";

export default function Profile() {
    return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>내정보</Text>
      <Text>프로필 / 처리현황 / 민원목록</Text>
    </View>
    );
  }