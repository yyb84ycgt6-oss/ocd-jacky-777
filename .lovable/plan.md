

# Fix Build Error + Complete Wishlist Feature

## Problem
The `PackCard` component was updated to require `isWishlisted` and `onToggleWishlist` props, but the parent component never added wishlist state or passes those props.

## Plan

### 1. Add wishlist state to `JadeStorePage` (line ~575)
- Add `useState<Set<string>>` for wishlist IDs, initialized from `localStorage` key `jade_wishlist`
- Add `toggleWishlist` function that adds/removes pack IDs and persists to `localStorage`

### 2. Add wishlist quick filter option
- Extend `QuickFilter` type to include `'wishlist'`
- Add wishlist filter button to the quick filter bar

### 3. Pass missing props to `PackCard` (lines 745-752)
- Add `isWishlisted={wishlist.has(pack.id)}` 
- Add `onToggleWishlist={toggleWishlist}`

This fixes the build error and completes the wishlist feature that was partially implemented before the cancellation.

