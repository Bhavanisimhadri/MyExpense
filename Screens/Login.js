import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'ExpenseDB.db', location: 'default' });

const LoginScreen = ({ navigation }) => {
  const [mobile, setMobile] = useState('');

  // Create Users table if not exists
  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY AUTOINCREMENT, mobile TEXT UNIQUE);'
      );
    });
  }, []);

  const handleContinue = () => {
    if (mobile.length !== 10) return Alert.alert('Error', 'Enter a valid 10-digit number');

    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Users WHERE mobile=?',
        [mobile],
        (_, results) => {
          if (results.rows.length > 0) {
            Alert.alert('Login successful', `Welcome back ${mobile}`);
          } else {
            tx.executeSql(
              'INSERT INTO Users (mobile) VALUES (?)',
              [mobile],
              () => Alert.alert('Account created', `Welcome ${mobile}`),
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
      <Text style={styles.label}>Enter Mobile Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
        placeholder="9876543210"
      />
      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { fontSize: 18, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, width: '80%', borderRadius: 5 },
});

export default LoginScreen;
