import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import Clipboard from "@react-native-clipboard/clipboard";
import { Copy, Download, Share2, X } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RNFS from "react-native-fs";
import { trigger } from "react-native-haptic-feedback";
import { toast } from "sonner-native";
import { VivrationOption } from "../../utils/constants";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  merchantId: string;
  merchantName: string;
  shareUrl?: string;
  qrCodeUrl?: string;
}

const { width } = Dimensions.get("window");

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  merchantName,
  shareUrl,
  qrCodeUrl,
}) => {
  const { t } = useTranslation();

  // Use API share_url if available, otherwise generate one
  const merchantURL = shareUrl;

  const handleShare = async () => {
    try {
      trigger("impactMedium", VivrationOption);

      // Use React Native's built-in Share API
      await Share.share({
        message: `Check out ${merchantName}'s listings on Nodoia: ${merchantURL}`,
        title: `${merchantName} - Nodoia`,
      });
    } catch (error) {
      console.log(error);
      toast.error(t("share.failedToShare"));
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setString(merchantURL ?? "");
      trigger("impactMedium", VivrationOption);
      toast.success(t("share.linkCopied"));
    } catch (error) {
      console.log(error);
      toast.error(t("share.failedToCopyLink"));
    }
  };

  const handleSaveQR = async () => {
    try {
      if (!qrCodeUrl) {
        toast.error(t("share.qrCodeNotAvailable"));
        return;
      }

      // 👇 Step 1: pre-trigger permission prompt if needed (iOS only)
      if (Platform.OS === "ios") {
        try {
          // This harmless call ensures iOS shows the permission popup first time
          await CameraRoll.getAlbums({ assetType: "Photos" });
        } catch (error) {
          console.log(error);
          // Ignore error — it's only for permission trigger
        }
      }

      // 👇 Step 2: download image locally
      const timestamp = Date.now();
      const localPath = `${RNFS.CachesDirectoryPath}/qr_code_${timestamp}.png`;

      await RNFS.downloadFile({
        fromUrl: qrCodeUrl,
        toFile: localPath,
      }).promise;

      // 👇 Step 3: save it after permission settled
      await CameraRoll.saveAsset(localPath, { type: "photo" });

      // 👇 Step 4: clean up
      await RNFS.unlink(localPath);

      trigger("impactMedium", VivrationOption);
      toast.success(t("share.qrCodeSaved"));
    } catch (error) {
      console.error("Save QR error:", error);
      toast.error(t("share.failedToSaveQR"));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {t("share.share")} {merchantName}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* QR Code Section */}
            <View style={styles.qrSection}>
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: qrCodeUrl }}
                  style={styles.qrCodeImage}
                  resizeMode="contain"
                />

                <Text style={styles.qrText}>{t("share.qrCode")}</Text>
                <Text style={styles.urlText} numberOfLines={2}>
                  {merchantURL}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <Share2 color="#ffffff" size={24} />
                <Text style={styles.actionText}>{t("share.share")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCopyLink}
              >
                <Copy color="#ffffff" size={24} />
                <Text style={styles.actionText}>{t("share.copyLink")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSaveQR}
              >
                <Download color="#ffffff" size={24} />
                <Text style={styles.actionText}>{t("share.saveQR")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    width: width * 0.9,
    maxWidth: 400,
    padding: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  qrSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  qrContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 200,
    justifyContent: "center",
  },
  qrCodeImage: {
    width: 120,
    height: 120,
  },
  qrText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginTop: 12,
    marginBottom: 8,
  },
  urlText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    maxWidth: 200,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  actionButton: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#333333",
    borderRadius: 12,
    minWidth: 80,
  },
  actionText: {
    color: "#ffffff",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  browserButton: {
    backgroundColor: "#c1fe00",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  browserButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ShareModal;
