import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Login'), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Expense Tracker</Text>

      {/* Image with Loader in Center */}
      <View style={styles.imageWrapper}>
        <Image 
          source={require('../assets/Background.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#2C9C94" style={styles.loader} />
      </View>

      <Text style={styles.subtitle}>Master your money, one step at a time</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F7E3B0'
  },
  imageWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 250,
    height: 250,
  },
  loader: {
    position: 'absolute',
  },
  title: { 
    fontSize: 30, 
    fontWeight: 'bold', 
    color: '#D35225',
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 15,
    fontSize: 16,
    color: '#5A2E18',
    fontStyle: 'italic'
  }
});

export default SplashScreen;
