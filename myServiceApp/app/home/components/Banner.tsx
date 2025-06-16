// app/(tabs)/home/components/Banner.tsx

import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';

// Define props for the Banner component
interface BannerProps {
  title: string;
  subtitle: string;
  buttonText: string;
  iconName: keyof typeof Ionicons.glyphMap; // Ensures valid Ionicons name
  backgroundColor: string; // To allow different banner colors
  onPress: () => void;
}

const Banner: React.FC<BannerProps> = ({ title, subtitle, buttonText, iconName, backgroundColor, onPress }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.bannerContainer, { backgroundColor: backgroundColor }]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>{title}</Text>
        <Text style={styles.bannerSubtitle}>{subtitle}</Text>
        <TouchableOpacity style={styles.bannerButton} onPress={onPress}>
          <Text style={styles.bannerButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bannerImageContainer}>
        <Ionicons name={iconName} size={60} color="#fff" style={styles.bannerImage} />
      </View>
    </View>
  );
};

const createStyles = createThemedStyles(theme => ({
  bannerContainer: {
    borderRadius: 20,
    marginHorizontal: 20, // Keep this for spacing within the carousel
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom removed as it will be handled by carousel padding/margin
    shadowColor: theme.colors.primary, // Default shadow, can be overridden
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerContent: {
    flex: 3,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
    marginBottom: 15,
  },
  bannerButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: theme.colors.primary, // Button text color uses primary theme color
    fontWeight: '600',
  },
  bannerImageContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bannerImage: {
    opacity: 0.8,
  },
}));

export default Banner;