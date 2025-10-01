import React, { useState } from 'react';
import { 
  View, 
  Text, // Ensure Text is imported
  StyleSheet, 
  ImageBackground, 
  TextInput, 
  ScrollView, 
  Image, 
  TouchableOpacity, Alert,
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const WomenScreen = ({ route, navigation }) => {
  const { name } = route.params;

  const [selectedSection, setSelectedSection] = useState(null);

  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savings, setSavings] = useState('');

  const [needs, setNeeds] = useState([{ element: '', amount: '' }]);
  const [wants, setWants] = useState([{ element: '', amount: '' }]);
  const [notes, setNotes] = useState(['']);
  const [bucketList, setBucketList] = useState([{ item: '', done: false }]);

  const handleAddRow = (section) => {
    if(section === 'needs') setNeeds([...needs, { element: '', amount: '' }]);
    if(section === 'wants') setWants([...wants, { element: '', amount: '' }]);
    if(section === 'notes') setNotes([...notes, '']);
    if(section === 'bucket') setBucketList([...bucketList, { item: '', done: false }]);
  };

  const handleRemoveRow = (section, index) => {
    if(section === 'needs') setNeeds(needs.filter((_, i) => i !== index));
    if(section === 'wants') setWants(wants.filter((_, i) => i !== index));
    if(section === 'notes') setNotes(notes.filter((_, i) => i !== index));
    if(section === 'bucket') setBucketList(bucketList.filter((_, i) => i !== index));
  };

  const handleInputChange = (section, index, field, value) => {
    if(section === 'needs') {
      const updated = [...needs]; updated[index][field] = value; setNeeds(updated);
    }
    if(section === 'wants') {
      const updated = [...wants]; updated[index][field] = value; setWants(updated);
    }
    if(section === 'notes') {
      const updated = [...notes]; updated[index] = value; setNotes(updated);
    }
    if(section === 'bucket') {
      const updated = [...bucketList]; updated[index].item = value; setBucketList(updated);
    }
  };

  const toggleDone = (index) => {
    const updated = [...bucketList]; updated[index].done = !updated[index].done; setBucketList(updated);
  };

  const renderTwoInputRow = (data, section) => (
    <ScrollView style={styles.sectionContentScroll}>
      {data.map((row, index) => (
        <View key={index} style={styles.rowContainer}>
          <TextInput
            style={styles.smallInput}
            placeholder="Element"
            value={row.element}
            onChangeText={(val) => handleInputChange(section, index, 'element', val)}
          />
          <TextInput
            style={styles.smallInput}
            placeholder="Amount"
            keyboardType="numeric"
            value={row.amount}
            onChangeText={(val) => handleInputChange(section, index, 'amount', val)}
          />
          <TouchableOpacity onPress={() => handleRemoveRow(section, index)}>
            <Ionicons name="remove-circle-outline" size={28} color="#d9534f" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow(section)}>
        <Ionicons name="add-circle-outline" size={30} color="#007bff" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSingleInputRow = (data, section) => (
    <ScrollView style={styles.sectionContentScroll}>
      {data.map((item, index) => (
        <View key={index} style={styles.rowContainer}>
          <TextInput
            style={styles.largeInput}
            placeholder={section === 'notes' ? "Note" : "Bucket Item"}
            value={section === 'notes' ? item : item.item}
            onChangeText={(val) => handleInputChange(section, index, section === 'notes' ? null : 'item', val)}
          />
          {section === 'bucket' ? (
            <TouchableOpacity onPress={() => toggleDone(index)}>
              <Ionicons name={item.done ? "checkmark-circle" : "ellipse-outline"} size={28} color="#28a745" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => handleRemoveRow(section, index)}>
              <Ionicons name="remove-circle-outline" size={28} color="#d9534f" />
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow(section)}>
        <Ionicons name="add-circle-outline" size={30} color="#007bff" />
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <ImageBackground 
      source={require('../assets/womenbackg.jpg')} 
      style={styles.background} resizeMode="cover"
    >
      <KeyboardAvoidingView style={styles.keyboardAvoidingContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome, {name}</Text>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => {
                      navigation.replace('Login');
                    },
                  },
                ],
              );
            }}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container}>

          {/* Income */}
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

          {/* Conditional Rendering: Cards or Section */}
          {!selectedSection ? (
            <View style={styles.sectionsContainer}>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('needs')}>
                  <View style={styles.sectionImageWrapper}><Image source={require('../assets/needs.jpg')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Needs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('wants')}>
                  <View style={styles.sectionImageWrapper}><Image source={require('../assets/wants.jpg')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Wants</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('notes')}>
                  <View style={styles.sectionImageWrapper}><Image source={require('../assets/notes.jpg')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('bucket')}>
                  <View style={styles.sectionImageWrapper}><Image source={require('../assets/bucket.jpg')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Bucket List</Text>
                </TouchableOpacity>
              </View>
          ) : (
            <View style={styles.fullScreenSectionContainer}> 
              <TouchableOpacity onPress={() => setSelectedSection(null)}  style={styles.backButton}>
                <Ionicons name="arrow-back" size={30} color="#702c51" />
              </TouchableOpacity>
              <Text style={styles.sectionHeader}>
                {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)}
              </Text>
              
              {/* Corrected: Income and Savings display inside Text components */}
              <View style={styles.sectionSummaryDisplay}>
                <Text style={styles.sectionSummaryText}>
                  Income: <Text style={styles.sectionSummaryAmount}>{monthlyIncome || '0'}</Text>
                </Text>
                <Text style={styles.sectionSummaryText}>
                  Savings: <Text style={styles.sectionSummaryAmount}>{savings || '0'}</Text>
                </Text>
              </View>

              {selectedSection === 'needs' && renderTwoInputRow(needs, 'needs')}
              {selectedSection === 'wants' && renderTwoInputRow(wants, 'wants')}
              {selectedSection === 'notes' && renderSingleInputRow(notes, 'notes')}
              {selectedSection === 'bucket' && renderSingleInputRow(bucketList, 'bucket')}
            </View>
          )}

        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  keyboardAvoidingContainer: { flex: 1 }, 
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 10,
  },
  container: { paddingVertical: 20, paddingHorizontal: 25, alignItems: 'center' },
  welcomeText: {
    fontSize: 28, fontWeight: 'bold', color: '#FFEEF2', 
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4, letterSpacing: 1, flex: 1,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  incomeContainer: { width: '100%', marginBottom: 35 },
  input: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 20, fontSize: 17, marginBottom: 15, color: '#333', elevation: 3 },
  sectionsContainer: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  sectionCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, alignItems: 'center', marginBottom: 20, paddingVertical: 25, elevation: 5 },
  sectionImageWrapper: { width: 70, height: 70, borderRadius: 35, overflow: 'hidden', marginBottom: 12 },
  sectionImage: { width: '100%', height: '100%' },
  sectionText: { fontSize: 18, fontWeight: '600', color: '#702c51' },
  sectionContainer: { width: '100%', marginBottom: 35 },
  fullScreenSectionContainer: { 
    width: '100%', 
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start'
  },
  sectionHeader: { fontSize: 22, fontWeight: '700', color: '#702c51', marginBottom: 10 },
  sectionContentScroll: {
    maxHeight: 300,
    width: '100%'
  },
  sectionSummaryDisplay: {
    backgroundColor: 'rgba(112, 44, 81, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%'
  },
  sectionSummaryText: {
    fontSize: 16,
    color: '#702c51',
    fontWeight: '600',
    marginBottom: 5
  },
  sectionSummaryAmount: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: 'bold'
  },
  rowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  smallInput: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, marginRight: 8 },
  largeInput: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, marginRight: 8 },
  addButton: { marginBottom: 20, alignSelf: 'flex-start' },
});

export default WomenScreen;