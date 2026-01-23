import { isLiquidGlassSupported } from "@callstack/liquid-glass";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";
import {
  BarChart2,
  House,
  Lightbulb,
  Search,
  User2,
} from "lucide-react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { CustomAndroidTabBar } from "../components/ui/CustomAndroidTabBar";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import ChatScreen from "../screens/ChatScreen";
import HomeScreen from "../screens/HomeScreen";
import NodoLabScreen from "../screens/NodoLabScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { BottomTabParamList } from "./navigationTypes";

// Use native bottom tabs for iOS, standard bottom tabs for Android
const Tab = isLiquidGlassSupported
  ? createNativeBottomTabNavigator<BottomTabParamList>()
  : createBottomTabNavigator<BottomTabParamList>();

// Track the previous tab (excluding SearchTab)
let previousTab: keyof BottomTabParamList = "HomeTab";

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={
        isLiquidGlassSupported
          ? undefined
          : (props) => <CustomAndroidTabBar {...props} />
      }
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#c1fe00",
        tabBarInactiveTintColor: "#fff",
        tabBarLabelStyle: styles.tabBarLabel,
        ...(isLiquidGlassSupported
          ? { tabBarLabelVisibilityMode: "labeled" }
          : { headerShown: false }),
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: isLiquidGlassSupported
            ? {
                type: "sfSymbol",
                name: "house.fill",
              }
            : ({ color, size, focused }) => <House size={size} color={color} />,
          headerShown: true,
        }}
        listeners={{
          tabPress: () => {
            previousTab = "HomeTab";
          },
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={isLiquidGlassSupported ? ChatScreen : () => <></>}
        options={{
          tabBarLabel: "Search",
          tabBarIcon: isLiquidGlassSupported
            ? {
                type: "sfSymbol",
                name: "magnifyingglass",
              }
            : ({ color, size, focused }) => (
                <Search
                  size={size}
                  color={color}
                  fill={focused ? color : "none"}
                />
              ),
          ...(isLiquidGlassSupported
            ? {
                tabBarSystemItem: "search",
                headerShown: true,
              }
            : {}),
        }}
        listeners={
          isLiquidGlassSupported
            ? undefined
            : ({ navigation }) => ({
                tabPress: (e) => {
                  e.preventDefault();
                  navigation.navigate("Chat" as any, { previousTab });
                },
              })
        }
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: "Analytics",
          tabBarIcon: isLiquidGlassSupported
            ? {
                type: "sfSymbol",
                name: "chart.bar.fill",
              }
            : ({ color, size, focused }) => (
                <BarChart2
                  size={size}
                  color={color}
                  fill={focused ? color : "none"}
                />
              ),
        }}
        listeners={{
          tabPress: () => {
            previousTab = "AnalyticsTab";
          },
        }}
      />

      <Tab.Screen
        name="LabsTab"
        component={NodoLabScreen}
        options={{
          tabBarLabel: "Labs",
          tabBarIcon: isLiquidGlassSupported
            ? {
                type: "sfSymbol",
                name: "lightbulb.fill",
              }
            : ({ color, size, focused }) => (
                <Lightbulb
                  size={size}
                  color={color}
                  fill={focused ? color : "none"}
                />
              ),
          headerShown: true,
        }}
        listeners={{
          tabPress: () => {
            previousTab = "LabsTab";
          },
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: isLiquidGlassSupported
            ? {
                type: "sfSymbol",
                name: "person.fill",
              }
            : ({ color, size, focused }) => (
                <User2
                  size={size}
                  color={color}
                  fill={focused ? color : "none"}
                />
              ),
        }}
        listeners={{
          tabPress: () => {
            previousTab = "ProfileTab";
          },
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: isLiquidGlassSupported
      ? "rgba(10, 10, 10, 0.85)"
      : "rgba(10, 10, 10, 0.95)",
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default BottomTabNavigator;

// Export function to get previous tab (for use in ChatScreen)
export const getPreviousTab = (): keyof BottomTabParamList => {
  return previousTab;
};
