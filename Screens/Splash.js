import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('SignUp'), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Expense Tracker</Text>

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
    backgroundColor: '#FFF8EC', // matching Home/Login/SignUp
    paddingHorizontal: 20,
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#D35225',
    letterSpacing: 1.2,
    marginBottom: 20,
    textAlign: 'center',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 25,
    width: 280,
    height: 280,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
  },
  subtitle: {
    marginTop: 20,
    fontSize: 16,
    color: '#4A2C2A',
    fontStyle: 'italic',
    textAlign: 'center',
  }
});

export default SplashScreen;
