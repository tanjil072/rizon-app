import { RizonButton } from "@/components/ui/rizon-button";
import { RIZON_LOGO } from "@/constants/assets";
import React from "react";
import { Image, Text, View } from "react-native";
import { styles } from "./styles";

type InitialOnboardingContentProps = {
  onNotYetPress: () => void;
  onLovingItPress: () => void;
};

export const InitialOnboardingContent = ({
  onNotYetPress,
  onLovingItPress,
}: InitialOnboardingContentProps) => (
  <View style={styles.container}>
    <View style={styles.logoContainer}>
      <View style={styles.logoWrapper}>
        <Image source={RIZON_LOGO} style={styles.logo} resizeMode="contain" />
      </View>
    </View>
    <Text style={styles.title}>Enjoying Rizon so far?</Text>
    <Text style={styles.subtitle}>
      Your feedback helps us build a better money experience.
    </Text>
    <View style={styles.buttonsContainer}>
      <View style={styles.buttonRow}>
        <RizonButton
          title="Not yet"
          onPress={onNotYetPress}
          variant="outline"
          style={styles.button}
        />
        <RizonButton
          title="Yes, loving it"
          onPress={onLovingItPress}
          variant="primary"
          style={styles.button}
        />
      </View>
    </View>
  </View>
);
