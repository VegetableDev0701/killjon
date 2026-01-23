import React, { createContext, useContext, useState } from "react";
import LoginSheet from "../components/LoginSheet";

type LoginSheetContextType = {
  showLoginSheet: () => void;
  hideLoginSheet: () => void;
};

const LoginSheetContext = createContext<LoginSheetContextType | undefined>(
  undefined
);

export const LoginSheetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const showLoginSheet = () => setIsVisible(true);
  const hideLoginSheet = () => setIsVisible(false);

  return (
    <LoginSheetContext.Provider value={{ showLoginSheet, hideLoginSheet }}>
      {children}
      <LoginSheet isVisible={isVisible} onClose={hideLoginSheet} />
    </LoginSheetContext.Provider>
  );
};

export const useLoginSheet = () => {
  const context = useContext(LoginSheetContext);
  if (context === undefined) {
    throw new Error("useLoginSheet must be used within a LoginSheetProvider");
  }
  return context;
};
