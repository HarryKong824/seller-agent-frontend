'use client';

/**
 * Hook for filtering navigation items based on user permissions
 *
 * Currently passes through all items. Permission-based filtering
 * will be implemented when RBAC is integrated with the custom auth system.
 */

import { useMemo } from 'react';
import type { NavItem, NavGroup } from '@/types';

/**
 * Hook to filter navigation items
 *
 * @param items - Array of navigation items to filter
 * @returns Filtered items (currently all items pass through)
 */
export function useFilteredNavItems(items: NavItem[]) {
  return useMemo(() => {
    return items.map((item) => {
      if (item.items && item.items.length > 0) {
        return { ...item, items: item.items };
      }
      return item;
    });
  }, [items]);
}

/**
 * Hook to filter navigation groups
 *
 * @param groups - Array of navigation groups to filter
 * @returns Filtered groups (empty groups are removed)
 */
export function useFilteredNavGroups(groups: NavGroup[]) {
  const filteredItems = useFilteredNavItems(groups.flatMap((g) => g.items));

  return useMemo(() => {
    const filteredSet = new Set(filteredItems.map((item) => item.title));
    return groups
      .map((group) => ({
        ...group,
        items: filteredItems.filter((item) =>
          group.items.some((gi) => gi.title === item.title && filteredSet.has(gi.title))
        )
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, filteredItems]);
}
