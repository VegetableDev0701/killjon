import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import Geolocation from "@react-native-community/geolocation";
import { ArrowLeft, MapPin, Search } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  MapPressEvent,
  Marker,
  MarkerDragStartEndEvent,
  Region,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  GoogleMapsService,
  LocationCoordinates,
  PlaceAutocompleteResult,
} from "../services/googleMapsService";
import { customMapStyle } from "../utils/geocoding";
import { SkeletonItem } from "./animated/SkeletonLoader";

interface MapWithBottomSheetProps {
  children: React.ReactNode;
  onLocationChange?: (
    coords: { latitude: number; longitude: number },
    address: string
  ) => void;
  initialLocation?: { latitude: number; longitude: number };
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
  onBack?: () => void;
  headerTitle?: string;
  isEditing?: boolean;
}

// Using the types from GoogleMapsService
// interface LocationSearchResult is replaced by PlaceAutocompleteResult

const MapWithBottomSheet: React.FC<MapWithBottomSheetProps> = ({
  children,
  onLocationChange,
  initialLocation,
  headerComponent,
  footerComponent,
  onBack,
  isEditing = false,
}) => {
  const { top } = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const [markerAnim] = useState(new Animated.Value(1));

  // Map and location state
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialLocation || null);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceAutocompleteResult[]>(
    []
  );
  const [_isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Bottom sheet snap points - Airbnb style
  const snapPoints = useMemo(() => ["15%", "50%", "100%"], []);

  // Initialize location
  useEffect(() => {
    if (
      initialLocation &&
      initialLocation.latitude !== selectedLocation?.latitude &&
      initialLocation.longitude !== selectedLocation?.longitude
    ) {
      setSelectedLocation(initialLocation);
      setMapRegion({
        ...initialLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      reverseGeocode(initialLocation, false);
    }
  }, [initialLocation]);

  useEffect(() => {
    if (isEditing) return;
    getCurrentLocation();
  }, [isEditing]);

  const getCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true);

    if (Platform.OS === "ios" && Geolocation.requestAuthorization) {
      Geolocation.requestAuthorization();
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const region = {
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setSelectedLocation(coords);
        setMapRegion(region);
        reverseGeocode(coords);
        setIsLoadingLocation(false);
      },
      () => {
        // Fallback to default location (you can change this)
        const defaultCoords = {
          latitude: 18.4861,
          longitude: -69.9312, // Santo Domingo, DR
        };

        setSelectedLocation(defaultCoords);
        setMapRegion({
          ...defaultCoords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  const reverseGeocode = useCallback(
    async (coords: LocationCoordinates, shouldChangeAddress = true) => {
      try {
        const address = await GoogleMapsService.reverseGeocode(coords);
        setCurrentAddress(address);
        if (shouldChangeAddress) {
          onLocationChange?.(coords, address);
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        // Fallback behavior - could set a default message
        setCurrentAddress("Unable to get address for this location");
      }
    },
    [onLocationChange]
  );

  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await GoogleMapsService.searchPlaces(query, "geocode");
      setSearchResults(results);
    } catch (error) {
      console.error("Places search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectSearchResult = useCallback(
    async (result: PlaceAutocompleteResult) => {
      try {
        const { coordinates, address } =
          await GoogleMapsService.getPlaceDetailsWithAddress(result.place_id);

        setSelectedLocation(coordinates);
        setMapRegion({
          ...coordinates,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setCurrentAddress(address);
        setSearchQuery("");
        setSearchResults([]);
        setShowSearch(false);
        onLocationChange?.(coordinates, address);

        // Animate to location
        mapRef.current?.animateToRegion(
          {
            ...coordinates,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      } catch (error) {
        console.error("Place details error:", error);
      }
    },
    [onLocationChange]
  );

  const handleMapPress = useCallback(
    (event: MapPressEvent) => {
      const coords = event.nativeEvent.coordinate;
      setSelectedLocation(coords);
      reverseGeocode(coords);
      pulseMarker();
    },
    [reverseGeocode]
  );

  const handleMarkerDragEnd = useCallback(
    (event: MarkerDragStartEndEvent) => {
      const coords = event.nativeEvent.coordinate;
      setSelectedLocation(coords);
      reverseGeocode(coords);
      pulseMarker();
    },
    [reverseGeocode]
  );

  const pulseMarker = useCallback(() => {
    Animated.sequence([
      Animated.timing(markerAnim, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(markerAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [markerAnim]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={1}
        appearsOnIndex={1}
        opacity={0.3}
      />
    ),
    []
  );

  const handleSheetChanges = useCallback((_: number) => {}, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion || undefined}
        region={mapRegion || undefined}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        loadingEnabled={isLoadingLocation}
        loadingIndicatorColor="#c1fe00"
        customMapStyle={customMapStyle}
        userInterfaceStyle={"dark"}
      >
        {selectedLocation && (
          <Marker.Animated
            coordinate={selectedLocation}
            draggable
            onDragEnd={handleMarkerDragEnd}
          >
            <Animated.View
              style={[
                styles.markerContainer,
                { transform: [{ scale: markerAnim }] },
              ]}
            >
              <MapPin color="#c1fe00" size={24} />
            </Animated.View>
          </Marker.Animated>
        )}
      </MapView>

      {/* Header  */}
      {showSearch ? (
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { marginTop: top }]}>
            <Search color="#888" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchPlaces(text);
              }}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.place_id}
                  style={styles.searchResultItem}
                  onPress={() => selectSearchResult(result)}
                >
                  <MapPin color="#c1fe00" size={16} />
                  <Text style={styles.searchResultText}>
                    {result.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.header, { paddingTop: top }]}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.8}
            >
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          )}

          {headerComponent}

          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearch(!showSearch)}
            activeOpacity={0.8}
          >
            <Search color="#c1fe00" size={24} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1} // Start at 50%
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        handleStyle={styles.bottomSheetHandle}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        backgroundStyle={styles.bottomSheetBackground}
        keyboardBehavior="interactive"
      >
        <BottomSheetScrollView
          automaticallyAdjustKeyboardInsets
          style={styles.bottomSheetContent}
        >
          {/* Location info header */}
          <View style={styles.locationHeader}>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationTitle}>Selected Location</Text>
              {currentAddress ? (
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {currentAddress}
                </Text>
              ) : (
                <>
                  <SkeletonItem width="100%" height={20} className="my-2" />
                  <SkeletonItem width="20%" height={20} />
                </>
              )}
            </View>
            <Pressable
              onPress={getCurrentLocation}
              style={styles.currentLocationButton}
            >
              <View style={styles.locationIconContainer}>
                <MapPin color="#c1fe00" size={30} />
              </View>
              <Text style={styles.locationTitle}>Current</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          {children}
        </BottomSheetScrollView>
        {footerComponent}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    shadowColor: "#c1fe00",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: "#000",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#c1fe00",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(10, 10, 10, 0.9)",
    zIndex: 100,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    backgroundColor: "rgba(35, 35, 35, 0.8)",
    borderRadius: 20,
  },
  searchButton: {
    padding: 8,
    backgroundColor: "rgba(35, 35, 35, 0.8)",
    borderRadius: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    zIndex: 100,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#232323",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
  },
  cancelText: {
    color: "#c1fe00",
    fontSize: 16,
    fontWeight: "600",
  },
  searchResults: {
    marginTop: 12,
    backgroundColor: "#181818",
    borderRadius: 12,
    overflow: "hidden",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#232323",
    gap: 12,
  },
  searchResultText: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
  },
  bottomSheetHandle: {
    backgroundColor: "#181818",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetIndicator: {
    backgroundColor: "#c1fe00",
    width: 40,
    height: 4,
  },
  bottomSheetBackground: {
    backgroundColor: "#181818",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    gap: 12,
  },
  locationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 27,
    backgroundColor: "rgba(193, 254, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationButton: {
    alignItems: "center",
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#c1fe00",
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#232323",
  },
  scrollContent: {
    flex: 1,
    paddingBottom: 100, // Extra space for bottom sheet expansion
  },
});

export default MapWithBottomSheet;
