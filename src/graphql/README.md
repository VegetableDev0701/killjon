# GraphQL Queries

This directory contains all GraphQL queries and fragments used throughout the application.

## Structure

### Files

- `queries.ts` - Contains all GraphQL queries and fragments
- `index.ts` - Re-exports for easier importing

### Fragments

#### Product Fragments

- `PRODUCT_FRAGMENT` - Complete product fields
- `MINIMAL_PRODUCT_FRAGMENT` - Minimal product fields (title only)

#### Vehicle Fragments

- `VEHICLE_FRAGMENT` - Complete vehicle fields
- `MINIMAL_VEHICLE_FRAGMENT` - Minimal vehicle fields (hid, brand)

#### Real Estate Fragments

- `REAL_ESTATE_FRAGMENT` - Complete real estate fields
- `MINIMAL_REAL_ESTATE_FRAGMENT` - Minimal real estate fields (hid, title)

#### Listing Fragments

- `LISTING_FRAGMENT` - Complete listing fields

### Queries

#### Main Queries

- `GET_ITEMS_BY_CATEGORY_AND_HIDS` - Fetch items by category and HIDs (full fields)
- `GET_MINIMAL_ITEMS_BY_CATEGORY_AND_HIDS` - Fetch items by category and HIDs (minimal fields)
- `GET_ITEMS_BY_LISTING_IDS` - Fetch listings by IDs

## Usage

### Importing Queries

```typescript
// Import specific queries
import {
  GET_ITEMS_BY_CATEGORY_AND_HIDS,
  GET_ITEMS_BY_LISTING_IDS,
} from "../graphql";

// Import all queries
import { QUERIES } from "../graphql";

// Import fragments
import { PRODUCT_FRAGMENT, VEHICLE_FRAGMENT } from "../graphql";
```

### Using with Apollo Client

```typescript
import { useQuery } from "@apollo/client/react";
import { GET_ITEMS_BY_CATEGORY_AND_HIDS } from "../graphql";

const { data, loading, error } = useQuery(GET_ITEMS_BY_CATEGORY_AND_HIDS, {
  variables: { category: "vehicles", hids: ["hid1", "hid2"] },
  fetchPolicy: "cache-and-network",
});
```

### Using with Apollo Client (manual query)

```typescript
import { useApolloClient } from "@apollo/client";
import { GET_MINIMAL_ITEMS_BY_CATEGORY_AND_HIDS } from "../graphql";

const client = useApolloClient();

const { data } = await client.query({
  query: GET_MINIMAL_ITEMS_BY_CATEGORY_AND_HIDS,
  variables: { category: "vehicles", hids: ["hid1", "hid2"] },
  fetchPolicy: "cache-first",
});
```

## Benefits

1. **Centralized Management** - All queries in one place
2. **Reusability** - Fragments can be shared across queries
3. **Type Safety** - Better TypeScript support
4. **Performance** - Fragments reduce query size
5. **Maintainability** - Easy to update and modify queries
6. **Consistency** - Ensures all components use the same query structure

## Best Practices

1. **Use Fragments** - Always use fragments for reusable field sets
2. **Minimal Queries** - Use minimal queries when full data isn't needed
3. **Cache Policies** - Choose appropriate fetch policies for your use case
4. **Error Handling** - Always handle query errors gracefully
5. **Loading States** - Provide loading indicators for better UX

## Migration Notes

All GraphQL queries have been migrated from individual components to this centralized location. The old inline `gql` queries have been removed and replaced with imports from this directory.
