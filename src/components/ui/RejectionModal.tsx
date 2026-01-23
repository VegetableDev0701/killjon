import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface RejectionModalProps {
  visible: boolean;
  rejectionReason: string;
  onClose: () => void;
  onResubmit: () => void;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
  visible,
  rejectionReason,
  onClose,
  onResubmit,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/80">
        <View className="w-5/6 rounded-3xl border border-[#333] bg-[#222222] p-6">
          <Text className="mb-6 text-center text-xl font-bold text-red-400">
            {t("profile.verificationRejected")}
          </Text>

          <View className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <Text className="mb-2 text-base font-semibold text-red-400">
              {t("profile.rejectionReason")}
            </Text>
            <Text className="text-sm leading-5 text-gray-300">
              {rejectionReason}
            </Text>
          </View>

          <Text className="mb-6 text-center text-sm text-gray-400">
            {t("profile.resubmitInstructions")}
          </Text>

          <View className="flex-row justify-center gap-4">
            <TouchableOpacity
              className="w-1/2 rounded-xl bg-[#333] py-4"
              onPress={onClose}
            >
              <Text className="text-center font-medium text-foreground">
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-1/2 rounded-xl bg-primary py-4"
              onPress={onResubmit}
            >
              <Text className="text-center font-bold text-black">
                {t("profile.resubmit")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
