import { AlignLeft, SquarePen } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import assets from "../../assets";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { StagingLabel } from "../ui";

interface Props {
  openDrawer?: () => void;
}

export const ChatHeader: React.FC<Props> = ({ openDrawer = () => {} }) => {
  const { setCurrentChat, isLoading } = useChatStore();
  const { top } = useSafeAreaInsets();
  const { isLoggedIn } = useAuthStore();

  const handleNewChat = () => {
    setCurrentChat(null);
  };

  return (
    <View className={`pt-safe flex-row items-center justify-between px-4`}>
      <TouchableOpacity className="mr-2 p-2" onPress={openDrawer}>
        <AlignLeft color="#fff" size={24} />
      </TouchableOpacity>
      <StagingLabel style={{ top: top }} />
      <Image
        source={assets.animatedLogo}
        style={styles.logo}
        resizeMode="contain"
        fadeDuration={0}
      />

      {/* New Chat Button */}
      <TouchableOpacity
        className="ml-2 p-2"
        onPress={handleNewChat}
        disabled={isLoading || !isLoggedIn}
        activeOpacity={isLoggedIn ? 0.8 : 0.3}
        style={[styles.newChatButton, { opacity: isLoggedIn ? 1 : 0.5 }]}
      >
        <SquarePen size={22} color={isLoggedIn ? "#fff" : "#666"} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  newChatButton: {
    // Base styles for new chat button
  },
  spinContainer: {
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#c1fe00",
    borderTopColor: "transparent",
  },
});
