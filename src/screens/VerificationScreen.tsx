import {
  ArrowLeft,
  Camera,
  Check,
  Square,
  Upload,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { AnimatedScreen } from "../components/animated";
import { ModalPicker } from "../components/ui";
import { NavigationProps } from "../navigation/navigationTypes";
import { ApiService } from "../services/apiService";
import { useAuthStore } from "../store/authStore";
import { useListingStore } from "../store/listingStore";

const VerificationFormScreen = ({
  navigation,
}: NavigationProps<"VerificationForm">) => {
  const { t, i18n } = useTranslation();
  const { userProfile, getUserProfile } = useAuthStore();
  const { categories, fetchCategories } = useListingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [cedulaImage, setCedulaImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState(
    userProfile?.firstName && userProfile?.lastName
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : ""
  );
  const [brandName, setBrandName] = useState("");
  const [logoUploadAccepted, setLogoUploadAccepted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Create categories array for dropdown with display names
  const categoryOptions = categories.map((cat) => cat.display_name);

  // Fetch categories on component mount
  useEffect(() => {
    if (!categories || categories.length === 0) {
      fetchCategories(i18n.language);
    }
  }, []);

  // Handle category selection - find the category_key for the selected display_name
  const handleCategorySelect = (displayName: string) => {
    const selectedCat = categories.find(
      (cat) => cat.display_name === displayName
    );
    if (selectedCat) {
      setSelectedCategory(selectedCat.category_key);
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        setCedulaImage(result.assets[0].uri || "");
      }
    } catch (error) {
      console.log(error);
      toast.error(t("verification.errorPickingImage"));
    }
  };

  const handleCameraCapture = async () => {
    try {
      const result = await launchCamera({
        mediaType: "photo",
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.assets && result.assets[0]) {
        setCedulaImage(result.assets[0].uri || "");
      }
    } catch (error) {
      console.log(error);
      toast.error(t("verification.errorCapturingImage"));
    }
  };

  const handleSubmitVerification = async () => {
    if (!cedulaImage) {
      toast.error(t("verification.pleaseUploadCedula"));
      return;
    }

    if (!fullName.trim()) {
      toast.error(t("verification.pleaseEnterFullName"));
      return;
    }

    if (!brandName.trim()) {
      toast.error(t("verification.pleaseEnterBrandName"));
      return;
    }

    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    if (!userProfile?.id) {
      toast.error("User ID not found");
      return;
    }

    setIsLoading(true);
    try {
      // Create form data for file upload
      const formData = new FormData();
      const filename = cedulaImage.split("/").pop();
      const fileType = filename?.split(".").pop();

      // Add the cédula front image with 'front' key as per API requirements
      formData.append("front", {
        uri: cedulaImage,
        name: filename || "cedula_front.jpg",
        type: `image/${fileType || "jpeg"}`,
      } as any);

      // Add required fields as per API specification
      formData.append("appleIdName", fullName.trim());
      formData.append("brandName", brandName.trim());
      formData.append("category", selectedCategory);
      formData.append("userId", userProfile.id);

      // Submit verification documents
      const response = await ApiService.verification.submitDocuments(formData);
      if (response) {
        toast.success(t("verification.submissionSuccess"));
        await getUserProfile(); // Refresh user profile
        navigation.goBack();
      }
    } catch (error) {
      console.log(error);
      toast.error(t("verification.submissionFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = () => {
    setCedulaImage(null);
  };

  return (
    <LinearGradient
      colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-[#222] px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3 p-2"
            >
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-foreground">
              Verification
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView className="flex-1 px-5 py-6">
            <AnimatedScreen animationType="stagger" staggerItems={6}>
              {/* Success Message */}
              <View className="mb-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-[#1a2a0a] to-[#232f0a] p-6">
                <View className="mb-4 flex-row items-center">
                  <View className="mr-4 rounded-full bg-primary/20 p-3">
                    <Check size={24} color="#c1fe00" />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 text-lg font-bold text-primary">
                      {t("verification.subscriptionActive")}
                    </Text>
                    <Text className="text-sm text-gray-300">
                      {t("verification.verificationRequired")}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Important Notice */}
              <View className="mb-6 rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#2a2a0a] to-[#232a0a] p-6">
                <Text className="mb-3 text-base font-semibold text-yellow-400">
                  {t("verification.importantNotice")}
                </Text>
                <Text className="text-sm leading-5 text-gray-300">
                  {t("verification.cedulaNameMatch")}
                </Text>
              </View>

              {/* Full Name Input */}
              <View className="mb-6">
                <Text className="mb-3 text-base font-semibold text-foreground">
                  {t("verification.fullName")}
                </Text>
                <View className="rounded-2xl bg-[#1e1e1e] p-4">
                  <TextInput
                    className="text-base text-foreground"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder={t("verification.enterFullName")}
                    placeholderTextColor="#666"
                    editable={false}
                    style={{
                      backgroundColor: "#2a2a2a",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingTop: 8,
                      paddingBottom: 12,
                      color: "#999",
                      textAlignVertical: "center",
                    }}
                  />
                  <Text className="mt-2 text-xs text-gray-400">
                    {t("verification.nameLockedMessage")}
                  </Text>
                </View>
              </View>

              {/* Brand Name Input */}
              <View className="mb-6">
                <Text className="mb-3 text-base font-semibold text-foreground">
                  {t("verification.brandName")}
                </Text>
                <View className="rounded-2xl bg-[#1e1e1e] p-4">
                  <TextInput
                    className="text-base text-foreground"
                    value={brandName}
                    onChangeText={setBrandName}
                    placeholder={t("verification.enterBrandName")}
                    placeholderTextColor="#666"
                    style={{
                      backgroundColor: "#2a2a2a",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingTop: 8,
                      paddingBottom: 12,
                      color: "#fff",
                      textAlignVertical: "center",
                    }}
                  />
                  <Text className="mt-2 text-xs text-gray-400">
                    {t("verification.brandNameInstructions")}
                  </Text>
                </View>
              </View>

              {/* Category Selection */}
              <View className="mb-6 rounded-2xl bg-[#1e1e1e] p-4">
                <ModalPicker
                  label="Business Category"
                  value={
                    categories.find(
                      (cat) => cat.category_key === selectedCategory
                    )?.display_name || ""
                  }
                  options={categoryOptions}
                  onSelect={handleCategorySelect}
                  accentColor="#c1fe00"
                  required={true}
                />
              </View>

              {/* Cédula Upload Section */}
              <View className="mb-6">
                <Text className="mb-3 text-base font-semibold text-foreground">
                  {t("verification.cedulaFront")}
                </Text>

                {cedulaImage ? (
                  <View className="rounded-2xl bg-[#1e1e1e] p-4">
                    <View className="relative">
                      <Image
                        source={{ uri: cedulaImage }}
                        className="h-48 w-full rounded-xl"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={removeImage}
                        className="absolute -right-2 -top-2 h-8 w-8 items-center justify-center rounded-full bg-red-500"
                      >
                        <X size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View className="rounded-2xl border-2 border-dashed border-[#444] bg-[#1e1e1e] p-8">
                    <View className="items-center">
                      <Upload size={48} color="#666" className="mb-4" />
                      <Text className="mb-2 text-center text-base font-semibold text-foreground">
                        {t("verification.uploadCedula")}
                      </Text>
                      <Text className="mb-6 text-center text-sm text-gray-400">
                        {t("verification.uploadInstructions")}
                      </Text>

                      <View className="flex-row justify-center">
                        <TouchableOpacity
                          onPress={handleImagePicker}
                          className="mr-4 flex-row items-center rounded-xl bg-[#333] px-6 py-3"
                          activeOpacity={0.7}
                        >
                          <Upload size={20} color="#c1fe00" />
                          <Text
                            className="font-semibold text-foreground"
                            style={{ marginLeft: 8 }}
                          >
                            {t("verification.gallery")}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleCameraCapture}
                          className="flex-row items-center rounded-xl bg-primary px-6 py-3"
                          activeOpacity={0.7}
                        >
                          <Camera size={20} color="#0a0a0a" />
                          <Text
                            className="font-semibold text-black"
                            style={{ marginLeft: 8 }}
                          >
                            {t("verification.camera")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Logo Upload Acceptance Checkbox */}
              <View className="mb-6 rounded-2xl  bg-[#1e1e1e] p-4">
                <TouchableOpacity
                  onPress={() => setLogoUploadAccepted(!logoUploadAccepted)}
                  className="flex-row items-start"
                  activeOpacity={0.7}
                >
                  <View className="mr-3 mt-1 self-center">
                    {logoUploadAccepted ? (
                      <View className="h-4 w-4 items-center justify-center rounded-sm bg-primary">
                        <Check size={13} color="#0a0a0a" />
                      </View>
                    ) : (
                      <View className="h-4 w-4 items-center justify-center rounded-sm">
                        <Square size={16} color="#666" />
                      </View>
                    )}
                  </View>
                  <Text className="flex-1 text-[10px] font-medium leading-4 text-gray-300">
                    {t("verification.logoUploadAcceptance")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <View className="mb-8">
                <TouchableOpacity
                  className={`flex-row items-center justify-center rounded-2xl px-6 py-4 ${
                    cedulaImage &&
                    brandName.trim() &&
                    logoUploadAccepted &&
                    selectedCategory
                      ? "bg-primary"
                      : "bg-[#333] opacity-50"
                  }`}
                  onPress={handleSubmitVerification}
                  disabled={
                    !cedulaImage ||
                    !brandName.trim() ||
                    !logoUploadAccepted ||
                    !selectedCategory ||
                    isLoading
                  }
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Check size={20} color="#0a0a0a" className="mr-2" />
                      <Text className="text-base font-bold text-black">
                        {t("verification.submitVerification")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </AnimatedScreen>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default VerificationFormScreen;
