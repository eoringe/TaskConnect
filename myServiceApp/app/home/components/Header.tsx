// app/(tabs)/home/components/Header.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/firebase-config';

interface HeaderProps {
  userName: string;
  onProfilePress: () => void;
}

const Header = ({ userName, onProfilePress }: HeaderProps) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Load the profile image from Firebase Auth
  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.photoURL) {
      setProfileImage(user.photoURL);
    }
    
    // Set up a listener to detect changes to the user's profile
    const interval = setInterval(() => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.photoURL !== profileImage) {
        setProfileImage(currentUser.photoURL);
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [profileImage]);
  
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerText}>Hi, {userName} 👋</Text>
        <Text style={styles.subHeaderText}>Find trusted help nearby</Text>
      </View>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={onProfilePress}
      >
        {profileImage ? (
          <Image 
            source={{ uri: profileImage }} 
            style={styles.profileImage} 
          />
        ) : (
          <Ionicons name="person-circle" size={40} color="#4A80F0" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 3,
  },
  avatarContainer: {
    height: 45,
    width: 45,
    borderRadius: 22.5,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
});

export default Header;