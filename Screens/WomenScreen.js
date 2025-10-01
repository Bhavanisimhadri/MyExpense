import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TextInput, ScrollView, Image, TouchableOpacity } from 'react-native';

const WomenScreen = ({ route }) => {
  const { name } = route.params;

  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savings, setSavings] = useState('');

  return (
    <ImageBackground 
      source={require('../assets/womenbackg.jpg')} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.container}>
          
          {/* Welcome Text */}
          <Text style={styles.welcomeText}>Welcome, {name}</Text>

          {/* Monthly Income Fields */}
          <View style={styles.incomeContainer}>
            <TextInput
              style={styles.input}
              placeholder="Monthly Income"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
            />
            <TextInput
              style={styles.input}
              placeholder="Savings"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={savings}
              onChangeText={setSavings}
            />
          </View>

          {/* Sections: Needs, Wants, Notes, Bucket List */}
          <View style={styles.sectionsContainer}>
            {[ 
              { name: 'Needs', img: require('../assets/needs.jpg') },
              { name: 'Wants', img: require('../assets/wants.jpg') },
              { name: 'Notes', img: require('../assets/notes.jpg') },
              { name: 'Bucket List', img: require('../assets/bucket.jpg') },
            ].map((item, index) => (
              <TouchableOpacity key={index} style={styles.sectionCard} activeOpacity={0.8}>
                <View style={styles.sectionImageWrapper}>
                  <Image source={item.img} style={styles.sectionImage} />
                </View>
                <Text style={styles.sectionText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    paddingVertical: 40,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 34,
    marginTop:20,
    fontWeight: 'bold',
    color: '#FFEEF2',
    textAlign: 'center',
    marginBottom: 25,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  incomeContainer: {
    width: '100%',
    marginBottom: 35,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 17,
    marginBottom: 15,
    color: '#333',
    elevation: 3,
  },
  sectionsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sectionImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sectionImage: {
    width: '100%',
    height: '100%',
  },
  sectionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#702c51',
  },
});

export default WomenScreen;
