import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';

const AdminLoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAdminLogin = () => {
    if (username === 'admin' && password === 'admin@123') {
      navigation.replace('AdminPanel');
    } else {
      Alert.alert('Error', 'Invalid admin credentials');
      setPassword('');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>🔙</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Admin Login</Text>
      <Text style={styles.subtitle}>Enter admin credentials</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
        placeholderTextColor="#888"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        placeholderTextColor="#888"
        secureTextEntry={true}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
        <Text style={styles.buttonText}>Login as Admin</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#FFF8EC',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
  },
  backButtonText: {
    fontSize: 20,
    color: '#D35225',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D35225',
    marginBottom: 5,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6A4E42',
    marginBottom: 40,
  },
  label: { 
    fontSize: 16, 
    marginBottom: 8, 
    color: '#4A2C2A',
    alignSelf: 'flex-start',
    marginLeft: 25,
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 14, 
    marginBottom: 20, 
    width: '85%', 
    borderRadius: 12, 
    backgroundColor: '#fff',
    fontSize: 16,
    elevation: 2,
  },
  button: {
    backgroundColor: '#D35225', 
    paddingVertical: 14, 
    paddingHorizontal: 40,
    borderRadius: 12,
    elevation: 4,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default AdminLoginScreen;