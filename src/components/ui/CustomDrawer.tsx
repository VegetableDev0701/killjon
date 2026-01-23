import { isLiquidGlassSupported } from "@callstack/liquid-glass";
import {
  Heart,
  MessageSquare,
  Mic2,
  MoreVertical,
  Pencil,
  Pin,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { HEADER_HEIGHT, IS_ANDROID, IS_IOS } from "../../utils/constants";
import { useLoginSheet } from "../../utils/LoginSheetContext";
import { SpinningLoader } from "../auth";

// Types
interface Chat {
  id: string;
  title: string;
  updatedAt: string;
  is_favorite: boolean;
}

interface AnimatedChatItemProps {
  chat: Chat;
  index: number;
  isSelected: boolean;
  isSelectedAndLoading: boolean;
  handleChatPress: (id: string) => void;
  handleToggleFavorite: (id: string) => void;
  openActionMenu: (chat: Chat) => void;
  pinLoading: boolean;
  formatTime: (dateString: string) => string;
  formatDateLabel: (dateString: string) => string;
}

// Animated Chat Item Component
const AnimatedChatItem = React.memo<AnimatedChatItemProps>(
  ({
    chat,
    index,
    isSelected,
    isSelectedAndLoading,
    handleChatPress,
    handleToggleFavorite,
    openActionMenu,
    pinLoading,
    formatTime,
    formatDateLabel,
  }) => {
    const { t } = useTranslation();
    const anim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 30,
        useNativeDriver: true,
      }).start();
    }, [index, anim]);

    const handlePressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start();
    }, [scaleAnim]);

    const animatedStyle = useMemo(
      () => ({
        opacity: 1,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
          { scale: scaleAnim },
        ],
      }),
      [anim, scaleAnim]
    );

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          activeOpacity={0.9}
          className={`
            mx-4 mb-2 flex-row items-center rounded-[20px] border
            border-[#1a1a1a] bg-[#111] px-4 py-4
            shadow-lg shadow-black/30
            ${
              isSelected
                ? "border-2 border-primary bg-[#0f0f0f] shadow-primary/15"
                : ""
            }
          `}
          onPress={() => handleChatPress(chat.id)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View className="mr-2 flex-1">
            <Text
              className="mb-1 text-base font-bold tracking-wide text-white"
              numberOfLines={2}
            >
              {chat.title.split(" ").slice(0, 2).join(" ")}
            </Text>
            <View className="mt-1 flex-row items-center">
              <Text
                className="text-xs font-medium text-gray-400"
                numberOfLines={1}
              >
                {formatDateLabel(chat.updatedAt)}
              </Text>
              <Text className="mx-1 text-xs font-medium text-gray-400">
                {" "}
                •{" "}
              </Text>
              <Text className="text-xs font-medium text-gray-400">
                {formatTime(chat.updatedAt)}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => handleToggleFavorite(chat.id)}
              className="mr-1 p-1"
              accessibilityLabel={
                chat.is_favorite
                  ? t("sidebar.unfavoriteChat")
                  : t("sidebar.favoriteChat")
              }
            >
              {pinLoading ? (
                <SpinningLoader size={18} color="#c1fe00" />
              ) : (
                <Pin
                  color={chat.is_favorite ? "#c1fe00" : "#666"}
                  fill={chat.is_favorite ? "#c1fe00" : "none"}
                  size={18}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="px-1"
              onPress={() => openActionMenu(chat)}
            >
              <MoreVertical color="#666" size={20} />
            </TouchableOpacity>
            {isSelectedAndLoading && (
              <View className="ml-1">
                <SpinningLoader size={18} color="#c1fe00" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

AnimatedChatItem.displayName = "AnimatedChatItem";

// Empty State Component
const EmptyState = React.memo(({ message }: { message: string }) => (
  <View className="py-15 items-center justify-center px-10">
    <MessageSquare color="#666" size={40} className="mb-4" />
    <Text className="text-center text-base font-medium leading-6 text-gray-400">
      {message}
    </Text>
  </View>
));

EmptyState.displayName = "EmptyState";

// Skeleton Loader Component
const SkeletonLoader = React.memo(({ count = 3 }: { count?: number }) => (
  <View>
    {Array.from({ length: count }).map((_, index) => (
      <View
        key={`skeleton-${index}`}
        className="mx-3 mb-3 h-20 rounded-[20px] border border-[#1a1a1a] bg-[#111]"
      />
    ))}
  </View>
));

SkeletonLoader.displayName = "SkeletonLoader";

// Feature Card Component
const FeatureCard = React.memo(
  ({
    icon: Icon,
    title,
    description,
  }: {
    icon: any;
    title: string;
    description: string;
  }) => (
    <View className="mx-3 mb-3 flex-row items-center rounded-2xl border border-primary/10 bg-primary/5 p-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Icon size={20} color="#c1fe00" />
      </View>
      <View className="flex-1">
        <Text className="mb-1 text-sm font-bold text-white">{title}</Text>
        <Text className="text-xs leading-4 text-gray-400">{description}</Text>
      </View>
    </View>
  )
);

FeatureCard.displayName = "FeatureCard";

// Main CustomDrawer Component
const CustomDrawer = React.memo(({ onClose }: { onClose: () => void }) => {
  const { isLoggedIn } = useAuthStore();
  const { bottom, top } = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showLoginSheet } = useLoginSheet();

  const {
    chats,
    selectedChatId,
    isLoadingChats,
    isLoadingCurrentChat,
    chatPagination,
    isLoadingMoreChats,
    loadMoreChats,
    selectAndFetchChat,
    updateChatTitle,
    deleteChat,
    toggleFavorite,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingChat, setEditingChat] = useState<Chat | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sectionAnim] = useState(new Animated.Value(0));
  const [pinLoadingStates, setPinLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [hasInitialized, setHasInitialized] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [actionMenuChat, setActionMenuChat] = useState<Chat | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Helper functions memoized
  const formatTime = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return t("sidebar.yesterday");
      }

      return date.toLocaleDateString();
    },
    [t]
  );

  const formatDateLabel = useCallback(
    (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) return t("sidebar.today");

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return t("sidebar.yesterday");
      }

      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    },
    [t]
  );

  useEffect(() => {
    if (!hasInitialized) {
      Animated.timing(sectionAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
      setHasInitialized(true);
    }
  }, [sectionAnim, hasInitialized]);

  const handleChatPress = useCallback(
    (chatId: string) => {
      onClose();
      selectAndFetchChat(chatId);
    },
    [selectAndFetchChat, onClose]
  );

  const openEditModal = useCallback((chat: Chat) => {
    setEditingChat(chat);
    setEditingTitle(chat.title);
    setEditModalVisible(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalVisible(false);
    setEditingChat(null);
    setEditingTitle("");
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!editingTitle.trim() || !editingChat) return;
    try {
      await updateChatTitle(editingChat.id, editingTitle.trim());
      closeEditModal();
    } catch (error) {
      console.log(error);
      toast.error(t("common.error"), {
        description: t("sidebar.updateChatTitleFailed"),
      });
    }
  }, [editingTitle, editingChat, updateChatTitle, closeEditModal]);

  const handleToggleFavorite = useCallback(
    async (chatId: string) => {
      try {
        setPinLoadingStates((prev) => ({ ...prev, [chatId]: true }));
        await toggleFavorite(chatId);
      } catch (error) {
        console.log(error);
        toast.error(t("common.error"), {
          description: t("sidebar.toggleFavoriteFailed"),
        });
      } finally {
        setPinLoadingStates((prev) => ({ ...prev, [chatId]: false }));
      }
    },
    [toggleFavorite]
  );

  const openActionMenu = useCallback((chat: Chat) => {
    setActionMenuChat(chat);
    setActionMenuVisible(true);
  }, []);

  const closeActionMenu = useCallback(() => {
    setActionMenuVisible(false);
    setActionMenuChat(null);
  }, []);

  const handleDeleteChat = useCallback(async () => {
    if (!actionMenuChat) return;

    Alert.alert(t("common.delete"), t("sidebar.confirmDeleteChat"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          setDeleteLoading(true);
          try {
            await deleteChat(actionMenuChat.id);
            closeActionMenu();
          } catch (error) {
            console.log(error);
            toast.error(t("common.error"), {
              description: t("sidebar.deleteChatFailed"),
            });
          } finally {
            setDeleteLoading(false);
          }
        },
      },
    ]);
  }, [actionMenuChat, deleteChat, closeActionMenu, t]);

  // Filtered chats memoized
  const filteredChats = useMemo(() => {
    return chats
      .filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (a.is_favorite !== b.is_favorite) {
          return a.is_favorite ? -1 : 1;
        }
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [chats, searchQuery]);

  const renderWelcomeSection = useCallback(() => {
    return (
      <Animated.View style={{ opacity: sectionAnim }} className="px-4">
        <Text className="mb-2 text-3xl font-bold text-white">
          {t("sidebar.welcome")}
        </Text>
        <Text className="mb-4 text-left text-sm text-gray-400">
          {t("sidebar.welcomeDescription")}
        </Text>

        <FeatureCard
          icon={Sparkles}
          title={t("sidebar.smartConversations")}
          description={t("sidebar.smartConversationsDesc")}
        />
        <FeatureCard
          icon={Heart}
          title={t("sidebar.saveFavorites")}
          description={t("sidebar.saveFavoritesDesc")}
        />
        <FeatureCard
          icon={Mic2}
          title={t("sidebar.voiceInput")}
          description={t("sidebar.voiceInputDesc")}
        />

        <TouchableOpacity
          onPress={() => {
            onClose();
            showLoginSheet();
          }}
          className="mt-4 rounded-[20px] bg-primary py-4 shadow-lg shadow-primary/30"
          activeOpacity={0.8}
        >
          <Text className="text-center text-[17px] font-bold tracking-wide text-black">
            {t("sidebar.getStarted")}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [sectionAnim, t, showLoginSheet, onClose]);

  const renderChatItem = useCallback(
    ({ item: chat, index }: { item: Chat; index: number }) => (
      <AnimatedChatItem
        chat={chat}
        index={index}
        isSelected={selectedChatId === chat.id}
        isSelectedAndLoading={
          selectedChatId === chat.id && isLoadingCurrentChat
        }
        handleChatPress={handleChatPress}
        handleToggleFavorite={handleToggleFavorite}
        openActionMenu={openActionMenu}
        pinLoading={pinLoadingStates[chat.id] || false}
        formatTime={formatTime}
        formatDateLabel={formatDateLabel}
      />
    ),
    [
      selectedChatId,
      isLoadingCurrentChat,
      handleChatPress,
      handleToggleFavorite,
      openActionMenu,
      pinLoadingStates,
      formatTime,
      formatDateLabel,
    ]
  );

  return (
    <LinearGradient
      colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, backgroundColor: "#0a0a0a" }}
    >
      {/* Transparent header area that stays transparent when scrolling */}
      <View
        style={{
          height: top,
          backgroundColor: "transparent",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}
        pointerEvents="none"
      />
      {isLoggedIn ? (
        <View
          className="flex-1 px-4"
          style={{ paddingTop: IS_ANDROID ? top : 0 }}
        >
          <FlatList
            data={isLoadingChats && chats.length === 0 ? [] : filteredChats}
            className="flex-1"
            contentContainerStyle={{
              paddingBottom: isLiquidGlassSupported ? HEADER_HEIGHT : bottom            }}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (chatPagination.hasMore && !isLoadingMoreChats) {
                loadMoreChats();
              }
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              isLoadingChats && chats.length === 0 ? (
                <SkeletonLoader count={6} />
              ) : (
                <EmptyState
                  message={`${t("sidebar.noConversationsYet")}\n${t(
                    "sidebar.startNewChatToBegin"
                  )}`}
                />
              )
            }
            ListFooterComponent={
              isLoadingMoreChats ? (
                <View className="items-center py-5">
                  <SpinningLoader size={20} color="#c1fe00" />
                  <Text className="mt-2 text-xs text-gray-400">
                    {t("sidebar.loadingMore")}
                  </Text>
                </View>
              ) : null
            }
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            ListHeaderComponent={() => (
              <View className="mb-2 mt-2" style={{ paddingTop: HEADER_HEIGHT }}>
                <View
                  className={`flex-row items-center rounded-[28px] border border-[#1a1a1a] bg-[#111] px-4 shadow-lg shadow-black/10 ${
                    IS_IOS ? "py-4" : "py-1"
                  }`}
                >
                  <Search color="#666" size={20} />
                  <TextInput
                    placeholder={t("sidebar.search")}
                    placeholderTextColor="#666"
                    className="ml-3 flex-1 text-base font-medium text-white"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <Text className="mb-4 mt-4 px-4 text-[11px] font-bold uppercase tracking-[3px] text-gray-400">
                  {t("sidebar.conversations")}
                </Text>
              </View>
            )}
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {renderWelcomeSection()}
        </ScrollView>
      )}

      {/* Edit Chat Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
        statusBarTranslucent
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={closeEditModal}
        >
          <View className="flex-1 justify-end">
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="w-full"
              enabled={Platform.OS === "ios"}
            >
              <View className="min-w-full items-stretch rounded-t-[28px] bg-[#181818] p-6 pb-9">
                <View className="mb-4 items-center">
                  <View className="mb-2 h-2 w-10 rounded-full bg-gray-700" />
                </View>
                <Text className="mb-6 px-4 text-2xl font-bold tracking-wide text-white">
                  {t("sidebar.editChat")}
                </Text>
                <TextInput
                  value={editingTitle}
                  onChangeText={setEditingTitle}
                  placeholder={t("sidebar.chatName")}
                  placeholderTextColor="#666"
                  className="mb-6 w-full rounded-2xl border border-[#1a1a1a] bg-[#111] px-4 py-4 text-[17px] font-medium text-white"
                  returnKeyType="done"
                  blurOnSubmit
                />
                <TouchableOpacity
                  onPress={handleRenameSubmit}
                  disabled={!editingTitle.trim()}
                  className={`mb-3 w-full items-center rounded-2xl bg-primary py-4 shadow-lg shadow-primary/30 ${
                    !editingTitle.trim() ? "opacity-60" : ""
                  }`}
                >
                  <Text className="text-[17px] font-bold tracking-wide text-black">
                    {t("sidebar.saveChanges")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeEditModal}
                  className="w-full items-center rounded-2xl border border-[#1a1a1a] bg-[#111] py-4"
                >
                  <Text className="text-[17px] font-semibold text-white">
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Action Menu Modal */}
      <Modal
        visible={actionMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={closeActionMenu}
        statusBarTranslucent
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={closeActionMenu}
        >
          <View className="flex-1 justify-end">
            <View className="min-w-full items-stretch rounded-t-[28px] bg-[#181818] p-6 pb-9">
              <View className="mb-4 items-center">
                <View className="mb-2 h-2 w-10 rounded-full bg-gray-700" />
              </View>
              <TouchableOpacity
                className="flex-row items-center py-4"
                onPress={() => {
                  closeActionMenu();
                  if (actionMenuChat) openEditModal(actionMenuChat);
                }}
                disabled={deleteLoading}
              >
                <Pencil size={20} color="#c1fe00" />
                <Text className="ml-4 text-lg text-white">
                  {t("common.edit")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-row items-center py-4 ${
                  deleteLoading ? "opacity-60" : ""
                }`}
                onPress={handleDeleteChat}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator
                    size={20}
                    color="#ff4444"
                    className="mr-4"
                  />
                ) : (
                  <Trash2 size={20} color="#ff4444" />
                )}
                <Text className="ml-4 text-lg text-red-500">
                  {deleteLoading ? t("sidebar.deleting") : t("common.delete")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
});

CustomDrawer.displayName = "CustomDrawer";

export default CustomDrawer;
