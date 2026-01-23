import {
  CheckCheck,
  Database,
  DollarSign,
  FileText,
  Mail,
  Pencil,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldCheck,
  ShieldUser,
  UserPen,
} from "lucide-react-native";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedScreen } from "../components/animated";
import { NavigationProps } from "../navigation/navigationTypes";

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
      <Text className="flex-1 text-lg font-bold text-foreground">{title}</Text>
    </View>
    <View className="rounded-2xl border border-[#333] bg-[#1e1e1e] p-5">
      {children}
    </View>
  </Animated.View>
);

const TermsOfUseScreen = ({ navigation }: NavigationProps<"TermsOfUse">) => {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: "#0a0a0a" },
      title: t("profile.termsOfUse"),
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
              <ReceiptText size={32} color="#c1fe00" />
            </View>
            <Text className="mb-2 text-center text-2xl font-bold text-foreground">
              {t("termsOfUse.title")}
            </Text>
            <Text className="mb-4 text-center text-gray-400">
              {t("termsOfUse.subtitle")}
            </Text>
          </Animated.View>
          <AnimatedScreen animationType="stagger" staggerItems={6}>
            {/* Overview */}
            <PolicySection
              icon={<ReceiptText color="#c1fe00" size={20} />}
              title={t("termsOfUse.acceptanceTitle")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.acceptanceDetails")}
              </Text>
            </PolicySection>

            {/* Service Description */}
            <PolicySection
              icon={<Settings color="#c1fe00" size={20} />}
              title={t("termsOfUse.serviceDescriptionTitle")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.serviceDescriptionDetails")}
              </Text>
            </PolicySection>

            {/* User Registration */}
            <PolicySection
              icon={<ShieldUser color="#c1fe00" size={20} />}
              title={t("termsOfUse.userRegistrationTitle")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.userRegistrationDetails")}
              </Text>
            </PolicySection>

            {/* Acceptance Use */}
            <PolicySection
              icon={<CheckCheck color="#c1fe00" size={20} />}
              title={t("termsOfUse.acceptanceUseTitle")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.acceptanceUseDetails")}
              </Text>
            </PolicySection>

            {/* User Generated Content */}
            <PolicySection
              icon={<UserPen color="#c1fe00" size={20} />}
              title={t("termsOfUse.userGeneratedContentTitle")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.userGeneratedContentDetails")}
              </Text>
            </PolicySection>

            {/* Viewing Public Information */}
            <PolicySection
              icon={<Database color="#c1fe00" size={20} />}
              title={t("termsOfUse.viewingTitle")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.viewingDetails")}
              </Text>
            </PolicySection>

            {/* Intellectual Property */}
            <PolicySection
              icon={<ScrollText color="#c1fe00" size={20} />}
              title={t("termsOfUse.intellectualProperty")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.intellectualPropertyDetails")}
              </Text>
            </PolicySection>

            {/* Payment Features */}
            <PolicySection
              icon={<DollarSign color="#c1fe00" size={20} />}
              title={t("termsOfUse.paymentFeaturesTitle")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.paymentFeaturesDetails")}
              </Text>
            </PolicySection>

            {/* Exclusion of Warranties */}
            <PolicySection
              icon={<ShieldCheck color="#c1fe00" size={20} />}
              title={t("termsOfUse.exclusionOfWarranties")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.exclusionOfWarrantiesDetails")}
              </Text>
            </PolicySection>

            {/* Modifications */}
            <PolicySection
              icon={<Pencil color="#c1fe00" size={20} />}
              title={t("termsOfUse.modificationsTitle")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.modificationsDetails")}
              </Text>
            </PolicySection>

            {/* Applicable Legislation */}
            <PolicySection
              icon={<FileText color="#c1fe00" size={20} />}
              title={t("termsOfUse.applicableLegislationTitle")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.applicableLegislationDetails")}
              </Text>
            </PolicySection>

            {/* Contact */}
            <PolicySection
              icon={<Mail color="#c1fe00" size={20} />}
              title={t("termsOfUse.contactTitle")}
            >
              <Text className="text-base leading-6 text-gray-300">
                {t("termsOfUse.contactDetails")}
              </Text>
            </PolicySection>
          </AnimatedScreen>
        </AnimatedScreen>
      </ScrollView>
    </LinearGradient>
  );
};

export default TermsOfUseScreen;
