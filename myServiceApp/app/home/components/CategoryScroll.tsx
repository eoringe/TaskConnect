// app/(tabs)/home/components/CategoryScroll.tsx

import React from 'react';
import { ScrollView, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';

interface CategoryScrollProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CategoryScroll = ({ categories, selectedCategory, onCategorySelect }: CategoryScrollProps) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.horizontalScroll}
      contentContainerStyle={styles.categoryContainer}
    >
      {categories.map((cat, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.categoryItem,
            selectedCategory === cat.name && styles.selectedCategoryItem
          ]}
          onPress={() => onCategorySelect(cat.name)}
        >
          <View style={[
            styles.categoryIconContainer,
            selectedCategory === cat.name && styles.selectedCategoryIconContainer
          ]}>
            <Ionicons
              name={cat.icon as any}
              size={22}
              color={selectedCategory === cat.name ? "#fff" : "#666666"}
            />
          </View>
          <Text style={[
            styles.categoryText,
            selectedCategory === cat.name && styles.selectedCategoryText
          ]}>{cat.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const createStyles = createThemedStyles(theme => ({
  horizontalScroll: {
    marginBottom: 25,
  },
  categoryContainer: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 18,
    width: 75,
  },
  selectedCategoryItem: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconContainer: {
    height: 60,
    width: 60,
    borderRadius: 20,
    backgroundColor: theme.dark ? 'rgba(60, 60, 60, 0.5)' : '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  selectedCategoryIconContainer: {
    backgroundColor: theme.colors.primary,
  },
  categoryText: {
    color: theme.colors.textSecondary,
    fontWeight: '500',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
}));

export default CategoryScroll;