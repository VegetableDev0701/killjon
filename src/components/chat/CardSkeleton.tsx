import React from "react";
import { StyleSheet, View } from "react-native";
import { screenWidth } from "../../utils/constants";
import { SkeletonItem } from "../animated/SkeletonLoader";

const CARD_WIDTH = screenWidth - 20;
const IMAGE_HEIGHT = 175;

/**
 * Skeleton loader for DynamicListingCard
 * Matches the structure and layout of the actual listing card
 */
export const DynamicListingCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Image Skeleton */}
      <View style={styles.imageContainer}>
        <SkeletonItem
          width={CARD_WIDTH}
          height={IMAGE_HEIGHT}
          borderRadius={20}
          className="bg-gray-800/50"
        />

        {/* Action buttons overlay skeleton */}
        <View style={styles.actionButtonsOverlay}>
          <SkeletonItem
            width={80}
            height={24}
            borderRadius={12}
            className="bg-gray-800/50"
          />
          <View style={styles.actionButtonsRight}>
            <SkeletonItem
              width={36}
              height={36}
              borderRadius={18}
              className="bg-gray-800/50"
            />
            <SkeletonItem
              width={36}
              height={36}
              borderRadius={18}
              className="bg-gray-800/50"
            />
          </View>
        </View>

        {/* Dots indicator skeleton */}
        <View style={styles.dotsContainer}>
          <SkeletonItem
            width={8}
            height={8}
            borderRadius={4}
            className="mx-1 bg-gray-700/50"
          />
          <SkeletonItem
            width={8}
            height={8}
            borderRadius={4}
            className="mx-1 bg-gray-700/50"
          />
          <SkeletonItem
            width={8}
            height={8}
            borderRadius={4}
            className="mx-1 bg-gray-700/50"
          />
        </View>
      </View>

      {/* Card Content Skeleton */}
      <View style={styles.cardContent}>
        {/* Header Row - Category and Price */}
        <View style={styles.headerRow}>
          <View style={styles.categoryRow}>
            <SkeletonItem
              width={18}
              height={18}
              borderRadius={9}
              className="mr-2 bg-gray-800/50"
            />
            <SkeletonItem
              width={80}
              height={16}
              borderRadius={4}
              className="bg-gray-800/50"
            />
          </View>
          <SkeletonItem
            width={90}
            height={28}
            borderRadius={14}
            className="bg-gray-800/50"
          />
        </View>

        {/* Title */}
        <SkeletonItem
          width="90%"
          height={20}
          borderRadius={6}
          className="mb-2 bg-gray-800/50"
        />
        <SkeletonItem
          width="70%"
          height={20}
          borderRadius={6}
          className="mb-3 bg-gray-800/50"
        />

        {/* Location */}
        <View style={styles.locationRow}>
          <SkeletonItem
            width={12}
            height={12}
            borderRadius={6}
            className="mr-2 bg-gray-800/50"
          />
          <SkeletonItem
            width={150}
            height={14}
            borderRadius={4}
            className="bg-gray-800/50"
          />
        </View>

        {/* Description */}
        <SkeletonItem
          width="100%"
          height={16}
          borderRadius={4}
          className="mb-1 bg-gray-800/50"
        />
        <SkeletonItem
          width="85%"
          height={16}
          borderRadius={4}
          className="mb-3 bg-gray-800/50"
        />

        {/* Attribute Tags */}
        <View style={styles.attributeRow}>
          <SkeletonItem
            width={100}
            height={28}
            borderRadius={8}
            className="bg-gray-800/50"
          />
          <SkeletonItem
            width={90}
            height={28}
            borderRadius={8}
            className="bg-gray-800/50"
          />
          <SkeletonItem
            width={80}
            height={28}
            borderRadius={8}
            className="bg-gray-800/50"
          />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton loader for ResultCard
 * Matches the structure and layout of the result/scraped card
 */
export const ResultCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Image Skeleton */}
      <View style={styles.imageContainer}>
        <SkeletonItem
          width={CARD_WIDTH}
          height={IMAGE_HEIGHT}
          borderRadius={24}
          className="bg-gray-800/50"
        />

        {/* Floating action buttons */}
        <View style={styles.floatingButtons}>
          <SkeletonItem
            width={36}
            height={36}
            borderRadius={18}
            className="bg-gray-800/50"
          />
          <SkeletonItem
            width={36}
            height={36}
            borderRadius={18}
            className="bg-gray-800/50"
          />
        </View>

        {/* Dots indicator skeleton */}
        <View style={styles.dotsContainer}>
          <SkeletonItem
            width={8}
            height={8}
            borderRadius={4}
            className="mx-1 bg-gray-700/50"
          />
          <SkeletonItem
            width={8}
            height={8}
            borderRadius={4}
            className="mx-1 bg-gray-700/50"
          />
        </View>
      </View>

      {/* Card Content Skeleton */}
      <View style={styles.cardContent}>
        {/* Header Row - Category and Price */}
        <View style={styles.headerRow}>
          <View style={styles.categoryRow}>
            <SkeletonItem
              width={18}
              height={18}
              borderRadius={9}
              className="mr-2 bg-gray-800/50"
            />
            <SkeletonItem
              width={90}
              height={14}
              borderRadius={4}
              className="bg-gray-800/50"
            />
          </View>
          <SkeletonItem
            width={85}
            height={30}
            borderRadius={15}
            className="bg-gray-800/50"
          />
        </View>

        {/* Title */}
        <SkeletonItem
          width="95%"
          height={22}
          borderRadius={6}
          className="mb-3 bg-gray-800/50"
        />

        {/* Location */}
        <View style={styles.locationRow}>
          <SkeletonItem
            width={14}
            height={14}
            borderRadius={7}
            className="mr-2 bg-gray-800/50"
          />
          <SkeletonItem
            width={140}
            height={14}
            borderRadius={4}
            className="bg-gray-800/50"
          />
        </View>

        {/* Spec Tags */}
        <View style={styles.specRow}>
          <SkeletonItem
            width={85}
            height={32}
            borderRadius={12}
            className="bg-gray-800/50"
          />
          <SkeletonItem
            width={95}
            height={32}
            borderRadius={12}
            className="bg-gray-800/50"
          />
          <SkeletonItem
            width={75}
            height={32}
            borderRadius={12}
            className="bg-gray-800/50"
          />
        </View>
      </View>
    </View>
  );
};

/**
 * Generic card skeleton that can be used as a fallback
 */
export const CardSkeleton: React.FC<{ variant?: "listing" | "result" }> = ({
  variant = "listing",
}) => {
  return variant === "result" ? (
    <ResultCardSkeleton />
  ) : (
    <DynamicListingCardSkeleton />
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(20,20,20,0.98)",
    borderRadius: 20,
    marginVertical: 8,
    marginHorizontal: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(193,254,0,0.2)",
  },
  imageContainer: {
    width: "100%",
    height: IMAGE_HEIGHT,
    position: "relative",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  actionButtonsOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  actionButtonsRight: {
    flexDirection: "row",
    gap: 8,
  },
  floatingButtons: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  attributeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },
});
