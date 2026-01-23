import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { AnimatedView } from "../animated";

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  withToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  value?: string;
  disabled?: boolean;
  isLast?: boolean;
}

export const SettingItem = ({
  icon,
  title,
  withToggle = false,
  toggleValue = false,
  onToggle,
  onPress,
  value,
  disabled = false,
  isLast = false,
}: SettingItemProps) => (
  <>
    <TouchableOpacity
      className="flex-row items-center px-5 py-4"
      onPress={onPress}
      disabled={withToggle || disabled}
      activeOpacity={0.7}
    >
      <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-[#272727]">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {value && <Text className="mt-1 text-xs text-gray-400">{value}</Text>}
      </View>
      {withToggle ? (
        <Switch
          trackColor={{ false: "#3e3e3e", true: "#c1fe00" }}
          thumbColor={toggleValue ? "#ffffff" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={onToggle}
          value={toggleValue}
        />
      ) : (
        <ChevronRight color="#666" size={20} />
      )}
    </TouchableOpacity>
    {!isLast && <View className="mx-5 h-px bg-[#333]" />}
  </>
);

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
  isNotViable?: boolean;
}

export const ProfileSection = ({
  title,
  children,
  delay = 0,
  isNotViable,
}: ProfileSectionProps) => {
  if (isNotViable) return null;

  return (
    <AnimatedView
      animation="slide-up"
      delay={delay}
      style={{ marginBottom: 16 }}
    >
      <Text className="mb-4 px-1 text-lg font-bold text-gray-300">{title}</Text>
      <View className="overflow-hidden rounded-2xl bg-[#1e1e1e]">
        {children}
      </View>
    </AnimatedView>
  );
};
