'use client';

/**
 * Hook for filtering navigation items based on user role.
 *
 * Role hierarchy: admin (2) > manager (1) > sales (0).
 * Items with `access.role` are only shown to users at or above that level.
 * Items without `access` are visible to everyone.
 */

import { useMemo } from 'react';
import type { NavItem, NavGroup } from '@/types';

const ROLE_LEVEL: Record<string, number> = {
  sales: 0,
  manager: 1,
  admin: 2
};

/**
 * Hook to filter navigation items by user role.
 *
 * @param items - Array of navigation items to filter
 * @param role - Current user's role (sales / manager / admin)
 * @returns Filtered items — items requiring a higher role are removed
 */
export function useFilteredNavItems(items: NavItem[], role?: string) {
  const userLevel = role ? (ROLE_LEVEL[role] ?? 0) : 0;

  return useMemo(() => {
    return items
      .filter((item) => {
        const requiredRole = item.access?.role;
        if (!requiredRole) return true;
        const requiredLevel = ROLE_LEVEL[requiredRole] ?? 0;
        return userLevel >= requiredLevel;
      })
      .map((item) => {
        if (item.items && item.items.length > 0) {
          return { ...item, items: item.items };
        }
        return item;
      });
  }, [items, userLevel]);
}

/**
 * Hook to filter navigation groups by user role.
 *
 * @param groups - Array of navigation groups
 * @param role - Current user's role (sales / manager / admin)
 * @returns Filtered groups — empty groups are removed
 */
export function useFilteredNavGroups(groups: NavGroup[], role?: string) {
  const filteredItems = useFilteredNavItems(groups.flatMap((g) => g.items), role);

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
