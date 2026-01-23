import {
  BadgeCheck,
  MapPin,
  MapPinOff,
  PencilLineIcon,
  PencilOff,
  Share,
  UserIcon,
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ProfileHeaderProps {
  currentProfileImage: string | null;
  uploadingPhoto: boolean;
  firstName?: string;
  email?: string;
  brandName?: string;
  lastName?: string;
  isVerifiedUser?: boolean;
  verifiedStatus?: string;
  hasMerchantDetails: boolean;
  onProfileImageError: () => void;
  onEditPress: () => void;
  onLocationPress: () => void;
  onSharePress: () => void;
  getVerificationStatusDisplay: (status?: string) => string;
}

export const ProfileHeader = ({
  currentProfileImage,
  uploadingPhoto,
  firstName,
  email,
  brandName,
  lastName,
  isVerifiedUser,
  verifiedStatus,
  hasMerchantDetails,
  onProfileImageError,
  onEditPress,
  onLocationPress,
  onSharePress,
  getVerificationStatusDisplay,
}: ProfileHeaderProps) => {
  const { t } = useTranslation();

  return (
    <View className="mb-6 flex-row items-start">
      <View
        className={
          "mr-4 h-40 w-40 items-center justify-center overflow-hidden rounded-[36px] border-2 bg-[#232323] shadow-2xl shadow-black/50"
        }
      >
        {uploadingPhoto ? (
          <ActivityIndicator size="large" color="#c1fe00" />
        ) : currentProfileImage ? (
          <Image
            source={{
              uri: currentProfileImage,
            }}
            className="h-40 w-40"
            resizeMode="cover"
            onError={onProfileImageError}
          />
        ) : firstName ? (
          <Text className="text-6xl font-bold text-primary">
            {firstName.charAt(0)}
          </Text>
        ) : (
          <UserIcon size={60} color="#c1fe00" />
        )}
      </View>

      {/* Details (Right) */}
      <View className="flex-1  justify-center pt-1">
        {/* Meta Tag */}
        <Text className="mb-1 text-[11px] font-medium tracking-wide text-neutral-500">
          {getVerificationStatusDisplay(verifiedStatus)}
        </Text>

        {/* Album Title */}
        <View className="mb-1 flex-row items-center gap-2">
          <Text
            className="text-3xl font-bold text-white"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {brandName
              ? brandName
              : firstName && lastName
                ? `${firstName} ${lastName}`
                : t("profile.user")}
          </Text>
          {isVerifiedUser && <BadgeCheck size={20} color="#c1fe00" />}
        </View>

        {/* Artist Name */}
        <Text className="text-m mb-5 font-medium text-neutral-400">
          {email?.includes("appleid") ? t("profile.privateEmail") : email}
        </Text>

        {/* Action Icons Row */}
        <View className="flex-row items-center gap-5">
          <TouchableOpacity
            hitSlop={12}
            disabled={!isVerifiedUser}
            onPress={onEditPress}
            className="active:opacity-70"
          >
            {isVerifiedUser ? (
              <PencilLineIcon size={22} color="#fff" />
            ) : (
              <PencilOff size={22} color="#a3a3a3" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            hitSlop={12}
            disabled={!isVerifiedUser}
            onPress={onLocationPress}
            className="active:opacity-70"
          >
            {isVerifiedUser ? (
              <MapPin size={22} color={"#fff"} />
            ) : (
              <MapPinOff size={22} color="#a3a3a3" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            hitSlop={12}
            disabled={!isVerifiedUser || !hasMerchantDetails}
            onPress={onSharePress}
            className="active:opacity-70"
          >
            <Share size={22} color={hasMerchantDetails ? "#fff" : "#a3a3a3"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
