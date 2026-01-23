import { isLiquidGlassSupported } from "@callstack/liquid-glass";
import { LegendListRef } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import { AlignLeft, ChevronDown, SquarePen } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { trigger } from "react-native-haptic-feedback";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchBarCommands } from "react-native-screens";
import { toast } from "sonner-native";
import assets from "../assets";
import { ChatInput } from "../components/chat/ChatInput";
import ChatMessage from "../components/chat/ChatMessage";
import { WelcomeContent } from "../components/chat/WelcomeContent";
import Loading from "../components/Loading";
import { CustomDrawer } from "../components/ui";
import { getPreviousTabAndroid } from "../components/ui/CustomAndroidTabBar";
import { getPreviousTab } from "../navigation/BottomTabNavigator";
import { BottomTabProps, NavigationProps } from "../navigation/navigationTypes";
import { useAuthStore } from "../store/authStore";
import {
  ChatMessage as ChatMessageType,
  useChatStore,
} from "../store/chatStore";
import { HEADER_HEIGHT, IS_IOS, VivrationOption } from "../utils/constants";
import { LiquidGlassContainer, liquidGlassProps } from "../utils/liquidGlass";

type ChatScreenProps = Platform["OS"] extends "android"
  ? NavigationProps<"Chat">
  : BottomTabProps<"SearchTab">;

