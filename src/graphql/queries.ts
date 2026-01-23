import { gql } from "@apollo/client";

// Fragment for Product fields
export const PRODUCT_FRAGMENT = gql`
  fragment ProductFields on Product {
    hid
    title
    brand
    price
    price_currency
    category
    availability
    images_url
    detail_url
    location
    coordinates
    source
    created_at
    updated_at
  }
`;

// Fragment for Vehicle fields
export const VEHICLE_FRAGMENT = gql`
  fragment VehicleFields on Vehicle {
    hid
    brand
    model
    year
    price
    price_currency
    engine
    condition
    mileage_value
    mileage_unit
    exterior_color
    interior_color
    passengers
    fuel_type
    transmission
    traction
    location
    city
    province
    coordinates
    images_url
    detail_url
    accessories
    source
    created_at
    updated_at
  }
`;

// Fragment for RealEstate fields
export const REAL_ESTATE_FRAGMENT = gql`
  fragment RealEstateFields on RealEstate {
    hid
    title
    price
    listing_type
    bedrooms
    bathrooms
    area
    location
    coordinates
    description
    images_url
    detail_url
    source
    updated_at
  }
`;

// Fragment for Listing fields
export const LISTING_FRAGMENT = gql`
  fragment ListingFields on Listing {
    id
    user_id
    category
    title
    description
    price
    phone_number
    location
    media
    basic_attributes
    is_verified
    attributes
    status
    boost
    boost_expire
    created_at
    updated_at
  }
`;

// Fragment for minimal Product fields (used in CustomDrawer)
export const MINIMAL_PRODUCT_FRAGMENT = gql`
  fragment MinimalProductFields on Product {
    title
  }
`;

// Fragment for minimal Vehicle fields (used in CustomDrawer)
export const MINIMAL_VEHICLE_FRAGMENT = gql`
  fragment MinimalVehicleFields on Vehicle {
    hid
    brand
  }
`;

// Fragment for minimal RealEstate fields (used in CustomDrawer)
export const MINIMAL_REAL_ESTATE_FRAGMENT = gql`
  fragment MinimalRealEstateFields on RealEstate {
    hid
    title
  }
`;

// Main query for getting items by category and HIDs
export const GET_ITEMS_BY_CATEGORY_AND_HIDS = gql`
  query GetItemsByCategoryAndHids($category: String!, $hids: [String!]!) {
    getItemsByCategoryAndHids(category: $category, hids: $hids) {
      ... on Product {
        ...ProductFields
      }
      ... on Vehicle {
        ...VehicleFields
      }
      ... on RealEstate {
        ...RealEstateFields
      }
    }
  }
  ${PRODUCT_FRAGMENT}
  ${VEHICLE_FRAGMENT}
  ${REAL_ESTATE_FRAGMENT}
`;

// Minimal version for CustomDrawer
export const GET_MINIMAL_ITEMS_BY_CATEGORY_AND_HIDS = gql`
  query GetMinimalItemsByCategoryAndHids(
    $category: String!
    $hids: [String!]!
  ) {
    getItemsByCategoryAndHids(category: $category, hids: $hids) {
      ... on Product {
        ...MinimalProductFields
      }
      ... on Vehicle {
        ...MinimalVehicleFields
      }
      ... on RealEstate {
        ...MinimalRealEstateFields
      }
    }
  }
  ${MINIMAL_PRODUCT_FRAGMENT}
  ${MINIMAL_VEHICLE_FRAGMENT}
  ${MINIMAL_REAL_ESTATE_FRAGMENT}
`;

// Query for getting listings by IDs
export const GET_ITEMS_BY_LISTING_IDS = gql`
  query GetListingsByIds($listingIds: [String!]!) {
    getListingsByIds(listingIds: $listingIds) {
      items {
        ...ListingFields
      }
    }
  }
  ${LISTING_FRAGMENT}
`;

// Export all fragments for potential direct use
export const FRAGMENTS = {
  PRODUCT_FRAGMENT,
  VEHICLE_FRAGMENT,
  REAL_ESTATE_FRAGMENT,
  LISTING_FRAGMENT,
  MINIMAL_PRODUCT_FRAGMENT,
  MINIMAL_VEHICLE_FRAGMENT,
  MINIMAL_REAL_ESTATE_FRAGMENT,
};

// Export all queries for easy importing
export const QUERIES = {
  GET_ITEMS_BY_CATEGORY_AND_HIDS,
  GET_MINIMAL_ITEMS_BY_CATEGORY_AND_HIDS,
  GET_ITEMS_BY_LISTING_IDS,
};
