import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { isStagingEnvironment } from "../../utils/constants";

interface StagingLabelProps {
  style?: any;
  textStyle?: any;
}

const StagingLabel: React.FC<StagingLabelProps> = ({ style, textStyle }) => {
  const isStaging = isStagingEnvironment();

  if (!isStaging) {
    return null;
  }

  return (
    <View style={[styles.stagingLabel, style]}>
      <Text style={[styles.stagingText, textStyle]}>STAGING</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  stagingLabel: {
    position: "absolute",
    top: 0,
    right: "42.5%",
    left: "42.5%",
    backgroundColor: "#ff6b35",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  stagingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});

export default StagingLabel;
