import { StyleSheet, TouchableOpacity, Dimensions, Animated, ImageBackground } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; // Import the useRouter hook from expo-router

export default function WelcomeScreen() {
  const router = useRouter(); // Initialize the router from expo-router

  // Animation values (rest of your animation code remains the same)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Animation effects (remain the same)
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.spring(buttonScaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
    ]).start();
  }, []);

  // Button press animations (remain the same)
  const onPressIn = () => {
    Animated.spring(buttonScaleAnim, { toValue: 0.95, friction: 5, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  // Function to navigate to the Login screen using useRouter
  const handleLoginPress = () => {
    router.push('/auth');
  };
  const handleGetStarted = () => {
    router.push('/home');
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&auto=format&fit=crop' }}
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.title}>Task Connect</Text>
            <Text style={styles.subtitle}>Your trusted platform to manage tasks efficiently</Text>
          </Animated.View>

          {/* Buttons */}
          <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScaleAnim }] }]}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleGetStarted}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            >
              <LinearGradient
                colors={['#5CBD6A', '#3C9D4E']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.gradient}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleLoginPress} // Call the Expo Router navigation function
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            >
              <Text style={styles.buttonTextSecondary}>Log In</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Info cards and footer (remain the same) */}
          <Animated.View style={[styles.cardsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {[
              { icon: '🚀', title: 'Fast', desc: 'Quick task management' },
              { icon: '🔒', title: 'Secure', desc: 'Your data is protected' },
              { icon: '🔄', title: 'Sync', desc: 'Works across devices' },
            ].map((item, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.cardIcon}>{item.icon}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
            ))}
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>v1.0.0 | © 2025 Task Connect</Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Your styles remain the same
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 42, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 10, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  subtitle: { fontSize: 18, fontWeight: '400', color: '#E0E0E0', textAlign: 'center', marginBottom: 40, lineHeight: 24, maxWidth: 300 },
  buttonContainer: { width: '100%', paddingHorizontal: 20, marginBottom: 40 },
  button: { marginBottom: 15, borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, overflow: 'hidden' },
  gradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 12 },
  buttonSecondary: { backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2.5 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  buttonTextSecondary: { color: '#333', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  cardsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10, marginBottom: 30 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.9)', width: width / 3.5, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2.5 },
  cardIcon: { fontSize: 24, marginBottom: 5 },
  cardTitle: { fontWeight: 'bold', fontSize: 14, color: '#333', marginBottom: 3 },
  cardDesc: { fontSize: 12, color: '#666', textAlign: 'center' },
  footer: { marginTop: 20, paddingVertical: 10 },
  footerText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' },
});