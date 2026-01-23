import {
  BookA,
  Briefcase,
  Car,
  Dumbbell,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Landmark,
  Monitor,
  PawPrint,
  Shirt,
  Sofa,
  Tag,
  Ticket,
  Wrench,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import FormContent from "../components/FormContent";
import MapWithBottomSheet from "../components/MapWithBottomSheet";
import SlideToAction from "../components/SlideToAction";
import { SuccessModal } from "../components/ui";
import FullScreenImageViewer from "../components/ui/FullScreenImageViewer";
import { NavigationProps } from "../navigation/navigationTypes";
import { trackMerchantProductUpload } from "../services/firebaseAnalyticsService";
import {
  AutofillResponse,
  Category,
  ListingsApi,
} from "../services/listingsApi";
import { useAuthStore } from "../store/authStore";
import { useListingStore } from "../store/listingStore";
import { screenWidth } from "../utils/constants";

// Updated icon map to match SelectCategoryScreen
const categoryIconMap: Record<string, React.ElementType> = {
  vehicles: Car,
  real_estate: Home,
  electronics: Monitor,
  fashion: Shirt,
  furniture: Sofa,
  books: BookA,
  sports: Dumbbell,
  services: Wrench,
  pets: PawPrint,
  jobs: Briefcase,
  collectibles: Landmark,
  health: HeartPulse,
  education: GraduationCap,
  events: Ticket,
  tools: Hammer,
};

const getCategoryIcon = (categoryKey: string | undefined) => {
  if (!categoryKey) return <Tag color="#0a0a0a" size={28} />;
  const Icon = categoryIconMap[categoryKey];
  if (Icon) return <Icon color="#0a0a0a" size={28} />;
  return <Tag color="#0a0a0a" size={28} />;
};

const isFormValid = (
  title: string,
  description: string,
  price: number,
  currency: string,
  images: string[],
  address: string,
  categoryAttributes: Record<string, any>,
  basicAttributes: Record<string, any>,
  selectedCategory: Category | null,
  errors: Record<string, string>
): boolean => {
  if (
    !title.trim() ||
    !description.trim() ||
    !address ||
    !currency ||
    price <= 0 ||
    images.length === 0
  )
    return false;
  if (!categoryAttributes.locationCoords) return false;
  if (Object.values(errors).some(Boolean)) return false;
  if (selectedCategory?.attributes) {
    for (const [key, attr] of Object.entries(selectedCategory.attributes) as [
      string,
      any,
    ][]) {
      if (attr.required) {
        const value = categoryAttributes[key];
        if (value === undefined || value === null || value === "") return false;
      }
    }
  }
  if (selectedCategory?.basic_attributes) {
    for (const [key, attr] of Object.entries(
      selectedCategory.basic_attributes
    ) as [string, any][]) {
      if (attr.required) {
        const value = basicAttributes[key];
        if (value === undefined || value === null || value === "") return false;
      }
    }
  }
  return true;
};

const ListingFormScreen = ({
  navigation,
  route,
}: NavigationProps<"ListingForm">) => {
  const { t, i18n } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const {
    selectedCategory,
    title,
    description,
    price,
    currency,
    images,
    categoryAttributes,
    errors,
    isSubmitting,
    setFormField,
    setCategoryAttribute,
    setBasicAttribute,
    basicAttributes,
    setError,
    clearErrors,
    setSubmitting,
    resetForm,
    addImage,
    removeImage,
    isEditing,
    editData,
    setEditData,
    populateFormWithEditData,
    clearEditData,
    editListing,
    categories,
    selectCategory,
    userListings,
    fetchCategories,
  } = useListingStore();
  const { userProfile } = useAuthStore();

  // Image preview state
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Add phone number state
  const [phoneNumber, setPhoneNumber] = useState(editData?.phone_number || "");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Autofill loading state
  const [isAutofillLoading, setIsAutofillLoading] = useState(false);

  // Robust edit flow: set editData from route param, then set category and populate form after categories load
  useEffect(() => {
    // @ts-ignore
    const item = route.params?.item;
    if (item && (!isEditing || !editData || editData.id !== item.id)) {
      setEditData(item);
    }
  }, [route.params, isEditing, editData, setEditData]);

  // Always fetch categories on mount if not loaded
  useEffect(() => {
    if (!categories || categories.length === 0) {
      fetchCategories(i18n.language);
    }
    // Only run on mount!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only populate edit form after categories are loaded and editData is set
  const hasPopulatedEdit = useRef<string | null>(null);
  useEffect(() => {
    if (
      isEditing &&
      editData &&
      categories &&
      categories.length > 0 &&
      hasPopulatedEdit.current !== editData.id
    ) {
      // Find the category for this item
      const cat = categories.find(
        (c) => c.category_key === (editData.category_key || editData.category)
      );
      if (cat) {
        selectCategory(cat);
        // Wait for category to be set, then populate form
        setTimeout(() => {
          populateFormWithEditData();
        }, 0);
        hasPopulatedEdit.current = editData.id;
      }
    }
    // If not editing, reset ref
    if (!isEditing) {
      hasPopulatedEdit.current = null;
    }
  }, [
    isEditing,
    editData,
    categories,
    selectCategory,
    populateFormWithEditData,
  ]);

  // Extra safety: Clear editData on unmount
  useEffect(() => {
    return () => {
      resetForm();
      clearEditData();
    };
  }, []);

  // Auto-fill handler for when user uploads first image
  const handleAutofill = async (imageUri: string) => {
    try {
      setIsAutofillLoading(true);
      const response: AutofillResponse =
        await ListingsApi.autofillFromImage(imageUri);

      // Only autofill if title and description are empty
      if (!title.trim()) {
        // Apply title character limit (50 characters)
        const truncatedTitle =
          response.title.length > 50
            ? response.title.substring(0, 50)
            : response.title;
        setFormField("title", truncatedTitle);
      }

      if (!description.trim()) {
        // Apply description character limit (300 characters)
        const truncatedDescription =
          response.description.length > 300
            ? response.description.substring(0, 300)
            : response.description;
        setFormField("description", truncatedDescription);
      }

      toast.success("Product details suggested from image!");
    } catch (error) {
      console.error("Autofill error:", error);
      // Don't show error toast - autofill is optional functionality
    } finally {
      setIsAutofillLoading(false);
    }
  };

  // Dominican Republic phone validation
  function isValidDRPhone(phone: string) {
    // Accepts +1 809/829/849 NNN NNNN or 809/829/849NNNNNNN or 10 digits
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      const area = cleaned.slice(1, 4);
      return ["809", "829", "849"].includes(area);
    }
    if (cleaned.length === 10) {
      const area = cleaned.slice(0, 3);
      return ["809", "829", "849"].includes(area);
    }
    return false;
  }

  const handleSubmit = async () => {
    try {
      clearErrors();
      const newErrors: Record<string, string> = {};
      if (!title.trim()) {
        toast.error("Title is required");
        newErrors.title = "Title is required";
      }
      if (!description.trim()) {
        toast.error("Description is required");
        newErrors.description = "Description is required";
      }
      if (price <= 0) {
        toast.error("Price must be greater than 0");
        newErrors.price = "Price must be greater than 0";
      }
      if (images.length === 0) {
        toast.error("At least one photo is required");
        newErrors.images = "At least one photo is required";
      }
      if (!categoryAttributes.locationCoords) {
        toast.error("Location is required");
        newErrors.location = "Location is required";
      }
      if (!isValidDRPhone(phoneNumber)) {
        toast.error("Enter a valid Dominican Republic phone number");
        newErrors.phone = "Enter a valid Dominican Republic phone number";
      }
      // Validate basic_attributes with enhanced validation
      Object.entries(selectedCategory?.basic_attributes || {}).forEach(
        ([key, attr]) => {
          const value = basicAttributes[key];
          const fieldLabel = (attr as any).label;

          // Required validation
          if (
            (attr as any).required &&
            (value === undefined || value === null || value === "")
          ) {
            toast.error(`${fieldLabel} is required`);
            newErrors[key] = `${fieldLabel} is required`;
            return;
          }

          // Number type validation (min/max)
          if (
            (attr as any).type === "number" &&
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            const numValue = Number(value);

            // Check both min and max together for better UX
            if (
              (attr as any).min !== undefined &&
              (attr as any).max !== undefined
            ) {
              if (
                numValue < (attr as any).min ||
                numValue > (attr as any).max
              ) {
                const message = `${fieldLabel} must be between ${
                  (attr as any).min
                } and ${(attr as any).max}`;
                toast.error(message);
                newErrors[key] = message;
              }
            } else if (
              (attr as any).min !== undefined &&
              numValue < (attr as any).min
            ) {
              const message = `${fieldLabel} must be at least ${
                (attr as any).min
              }`;
              toast.error(message);
              newErrors[key] = message;
            } else if (
              (attr as any).max !== undefined &&
              numValue > (attr as any).max
            ) {
              const message = `${fieldLabel} must be at most ${
                (attr as any).max
              }`;
              toast.error(message);
              newErrors[key] = message;
            }
          }
        }
      );

      // Validate regular attributes with enhanced validation
      Object.entries(selectedCategory?.attributes || {}).forEach(
        ([key, attr]) => {
          const value = categoryAttributes[key];
          const fieldLabel =
            typeof attr.label === "string"
              ? attr.label
              : attr.label?.en || attr.label?.es || "";

          // Required validation
          if (
            attr.required &&
            (value === undefined || value === null || value === "")
          ) {
            toast.error(`${fieldLabel} is required`);
            newErrors[key] = `${fieldLabel} is required`;
            return;
          }

          // Number type validation (min/max)
          if (
            attr.type === "number" &&
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            const numValue = Number(value);

            // Check both min and max together for better UX
            if (attr.min !== undefined && attr.max !== undefined) {
              if (numValue < attr.min || numValue > attr.max) {
                const message = `${fieldLabel} must be between ${attr.min} and ${attr.max}`;
                toast.error(message);
                newErrors[key] = message;
              }
            } else if (attr.min !== undefined && numValue < attr.min) {
              const message = `${fieldLabel} must be at least ${attr.min}`;
              toast.error(message);
              newErrors[key] = message;
            } else if (attr.max !== undefined && numValue > attr.max) {
              const message = `${fieldLabel} must be at most ${attr.max}`;
              toast.error(message);
              newErrors[key] = message;
            }
          }
        }
      );
      if (Object.keys(newErrors).length > 0) {
        Object.entries(newErrors).forEach(([field, error]) =>
          setError(field, error)
        );
        setPhoneError(newErrors.phone || null);
        return;
      }
      setPhoneError(null);
      setSubmitting(true);

      // Build attributes object (exclude location/locationCoords/locationDetails)
      const attributes: Record<string, any> = {};
      Object.entries(categoryAttributes).forEach(([key, value]) => {
        if (!["location", "locationCoords", "locationDetails"].includes(key)) {
          attributes[key] = value;
        }
      });
      const basic_attributes: Record<string, any> = {};
      Object.entries(basicAttributes).forEach(([key, value]) => {
        basic_attributes[key] = value;
      });

      // Use structured location object
      const location = categoryAttributes.locationDetails || {
        city: "",
        country: "",
        coordinates: {
          lat: categoryAttributes.locationCoords?.latitude,
          lng: categoryAttributes.locationCoords?.longitude,
        },
      };

      const formData = new FormData();
      formData.append("category", selectedCategory?.category_key);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("price", Number(price).toString());
      formData.append("location", JSON.stringify(location)); // <--- JSON string!
      formData.append("attributes", JSON.stringify(attributes));
      formData.append("basic_attributes", JSON.stringify(basic_attributes));
      formData.append("phone_number", phoneNumber);
      images.forEach((image, index) => {
        formData.append("images", {
          uri: image,
          name: `image_${index}.jpg`,
          type: "image/jpeg",
        });
      });

      // --- EDIT/UPDATE FLOW ---
      if (isEditing && editData && editData.id) {
        const updated = await ListingsApi.updateListing(editData.id, formData);
        if (updated) {
          editListing(editData.id, updated);
          setShowSuccessModal(true);
        }
        return;
      }
      // --- CREATE FLOW ---
      const newListing = await ListingsApi.createListing(formData);
      setShowSuccessModal(true);

      // Track merchant product upload event
      if (userProfile?.id && newListing) {
        const totalProducts = userListings.length + 1; // Include the new listing
        trackMerchantProductUpload(
          userProfile.id,
          newListing.id || "unknown",
          totalProducts
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create listing"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle location changes from the MapWithBottomSheet
  const handleLocationChange = (
    coords: { latitude: number; longitude: number },
    address: string
  ) => {
    setCategoryAttribute("locationCoords", coords);
    setCategoryAttribute("location", address);
    setCategoryAttribute("locationDetails", {
      city: "", // Will be populated by reverse geocoding in MapWithBottomSheet
      country: "",
      coordinates: { lat: coords.latitude, lng: coords.longitude },
    });
  };

  const formIsValid = isFormValid(
    title,
    description,
    price,
    currency,
    images,
    categoryAttributes.location || "",
    categoryAttributes,
    basicAttributes,
    selectedCategory,
    errors
  );

  // Get the header component with category icon
  const headerComponent = (
    <View style={styles.headerContent}>
      <View style={styles.headerIcon}>
        {getCategoryIcon(selectedCategory?.category_key)}
      </View>
      <Text style={styles.headerTitle}>{selectedCategory?.display_name}</Text>
    </View>
  );

  const footerComponent = (
    <SlideToAction
      onComplete={handleSubmit}
      slideText={
        isEditing
          ? t("listingForm.slideToUpdate")
          : t("listingForm.slideToSubmit")
      }
      completionText={
        isSubmitting
          ? isEditing
            ? t("listingForm.updating")
            : t("listingForm.submitting")
          : isEditing
            ? t("listingForm.updateNow")
            : t("listingForm.submitNow")
      }
      isProcessing={isSubmitting}
      disabled={!formIsValid || isSubmitting}
      sliderWidth={screenWidth * 0.85}
      sliderHeight={58}
      slideThreshold={0.8}
      primaryColor="#c1fe00"
      backgroundColor={
        formIsValid ? "rgba(193, 254, 0, 0.2)" : "rgba(100, 100, 100, 0.2)"
      }
      textColor={"#c1fe00"}
      thumbColor={"#c1fe00"}
      completionThumbColor="#000"
      completionBackgroundColor="#c1fe00"
      showHintText={false}
      style={[styles.slideToActionContainer, { paddingBottom: bottom }]}
    />
  );

  return (
    <View style={styles.container}>
      <MapWithBottomSheet
        onLocationChange={handleLocationChange}
        initialLocation={categoryAttributes.locationCoords}
        headerComponent={headerComponent}
        footerComponent={footerComponent}
        onBack={navigation.goBack}
        isEditing={isEditing}
      >
        <FormContent
          title={title}
          description={description}
          price={price}
          currency={currency}
          onTitleChange={(title) => setFormField("title", title)}
          onDescriptionChange={(desc) => setFormField("description", desc)}
          onPriceChange={(price) => setFormField("price", price)}
          onCurrencyChange={(currency) => setFormField("currency", currency)}
          images={images}
          onAddImage={addImage}
          onRemoveImage={removeImage}
          onImagePress={(index) => {
            setImageViewerIndex(index);
            setShowImageViewer(true);
          }}
          phoneNumber={phoneNumber}
          onPhoneChange={(phone) => {
            setPhoneNumber(phone);
            setPhoneError(null);
          }}
          phoneError={phoneError}
          selectedCategory={selectedCategory}
          categoryAttributes={categoryAttributes}
          basicAttributes={basicAttributes}
          onCategoryAttributeChange={setCategoryAttribute}
          onBasicAttributeChange={setBasicAttribute}
          errors={errors}
          onAutofill={handleAutofill}
          isAutofillLoading={isAutofillLoading}
        />
      </MapWithBottomSheet>

      {/* Success Modal */}
      <SuccessModal
        title={t("successModal.congratulations")}
        message={
          isEditing
            ? t("successModal.listingUpdated")
            : t("successModal.listingCreated")
        }
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        primaryAction={{
          label: isEditing
            ? t("successModal.editAnotherListing")
            : t("successModal.addAnotherProduct"),
          onPress: () => {
            resetForm();
            clearEditData();
            setShowSuccessModal(false);
            navigation.goBack();
          },
        }}
        secondaryAction={{
          label: t("successModal.viewMyListings"),
          onPress: () => {
            resetForm();
            clearEditData();
            if (isEditing) {
              navigation.goBack();
            } else {
              navigation.replace("MyListings");
            }
          },
        }}
        accentColor="#c1fe00"
      />

      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        visible={showImageViewer}
        images={images}
        initialIndex={imageViewerIndex}
        onClose={() => setShowImageViewer(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    marginRight: 8,
  },
  headerIcon: {
    width: 34,
    height: 35,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#c1fe00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    backgroundColor: "#c1fe00",
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  slideToActionContainer: {
    paddingTop: 16,
    width: screenWidth,
  },
});

export default ListingFormScreen;
