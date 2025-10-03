import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert 
} from 'react-native';
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
  console.log("Home route params:", route.params);

  const { mobile, name } = route.params || {};
  console.log("Home screen - mobile:", mobile, "name:", name);

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
              console.log("➡️ Navigating to", category.screen, "with mobile:", mobile, "name:", name);
              navigation.replace(category.screen, { mobile, name });
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

      <Text 
        style={[
          styles.reportText,
          {  fontStyle: 'italic' }
        ]}
      >
       Note: Once a category is selected, you can log in to that category using your mobile number. To change your category, please go to the ‘Category Update’ option on the signup page.
      </Text>

      <View style={styles.grid}>
        {categories.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.card} 
            onPress={() => handleCategoryPress(item)}
          >
            <Image source={item.image} style={styles.image} />
            <Text style={styles.label}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF8EC', 
    alignItems: 'center', 
    paddingTop: 50 
  },
  reportText: { 
    fontSize: 12, 
    color: '#5A2E18', 
    marginBottom: 8, 
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#D35225', 
    marginBottom: 5,
    letterSpacing: 1,
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-around', 
    width: '95%' 
  },
  card: { 
    width: '42%', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    alignItems: 'center', 
    marginBottom: 25, 
    paddingVertical: 20, 
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  image: { 
    width: 110, 
    height: 110, 
    marginBottom: 15, 
    resizeMode: 'contain' 
  },
  label: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#4A2C2A',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
