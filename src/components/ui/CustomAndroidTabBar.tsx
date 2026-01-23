import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useRef } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabParamList } from "../../navigation/navigationTypes";
import { ANYDO_TIMING } from "../../utils/reanimatedUtils";

let previousTab: keyof BottomTabParamList = "HomeTab";

export const CustomAndroidTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;

  // Animation value for sliding left
  const translateX = useSharedValue(0);
  // Track if the bar was animated away (so we can slide it back in from left)
  const wasAnimatedAway = useRef(false);
  const previousRouteName = useRef<string | undefined>(undefined);
  // Track if we're currently animating away (to prevent immediate slide-back)
  const isAnimatingAway = useRef(false);

  // Filter out Search tab from main tabs
  const mainRoutes = state.routes.filter((route) => route.name !== "SearchTab");
  const searchRoute = state.routes.find((route) => route.name === "SearchTab");
  const searchIndex = state.routes.findIndex(
    (route) => route.name === "SearchTab"
  );

  // Animated style for the bottom bar container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Function to navigate to Chat screen (called after animation completes)
  const navigateToChat = () => {
    // Mark that we're done animating away
    isAnimatingAway.current = false;

    // Navigate to Chat using parent navigator (Chat is a Stack screen, not Tab)
    try {
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate("Chat" as any, { previousTab });
      }
    } catch (error) {
      // Fallback: try using tab navigator navigation
      const event = navigation.emit({
        type: "tabPress",
        target: searchRoute?.key || "",
        canPreventDefault: true,
      });

      if (!event.defaultPrevented && searchRoute) {
        navigation.navigate("Chat" as any, { previousTab });
      }
    }
  };

  // Check navigation state to detect when returning from Chat
  useEffect(() => {
    const checkNavigationState = () => {
      try {
        const parentNav = navigation.getParent();
        if (!parentNav) return;

        const parentState = parentNav.getState();
        if (!parentState) return;

        const currentRouteName = parentState.routes?.[parentState.index]?.name;

        // If we were on Chat and now we're back on MainApp (tab navigator), slide in from left
        // But don't trigger if we're currently animating away
        if (
          previousRouteName.current === "Chat" &&
          currentRouteName === "MainApp" &&
          wasAnimatedAway.current &&
          !isAnimatingAway.current
        ) {
          // Start from left position and animate to 0
          translateX.value = -screenWidth - 100;
          translateX.value = withTiming(0, {
            duration: ANYDO_TIMING.modal.duration,
            easing: ANYDO_TIMING.modal.easing,
          });
          wasAnimatedAway.current = false;
        }

        // Update previous route name
        if (currentRouteName === "Chat") {
          previousRouteName.current = "Chat";
        } else if (currentRouteName === "MainApp") {
          // Only update if we're actually on MainApp (not transitioning)
          if (previousRouteName.current !== "MainApp") {
            previousRouteName.current = "MainApp";
          }
        }
      } catch (error) {
        // Silently handle errors
      }
    };

    // Check on mount and when state changes
    checkNavigationState();

    // Use a reasonable interval to check for navigation changes
    // This handles the case when user uses back button/gesture to return from Chat
    const interval = setInterval(checkNavigationState, 200);

    return () => clearInterval(interval);
  }, [navigation, screenWidth, state.index]);

  // Also handle when returning to tab screens via tab navigation
  useEffect(() => {
    // When returning to a tab screen after being on Chat, slide in from left
    // But don't trigger if we're currently animating away
    if (
      state.index !== searchIndex &&
      wasAnimatedAway.current &&
      !isAnimatingAway.current
    ) {
      // Start from left position and animate to 0
      translateX.value = -screenWidth - 100;
      translateX.value = withTiming(0, {
        duration: ANYDO_TIMING.modal.duration,
        easing: ANYDO_TIMING.modal.easing,
      });
      wasAnimatedAway.current = false;
    }
  }, [state.index, searchIndex, screenWidth]);

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        {
          paddingBottom: insets.bottom + 8,
        },
        animatedStyle,
      ]}
    >
      {/* Pill-shaped container for main tabs */}
      <View style={styles.pillContainer}>
        {mainRoutes.map((route, idx) => {
          const index = state.routes.findIndex((r) => r.name === route.name);
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            // Slide in from left if it was previously animated away (but not currently animating away)
            if (wasAnimatedAway.current && !isAnimatingAway.current) {
              translateX.value = -screenWidth - 100;
              translateX.value = withTiming(0, {
                duration: ANYDO_TIMING.modal.duration,
                easing: ANYDO_TIMING.modal.easing,
              });
              wasAnimatedAway.current = false;
            }

            // Update previous tab before navigation
            previousTab = route.name as keyof BottomTabParamList;

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          // Get the icon
          const IconComponent = options.tabBarIcon;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              <View style={styles.tabContent}>
                {/* Icon */}
                {IconComponent &&
                  IconComponent({
                    color: isFocused ? "#c1fe00" : "#FFFFFF",
                    size: 24,
                    focused: isFocused,
                  })}

                {/* Label */}
                <Text
                  style={[
                    styles.label,
                    {
                      color: isFocused ? "#c1fe00" : "#FFFFFF",
                      fontWeight: isFocused ? "700" : "400",
                    },
                  ]}
                >
                  {label as string}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Floating Search Button */}
      {searchRoute && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={
            state.index === searchIndex ? { selected: true } : {}
          }
          accessibilityLabel={
            descriptors[searchRoute.key]?.options.tabBarAccessibilityLabel
          }
          onPress={() => {
            // Mark that we're animating away and update route tracking
            wasAnimatedAway.current = true;
            isAnimatingAway.current = true;
            previousRouteName.current = "Chat";

            // Slide the bottom bar to the left and disappear
            translateX.value = withTiming(
              -screenWidth - 100, // Slide completely off screen to the left
              {
                duration: 450, // Slightly slower for smoother feel
                easing: ANYDO_TIMING.modal.easing,
              }
              // (finished) => {
              //   if (finished) {
              //     // After animation completes, navigate to Chat screen
              //     runOnJS(navigateToChat)();
              //   }
              // }
            );
            navigateToChat();
          }}
          style={styles.searchButton}
        >
          {descriptors[searchRoute.key]?.options.tabBarIcon?.({
            color: "#FFFFFF",
            size: 26,
            focused: state.index === searchIndex,
          })}
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#272727",
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 40,
    backgroundColor: "transparent",
  },
  tabActive: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "400",
  },
  searchButton: {
    width: 58,
    height: 58,
    borderRadius: 30,
    backgroundColor: "#272727",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
});

// Export function to get previous tab (for use in ChatScreen)
export const getPreviousTabAndroid = (): keyof BottomTabParamList => {
  return previousTab;
};
