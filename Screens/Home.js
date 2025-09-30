import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const categories = [
  { name: 'Women', image: require('../assets/Women.jpg') },
  { name: 'Men', image: require('../assets/Man.jpg') },
  { name: 'Student', image: require('../assets/Students.jpg') },
  { name: 'Elder', image: require('../assets/Elders.jpg') },
  { name: 'Partners', image: require('../assets/Couple.jpg') },
  { name: 'Friends', image: require('../assets/Friends.jpg') },
];

const HomeScreen = ({ navigation }) => {
  const handleCategoryPress = (category) => {
    // You can navigate to category-specific screen
    // navigation.navigate('CategoryScreen', { category });
    alert(`You selected: ${category}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Category</Text>
      <View style={styles.grid}>
        {categories.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => handleCategoryPress(item.name)}
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
    backgroundColor: '#F7E3B0', 
    alignItems: 'center', 
    paddingTop: 40 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#D35225', 
    marginBottom: 80 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    width: '90%' 
  },
  card: { 
    width: '45%', 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 20, 
    padding: 10, 
    elevation: 3 
  },
  image: { 
    width: 100, 
    height: 100, 
    marginBottom: 10, 
    resizeMode: 'contain' 
  },
  label: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#5A2E18' 
  },
});

export default HomeScreen;
