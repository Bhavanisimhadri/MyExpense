import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StudentScreen = ({ route }) => {
  const { mobile } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Student Category!</Text>
      <Text style={styles.subtitle}>Logged in as: {mobile}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7E3B0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D35225', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#5A2E18' },
});

export default StudentScreen;
