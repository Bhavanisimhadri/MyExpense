import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'ExpenseDB.db', location: 'default' });

const CategoryUpdateScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  const handleCategoryUpdate = () => {
    if (!name.trim() || mobile.length !== 10) {
      Alert.alert('Error', 'Please enter valid name and 10-digit mobile number');
      return;
    }

    // First verify the user exists
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Users WHERE mobile = ? AND name = ?',
        [mobile, name.trim()],
        (_, results) => {
          if (results.rows.length === 0) {
            Alert.alert('Error', 'User not found. Please check name and mobile number.');
            return;
          }

          const user = results.rows.item(0);
          
          // User exists, navigate to Home to select new category
          Alert.alert(
            'Success', 
            'User verified! Please select your new category.',
            [
              { 
                text: 'OK', 
                onPress: () => {
                  console.log("Category Update - Navigating to Home with:", { 
                    mobile, 
                    name: name.trim() 
                  });
                  navigation.replace('Home', { 
                    mobile, 
                    name: name.trim() 
                  });
                }
              }
            ]
          );
        },
        err => {
          console.log('Database error:', err);
          Alert.alert('Error', 'Database error occurred');
        }
      );
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>🔙</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Update Category</Text>
      <Text style={styles.subtitle}>Enter user details to change category</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter user's name"
        placeholderTextColor="#888"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Mobile Number</Text>
      <TextInput
        style={styles.input}
        value={mobile}
        onChangeText={setMobile}
        placeholder="Enter 10-digit mobile number"
        placeholderTextColor="#888"
        keyboardType="phone-pad"
        maxLength={10}
      />

      <TouchableOpacity style={styles.button} onPress={handleCategoryUpdate}>
        <Text style={styles.buttonText}>Update Category</Text>
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
    backgroundColor: '#2C9C94', 
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

export default CategoryUpdateScreen;