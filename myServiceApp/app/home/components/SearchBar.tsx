// app/(tabs)/home/components/SearchBar.tsx

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
}

const SearchBar = ({ value, onChangeText, onFilterPress }: SearchBarProps) => {
  return (
    <View style={styles.searchBarContainer}>
      <Ionicons name="search" size={22} color="#A0A0A0" style={styles.searchIcon} />
      <TextInput
        style={styles.searchBar}
        placeholder="What do you need done?"
        placeholderTextColor="#A0A0A0"
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

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 10,
    padding: 8,
  },
});

export default SearchBar;