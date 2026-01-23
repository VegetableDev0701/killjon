import { Check, ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ModalPickerProps {
  label: string;
  value: string | undefined;
  options: string[];
  onSelect: (val: string) => void;
  accentColor?: string;
  error?: string;
  required?: boolean;
}

// Helper function to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str.replace(
    /(^|\s)([a-zA-ZáéíóúñÁÉÍÓÚÑ])/g,
    (match, space, letter) => space + letter.toUpperCase()
  );
};

const ModalPicker: React.FC<ModalPickerProps> = ({
  label,
  value,
  options,
  onSelect,
  accentColor = "#c1fe00",
  error,
  required,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.label, { color: error ? accentColor : "#fff" }]}>
        {label} {required && <Text style={{ color: "#FF4D4F" }}>*</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.input, { borderColor: error ? "#FF4D4F" : "#232323" }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={[styles.valueText, { color: value ? "#fff" : "#888" }]}>
          {value
            ? capitalizeWords(value.replace(/_/g, " "))
            : `Select ${label}`}
        </Text>
        <ChevronDown color={accentColor} size={20} />
      </TouchableOpacity>
      {error && (
        <Text style={[styles.errorText, { color: accentColor }]}>{error}</Text>
      )}
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        />
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: accentColor }]}>
            {label}
          </Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  value === item && { backgroundColor: accentColor + "22" },
                ]}
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    value === item && {
                      color: accentColor,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {capitalizeWords(item.replace(/_/g, " "))}
                </Text>
                {value === item && <Check color={accentColor} size={18} />}
              </TouchableOpacity>
            )}
            style={{ maxHeight: 320 }}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#181818",
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: Platform.OS === "ios" ? 16 : 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  valueText: {
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#181818",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 18,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    color: "#fff",
  },
});

export default ModalPicker;
