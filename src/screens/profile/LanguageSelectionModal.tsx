import { Check, Globe } from "lucide-react-native";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";
import { useLanguage } from "../../i18n/LanguageContext";
import { NavigationProps } from "../../navigation/navigationTypes";
import { useListingStore } from "../../store/listingStore";
import { IS_ANDROID, IS_IOS } from "../../utils/constants";
import {
  LiquidGlassContainer,
  liquidGlassProps,
} from "../../utils/liquidGlass";

const LanguageSelectionModal = ({
  navigation,
}: NavigationProps<"LanguageSelection">) => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { fetchCategories } = useListingStore();

  const getLanguageDisplay = (code: string) => {
    switch (code) {
      case "es":
        return t("common.spanish");
      case "en":
        return t("common.english");
      default:
        return t("common.english");
    }
  };

  const handleLanguageSelect = async (langCode: string) => {
    try {
      setLanguage(langCode);
      fetchCategories(langCode);
      navigation.goBack();

      const languageName = getLanguageDisplay(langCode);
      toast.success(t("profile.languageUpdated"), {
        description: t("profile.languageUpdateSuccess").replace(
          "{language}",
          languageName
        ),
      });
    } catch (error) {
      console.log(error);
      toast.error(t("profile.failedUpdateLanguage"));
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      sheetAllowedDetents: IS_IOS ? "fitToContents" : [0.4],
      contentStyle: {
        backgroundColor: "transparent",
      },
    });
  });

  return (
    <View
      className={`float-end w-full flex-1 justify-between px-6 pt-8 ${IS_ANDROID ? "rounded-tl-3xl rounded-tr-3xl border border-[#333] bg-[#222222] pb-2" : ""}`}
    >
      <Text className="text-center text-2xl font-bold text-foreground">
        {t("profile.selectLanguage")}
      </Text>

      <View className={`gap-4 ${IS_IOS ? "my-8" : ""}`}>
        {[
          { code: "es", label: t("common.spanish") },
          { code: "en", label: t("common.english") },
        ].map((lang, index) => (
          <LiquidGlassContainer
            key={index}
            {...liquidGlassProps}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: language === lang.code ? "#c1fe00" : "#333",
            }}
          >
            <TouchableOpacity
              key={lang.code}
              className={` flex-row items-center justify-between p-4 `}
              onPress={() => handleLanguageSelect(lang.code)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Globe
                  color={language === lang.code ? "#c1fe00" : "#666"}
                  size={24}
                />
                <Text
                  className={`ml-3 text-base ${
                    language === lang.code
                      ? "font-bold text-primary"
                      : "text-foreground"
                  }`}
                >
                  {lang.label}
                </Text>
              </View>
              {language === lang.code && <Check color="#c1fe00" size={24} />}
            </TouchableOpacity>
          </LiquidGlassContainer>
        ))}
      </View>

      <TouchableOpacity
        className={`${IS_ANDROID ? "mb-safe" : ""} rounded-xl bg-[#333] py-4`}
        onPress={navigation.goBack}
      >
        <Text className="text-center font-medium text-foreground">
          {t("common.cancel")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LanguageSelectionModal;
