import { Camera, ChevronRight, Upload } from "lucide-react-native";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import { toast } from "sonner-native";
import { NavigationProps } from "../../navigation/navigationTypes";
import { IS_ANDROID, IS_IOS } from "../../utils/constants";
import {
  LiquidGlassContainer,
  liquidGlassProps,
} from "../../utils/liquidGlass";

const PhotoSourceModal = ({
  navigation,
  route,
}: NavigationProps<"PhotoSource">) => {
  const { t } = useTranslation();
  const { onImageSelected } = route.params;

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        mediaType: "photo",
        includeBase64: false,
      });

      if (result && result.path) {
        navigation.goBack();
        onImageSelected(result.path);
      } else {
        toast.error(t("verification.errorPickingImage"));
      }
    } catch (error: any) {
      if (error.code !== "E_PICKER_CANCELLED") {
        toast.error(t("verification.errorPickingImage"));
      }
    }
  };

  const handleCameraCapture = async () => {
    try {
      const result = await ImagePicker.openCamera({
        width: 300,
        height: 300,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        mediaType: "photo",
        includeBase64: false,
      });

      if (result && result.path) {
        navigation.goBack();
        onImageSelected(result.path);
      } else {
        toast.error(t("verification.errorCapturingImage"));
      }
    } catch (error: any) {
      if (error.code !== "E_PICKER_CANCELLED") {
        toast.error(t("verification.errorCapturingImage"));
      }
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      sheetAllowedDetents: IS_IOS ? "fitToContents" : [0.45],
      contentStyle: {
        backgroundColor: "transparent",
      },
    });
  });

  return (
    <View
      className={`float-end w-full flex-1 px-6 pt-8 ${IS_ANDROID ? "rounded-tl-3xl rounded-tr-3xl border border-[#333] bg-[#222222]" : ""}`}
    >
      <Text className="mb-2 text-center text-xl font-bold text-foreground">
        {t("profile.updateProfilePhoto")}
      </Text>

      <Text className="mb-6 text-center text-sm text-gray-400">
        {t("profile.choosePhotoSource")}
      </Text>

      <View className="mb-6 space-y-4">
        {/* Take Photo Option */}
        <LiquidGlassContainer
          {...liquidGlassProps}
          style={{
            marginBottom: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#333",
          }}
        >
          <TouchableOpacity
            className="flex-row items-center  p-4"
            onPress={handleCameraCapture}
            activeOpacity={0.7}
          >
            <View className="mr-4 rounded-full bg-primary/20 p-3">
              <Camera color="#c1fe00" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                {t("profile.takePhoto")}
              </Text>
              <Text className="text-sm text-gray-400">
                {t("profile.takePhotoDescription")}
              </Text>
            </View>
            <ChevronRight color="#666" size={20} />
          </TouchableOpacity>
        </LiquidGlassContainer>

        {/* Choose from Gallery Option */}
        <LiquidGlassContainer
          {...liquidGlassProps}
          style={{
            marginBottom: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#333",
          }}
        >
          <TouchableOpacity
            className="flex-row items-center  p-4"
            onPress={handleImagePicker}
            activeOpacity={0.7}
          >
            <View className="mr-4 rounded-full bg-primary/20 p-3">
              <Upload color="#c1fe00" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                {t("profile.chooseFromGallery")}
              </Text>
              <Text className="text-sm text-gray-400">
                {t("profile.chooseFromGalleryDescription")}
              </Text>
            </View>
            <ChevronRight color="#666" size={20} />
          </TouchableOpacity>
        </LiquidGlassContainer>
      </View>

      <TouchableOpacity
        className="rounded-xl bg-[#333] py-4"
        onPress={() => navigation.goBack()}
      >
        <Text className="text-center font-medium text-foreground">
          {t("common.cancel")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PhotoSourceModal;
