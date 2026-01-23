import i18n from "i18next";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { storage, StorageKeys } from "../utils/storage";

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState("es");

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = storage.getString(StorageKeys.LANGUAGE);
    if (savedLanguage) {
      setLanguageState(savedLanguage);
      i18n.changeLanguage(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: string) => {
    if (lang !== "en" && lang !== "es") return;

    i18n.changeLanguage(lang);
    setLanguageState(lang);
    storage.set(StorageKeys.LANGUAGE, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
