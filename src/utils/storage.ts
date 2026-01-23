import { createMMKV } from "react-native-mmkv";

const generateEncryptionKey = "my-secure-key-123!";
const appName = `nodo-mmkv-storage`;

export const storage = createMMKV({
  id: appName,
  encryptionKey: generateEncryptionKey,
});

export const StorageKeys = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  LANGUAGE: "language",
  THEME: "theme",
  ONBOARDING_COMPLETE: "onboarding_complete",
  APP_MODE: "app_mode",
} as const;
