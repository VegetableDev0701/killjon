import { NavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/navigationTypes";

class NavigationService {
  private navigationRef: NavigationContainerRef<RootStackParamList> | null =
    null;

  setNavigationRef = (ref: NavigationContainerRef<RootStackParamList>) => {
    this.navigationRef = ref;
  };

  navigate = (name: keyof RootStackParamList, params?: any) => {
    if (this.navigationRef?.isReady()) {
      this.navigationRef.navigate(name, params);
    }
  };

  reset = (routes: { name: keyof RootStackParamList; params?: any }[]) => {
    if (this.navigationRef?.isReady()) {
      this.navigationRef.reset({
        index: 0,
        routes,
      });
    }
  };

  navigateToWelcome = () => {
    if (this.navigationRef?.isReady()) {
      this.navigationRef.reset({
        index: 0,
        routes: [{ name: "Welcome" }],
      });
    }
  };

  isReady = () => {
    return this.navigationRef?.isReady() ?? false;
  };
}

export const navigationService = new NavigationService();
