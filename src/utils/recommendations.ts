import { MenuItem } from '@/types';

// Get popular items based on order history
export const getPopularItems = (allItems: MenuItem[]): MenuItem[] => {
    // For now, return items with highest ratings
    // In production, this would use actual order data
    return allItems
        .filter(item => item.isAvailable !== false)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);
};

// Get frequently bought together items
export const getFrequentlyBoughtTogether = (
    currentItem: MenuItem,
    allItems: MenuItem[],
    orderHistory: any[] = []
): MenuItem[] => {
    // Simple algorithm: items from same category
    // In production, analyze actual order patterns
    return allItems
        .filter(item =>
            item.id !== currentItem.id &&
            item.category === currentItem.category &&
            item.isAvailable !== false
        )
        .slice(0, 3);
};

// Get personalized recommendations based on order history
export const getPersonalizedRecommendations = (
    orderHistory: any[],
    allItems: MenuItem[]
): MenuItem[] => {
    if (!orderHistory || orderHistory.length === 0) {
        return getPopularItems(allItems);
    }

    // Get categories user has ordered from
    const orderedCategories = new Set<string>();
    const orderedItemIds = new Set<string>();

    orderHistory.forEach(order => {
        order.items?.forEach((item: any) => {
            orderedItemIds.add(item.itemId || item.id);
            // Find the category from allItems
            const menuItem = allItems.find(mi => mi.id === (item.itemId || item.id));
            if (menuItem) {
                orderedCategories.add(menuItem.category);
            }
        });
    });

    // Recommend items from categories user likes, but hasn't ordered yet
    const recommendations = allItems
        .filter(item =>
            orderedCategories.has(item.category) &&
            !orderedItemIds.has(item.id) &&
            item.isAvailable !== false
        )
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);

    // If not enough recommendations, add popular items
    if (recommendations.length < 6) {
        const popular = getPopularItems(allItems)
            .filter(item => !recommendations.find(r => r.id === item.id))
            .slice(0, 6 - recommendations.length);
        recommendations.push(...popular);
    }

    return recommendations;
};

// Get "Customers also ordered" suggestions
export const getCustomersAlsoOrdered = (
    currentItemId: string,
    allItems: MenuItem[],
    orderHistory: any[] = []
): MenuItem[] => {
    // Find orders containing current item
    const ordersWithItem = orderHistory.filter(order =>
        order.items?.some((item: any) => (item.itemId || item.id) === currentItemId)
    );

    // Count frequency of other items in those orders
    const itemFrequency = new Map<string, number>();

    ordersWithItem.forEach(order => {
        order.items?.forEach((item: any) => {
            const itemId = item.itemId || item.id;
            if (itemId !== currentItemId) {
                itemFrequency.set(itemId, (itemFrequency.get(itemId) || 0) + 1);
            }
        });
    });

    // Sort by frequency and get top items
    const sortedItems = Array.from(itemFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([itemId]) => allItems.find(item => item.id === itemId))
        .filter((item): item is MenuItem => item !== undefined && item.isAvailable !== false);

    // If not enough data, fallback to same category items
    if (sortedItems.length < 3) {
        const currentItem = allItems.find(item => item.id === currentItemId);
        if (currentItem) {
            const sameCategory = allItems
                .filter(item =>
                    item.id !== currentItemId &&
                    item.category === currentItem.category &&
                    item.isAvailable !== false &&
                    !sortedItems.find(si => si.id === item.id)
                )
                .slice(0, 4 - sortedItems.length);
            sortedItems.push(...sameCategory);
        }
    }

    return sortedItems;
};

// Get Chef's Special (admin can mark items as special)
export const getChefsSpecial = (allItems: MenuItem[]): MenuItem[] => {
    // Items marked with high rating and available
    return allItems
        .filter(item =>
            item.isAvailable !== false &&
            (item.rating || 0) >= 4.5
        )
        .slice(0, 4);
};

// Get trending items this week
export const getTrendingThisWeek = (
    allItems: MenuItem[],
    recentOrders: any[] = []
): MenuItem[] => {
    // Count orders in last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const itemCounts = new Map<string, number>();

    recentOrders
        .filter(order => new Date(order.orderedAt || order.createdAt) >= oneWeekAgo)
        .forEach(order => {
            order.items?.forEach((item: any) => {
                const itemId = item.itemId || item.id;
                itemCounts.set(itemId, (itemCounts.get(itemId) || 0) + 1);
            });
        });

    // Get top trending items
    const trending = Array.from(itemCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([itemId]) => allItems.find(item => item.id === itemId))
        .filter((item): item is MenuItem => item !== undefined && item.isAvailable !== false);

    // Fallback to popular if not enough data
    if (trending.length < 6) {
        const popular = getPopularItems(allItems)
            .filter(item => !trending.find(t => t.id === item.id))
            .slice(0, 6 - trending.length);
        trending.push(...popular);
    }

    return trending;
};
