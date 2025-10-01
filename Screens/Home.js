import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'ExpenseDB.db', location: 'default' });

const categories = [
  { name: 'Women', image: require('../assets/Women.jpg'), screen: 'WomenScreen' },
  { name: 'Men', image: require('../assets/Man.jpg'), screen: 'MenScreen' },
  { name: 'Student', image: require('../assets/Students.jpg'), screen: 'StudentScreen' },
  { name: 'Elder', image: require('../assets/Elders.jpg'), screen: 'ElderScreen' },
  { name: 'Partners', image: require('../assets/Couple.jpg'), screen: 'PartnersScreen' },
  { name: 'Friends', image: require('../assets/Friends.jpg'), screen: 'FriendsScreen' },
];

const HomeScreen = ({ navigation, route }) => {
 console.log("Home route params:", route.params); // 👈 add this

  const { mobile } = route.params || {}; // 👈 safe access

 const handleCategoryPress = (category) => {
  console.log("Category pressed:", category.name, "Mobile:", mobile);

  db.transaction(
    (tx) => {
      tx.executeSql(
        'UPDATE Users SET category = ? WHERE mobile = ?',
        [category.name, mobile],
        (_, result) => {
          console.log("✅ Category saved:", category.name, "Rows affected:", result.rowsAffected);

          if (result.rowsAffected > 0) {
            console.log("➡️ Navigating to Login");
            navigation.replace(category.screen, { mobile });
          } else {
            console.log("⚠️ No row updated! Mobile may not exist:", mobile);
            Alert.alert("Error", "User not found in database.");
          }
        }
      );
    },
    (err) => {
      console.log("❌ Transaction error:", err);
    },
    () => {
      console.log("✅ Transaction completed");
    }
  );
};





  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Category</Text>
      <View style={styles.grid}>
        {categories.map((item, index) => (
          <TouchableOpacity key={index} style={styles.card} onPress={() => handleCategoryPress(item)}>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.label}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7E3B0', alignItems: 'center', paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D35225', marginBottom:80 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '90%' },
  card: { width: '45%', backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', marginBottom: 20, padding: 10, elevation: 3 },
  image: { width: 100, height: 100, marginBottom: 10, resizeMode: 'contain' },
  label: { fontSize: 18, fontWeight: 'bold', color: '#5A2E18' },
});

export default HomeScreen;
