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
    // Create table if not exists
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        mobile TEXT UNIQUE
      );`
    );

    // Check if category column exists, add if not
    tx.executeSql(
      `PRAGMA table_info(Users);`,
      [],
      (_, result) => {
        const columns = [];
        for (let i = 0; i < result.rows.length; i++) {
          columns.push(result.rows.item(i).name);
        }
        
        if (!columns.includes('category')) {
          tx.executeSql(
            `ALTER TABLE Users ADD COLUMN category TEXT;`,
            [],
            () => console.log("✅ Category column added successfully"),
            (err) => console.log("❌ Error adding category column:", err)
          );
        } else {
          console.log("✅ Category column already exists");
        }
      },
      (err) => console.log("❌ Error checking table structure:", err)
    );
  });
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
            console.log("Login - Found user:", user);
            
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

  db.transaction(tx => {
    tx.executeSql('DELETE FROM Session');
    tx.executeSql('INSERT INTO Session (mobile) VALUES (?)', [mobile]);
  });

  navigation.replace(screenMap[user.category], { mobile, name: user.name });
} else {
  db.transaction(tx => {
    tx.executeSql('DELETE FROM Session');
    tx.executeSql('INSERT INTO Session (mobile) VALUES (?)', [mobile]);
  });

  navigation.replace('Home', { mobile, name: user.name });
}

            
          } else {
            Alert.alert(
              'New User',
              'Mobile number not found. Please create an account first.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Create Account',
                  onPress: () => navigation.navigate('SignUp', { mobile }),
                },
              ]
            );
          }
        },
        err => console.log('Select error:', err)
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Admin Button - Top Right */}
      {/* <TouchableOpacity 
        style={styles.adminButton}
        onPress={() => navigation.navigate('AdminLogin')}
      >
        <Text style={styles.adminButtonText}>🔑</Text>
      </TouchableOpacity> */}
      
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.label}>Enter Mobile Number</Text>

      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
        placeholder="Enter 10-digit mobile number"
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
    backgroundColor: '#FFF8EC',
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
  label: { 
    fontSize: 18, 
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
    marginLeft: 25,
  },
  checkbox: {
    width: 22, 
    height: 22,
    borderWidth: 1.5, 
    borderColor: '#5A2E18',
    marginRight: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#2C9C94',
    borderColor: '#2C9C94',
  },
  rememberText: {
    color: '#4A2C2A',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2C9C94', 
    paddingVertical: 14, 
    paddingHorizontal: 50,
    borderRadius: 12,
    elevation: 4,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  signupText: {
    marginTop: 25,
    fontSize: 15,
    color: '#4A2C2A',
  },
  signupLink: {
    color: '#D35225',
    fontWeight: 'bold',
  },
  adminButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(213, 82, 37, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(213, 82, 37, 0.2)',
  },
  adminButtonText: {
    fontSize: 18,
  },
});

export default LoginScreen;
