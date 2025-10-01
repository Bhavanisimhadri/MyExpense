import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TextInput, ScrollView, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const WomenScreen = ({ route }) => {
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
    data.map((row, index) => (
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
    ))
  );

  const renderSingleInputRow = (data, section) => (
    data.map((item, index) => (
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
    ))
  );

  return (
    <ImageBackground 
      source={require('../assets/womenbackg.jpg')} 
      style={styles.background} resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.welcomeText}>Welcome, {name}</Text>

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
            <View style={styles.sectionContainer}>
              <TouchableOpacity onPress={() => setSelectedSection(null)}  style={{marginBottom:20}}>
                <Ionicons name="arrow-back" size={30} color="#702c51" />
              </TouchableOpacity>
              <Text style={styles.sectionHeader}>
                {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)}
              </Text>

              {selectedSection === 'needs' && renderTwoInputRow(needs, 'needs')}
              {selectedSection === 'wants' && renderTwoInputRow(wants, 'wants')}
              {selectedSection === 'notes' && renderSingleInputRow(notes, 'notes')}
              {selectedSection === 'bucket' && renderSingleInputRow(bucketList, 'bucket')}

              <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow(selectedSection)}>
                <Ionicons name="add-circle-outline" size={30} color="#007bff" />
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  container: { paddingVertical: 40, paddingHorizontal: 25, alignItems: 'center' },
  welcomeText: {
    fontSize: 34, marginTop:20, fontWeight: 'bold', color: '#FFEEF2', textAlign: 'center',
    marginBottom: 25, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4, letterSpacing: 1,
  },
  incomeContainer: { width: '100%', marginBottom: 35 },
  input: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 20, fontSize: 17, marginBottom: 15, color: '#333', elevation: 3 },
  sectionsContainer: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  sectionCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, alignItems: 'center', marginBottom: 20, paddingVertical: 25, elevation: 5 },
  sectionImageWrapper: { width: 70, height: 70, borderRadius: 35, overflow: 'hidden', marginBottom: 12 },
  sectionImage: { width: '100%', height: '100%' },
  sectionText: { fontSize: 18, fontWeight: '600', color: '#702c51' },
  sectionContainer: { width: '100%', marginBottom: 35 },
  sectionHeader: { fontSize: 22, fontWeight: '700', color: '#FFEEF2', marginBottom: 10 },
  rowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  smallInput: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, marginRight: 8 },
  largeInput: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, marginRight: 8 },
  addButton: { marginBottom: 20, alignSelf: 'flex-start' },
});

export default WomenScreen;
