import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = SQLite.openDatabase({ name: 'ExpenseDB.db', location: 'default' });

const LoginScreen = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Create Users table if not exists (drop old table in dev)
 useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          mobile TEXT UNIQUE,
          category TEXT
        );`,
        [],
        () => console.log('Users table ready'),
        err => console.log('Table creation error:', err)
      );
    });

    const loadRemembered = async () => {
      const savedMobile = await AsyncStorage.getItem('rememberedMobile');
      if (savedMobile) {
        setMobile(savedMobile);
        setRememberMe(true);
      }
    };
    loadRemembered();
  }, []);

  const handleContinue = () => {
    if (mobile.length !== 10) return Alert.alert('Error', 'Enter a valid 10-digit number');

    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Users WHERE mobile=?',
        [mobile],
        async (_, results) => {
          if (results.rows.length > 0) {
            const user = results.rows.item(0);
            if (rememberMe) await AsyncStorage.setItem('rememberedMobile', mobile);
            else await AsyncStorage.removeItem('rememberedMobile');

            if (user.category) {
              const screenMap = {
                Women: 'WomenScreen',
                Men: 'MenScreen',
                Student: 'StudentScreen',
                Elder: 'ElderScreen',
                Partners: 'PartnersScreen',
                Friends: 'FriendsScreen',
              };
              navigation.replace(screenMap[user.category], { mobile });
            } else {
              navigation.replace('Home', { mobile });
            }
          } else {
            navigation.navigate('SignUp', { mobile });
          }
        },
        err => console.log('Select error:', err)
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.label}>Enter Mobile Number</Text>

      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
        placeholder="9876543210"
        placeholderTextColor="#888"
      />

      <TouchableOpacity 
        style={styles.rememberRow} 
        onPress={() => setRememberMe(!rememberMe)}
      >
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
        <Text style={styles.rememberText}>Remember Me</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp', { mobile })}>
        <Text style={styles.signupText}>
          Not visited before? <Text style={styles.signupLink}>Sign Up</Text>
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
    padding: 20,
    backgroundColor: '#F7E3B0'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D35225',
    marginBottom: 20,
  },
  label: { 
    fontSize: 18, 
    marginBottom: 10, 
    color: '#5A2E18' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    padding: 12, 
    marginBottom: 20, 
    width: '85%', 
    borderRadius: 8, 
    backgroundColor: '#fff',
    fontSize: 16,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  checkbox: {
    width: 20, 
    height: 20,
    borderWidth: 1, 
    borderColor: '#5A2E18',
    marginRight: 10,
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#2C9C94',
  },
  rememberText: {
    color: '#5A2E18',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2C9C94', 
    paddingVertical: 12, 
    paddingHorizontal: 40,
    borderRadius: 10,
    elevation: 3,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  signupText: {
    marginTop: 20,
    fontSize: 16,
    color: '#5A2E18',
  },
  signupLink: {
    color: '#D35225',
    fontWeight: 'bold',
  }
});

export default LoginScreen;
