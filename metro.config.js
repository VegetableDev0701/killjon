const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = mergeConfig(getDefaultConfig(__dirname), {
  resolver: {
    unstable_conditionNames: ["browser", "require", "react-native"],
  },
  /* your config */
});

module.exports = withNativeWind(config, { input: "./global.css" });
