import { ActivityIndicator, View } from "react-native";

/**
 * Auth screen - handles rizon://auth route
 * useDeepLinkingHandler in _layout processes the actual token
 */
export default function AuthScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}
