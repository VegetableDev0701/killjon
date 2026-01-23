import { ChartBar, Check, Globe, Lightbulb, Store } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  Dimensions,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Animation configurations matching iOS MenuView feel
const SPRING_CONFIG = {
  damping: 18,
  mass: 0.9,
  stiffness: 120,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const ANIMATION_CONFIG = {
  open: {
    duration: 250,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // easeOutQuart
  },
  close: {
    duration: 200,
    easing: Easing.bezier(0.55, 0.06, 0.68, 0.19), // easeInQuart
  },
  backdrop: {
    duration: 200,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  },
};

type MenuItem = {
  id: string;
  title: string;
  titleColor?: string;
  image?: string;
  imageColor?: string;
  state?: "on" | "off";
  attributes?: {
    destructive?: boolean;
    disabled?: boolean;
    hidden?: boolean;
  };
};

type AndroidMenuPickerProps = {
  children: React.ReactNode;
  title?: string;
  themeVariant?: "light" | "dark";
  actions: MenuItem[];
  onPressAction: (event: { nativeEvent: { event: string } }) => void;
  shouldOpenOnLongPress?: boolean;
};

export type AndroidMenuPickerRef = {
  show: () => void;
  hide: () => void;
};

const AndroidMenuPicker = React.forwardRef<
  AndroidMenuPickerRef,
  AndroidMenuPickerProps
>(
  (
    {
      children,
      title,
      themeVariant = "dark",
      actions,
      onPressAction,
      shouldOpenOnLongPress: _shouldOpenOnLongPress = false,
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const [isVisible, setIsVisible] = React.useState(false);
    const triggerElementRef = useRef<View>(null);
    const [triggerLayout, setTriggerLayout] = React.useState<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>(null);

    // Animation values
    const backdropOpacity = useSharedValue(0);
    const menuScale = useSharedValue(0.8);
    const menuOpacity = useSharedValue(0);
    const menuTranslateY = useSharedValue(-20);

    // Filter out hidden items
    const visibleActions = useMemo(
      () => actions.filter((item) => !item.attributes?.hidden),
      [actions]
    );

    // Calculate menu dimensions
    const menuHeight = useMemo(() => {
      const itemHeight = 36;
      const titleHeight = title ? 28 : 0;
      return titleHeight + visibleActions.length * itemHeight;
    }, [visibleActions.length, title]);

    // Expose show/hide methods via ref
    useImperativeHandle(ref, () => ({
      show: () => {
        // Measure trigger element position
        triggerElementRef.current?.measure(
          (x, y, width, height, pageX, pageY) => {
            setTriggerLayout({ x: pageX, y: pageY, width, height });
            setIsVisible(true);
          }
        );
      },
      hide: () => {
        setIsVisible(false);
      },
    }));

    const handleClose = useCallback(() => {
      backdropOpacity.value = withTiming(0, ANIMATION_CONFIG.backdrop);
      menuOpacity.value = withTiming(0, ANIMATION_CONFIG.close);
      menuScale.value = withTiming(0.8, ANIMATION_CONFIG.close);
      menuTranslateY.value = withTiming(
        -20,
        ANIMATION_CONFIG.close,
        (finished) => {
          if (finished) {
            runOnJS(setIsVisible)(false);
          }
        }
      );
    }, [backdropOpacity, menuOpacity, menuScale, menuTranslateY]);

    const handleItemPress = useCallback(
      (item: MenuItem) => {
        if (item.attributes?.disabled) return;

        // Close menu first
        handleClose();

        // Trigger the action after a small delay to allow close animation
        setTimeout(() => {
          onPressAction({ nativeEvent: { event: item.id } });
        }, 100);
      },
      [onPressAction, handleClose]
    );

    // Opening/closing animation sequence
    useEffect(() => {
      if (isVisible) {
        // Opening sequence
        backdropOpacity.value = withTiming(0.99, ANIMATION_CONFIG.backdrop);
        menuOpacity.value = withTiming(1, ANIMATION_CONFIG.open);
        menuScale.value = withSpring(1, SPRING_CONFIG);
        menuTranslateY.value = withSpring(0, SPRING_CONFIG);
      }
    }, [isVisible, backdropOpacity, menuOpacity, menuScale, menuTranslateY]);

    // Animated styles
    const backdropAnimatedStyle = useAnimatedStyle(
      () => ({
        opacity: backdropOpacity.value,
      }),
      []
    );

    const menuAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: menuOpacity.value,
        transform: [
          { scale: menuScale.value },
          { translateY: menuTranslateY.value },
        ],
      };
    }, []);

    // Calculate menu position
    const menuPosition = useMemo(() => {
      if (!triggerLayout) return { top: 100, left: 20 };

      const menuWidth = 220;
      const margin = 4;

      // Position below the trigger element
      let top = triggerLayout.y + triggerLayout.height + 8;
      let left = triggerLayout.x + triggerLayout.width / 2 - menuWidth / 2;

      // Ensure menu fits within screen bounds
      if (left < margin) left = margin;
      if (left + menuWidth > SCREEN_WIDTH - margin) {
        left = SCREEN_WIDTH - menuWidth - margin;
      }

      // If menu would go below screen, position above trigger
      if (top + menuHeight > SCREEN_HEIGHT - insets.bottom - 20) {
        top = triggerLayout.y - menuHeight - 8;
      }

      // Ensure top doesn't go above safe area
      if (top < insets.top + 20) {
        top = insets.top + 20;
      }

      return { top, left };
    }, [triggerLayout, menuHeight, insets]);

    const renderMenuItem = useCallback(
      (item: MenuItem, index: number) => {
        const isActive = item.state === "on";
        const isDisabled = item.attributes?.disabled;
        const isDestructive = item.attributes?.destructive;

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              isDisabled && styles.menuItemDisabled,
              index === visibleActions.length - 1 && styles.menuItemLast,
            ]}
            onPress={() => handleItemPress(item)}
            disabled={isDisabled}
            activeOpacity={0.7}
          >
            <View className="w-8 items-center justify-center ">
              {isActive && <Check color={"#fff"} size={16} />}
            </View>
            <Text
              style={[
                styles.menuItemText,

                isDisabled && styles.menuItemTextDisabled,
                isDestructive && styles.menuItemTextDestructive,
              ]}
            >
              {item.title}
            </Text>
            {item.image && (
              <View style={styles.menuItemIcon}>
                {item.image === "explorer" ? (
                  <Globe color={item.imageColor} size={16} />
                ) : item.image === "listing" ? (
                  <Store color={item.imageColor} size={16} />
                ) : item.image === "analytics" ? (
                  <ChartBar color={item.imageColor} size={16} />
                ) : item.image === "nodoLab" ? (
                  <Lightbulb color={item.imageColor} size={16} />
                ) : (
                  <Globe color={item.imageColor} size={16} />
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      },
      [visibleActions.length, handleItemPress, themeVariant]
    );

    return (
      <>
        <View ref={triggerElementRef} onLayout={() => {}}>
          {children}
        </View>

        <Modal
          visible={isVisible}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={handleClose}
        >
          <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={handleClose}>
            <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
              {/* Menu Container */}
              <View style={styles.menuPositioner}>
                <Animated.View
                  style={[
                    styles.menuContainer,
                    menuAnimatedStyle,
                    {
                      top: menuPosition.top,
                      left: menuPosition.left,
                      height: menuHeight,
                    },
                  ]}
                >
                  {/* Stop propagation on menu touches */}
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={styles.menuWrapper}>
                      <LinearGradient
                        colors={
                          themeVariant === "dark"
                            ? ["#1a1a1a", "#2a2a2a", "#1a1a1a"]
                            : ["#ffffff", "#f5f5f5", "#ffffff"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.menuGradient}
                      >
                        {title && (
                          <View className="pl-8" style={styles.menuHeader}>
                            <Text
                              style={[
                                styles.menuTitle,
                                {
                                  color:
                                    themeVariant === "dark" ? "#FFF" : "#000",
                                },
                              ]}
                            >
                              {title}
                            </Text>
                          </View>
                        )}

                        <View style={styles.menuContent}>
                          {visibleActions.map(renderMenuItem)}
                        </View>
                      </LinearGradient>
                    </View>
                  </TouchableWithoutFeedback>
                </Animated.View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>
      </>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuPositioner: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "box-none",
  },
  menuContainer: {
    position: "absolute",
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
    shadowColor: "#c1fe00",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: "hidden",
  },
  menuWrapper: {
    flex: 1,
  },
  menuGradient: {
    flex: 1,
  },
  menuHeader: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(193, 254, 0, 0.1)",
  },
  menuTitle: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "left",
    opacity: 0.5,
  },
  menuContent: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    minHeight: 36,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemActive: {
    backgroundColor: "rgba(193, 254, 0, 0.1)",
  },
  menuItemDisabled: {
    opacity: 0.4,
  },
  menuItemIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemIconText: {
    fontSize: 18,
    textAlign: "center",
  },
  menuItemText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "400",
    color: "#fff",
  },
  menuItemTextActive: {
    fontWeight: "600",
  },
  menuItemTextDisabled: {
    opacity: 0.5,
  },
  menuItemTextDestructive: {
    color: "#ff4444",
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#c1fe00",
    marginLeft: 8,
  },
});

AndroidMenuPicker.displayName = "AndroidMenuPicker";

export default React.memo(AndroidMenuPicker);
