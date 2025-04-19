// app/(tabs)/home/components/ProfileModal.tsx

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { handleLogout } from '../utils/logout';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
}

const ProfileModal = ({ visible, onClose, userName }: ProfileModalProps) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View style={styles.profileModalContent}>
          <Text style={styles.profileModalTitle}>Hello {userName} 👋</Text>
          <TouchableOpacity style={styles.profileOption}>
            <Ionicons name="person-outline" size={20} color="#4A80F0" />
            <Text style={styles.profileOptionText}>View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileOption}>
            <Ionicons name="settings-outline" size={20} color="#4A80F0" />
            <Text style={styles.profileOptionText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileOption}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={[styles.profileOptionText, { color: '#FF6B6B' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  profileModalContent: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  profileModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  profileOptionText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default ProfileModal;