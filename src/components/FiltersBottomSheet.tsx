import { Check, Filter, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Slider } from "./ui";

// Price slider constants
const ABSOLUTE_PRICE_MIN = 0;
const ABSOLUTE_PRICE_MAX = 1000000;

// Year slider constants
const ABSOLUTE_YEAR_MIN = 1970;
const ABSOLUTE_YEAR_MAX = new Date().getFullYear();

interface FiltersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  options: any;
  activeFilters: any;
  setActiveFilters: (filters: any) => void;
  category: string;
  loadedItems: Record<string, any>;
}
const getPriceRange = (loadedItems: Record<string, any>): [number, number] => {
  const prices = Object.values(loadedItems)
    .map((item) =>
      typeof item.price === "string"
        ? parseFloat(item.price.replace(/[^\d.]/g, ""))
        : item.price
    )
    .filter((price) => typeof price === "number" && !isNaN(price));
  if (!prices.length) return [ABSOLUTE_PRICE_MIN, ABSOLUTE_PRICE_MAX];
  return [Math.min(...prices), Math.max(...prices)];
};

const getYearRange = (year: number[]): [number, number] => {
  if (!year || year.length === 0) return [ABSOLUTE_YEAR_MIN, ABSOLUTE_YEAR_MAX];
  return [Math.min(...year), Math.max(...year)];
};
const FiltersBottomSheet: React.FC<FiltersBottomSheetProps> = ({
  visible,
  onClose,
  options,
  activeFilters,
  setActiveFilters,
  category,
  loadedItems,
}) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState<any>({});
  const [yearRange, setYearRange] = useState<[number, number]>([
    ABSOLUTE_YEAR_MIN,
    ABSOLUTE_YEAR_MAX,
  ]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    ABSOLUTE_PRICE_MIN,
    ABSOLUTE_PRICE_MAX,
  ]);

  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);

  const handleApply = () => {
    setActiveFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    ("[FiltersBottomSheet] Resetting filters");
    setLocalFilters({});
    setActiveFilters({});
    setYearRange(getYearRange(options?.year));
    setPriceRange(getPriceRange(loadedItems));
  };

  const toggleFilter = (key: string, value: string) => {
    setLocalFilters((prev: any) => {
      const current = prev[key] || [];
      const newValue = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];

      const updated = {
        ...prev,
        [key]: newValue.length > 0 ? newValue : undefined,
      };

      Object.keys(updated).forEach((k) => {
        if (updated[k] === undefined) {
          delete updated[k];
        }
      });

      return updated;
    });
  };

  const getProductCounts = (key: string, values: string[]) => {
    const itemsArr = Object.values(loadedItems);
    const counts: Record<string, number> = {};

    values.forEach((value) => {
      const count = itemsArr.filter((item) => item[key] === value).length;
      counts[value] = count;
    });

    return counts;
  };

  const renderFilterSection = (
    title: string,
    key: string,
    values: string[],
    index: number
  ) => {
    if (!values || values.length === 0) return null;

    const productCounts = getProductCounts(key, values);

    return (
      <View style={styles.filterSection} key={`${title}-${index}`}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.optionsContainer}>
          {values.map((value, index) => {
            const isSelected = localFilters[key]?.includes(value);
            return (
              <TouchableOpacity
                key={`${value}-${index}-${title}`}
                style={[
                  styles.optionChip,
                  isSelected && styles.optionChipSelected,
                ]}
                onPress={() => toggleFilter(key, value)}
              >
                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {value} ({productCounts[value]})
                  </Text>
                </View>
                {isSelected && <Check size={16} color="#c1fe00" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const getFilterSections = () => {
    const sections = [];
    if (category === "vehicles") {
      if (options.brand)
        sections.push({ title: "Brand", key: "brand", values: options.brand });
      if (options.year)
        sections.push({ title: "Year", key: "year", values: options.year });
      if (options.fuel_type)
        sections.push({
          title: "Fuel Type",
          key: "fuel_type",
          values: options.fuel_type,
        });
      if (options.transmission)
        sections.push({
          title: "Transmission",
          key: "transmission",
          values: options.transmission,
        });
      if (options.city)
        sections.push({ title: "City", key: "city", values: options.city });
      if (options.province)
        sections.push({
          title: "Province",
          key: "province",
          values: options.province,
        });
    } else if (category === "products") {
      if (options.brand)
        sections.push({ title: "Brand", key: "brand", values: options.brand });
      if (options.category)
        sections.push({
          title: "Category",
          key: "category",
          values: options.category,
        });
      if (options.availability)
        sections.push({
          title: "Availability",
          key: "availability",
          values: options.availability,
        });
      if (options.location)
        sections.push({
          title: "Location",
          key: "location",
          values: options.location,
        });
    } else if (category === "real_estate") {
      if (options.listing_type)
        sections.push({
          title: "Listing Type",
          key: "listing_type",
          values: options.listing_type,
        });
      if (options.bedrooms)
        sections.push({
          title: "Bedrooms",
          key: "bedrooms",
          values: options.bedrooms,
        });
      if (options.bathrooms)
        sections.push({
          title: "Bathrooms",
          key: "bathrooms",
          values: options.bathrooms,
        });
      if (options.location)
        sections.push({
          title: "Location",
          key: "location",
          values: options.location,
        });
    }
    return sections;
  };

  const activeFiltersCount = Object.values(localFilters).filter(Boolean).length;
  const totalItems = Object.keys(loadedItems).length;

  const handleYearChange = (value: [number, number]) => {
    setYearRange(value);
    setLocalFilters((prev: any) => ({ ...prev, year: value }));
  };

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
    setLocalFilters((prev: any) => ({ ...prev, price: value }));
  };

  useEffect(() => {
    if (localFilters.year) {
      setYearRange(localFilters.year);
    } else {
      setYearRange(getYearRange(options?.year));
    }
    if (localFilters.price) {
      setPriceRange(localFilters.price);
    } else {
      setPriceRange(getPriceRange(loadedItems));
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.bottomSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Filter size={24} color="#c1fe00" />
              <Text style={styles.headerTitle}>{t("filters.title")}</Text>
              {activeFiltersCount > 0 && (
                <View style={styles.filterCount}>
                  <Text style={styles.filterCountText}>
                    {activeFiltersCount}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#c1fe00" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.totalItemsText}>
              {t("filters.itemsAvailable", { count: totalItems })}
            </Text>
            {/* Show price slider for products/vehicles/real_estate if price is relevant */}
            {(category === "products" ||
              category === "vehicles" ||
              category === "real_estate") && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>
                  {t("filters.priceRange")}
                </Text>
                <Slider
                  value={priceRange}
                  step={10000}
                  minValue={ABSOLUTE_PRICE_MIN}
                  maxValue={Math.max(ABSOLUTE_PRICE_MAX, priceRange[1])}
                  onValueChange={handlePriceChange}
                  formatLabel={(value) => `$${value.toLocaleString("en-US")}`}
                  showLabels
                  showValueLabel
                />
              </View>
            )}
            {/* Show year slider for vehicles only */}
            {category === "vehicles" && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>
                  {t("filters.yearRange")}
                </Text>
                <Slider
                  value={yearRange}
                  minValue={ABSOLUTE_YEAR_MIN}
                  maxValue={ABSOLUTE_YEAR_MAX}
                  onValueChange={handleYearChange}
                  showLabels
                  showValueLabel
                />
              </View>
            )}
            {getFilterSections().map((section, index) =>
              section.key === "price" || section.key === "year"
                ? null
                : renderFilterSection(
                    section.title,
                    section.key,
                    section.values,
                    index
                  )
            )}
            {getFilterSections().length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {t("filters.noFiltersAvailable")}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {t("filters.loadMoreItems")}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>{t("filters.reset")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>
                {t("filters.applyFilters")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#0a0a0a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(193,254,0,0.2)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  filterCount: {
    backgroundColor: "#c1fe00",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  filterCountText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  totalItemsText: {
    color: "#888",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(193,254,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(193,254,0,0.3)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  optionChipSelected: {
    backgroundColor: "rgba(193,254,0,0.2)",
    borderColor: "#c1fe00",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  optionText: {
    color: "#c1fe00",
    fontSize: 14,
    fontWeight: "500",
  },
  optionTextSelected: {
    fontWeight: "600",
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  countText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "#888",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(193,254,0,0.2)",
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#c1fe00",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#c1fe00",
    fontSize: 16,
    fontWeight: "600",
  },
  applyButton: {
    flex: 2,
    backgroundColor: "#c1fe00",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  filterChip: {
    maxWidth: "90%",
    flexWrap: "wrap",
    alignSelf: "flex-start",
    marginBottom: 10,
    marginRight: 10,
    borderRadius: 22,
    backgroundColor: "rgba(193,254,0,0.10)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: "#c1fe00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  filterChipSelected: {
    backgroundColor: "#c1fe00",
    shadowOpacity: 0.18,
  },
  filterChipText: {
    fontSize: 16,
    color: "#c1fe00",
    fontWeight: "600",
    flexShrink: 1,
  },
  filterChipTextSelected: {
    color: "#181818",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(193,254,0,0.10)",
    marginVertical: 18,
    marginHorizontal: 8,
  },
});

export default FiltersBottomSheet;
