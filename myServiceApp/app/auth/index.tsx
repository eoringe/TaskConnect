import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useGoogleSignIn from './googleSignIn';

const LoginScreen = () => {
  const { promptAsync } = useGoogleSignIn();

  return (
    <View style={styles.container}>
      {/* Other login inputs */}
      
      <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  googleButton: {
    marginTop: 20,
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});

export default LoginScreen;
