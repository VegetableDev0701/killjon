import { Camera, Check, Loader2, X } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
  Image,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ImagePickerResponse,
  launchImageLibrary,
  MediaType,
  PhotoQuality,
} from "react-native-image-picker";
import { toast } from "sonner-native";
import { Category } from "../services/listingsApi";
import { screenWidth } from "../utils/constants";
import { ModalPicker } from "./ui";

interface FormContentProps {
  // Basic info
  title: string;
  description: string;
  price: number;
  currency: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPriceChange: (price: number) => void;
  onCurrencyChange: (currency: string) => void;

  // Images
  images: string[];
  onAddImage: (uri: string) => void;
  onRemoveImage: (index: number) => void;
  onImagePress: (index: number) => void;

  // Phone
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  phoneError: string | null;

  // Category attributes
  selectedCategory: Category | null;
  categoryAttributes: Record<string, any>;
  basicAttributes: Record<string, any>;
  onCategoryAttributeChange: (key: string, value: any) => void;
  onBasicAttributeChange: (key: string, value: any) => void;

  // Errors
  errors: Record<string, string>;

  // Autofill functionality
  onAutofill?: (imageUri: string) => Promise<void>;
  isAutofillLoading?: boolean;
}

const FormContent: React.FC<FormContentProps> = ({
  title,
  description,
  price,
  currency: _currency,
  onTitleChange,
  onDescriptionChange,
  onPriceChange,
  onCurrencyChange: _onCurrencyChange,
  images,
  onAddImage,
  onRemoveImage,
  onImagePress,
  phoneNumber,
  onPhoneChange,
  phoneError,
  selectedCategory,
  categoryAttributes,
  basicAttributes,
  onCategoryAttributeChange,
  onBasicAttributeChange,
  errors,
  onAutofill,
  isAutofillLoading = false,
}) => {
  const { t } = useTranslation();
  const spinValue = useRef(new Animated.Value(0)).current;

  // Spin animation for loading icon
  useEffect(() => {
    if (isAutofillLoading) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    } else {
      spinValue.setValue(0);
    }
  }, [isAutofillLoading, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  function formatDRPhone(phone: string) {
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
      10
    )}`;
  }

  const handleImagePicker = () => {
    const options = {
      mediaType: "photo" as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as PhotoQuality,
      selectionLimit: 10 - images.length,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        toast.error(response.errorMessage || "Failed to pick image");
        return;
      }

      if (response.assets) {
        const isFirstImage = images.length === 0;

        response.assets.forEach((asset, index) => {
          if (asset.uri) {
            onAddImage(asset.uri);

            // Trigger autofill only on the first image upload and first asset
            if (isFirstImage && index === 0 && onAutofill) {
              onAutofill(asset.uri);
            }
          }
        });
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    Alert.alert("Remove Photo", "Are you sure you want to remove this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => onRemoveImage(index),
      },
    ]);
  };

  const renderField = (
    key: string,
    attr: any,
    value: any,
    updateValues: (key: string, value: any) => void
  ) => {
    const error = errors[key];

    switch (attr.type) {
      case "string":
        return (
          <View
            style={[
              styles.fieldCard,
              error ? styles.errorBorderColor : styles.fieldCardNormal,
            ]}
          >
            <Text
              style={[
                styles.fieldLabel,
                error ? styles.accentColor : styles.whiteLabel,
              ]}
            >
              {typeof attr.label === "string"
                ? attr.label
                : attr.label?.en || attr.label?.es || ""}{" "}
              {attr.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              placeholder={
                (typeof attr.placeholder === "string"
                  ? attr.placeholder
                  : attr.placeholder?.en || attr.placeholder?.es) ||
                `Enter ${
                  (typeof attr.label === "string"
                    ? attr.label
                    : attr.label?.en || attr.label?.es || ""
                  ).toLowerCase() || "value"
                }`
              }
              value={value || ""}
              onChangeText={(text) => updateValues(key, text)}
              style={[styles.textInput, styles.whiteLabel]}
              placeholderTextColor="#888"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );
      case "number":
        return (
          <View
            style={[
              styles.fieldCard,
              error ? styles.errorBorderColor : styles.fieldCardNormal,
            ]}
          >
            <Text
              style={[
                styles.fieldLabel,
                error ? styles.accentColor : styles.whiteLabel,
              ]}
            >
              {typeof attr.label === "string"
                ? attr.label
                : attr.label?.en || attr.label?.es || ""}{" "}
              {attr.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              placeholder={
                (typeof attr.placeholder === "string"
                  ? attr.placeholder
                  : attr.placeholder?.en || attr.placeholder?.es) ||
                `Enter ${
                  (typeof attr.label === "string"
                    ? attr.label
                    : attr.label?.en || attr.label?.es || ""
                  ).toLowerCase() || "value"
                }`
              }
              value={value ? String(value) : ""}
              keyboardType="numeric"
              onChangeText={(text) => {
                const numValue = text.replace(/[^0-9]/g, "");
                updateValues(key, numValue ? Number(numValue) : "");
              }}
              style={[styles.textInput, styles.whiteLabel]}
              placeholderTextColor="#888"
            />
            {error && (
              <Text style={[styles.errorText, styles.accentColor]}>
                {error}
              </Text>
            )}
          </View>
        );
      case "boolean":
        return (
          <View
            style={[
              styles.fieldCard,
              error ? styles.errorBorderColor : styles.fieldCardNormal,
              styles.booleanFieldCard,
            ]}
          >
            <Text
              style={[
                styles.fieldLabel,
                error ? styles.accentColor : styles.whiteLabel,
              ]}
            >
              {typeof attr.label === "string"
                ? attr.label
                : attr.label?.en || attr.label?.es || ""}{" "}
              {attr.required && <Text style={styles.required}>*</Text>}
            </Text>
            <Switch
              value={!!value}
              onValueChange={(val) => updateValues(key, val)}
              trackColor={{ false: "#232323", true: "#c1fe00" }}
              thumbColor={value ? "#c1fe00" : "#f4f3f4"}
            />
            {error && (
              <Text style={[styles.errorText, styles.accentColor]}>
                {error}
              </Text>
            )}
          </View>
        );
      case "enum":
        const transformedOptions = (attr.options || []).map((opt: any) =>
          typeof opt === "string" ? opt : opt?.en || opt?.es || ""
        );
        return (
          <ModalPicker
            label={
              typeof attr.label === "string"
                ? attr.label
                : attr.label?.en || attr.label?.es || ""
            }
            required={attr.required}
            value={value}
            options={transformedOptions}
            onSelect={(val) => updateValues(key, val)}
            accentColor={"#c1fe00"}
            error={error}
          />
        );
      case "array":
        return (
          <View
            style={[
              styles.fieldCard,
              error ? styles.errorBorderColor : styles.fieldCardNormal,
            ]}
          >
            <Text
              style={[
                styles.fieldLabel,
                error ? styles.accentColor : styles.whiteLabel,
              ]}
            >
              {typeof attr.label === "string"
                ? attr.label
                : attr.label?.en || attr.label?.es || ""}{" "}
              {attr.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={styles.arrayContainer}>
              {attr.options?.map((opt: any) => (
                <TouchableOpacity
                  key={typeof opt === "string" ? opt : opt?.en || opt?.es || ""}
                  style={[
                    styles.arrayOption,
                    value?.includes(
                      typeof opt === "string" ? opt : opt?.en || opt?.es || ""
                    ) && styles.arrayOptionSelected,
                  ]}
                  onPress={() => {
                    const arr = Array.isArray(value) ? value : [];
                    const optValue =
                      typeof opt === "string" ? opt : opt?.en || opt?.es || "";
                    updateValues(
                      key,
                      arr.includes(optValue)
                        ? arr.filter((v: string) => v !== optValue)
                        : [...arr, optValue]
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.arrayOptionText,
                      value?.includes(
                        typeof opt === "string" ? opt : opt?.en || opt?.es || ""
                      ) && styles.arrayOptionTextSelected,
                    ]}
                  >
                    {(typeof opt === "string" ? opt : opt?.en || opt?.es || "")
                      .replace(/_/g, " ")
                      .replace(
                        /(^|\s)([a-zA-ZáéíóúñÁÉÍÓÚÑ])/g,
                        (match: string, space: string, letter: string) =>
                          space + letter.toUpperCase()
                      )}
                  </Text>
                  {value?.includes(
                    typeof opt === "string" ? opt : opt?.en || opt?.es || ""
                  ) && <Check color="#0a0a0a" size={16} />}
                </TouchableOpacity>
              ))}
            </View>
            {error && (
              <Text style={[styles.errorText, styles.accentColor]}>
                {error}
              </Text>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Images Section */}
      <Text style={styles.sectionTitle}>{t("listingForm.images")}</Text>
      <View
        style={[
          styles.fieldCard,
          errors.images ? styles.errorBorderColor : styles.fieldCardNormal,
        ]}
      >
        <Text style={[styles.fieldLabel, styles.whiteLabel]}>
          {t("listingForm.photos")} <Text style={styles.required}>*</Text>
          {isAutofillLoading && (
            <Text style={[styles.autofillText, styles.accentColor]}>
              {" "}
              {t("listingForm.analyzingImage")}
            </Text>
          )}
        </Text>
        <View style={styles.imagesContainer}>
          {images.map((image, index) => (
            <Animated.View key={index} style={styles.imageWrapper}>
              <TouchableOpacity
                onPress={() => onImagePress(index)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: image }} style={styles.imagePreview} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.removeImageButton,
                  { backgroundColor: "#c1fe00" },
                ]}
                onPress={() => handleRemoveImage(index)}
              >
                <X color="#0a0a0a" size={16} />
              </TouchableOpacity>
            </Animated.View>
          ))}
          {images.length < 10 && (
            <TouchableOpacity
              style={[styles.addImageButton, styles.addImageButtonAccent]}
              onPress={handleImagePicker}
              activeOpacity={0.8}
              disabled={isAutofillLoading}
            >
              {isAutofillLoading ? (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Loader2 color={"#c1fe00"} size={32} />
                </Animated.View>
              ) : (
                <Camera color={"#c1fe00"} size={32} />
              )}
              <Text style={[styles.addImageText, styles.accentColor]}>
                {isAutofillLoading
                  ? t("listingForm.analyzing")
                  : t("listingForm.addPhoto")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.imageHelperText}>
          {images.length}/10 {t("listingForm.photosHelper")}
        </Text>
        {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}
      </View>

      {/* Basic Info */}
      <Text style={styles.sectionTitle}>
        {t("listingForm.basicInformation")}
      </Text>

      <View
        style={[
          styles.fieldCard,
          errors.title ? styles.errorBorderColor : styles.fieldCardNormal,
        ]}
      >
        <Text
          style={[
            styles.fieldLabel,
            errors.title ? styles.accentColor : styles.whiteLabel,
          ]}
        >
          {t("listingForm.title")} <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          placeholder={t("listingForm.enterListingTitle")}
          value={title}
          onChangeText={(text) => {
            if (text.length <= 50) {
              onTitleChange(text);
            }
          }}
          style={[styles.textInput, styles.whiteLabel]}
          placeholderTextColor="#888"
          maxLength={50}
        />
        <Text style={styles.characterCount}>
          {title.length}/50 {t("listingForm.characters")}
        </Text>
        {errors.title && (
          <Text style={[styles.errorText, styles.accentColor]}>
            {errors.title}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.fieldCard,
          errors.description ? styles.errorBorderColor : styles.fieldCardNormal,
        ]}
      >
        <Text
          style={[
            styles.fieldLabel,
            errors.description ? styles.accentColor : styles.whiteLabel,
          ]}
        >
          {t("listingForm.description")} <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          placeholder={t("listingForm.describeYourItem")}
          value={description}
          onChangeText={(text) => {
            if (text.length <= 300) {
              onDescriptionChange(text);
            }
          }}
          style={[styles.textInput, styles.textArea, styles.whiteLabel]}
          placeholderTextColor="#888"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={300}
        />
        <Text style={styles.characterCount}>
          {description.length}/300 {t("listingForm.characters")}
        </Text>
        {errors.description && (
          <Text style={[styles.errorText, styles.accentColor]}>
            {errors.description}
          </Text>
        )}
      </View>

      {/* Basic Attributes */}
      {Object.entries(selectedCategory?.basic_attributes || {}).map(
        ([key, attr]) => {
          if ((attr as any).hidden) return null;
          return (
            <View key={key}>
              {renderField(
                key,
                attr,
                basicAttributes[key],
                onBasicAttributeChange
              )}
            </View>
          );
        }
      )}

      <View
        style={[
          styles.fieldCard,
          errors.price ? styles.errorBorderColor : styles.fieldCardNormal,
        ]}
      >
        <Text
          style={[
            styles.fieldLabel,
            errors.price ? styles.accentColor : styles.whiteLabel,
          ]}
        >
          {t("listingForm.price")} <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.priceRow}>
          <TextInput
            placeholder="0.00"
            value={price ? String(price) : ""}
            onChangeText={(text) => {
              const numValue = text.replace(/[^0-9.]/g, "");
              onPriceChange(numValue ? Number(numValue) : 0);
            }}
            style={[styles.textInput, styles.priceInput, styles.whiteLabel]}
            placeholderTextColor="#888"
            keyboardType="numeric"
          />
        </View>
        {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
      </View>

      {/* Phone Number Field */}
      <View
        style={[
          styles.fieldCard,
          phoneError ? styles.errorBorderColor : styles.fieldCardNormal,
          styles.phoneFieldCard,
        ]}
      >
        <Text
          style={[
            styles.fieldLabel,
            phoneError ? styles.accentColor : styles.whiteLabel,
          ]}
        >
          {t("listingForm.phoneNumber")} <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.phoneInputContainer}>
          <Text style={styles.phonePrefix}>+1</Text>
          <TextInput
            placeholder="809-XXX-XXXX"
            value={formatDRPhone(phoneNumber)}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, "");
              onPhoneChange(cleaned);
            }}
            style={[styles.textInput, styles.phoneTextInput]}
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            maxLength={12}
          />
        </View>
        {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
      </View>

      {/* Category Attributes */}
      <Text style={styles.sectionTitle}>
        {selectedCategory?.display_name} {t("listingForm.details")}
      </Text>
      {Object.entries(selectedCategory?.attributes || {}).map(([key, attr]) => {
        if ((attr as any).hidden) return null;
        return (
          <View key={key}>
            {renderField(
              key,
              attr,
              categoryAttributes[key],
              onCategoryAttributeChange
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 0.5,
    color: "#c1fe00",
  },
  fieldCard: {
    backgroundColor: "#232323", // Changed from #181818 to work better in bottom sheet
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  fieldCardNormal: {
    borderColor: "#333333", // Lighter border for bottom sheet
  },
  errorBorderColor: {
    borderColor: "#FF4D4F",
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  whiteLabel: {
    color: "#fff",
  },
  accentColor: {
    color: "#c1fe00",
  },
  required: {
    color: "#FF4D4F",
    fontWeight: "bold",
  },
  textInput: {
    backgroundColor: "#2a2a2a", // Slightly lighter for contrast
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    marginBottom: 0,
  },
  textArea: {
    height: 90,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceInput: {
    flex: 1,
    marginRight: 8,
  },
  phoneFieldCard: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  phonePrefix: {
    color: "#888",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 6,
    marginLeft: 4,
  },
  phoneTextInput: {
    color: "#fff",
    flex: 1,
    borderRadius: 10,
    marginLeft: 0,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  imageWrapper: {
    position: "relative",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  imagePreview: {
    width: (screenWidth - 100) / 3,
    height: (screenWidth - 100) / 3,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  addImageButton: {
    width: (screenWidth - 100) / 3,
    height: (screenWidth - 100) / 3,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
  },
  addImageButtonAccent: {
    borderColor: "#c1fe00",
  },
  addImageText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  imageHelperText: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
  arrayContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  arrayOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderWidth: 2,
    borderColor: "#333333",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  arrayOptionSelected: {
    backgroundColor: "#c1fe00",
    borderColor: "#c1fe00",
  },
  arrayOptionText: {
    color: "#fff",
    fontSize: 14,
    marginRight: 4,
  },
  arrayOptionTextSelected: {
    color: "#0a0a0a",
    fontWeight: "bold",
  },
  booleanFieldCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
    color: "#c1fe00",
  },
  characterCount: {
    fontSize: 12,
    color: "#888",
    marginTop: 12,
    textAlign: "right",
  },
  autofillText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  spinningIcon: {
    // Add animation styles if needed
  },
});

export default FormContent;
