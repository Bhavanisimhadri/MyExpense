import React, { useState, useMemo } from 'react'; // Import useMemo
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  TextInput, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
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

  // --- Start of new/modified logic ---

  // Helper to safely parse numbers
  const parseAmount = (amountStr) => {
    const num = parseFloat(amountStr);
    return isNaN(num) ? 0 : num;
  };

  // Calculate total spent on Needs
  const totalNeeds = useMemo(() => {
    return needs.reduce((sum, item) => sum + parseAmount(item.amount), 0);
  }, [needs]);

  // Calculate total spent on Wants
  const totalWants = useMemo(() => {
    return wants.reduce((sum, item) => sum + parseAmount(item.amount), 0);
  }, [wants]);

  // Calculate the "new income" (monthly income minus initial savings)
  const effectiveMonthlyIncome = useMemo(() => {
    const income = parseAmount(monthlyIncome);
    const initialSavings = parseAmount(savings);
    return income - initialSavings;
  }, [monthlyIncome, savings]);

  // Calculate remaining balance after considering needs and wants,
  // and how much is left from savings if expenses exceed effective income.
  const { currentIncomeBalance, currentSavingsBalance } = useMemo(() => {
    let incomeRemaining = effectiveMonthlyIncome;
    let savingsRemaining = parseAmount(savings); // Start with the initial savings amount

    const totalExpenses = totalNeeds + totalWants;

    if (totalExpenses <= incomeRemaining) {
      // Expenses are covered by the effective income
      incomeRemaining -= totalExpenses;
    } else {
      // Expenses exceed effective income
      const excessExpenses = totalExpenses - incomeRemaining;
      incomeRemaining = 0; // Effective income is fully used

      // Deduct the excess from savings
      savingsRemaining -= excessExpenses;
    }

    return {
      currentIncomeBalance: incomeRemaining,
      currentSavingsBalance: savingsRemaining,
    };
  }, [effectiveMonthlyIncome, parseAmount(savings), totalNeeds, totalWants]); // Depend on parsed savings

  // --- End of new/modified logic ---


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
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingContainer} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} 
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.welcomeText}>Welcome, {name}</Text>
         
          {!selectedSection ? (
            <>
              <View style={styles.incomeInputContainer}>
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
            </>
          ) : (
            <View style={styles.fullScreenSectionContainer}> 
              <TouchableOpacity onPress={() => setSelectedSection(null)}  style={styles.backButton}>
                <Ionicons name="arrow-back" size={30} color="#702c51" />
              </TouchableOpacity>
              <Text style={styles.sectionHeader}>
                {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)}
              </Text>
              
              {/* Display Calculated Income and Savings */}
              <View style={styles.sectionSummaryDisplay}>
                <Text style={styles.sectionSummaryText}>
                  Remaining Income: <Text style={styles.sectionSummaryAmount}>${currentIncomeBalance.toFixed(2)}</Text>
                </Text>
                <Text style={styles.sectionSummaryText}>
                  Remaining Savings: <Text style={styles.sectionSummaryAmount}>${currentSavingsBalance.toFixed(2)}</Text>
                </Text>
              </View>

              {selectedSection === 'needs' && renderTwoInputRow(needs, 'needs')}
              {selectedSection === 'wants' && renderTwoInputRow(wants, 'wants')}
              {selectedSection === 'notes' && renderSingleInputRow(notes, 'notes')}
              {selectedSection === 'bucket' && renderSingleInputRow(bucketList, 'bucket')}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  keyboardAvoidingContainer: { flex: 1 }, 
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  container: { 
    paddingVertical: 40, 
    paddingHorizontal: 25, 
    alignItems: 'center',
    flexGrow: 1, 
  },
  welcomeText: {
    fontSize: 34, marginTop:20, fontWeight: 'bold', color: '#702c51', textAlign: 'center',
    marginBottom: 25, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4, letterSpacing: 1,
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 14,
    padding: 15,
    marginBottom: 25,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 18,
    color: '#FFEEF2',
    fontWeight: '600',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.3)', 
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  summaryAmount: {
    fontWeight: 'bold',
    color: '#E0BBE4', 
  },
  incomeInputContainer: { 
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
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
  },
  sectionsContainer: { 
    width: '100%', 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-around', 
    marginBottom: 25,
  },
  sectionCard: { 
    width: '46%', 
    backgroundColor: 'rgba(255,255,255,0.98)', 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 20, 
    paddingVertical: 20, 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 6,
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.6)', 
  },
  sectionImageWrapper: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    overflow: 'hidden', 
    marginBottom: 15, 
    backgroundColor: '#F7E7ED', 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2,
  },
  sectionImage: { 
    width: '90%', 
    height: '90%',
    borderRadius: 35, 
  },
  sectionText: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#702c51', 
    marginTop: 5, 
    textShadowColor: 'rgba(0,0,0,0.1)', 
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  fullScreenSectionContainer: {
    width: '100%',
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 20, 
    padding: 20,
    marginTop: -10, 
  },
  backButton: {
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  sectionHeader: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#702c51', 
    marginBottom: 20, 
    textAlign: 'center',
  },
  sectionSummaryDisplay: {
    backgroundColor: 'rgba(112, 44, 81, 0.1)', 
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
   
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sectionSummaryText: {
    fontSize: 16,
    color: '#702c51',
    fontWeight: '500',
  },
  sectionSummaryAmount: {
    fontWeight: 'bold',
    color: '#702c51', 
  },
  sectionContentScroll: { 
    flex: 1, 
    width: '100%',
    maxHeight: '70%', 
    paddingTop: 5,
  },
  rowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  smallInput: { 
    flex: 1, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 12, 
    padding: 12, 
    marginRight: 8, 
    fontSize: 16, 
    color: '#333',
    minHeight: 45, 
  },
  largeInput: { 
    flex: 1, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 12, 
    padding: 12, 
    marginRight: 8, 
    fontSize: 16, 
    color: '#333',
    minHeight: 45, 
  },
  addButton: { 
    marginTop: 20, 
    marginBottom: 10, 
    alignSelf: 'center', 
    backgroundColor: '#e6f2ff', 
    borderRadius: 50,
    padding: 8,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});

export default WomenScreen;