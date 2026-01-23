import { Angry, Frown, Laugh, Meh, Smile } from "lucide-react-native";
import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";
import { NavigationProps } from "../../navigation/navigationTypes";
import { ApiService } from "../../services/apiService";
import { IS_ANDROID, IS_IOS } from "../../utils/constants";

const FeedbackModal = ({ navigation }: NavigationProps<"Feedback">) => {
  const { t } = useTranslation();
  const [selectedFeedback, setSelectedFeedback] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!selectedFeedback) {
      toast.error(t("profile.pleaseSelectRating"));
      return;
    }

    setFeedbackLoading(true);
    try {
      const feedbackData = {
        rating: selectedFeedback,
        comment: feedback.trim() || t("profile.noAdditionalComment"),
      };

      await ApiService.feedback.submit(feedbackData);

      toast.success(t("profile.thankYouFeedback"));
      navigation.goBack();
    } catch (error) {
      console.log(error);
      toast.error(t("profile.failedSubmitFeedback"));
    } finally {
      setFeedbackLoading(false);
    }
  };

  const getEmoji = (rating: number) => {
    switch (rating) {
      case 1:
        return <Angry color="#c1fe00" size={25} />;
      case 2:
        return <Frown color="#c1fe00" size={25} />;
      case 3:
        return <Meh color="#c1fe00" size={25} />;
      case 4:
        return <Smile color="#c1fe00" size={25} />;
      case 5:
        return <Laugh color="#c1fe00" size={25} />;
      default:
        return null;
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      sheetAllowedDetents: IS_IOS ? "fitToContents" : [0.75],
      contentStyle: {
        backgroundColor: "transparent",
      },
      keyboardHandlingEnabled: true,
    });
  });

  return (
    <View
      className={`float-end w-full flex-1 justify-between  px-6 pt-8 ${IS_ANDROID ? "rounded-tl-3xl rounded-tr-3xl border border-[#333] bg-[#222222] pb-2" : ""}`}
    >
      <View className={`${IS_IOS ? "mb-8" : ""} gap-4`}>
        <Text className="text-center text-2xl font-bold text-foreground">
          {t("profile.feedback")}
        </Text>
        <Text className="text-center text-base text-gray-400">
          {t("profile.howDoYouFeel")}
        </Text>

        <View className="flex-row justify-center gap-4">
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              className={`items-center justify-between rounded-xl border bg-[#191919] p-4 ${
                selectedFeedback === rating
                  ? "border-primary"
                  : "border-transparent"
              }`}
              onPress={() => setSelectedFeedback(rating)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">{getEmoji(rating)}</View>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-center text-base text-foreground">
          {t("profile.anythingWeCanImprove")}
        </Text>

        <TextInput
          className="h-40 rounded-xl bg-[#191919] p-4 text-foreground"
          value={feedback}
          onChangeText={setFeedback}
          placeholder={t("profile.feedbackPlaceholder")}
          placeholderTextColor="#666"
          multiline={true}
          numberOfLines={4}
        />
      </View>

      <View
        className={`${IS_ANDROID ? "mb-safe" : ""} flex-row justify-between`}
      >
        <TouchableOpacity
          className="w-[48%] rounded-xl bg-[#333] py-4"
          onPress={navigation.goBack}
          disabled={feedbackLoading}
        >
          <Text className="text-center font-medium text-foreground">
            {t("common.cancel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`w-[48%] rounded-xl bg-primary py-4 ${
            feedbackLoading || !selectedFeedback ? "opacity-60" : ""
          }`}
          onPress={handleSubmitFeedback}
          disabled={feedbackLoading || !selectedFeedback}
        >
          {feedbackLoading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#000" />
              <Text className="ml-2 text-center font-bold text-black">
                {t("common.sending")}
              </Text>
            </View>
          ) : (
            <Text className="text-center font-bold text-black">
              {t("profile.sendFeedback")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FeedbackModal;
