import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />
      
      {/* Header with close button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* App logo */}
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['#5CBD6A', '#3C9D4E']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.logoGradient}
        >
          <Text style={styles.logoText}>TC</Text>
        </LinearGradient>
      </View>
      
      <Text style={styles.title}>Task Connect</Text>
      <Text style={styles.version}>Version 1.0.0</Text>
      
      <View style={styles.separator} lightColor="rgba(255,255,255,0.1)" darkColor="rgba(255,255,255,0.1)" />

      {/* App description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>About Task Connect</Text>
        <Text style={styles.descriptionText}>
          Task Connect is your all-in-one solution for task management and productivity. Our app helps you stay organized, focused, and efficient with a beautiful interface designed for simplicity and power.
        </Text>
        
        <View style={styles.featureList}>
          <FeatureItem 
            icon="flash-outline" 
            title="Fast & Efficient" 
            description="Quickly add and organize tasks with our intuitive interface"
          />
          
          <FeatureItem 
            icon="sync-outline" 
            title="Cloud Sync" 
            description="Access your tasks from any device with real-time synchronization"
          />
          
          <FeatureItem 
            icon="notifications-outline" 
            title="Smart Reminders" 
            description="Never miss a deadline with customizable notifications"
          />
          
          <FeatureItem 
            icon="lock-closed-outline" 
            title="Secure & Private" 
            description="Your data is protected with industry-standard encryption"
          />
        </View>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Task Connect</Text>
      </View>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style="light" />
    </View>
  );
}

// Component for feature items
function FeatureItem({ icon, title, description }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={20} color="#5CBD6A" />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  logoGradient: {
    width: 70,
    height: 70,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
    alignSelf: 'center',
  },
  descriptionContainer: {
    paddingHorizontal: 30,
    backgroundColor: 'transparent',
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  featureList: {
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(92, 189, 106, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.7)',
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});