const ChatScreen = ({ navigation, route }: ChatScreenProps) => {
  // Get previous tab from route params (Android) or module variable (iOS)
  const previousTabFromRoute = (route?.params as any)?.previousTab;
  const previousRouteName =
    previousTabFromRoute ||
    (IS_IOS ? getPreviousTab() : getPreviousTabAndroid());

  const { t } = useTranslation();
  const { isLoggedIn, getUserProfile } = useAuthStore();
  const { bottom } = useSafeAreaInsets();
  const lastKnowIndex = useSharedValue(0);
  const isUserAtBottom = useSharedValue(true);
  const lastQueryHeightRef = useRef(0);
  const [prevListHeight, setPrevListHeight] = useState(0);
  const [open, setOpen] = useState(false);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const inputRef = useRef<SearchBarCommands | TextInput>(null);
  const listRef = useRef<LegendListRef>(null);
  const listHeight = useRef(0);
  const spinValue = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const showScrollButton = useSharedValue(0);
  const reservedHeightRef = useRef<number | undefined>(undefined);

  // Pre-calculate reserved height on each input change
  const preCalculatedReservedHeight = useMemo(() => {
    if (!inputText.trim()) return undefined;

    const estimatedUserHeight = Math.max(
      60,
      Math.ceil(inputText.length / 50) * 20 + 40
    );
    const currentListHeight = listHeight.current || prevListHeight || 600;

    // With behavior="padding", we add keyboard height to simulate the "keyboard dismissed" state
    // This ensures the scroll position is accurate when keyboard is dismissed after scroll
    const adjustedListHeight = currentListHeight + keyboardHeight;
    const calculatedHeight = Math.max(
      adjustedListHeight - estimatedUserHeight,
      100
    );

    // Store in ref so it persists after input is cleared
    reservedHeightRef.current = calculatedHeight + HEADER_HEIGHT;

    return calculatedHeight;
  }, [inputText, prevListHeight, keyboardHeight]);

  const {
    currentChat,
    isLoadingCurrentChat,
    isLoading,
    sendMessage,
    createChatWithMessage,
    fetchChats,
    fetchFavorites,
    setCurrentChat,
  } = useChatStore();

  // Track keyboard height for accurate reserved height calculation with padding behavior
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      IS_IOS ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);

        // If user is at bottom, scroll to bottom when keyboard shows
        if (isUserAtBottom.value) {
          setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: true });
          }, 50);
        }
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      IS_IOS ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleNewChat = () => {
    setCurrentChat(null);
  };

  useEffect(() => {
    if (currentChat?.Messages.length) {
      // Check if the last message is an optimistic AI message
      const lastMessage = currentChat.Messages[currentChat.Messages.length - 1];
      const isOptimisticAiMessage =
        lastMessage?.content?.type === "ai_chat" &&
        lastMessage?.content?.isOptimistic;

      if (isOptimisticAiMessage) {
        // Use multiple requestAnimationFrame to ensure layout is complete

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (lastKnowIndex.value !== 0) {
              scrollToIndexWithEasing(lastKnowIndex.value);
            }
          });
        });
      }
    }
  }, [currentChat?.Messages.length]);

  useEffect(() => {
    if (!currentChat) {
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 500);
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          listHeight.current = 0;
          setPrevListHeight(0);
          setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: false });
          }, 100);
        });
      });
    }
  }, [currentChat?.id]); // Only trigger when chat ID changes

  useEffect(() => {
    if (isLoggedIn) {
      fetchChats();
      fetchFavorites();
      getUserProfile();
    }
  }, [isLoggedIn]);

  const handleSendMessage = useCallback(
    async (searchText: string) => {
      if (!searchText.trim()) return;

      // Clear input immediately
      setInputText("");

      // Handle iOS search bar cancel
      if (
        isLiquidGlassSupported &&
        "cancelSearch" in (inputRef.current || {})
      ) {
        (inputRef.current as SearchBarCommands)?.cancelSearch();
      }

      trigger("impactMedium", VivrationOption);
      setIsTyping(true);

      lastKnowIndex.value = currentChat?.Messages.length || 0;
      const estimatedUserHeight = Math.max(
        60,
        Math.ceil(searchText.length / 50) * 20 + 40
      );
      lastQueryHeightRef.current = estimatedUserHeight;

      try {
        // If no chat exists, create one with the message
        if (!currentChat?.id) {
          inputRef.current?.blur();
          await createChatWithMessage(searchText);
        } else {
          // Send message to existing chat
          await sendMessage(searchText);
        }
      } catch (error) {
        toast.error("Failed to send message. Please try again.");
      } finally {
        setIsTyping(false);
        trigger("impactMedium", VivrationOption);
        // Clear the reserved height ref after response comes
        setTimeout(() => {
          reservedHeightRef.current = undefined;
        }, 2000);
      }
    },
    [sendMessage, currentChat, createChatWithMessage]
  );

  // Smooth scroll function with keyboard dismiss
  const scrollToIndexWithEasing = useCallback((index: number) => {
    const InteractionManager = require("react-native").InteractionManager;
    InteractionManager.runAfterInteractions(() => {
      listRef.current?.scrollToIndex({
        index,
        animated: true,
      });

      // Dismiss keyboard and blur input after scroll completes
      setTimeout(() => {
        inputRef.current?.blur(); // Blur the input
        Keyboard.dismiss(); // Ensure keyboard is dismissed
      }, 500); // Wait for scroll animation to complete
    });
  }, []);

  const keyExtractor = useCallback(
    (item: ChatMessageType, index: number) => item?.id || index.toString(),
    []
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const currentScrollY = contentOffset.y;
      const maxScrollY = contentSize.height - layoutMeasurement.height;
      const threshold = 500;

      scrollY.value = currentScrollY;
      const distanceFromBottom = maxScrollY - currentScrollY;
      const shouldShow = distanceFromBottom > threshold && maxScrollY > 0;

      isUserAtBottom.value = distanceFromBottom <= 50;

      showScrollButton.value = withSpring(shouldShow ? 1 : 0, {
        damping: 15,
        stiffness: 150,
      });
    },
    []
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Spinning animation for loading
  useEffect(() => {
    if (isLoadingCurrentChat) {
      spinValue.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1, // Infinite repetitions
        false // Don't reverse the animation
      );
    } else {
      spinValue.value = withTiming(0, { duration: 200 });
    }
  }, [isLoadingCurrentChat]);

  const scrollButtonAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      showScrollButton.value,
      [0, 1],
      [0.8, 1],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      showScrollButton.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      showScrollButton.value,
      [0, 1],
      [20, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={open ? onDrawerClosedPressed : onDrawerOpenPressed}
          className="pl-2"
        >
          <AlignLeft color="#fff" size={24} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleNewChat}
          className="pl-2"
          disabled={!isLoggedIn}
        >
          <SquarePen size={24} color={isLoggedIn ? "#fff" : "#666"} />
        </TouchableOpacity>
      ),
      headerShown: true,
      headerTransparent: true,
      headerTitle: '',
      headerStyle: { backgroundColor: "transparent" },
      ...(isLiquidGlassSupported
        ? {
            headerSearchBarOptions: {
              onChangeText: ({ nativeEvent: { text } }) => {
                setInputText(text);
              },
              placeholder: t("chat.inputPlaceholder"),
              shouldShowHintSearchIcon: true,
              onSearchButtonPress: (event: {
                nativeEvent: { text: string };
              }) => {
                const searchText = event.nativeEvent.text;
                if (searchText.trim()) {
                  handleSendMessage(searchText);
                }
              },
              textColor: "#fff",
              tintColor: "#c1fe00",
              ref: inputRef as React.RefObject<SearchBarCommands>,
              hideWhenScrolling: false,
              hideNavigationBar: false,
            },
          }
        : {}),
    });
  }, [navigation, handleNewChat, open, t, isLoggedIn, handleSendMessage]);

  const onDrawerOpenPressed = useCallback(() => {
    setOpen(true);
    trigger("impactMedium", VivrationOption);
  }, []);

  const onDrawerClosedPressed = useCallback(() => {
    setOpen(false);
    trigger("impactMedium", VivrationOption);
  }, []);

  // Determine if we're showing welcome content
  const isShowingWelcome = useMemo(() => {
    const hasMessages = (currentChat?.Messages?.length ?? 0) > 0;
    const isUserTyping = isTyping; // Add this condition

    // Show chat content if user is typing, even without messages
    if (isUserTyping) {
      return false; // Show chat content immediately
    }

    return !currentChat || !hasMessages;
  }, [currentChat?.Messages?.length, currentChat, isLoading, isTyping]);

  return (
    <Drawer
      open={open}
      onOpen={onDrawerOpenPressed}
      onClose={onDrawerClosedPressed}
      renderDrawerContent={() => (
        <CustomDrawer onClose={onDrawerClosedPressed} />
      )}
      overlayStyle={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
      drawerStyle={{ backgroundColor: "transparent" }}
    >
      <LinearGradient
        colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={[styles.container, { flex: 1 }]}
          behavior={"padding"}
          contentContainerStyle={{ flex: 1 }}
          keyboardVerticalOffset={
            isLiquidGlassSupported
              ? bottom + 8
              : Platform.select({
                  ios: -bottom,
                  android: -bottom / 2,
                })
          }
          enabled={isLiquidGlassSupported ? true : keyboardHeight !== 0}
        >
          <AnimatedLegendList
            key={`chat-list-${currentChat?.id || 'empty'}`}
            ref={listRef}
            onLayout={(e) => {
              const newHeight = e.nativeEvent.layout.height;
              if (Math.abs(newHeight - listHeight.current) > 1) {
                setPrevListHeight(listHeight.current);
                listHeight.current = newHeight;
              }
            }}
            ListEmptyComponent={
              isLoadingCurrentChat ? (
                <Loading />
              ) : isShowingWelcome ? (
                <WelcomeContent />
              ) : null
            }
            data={currentChat?.Messages || []}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent:
                isShowingWelcome || isLoadingCurrentChat
                  ? "center"
                  : "flex-start",
              paddingTop: HEADER_HEIGHT + 15,
              paddingBottom: Platform.select({
                ios: HEADER_HEIGHT * (keyboardHeight !== 0 ? 1.35 : 0.8),
                android: 0,
              }),
            }}
            style={{ flex: 1 }}
            keyExtractor={keyExtractor}
            estimatedItemSize={80}
            maintainScrollAtEnd={false}
            alignItemsAtEnd={false}
            keyboardDismissMode="interactive"
            initialScrollIndex={0}
            maintainVisibleContentPosition
            renderItem={({ item }) => {
              // Use pre-calculated reserved height as prop for optimistic AI messages
              const getReservedHeight = () => {
                if (
                  item.content.type === "ai_chat" &&
                  item.content.isOptimistic
                ) {
                  // Use the reserved height from ref - persists even after input is cleared
                  return reservedHeightRef.current || 100; // fallback to 100px
                }
                return undefined; // No reserved height for other messages
              };

              return (
                <ChatMessage
                  item={item}
                  onLayout={
                    item.sender === "user"
                      ? (height) => {
                          lastQueryHeightRef.current = height;
                        }
                      : undefined
                  }
                  reservedHeight={getReservedHeight()}
                />
              );
            }}
            onScroll={handleScroll}
          />
          {!isLiquidGlassSupported && (
            <ChatInput
              inputText={inputText}
              setInputText={setInputText}
              onSend={handleSendMessage}
              inputRef={inputRef as any}
              isVoiceDisabled={!isLoggedIn}
              onOpenMerchantsModal={navigation.goBack}
              previousTab={previousRouteName}
            />
          )}

          {(currentChat?.Messages?.length ?? 0) > 0 && (
            <Animated.View
              style={[styles.scrollToBottomButton, scrollButtonAnimatedStyle]}
            >
              <LiquidGlassContainer
                {...liquidGlassProps}
                style={styles.liquidGlassBackground}
              />
              <TouchableOpacity
                onPress={scrollToBottom}
                style={styles.scrollToBottomButtonInner}
                activeOpacity={0.8}
              >
                <ChevronDown size={20} color="#ffffff" strokeWidth={2.5} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </LinearGradient>
    </Drawer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },

  scrollToBottomButton: {
    position: "absolute",
    bottom: 100,
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#c1fe00",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  liquidGlassBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  scrollToBottomButtonInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    zIndex: 1,
  },
});

export default React.memo(ChatScreen);
