import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from "@callstack/liquid-glass";
import Animated from "react-native-reanimated";
import { IS_IOS } from "./constants";

export const LiquidGlassContainer =
  IS_IOS && isLiquidGlassSupported
    ? Animated.createAnimatedComponent(LiquidGlassView)
    : Animated.View;

export const liquidGlassProps =
  IS_IOS && isLiquidGlassSupported
    ? { effect: "regular" as const, interactive: true }
    : {};
