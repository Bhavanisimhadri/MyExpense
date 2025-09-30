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
  const { mobile } = route.params;

  const handleCategoryPress = (category) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE Users SET category=? WHERE mobile=?',
        [category.name, mobile],
        () => navigation.replace(category.screen, { mobile }),
        err => console.log('Update error:', err)
      );
    });
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#D35225', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '90%' },
  card: { width: '45%', backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', marginBottom: 20, padding: 10, elevation: 3 },
  image: { width: 100, height: 100, marginBottom: 10, resizeMode: 'contain' },
  label: { fontSize: 18, fontWeight: 'bold', color: '#5A2E18' },
});

export default HomeScreen;
