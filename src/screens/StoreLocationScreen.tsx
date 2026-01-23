import Geolocation from "@react-native-community/geolocation";
import { Check, MapPin } from "lucide-react-native";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { toast } from "sonner-native";
import { NavigationProps } from "../navigation/navigationTypes";
import { MerchantService } from "../services/merchantService";
import { customMapStyle } from "../utils/geocoding";

const StoreLocationScreen = ({
  navigation,
}: NavigationProps<"StoreLocation">) => {
  const { t } = useTranslation();
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region>({
    latitude: 18.4861,
    longitude: -69.9312,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const mapRef = useRef<MapView>(null);

  // Get user's current location on mount
  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const region: Region = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setCurrentRegion(region);

        // Animate to user's location
        if (mapRef.current) {
          mapRef.current.animateToRegion(region, 1000);
        }
      },
      (error) => {
        console.log("Error getting location:", error);
        toast.error(t("chat.failedToGetCurrentLocation"));
      },
      {
        enableHighAccuracy: Platform.OS === "ios",
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: "#0a0a0a" },
      title: t("chat.setStoreLocation"),
      headerBackButtonDisplayMode: "minimal",
      headerTitleStyle: {
        color: "#ffffff",
      },
      headerTitleAlign: "center",
      headerTintColor: "#ffffff",
    });
  }, [navigation, t]);

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setSelectedLocation({
      latitude,
      longitude,
    });
    console.log("selectedLocation", selectedLocation);
    toast.success(t("chat.storeLocationSelected"));
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      toast.error(t("chat.pleaseSelectLocation"));
      return;
    }

    setLoading(true);
    try {
      // Save location to backend
      await MerchantService.updateStoreLocation({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
      console.log("MerchantService: Store location updated successfully");
      toast.success(t("chat.storeLocationSaved"));
      navigation.goBack();
    } catch (error: any) {
      console.error("Error saving store location:", error);
      toast.error(
        error.response?.data?.message || t("chat.failedToSaveLocation")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
    toast.info(t("chat.locationCleared"));
  };

  return (
    <View style={styles.container}>
      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {t("chat.storeLocationDescription")}
        </Text>
        <Text style={styles.instructionsSubtext}>
          {t("chat.tapOnMapToSelect")}
        </Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={currentRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
          loadingIndicatorColor="#c1fe00"
          customMapStyle={customMapStyle}
          userInterfaceStyle={"dark"}
        >
          {selectedLocation !== null ? (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title={t("chat.storeLocation")}
              description={`${selectedLocation.latitude?.toFixed(6)}, ${selectedLocation.longitude?.toFixed(6)}`}
            >
              <View style={styles.customMarker}>
                <MapPin color="#c1fe00" size={24} />
              </View>
            </Marker>
          ) : null}
        </MapView>
      </View>

      {/* Selected Location Info */}
      {selectedLocation !== null ? (
        <View style={styles.locationInfo}>
          <View style={styles.locationHeader}>
            <MapPin color="#c1fe00" size={20} />
            <Text style={styles.locationTitle}>
              {t("chat.selectedLocation")}
            </Text>
          </View>
          <Text style={styles.locationText}>
            {selectedLocation.latitude.toFixed(6)},{" "}
            {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {selectedLocation !== null ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearLocation}
            disabled={loading}
          >
            <Text style={styles.clearButtonText}>{t("common.clear")}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[
            styles.saveButton,
            !selectedLocation && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveLocation}
          disabled={!selectedLocation || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Check color="#000" size={20} />
              <Text style={styles.saveButtonText}>{t("common.save")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  instructionsText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
  },
  instructionsSubtext: {
    fontSize: 14,
    color: "#888",
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: "#000",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#c1fe00",
  },
  locationInfo: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#c1fe00",
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: "#888",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#333",
    borderRadius: 12,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "#c1fe00",
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#666",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
});

export default StoreLocationScreen;
