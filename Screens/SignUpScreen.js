import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'ExpenseDB.db', location: 'default' });

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  // Ensure Users table exists before using it
 useEffect(() => {
  db.transaction(tx => {
    // Create table if not exists
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        mobile TEXT UNIQUE
      );`
    );

    // Ensure category column exists
    tx.executeSql(
      `ALTER TABLE Users ADD COLUMN category TEXT;`,
      [],
      () => console.log("Category column added"),
      (err) => console.log("Alter error (maybe already exists):", err)
    );
  });
}, []);


  const handleSignUp = () => {
    const trimmedName = name.trim();
    const trimmedMobile = mobile.trim();
    if (!trimmedName) return Alert.alert('Error', 'Enter your name');
    if (trimmedMobile.length !== 10) return Alert.alert('Error', 'Enter a valid 10-digit number');

    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Users WHERE mobile = ?',
        [trimmedMobile],
        (_, results) => {
          if (results.rows.length > 0) {
            Alert.alert('Error', 'Mobile number already exists');
          } else {
            tx.executeSql(
              'INSERT INTO Users (name, mobile) VALUES (?, ?)',
              [trimmedName, trimmedMobile],
              () => {
                console.log("SignUp - Navigating to Home with:", { mobile: trimmedMobile, name: trimmedName });
                navigation.replace('Home', { mobile: trimmedMobile, name: trimmedName });
              },
              err => console.log('Insert error:', err)
            );
          }
        },
        err => console.log('Select error:', err)
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
        placeholder="9876543210"
        placeholderTextColor="#888"
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginLink}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFF8EC', 
    padding: 20 
  },
  title: { 
    fontSize: 30, 
    fontWeight: 'bold', 
    color: '#D35225', 
    marginBottom: 5,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6A4E42',
    marginBottom: 30,
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 14, 
    marginBottom: 18, 
    width: '85%', 
    borderRadius: 12, 
    backgroundColor: '#fff', 
    fontSize: 16,
    elevation: 2,
  },
  button: { 
    backgroundColor: '#2C9C94', 
    paddingVertical: 14, 
    paddingHorizontal: 50, 
    borderRadius: 12, 
    elevation: 4, 
    marginTop: 10 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loginText: { 
    marginTop: 25, 
    fontSize: 15, 
    color: '#4A2C2A' 
  },
  loginLink: { 
    color: '#D35225', 
    fontWeight: 'bold' 
  }
});

export default SignUpScreen;
