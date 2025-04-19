// app/(tabs)/home/components/CategoryScroll.tsx

import React from 'react';
import { ScrollView, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';

interface CategoryScrollProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CategoryScroll = ({ categories, selectedCategory, onCategorySelect }: CategoryScrollProps) => {
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
              color={selectedCategory === cat.name ? "#fff" : "#4A80F0"}
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

const styles = StyleSheet.create({
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
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#4A80F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  selectedCategoryIconContainer: {
    backgroundColor: '#4A80F0',
  },
  categoryText: {
    color: '#555',
    fontWeight: '500',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#4A80F0',
    fontWeight: '700',
  },
});

export default CategoryScroll;