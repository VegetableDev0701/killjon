import {
  AlertCircle,
  Building2,
  Cookie,
  Heart,
  Link2,
  LockKeyhole,
  Mail,
  MessageSquare,
  RefreshCcw,
  Shield,
  UserRoundSearch,
} from "lucide-react-native";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated from "react-native-reanimated";
import { AnimatedScreen } from "../components/animated";
import { NavigationProps } from "../navigation/navigationTypes";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PolicySection = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <Animated.View className="mb-6">
    <View className="mb-4 flex-row items-center">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a]">
        {icon}
      </View>
      <Text className="text-lg font-bold text-foreground">{title}</Text>
    </View>
    <View className="rounded-2xl border border-[#333] bg-[#1e1e1e] p-5">
      {children}
    </View>
  </Animated.View>
);

const PrivacyPolicyScreen = ({
  navigation,
}: NavigationProps<"PrivacyPolicy">) => {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: "#0a0a0a" },
      title: t("privacyPolicy.title"),
      headerBackButtonDisplayMode: "minimal",
      headerTitleStyle: {
        color: "#ffffff",
      },
      headerTitleAlign: "center",
      headerTintColor: "#ffffff",
    });
  }, [navigation, t]);

  return (
    <LinearGradient
      colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom }}
      >
        <AnimatedScreen animationType="fade" duration={800}>
          {/* Introduction */}
          <Animated.View
            className="mb-8 mt-5 items-center justify-center rounded-3xl bg-gradient-to-b from-[#232323] to-[#161616] py-8"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            }}
          >
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#2a2a2a]">
              <Shield size={32} color="#c1fe00" />
            </View>
            <Text className="mb-2 text-center text-2xl font-bold text-foreground">
              {t("privacyPolicy.title")}
            </Text>
            <Text className="mb-4 text-center text-gray-400">
              {t("privacyPolicy.subtitle")}
            </Text>
          </Animated.View>
          <AnimatedScreen animationType="stagger" staggerItems={6}>
            {/* Overview */}
            <PolicySection
              icon={<Shield color="#c1fe00" size={20} />}
              title={t("privacyPolicy.descriptionTitle")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("privacyPolicy.description")}
              </Text>
            </PolicySection>

            {/* Information We Collect */}
            <PolicySection
              icon={<UserRoundSearch color="#c1fe00" size={20} />}
              title={t("privacyPolicy.informationTitle")}
            >
              <Text className="whitespace-pre-line text-sm leading-6 text-gray-300">
                {t("privacyPolicy.informationDetails")}
              </Text>
            </PolicySection>

            {/* Purpose of Use */}
            <PolicySection
              icon={<MessageSquare color="#c1fe00" size={20} />}
              title={t("privacyPolicy.purposeTitle")}
            >
              <Text className="whitespace-pre-line text-sm leading-6 text-gray-300">
                {t("privacyPolicy.purposeDetails")}
              </Text>
            </PolicySection>

            {/* Data Sharing */}
            <PolicySection
              icon={<Link2 color="#c1fe00" size={20} />}
              title={t("privacyPolicy.sharingTitle")}
            >
              <Text className="whitespace-pre-line text-sm leading-6 text-gray-300">
                {t("privacyPolicy.sharingDetails")}
              </Text>
            </PolicySection>

            {/* Data Security */}
            <PolicySection
              icon={<LockKeyhole color="#c1fe00" size={20} />}
              title={t("privacyPolicy.securityTitle")}
            >
              <Text className="whitespace-pre-line text-sm leading-6 text-gray-300">
                {t("privacyPolicy.securityDetails")}
              </Text>
            </PolicySection>

            {/* Cookies and Similar Technologies */}
            <PolicySection
              icon={<Cookie color="#c1fe00" size={20} />}
              title={t("privacyPolicy.cookiesTitle")}
            >
              <Text className="whitespace-pre-line text-sm leading-6 text-gray-300">
                {t("privacyPolicy.cookiesDetails")}
              </Text>
            </PolicySection>

            {/* User Rights */}
            <PolicySection
              icon={<Heart color="#c1fe00" size={20} />}
              title={t("privacyPolicy.rightsTitle")}
            >
              <Text className="whitespace-pre-line text-sm leading-6 text-gray-300">
                {t("privacyPolicy.rightsDetails")}
              </Text>
            </PolicySection>

            {/* Privacy of Minors */}
            <PolicySection
              icon={<AlertCircle color="#c1fe00" size={20} />}
              title={t("privacyPolicy.minorsTitle")}
            >
              <Text className="whitespace-pre-line text-sm leading-6 text-gray-300">
                {t("privacyPolicy.minorsDetails")}
              </Text>
            </PolicySection>

            {/* Third Party Services */}
            <PolicySection
              icon={<Building2 color="#c1fe00" size={20} />}
              title={t("privacyPolicy.thirdPartyTitle")}
            >
              <Text className="whitespace-pre-line text-sm leading-6 text-gray-300">
                {t("privacyPolicy.thirdPartyDetails")}
              </Text>
            </PolicySection>

            {/* Changes to this Policy */}
            <PolicySection
              icon={<RefreshCcw color="#c1fe00" size={20} />}
              title={t("privacyPolicy.changesTitle")}
            >
              <Text className="whitespace-pre-line text-sm leading-6 text-gray-300">
                {t("privacyPolicy.changesDetails")}
              </Text>
            </PolicySection>

            {/* Contact  */}
            <PolicySection
              icon={<Mail color="#c1fe00" size={20} />}
              title={t("privacyPolicy.contactTitle")}
            >
              <Text className="whitespace-pre-line text-sm leading-6 text-gray-300">
                {t("privacyPolicy.contactDetails")}
              </Text>
            </PolicySection>
          </AnimatedScreen>
        </AnimatedScreen>
      </ScrollView>
    </LinearGradient>
  );
};

export default PrivacyPolicyScreen;
