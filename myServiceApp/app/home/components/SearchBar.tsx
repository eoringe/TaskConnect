// app/(tabs)/home/components/SearchBar.tsx

import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
}

const SearchBar = ({ value, onChangeText, onFilterPress }: SearchBarProps) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.searchBarContainer}>
      <Ionicons name="search" size={22} color={theme.colors.textLight} style={styles.searchIcon} />
      <TextInput
        style={styles.searchBar}
        placeholder="What do you need done?"
        placeholderTextColor={theme.colors.textLight}
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity
        style={styles.filterButton}
        onPress={onFilterPress}
      >
        <Ionicons name="options-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = createThemedStyles(theme => ({
  searchBarContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 15,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.dark ? 0.3 : 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  filterButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    padding: 8,
  },
}));

export default SearchBar;