import React, { useCallback } from "react";
import { ChatMessage as ChatMessageType } from "../../store/chatStore";
import ResultCard from "./ResultCard";
import SeeMoreButton from "./SeeMoreButton";

import { useQuery } from "@apollo/client/react";
import {
  LegendList,
  LegendListProps,
  LegendListRenderItemProps,
} from "@legendapp/list";
import { StyleSheet, View } from "react-native";
import {
  GET_ITEMS_BY_CATEGORY_AND_HIDS,
  GET_ITEMS_BY_LISTING_IDS,
} from "../../graphql";
import { Product } from "../../types/api.types";
import { getQueryCategory, screenWidth } from "../../utils/constants";
import { CardSkeleton } from "./CardSkeleton";
import DynamicListingCard from "./DynamicListingCard";

const HORIZONTAL_CARD_PADDING = 55;

type DatabaseSearchContentProps = LegendListProps<Product> & {
  content: ChatMessageType["content"];
  onSeeMore?: () => void;
};

const DatabaseSearchContent: React.FC<DatabaseSearchContentProps> = ({
  content,
  onSeeMore,
  ...props
}) => {
  const shouldShowSeeMoreButton = () => {
    return (
      content.type === "database_search" &&
      content.products &&
      content.products.length > 0 &&
      content.searchId
    );
  };

  // Separate products by type
  const listingProducts =
    content.products?.filter((p) => p.type === 1).map((p) => p.id) || [];
  const scrapedProducts =
    content.products?.filter((p) => p.type === 2).map((p) => p.id) || [];

  // Add debug log
  const { data: scrapedData, loading: scrapedLoading } = useQuery(
    GET_ITEMS_BY_CATEGORY_AND_HIDS,
    {
      variables: {
        category: getQueryCategory(content.category || "vehicles"),
        hids: scrapedProducts,
      },
      fetchPolicy: "no-cache",
      notifyOnNetworkStatusChange: false,
      skip: !scrapedProducts || scrapedProducts.length === 0,
    }
  );

  const { data: listingData, loading: listingLoading } = useQuery(
    GET_ITEMS_BY_LISTING_IDS,
    {
      variables: { listingIds: listingProducts },
      fetchPolicy: "no-cache",
      notifyOnNetworkStatusChange: false,
      skip: !listingProducts || listingProducts.length === 0,
    }
  );

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<Product>) => {
      if (item.type === 1) {
        const data = listingData?.getListingsByIds?.items?.find(
          (listing: any) => listing.id === item.id
        );
        if (listingLoading || !data) return <CardSkeleton variant="listing" />;
        return <DynamicListingCard item={data || {}} shouldLogAnalytic style={{ width: screenWidth - HORIZONTAL_CARD_PADDING }} />;
      } else {
        const data = scrapedData?.getItemsByCategoryAndHids?.find(
          (scrapped: any) => scrapped.hid === item.id
        );
        if (scrapedLoading || !data) return <CardSkeleton variant="result" />;
        return (
          <ResultCard
            item={data || {}}
            shouldLogAnalytic
            categoryy={getQueryCategory(content.category || "vehicles")}
            style={{ width: screenWidth - HORIZONTAL_CARD_PADDING }}
          />
        );
      }
    },
    [listingData, scrapedData, scrapedLoading, content.category, listingLoading]
  );

  return (
    <View style={styles.container}>
      <LegendList<Product>
        recycleItems
        horizontal
        showsHorizontalScrollIndicator={false}
        extraData={[
          listingData,
          scrapedData,
          scrapedLoading,
          content.products,
          content.category,
        ]}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id}
        estimatedItemSize={400}
        {...props}
      />
      {onSeeMore && shouldShowSeeMoreButton() && (
        <SeeMoreButton onPress={onSeeMore} />
      )}
    </View>
  );
};

export default DatabaseSearchContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
