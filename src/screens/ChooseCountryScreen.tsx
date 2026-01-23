import { Check } from "lucide-react-native";
import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated from "react-native-reanimated";
import { toast } from "sonner-native";
import { AnimatedScreen } from "../components/animated";
import { NavigationProps } from "../navigation/navigationTypes";
import { ApiService } from "../services/apiService";
import { useAuthStore } from "../store/authStore";

interface Country {
  code: string;
  name: string;
  flag: string;
  isAvailable: boolean;
  comingSoon?: boolean;
}

export const countries: Country[] = [
  {
    code: "DO",
    name: "República Dominicana",
    flag: "🇩🇴",
    isAvailable: true,
  },
  {
    code: "BR",
    name: "Brasil",
    flag: "🇧🇷",
    isAvailable: false,
    comingSoon: true,
  },
  {
    code: "PR",
    name: "Puerto Rico",
    flag: "🇵🇷",
    isAvailable: false,
    comingSoon: true,
  },
  {
    code: "CO",
    name: "Colombia",
    flag: "🇨🇴",
    isAvailable: false,
    comingSoon: true,
  },
  {
    code: "VE",
    name: "Venezuela",
    flag: "🇻🇪",
    isAvailable: false,
    comingSoon: true,
  },
  {
    code: "MX",
    name: "México",
    flag: "🇲🇽",
    isAvailable: false,
    comingSoon: true,
  },
  {
    code: "CH",
    name: "Switzerland",
    flag: "🇨🇭",
    isAvailable: false,
    comingSoon: true,
  },
  {
    code: "AE",
    name: "UAE",
    flag: "🇦🇪",
    isAvailable: false,
    comingSoon: true,
  },
  {
    code: "US",
    name: "EEUU",
    flag: "🇺🇸",
    isAvailable: false,
    comingSoon: true,
  },
];

const ChooseCountryScreen = ({
  navigation,
}: NavigationProps<"ChooseCountry">) => {
  const { t } = useTranslation();
  const {
    setSelectedCountry,
    isLoggedIn,
    selectedCountry: currentCountry,
  } = useAuthStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: "#0a0a0a" },
      title: t("chooseCountry.title"),
      headerBackButtonDisplayMode: "minimal",
      headerTitleStyle: {
        color: "#ffffff",
      },
      headerTitleAlign: "center",
      headerTintColor: "#ffffff",
    });
  }, [navigation, t]);

  // Check if user is coming from sign-in flow (no country selected yet)
  const isComingFromSignIn =
    isLoggedIn && !useAuthStore.getState().selectedCountry;
  const [searchQuery, _] = useState("");
  const [selectedCountry, setSelectedCountryState] = useState<Country>(
    countries.find((c) => c.code === "DO")!
  );

  // Check if selected country is different from current country
  const isCountryChanged = selectedCountry.code !== currentCountry;

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (country: Country) => {
    if (!country.isAvailable) return;
    setSelectedCountryState(country);
  };

  const handleContinue = async () => {
    try {
      // Update country in database if user is logged in
      if (isLoggedIn) {
        const response = await ApiService.user.updateCountry(
          selectedCountry.code
        );

        if (response && response.message) {
          toast.success(response.message);
        } else {
          toast.error("Failed to update country");
        }
      }

      // Update local state
      setSelectedCountry(selectedCountry.code);

      // Let AppNavigator handle navigation based on selectedCountry state
    } catch (error) {
      console.error("Error updating country:", error);
      toast.error("Failed to update country. Please try again.");
    }
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      className={`mb-3 flex-row items-center rounded-2xl p-4 ${
        item.isAvailable
          ? selectedCountry.code === item.code
            ? "border border-primary bg-primary"
            : "border border-[#333] bg-[#1e1e1e]"
          : "border border-[#333] bg-[#1e1e1e] opacity-50"
      }`}
      onPress={() => handleCountrySelect(item)}
      disabled={!item.isAvailable}
      activeOpacity={item.isAvailable ? 0.7 : 1}
    >
      <Text className="mr-4 text-2xl">{item.flag}</Text>
      <View className="flex-1">
        <Text
          className={`text-base font-semibold ${
            item.isAvailable
              ? selectedCountry.code === item.code
                ? "text-black"
                : "text-foreground"
              : "text-gray-500"
          }`}
        >
          {item.name}
        </Text>
      </View>
      {item.isAvailable && selectedCountry.code === item.code && (
        <Check size={20} color="#0a0a0a" />
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Welcome Message */}
      <View className="mx-5 mb-4 mt-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-[#1a2a0a] to-[#232f0a] p-6">
        <Text className="text-sm leading-5 text-gray-300">
          {t("chooseCountry.welcomeSubtitle")}
        </Text>
      </View>

      {/* Scrollable Countries List */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <AnimatedScreen animationType="stagger" staggerItems={6}>
          {/* Available Countries */}
          <View className="mb-6">
            <Text className="mb-4 text-lg font-bold text-primary">
              {t("chooseCountry.availableNow")}
            </Text>
            {filteredCountries
              .filter((country) => country.isAvailable)
              .map((country) => (
                <View key={country.code}>
                  {renderCountryItem({ item: country })}
                </View>
              ))}
          </View>

          {/* Coming Soon Countries */}
          {filteredCountries.filter((country) => !country.isAvailable).length >
            0 && (
            <View className="mb-6">
              <Text className="mb-4 text-lg font-bold text-gray-400">
                {t("chooseCountry.comingSoon")}
              </Text>
              {filteredCountries
                .filter((country) => !country.isAvailable)
                .map((country) => (
                  <View key={country.code}>
                    {renderCountryItem({ item: country })}
                  </View>
                ))}
            </View>
          )}
        </AnimatedScreen>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <Animated.View className="mb-safe mt-4 px-5">
        <TouchableOpacity
          className={`flex-row items-center justify-center rounded-2xl px-6 py-4 ${
            isCountryChanged
              ? "bg-primary shadow-lg shadow-primary/20"
              : "border border-[#444] bg-[#2a2a2a]"
          }`}
          onPress={handleContinue}
          activeOpacity={isCountryChanged ? 0.8 : 1}
          disabled={!isCountryChanged}
        >
          <Text
            className={`text-base font-bold ${
              isCountryChanged ? "text-black" : "text-gray-500"
            }`}
          >
            {isComingFromSignIn ? t("common.continue") : t("common.select")}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

export default ChooseCountryScreen;
