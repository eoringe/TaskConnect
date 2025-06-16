import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { ScrollView, TouchableOpacity, View, Text, ActivityIndicator, StyleSheet as RNStyleSheet } from 'react-native'; // Import ActivityIndicator and RNStyleSheet
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';

// Import Firestore related functions and db instance
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase-config'; // Adjust this path to your firebaseConfig



const CategoryScroll = (
  {

  }:

  {
    selectedCategory: string; // Keep these for internal state management for the scroll
    onCategorySelect: (category: string) => void;
  }
) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [categories, setCategories] = useState<Category[]>([]); // Internal state for categories
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All'); // Internal state for selected category

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesCollectionRef = collection(db, 'serviceCategories');
        const q = query(categoriesCollectionRef); // Fetch all documents

        const querySnapshot = await getDocs(q);
        const fetchedCategories: Category[] = querySnapshot.docs.map(doc => ({
          name: doc.id, // Use the document ID as the category name
          icon: doc.data().icon as string, // Cast icon to string
        }));

        setCategories(fetchedCategories);
        // Automatically select the first category or 'All' if available
        if (fetchedCategories.length > 0 && selectedCategory === 'All') {
          // If 'All' is a special case not present in DB, keep it.
          // Otherwise, if 'All' is meant to be a DB entry, this needs adjustment.
          // For now, if no category is selected, it defaults to 'All'.
          // If you want to auto-select the first DB category, change:
          // setSelectedCategory(fetchedCategories[0].name);
        }
      } catch (err) {
        console.error("Error fetching categories in CategoryScroll:", err);
        setError("Failed to load categories. Please check your network and Firestore rules.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []); // Empty dependency array means it runs once on mount

  // Handle category selection
  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    // If you need to pass the selected category to a parent, you'd still need a prop like onCategorySelect
    // onCategorySelect(categoryName); // Uncomment if the parent still needs to know the selected category
  };

  if (loading) {
    return (
      <View style={localStyles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={localStyles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={localStyles.errorContainer}>
        <Text style={localStyles.errorText}>{error}</Text>
      </View>
    );
  }

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
          onPress={() => handleCategorySelect(cat.name)} // Use internal handler
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
    marginHorizontal: 1, // Added margin to the scroll view itself
  },
  categoryContainer: {
    paddingHorizontal: 10, // Added padding to the content within the scroll view
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

// Local styles for loading/error state if fetching internally
const localStyles = RNStyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100, // Give it some height so it's visible
  },
  loadingText: {
    marginTop: 10,
    color: '#666', // Adjust color as needed
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    paddingHorizontal: 20,
  },
  errorText: {
    color: 'red', // Adjust color as needed
    textAlign: 'center',
  },
});

export default CategoryScroll;
