
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  BackHandler,
  Image
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import DatabaseHelper from '../Screens/DatabaseHelper';

const PartnersScreen = ({ route, navigation }) => {
  const { name, mobile } = route.params;

  const [selectedSection, setSelectedSection] = useState(null);
  const [showReports, setShowReports] = useState(false);

  // State for current month's data for both partners
  const [herMonthlyIncome, setHerMonthlyIncome] = useState('');
  const [herSavings, setHerSavings] = useState('');
  const [hisMonthlyIncome, setHisMonthlyIncome] = useState('');
  const [hisSavings, setHisSavings] = useState('');

  const [herExpenses, setHerExpenses] = useState([{ element: '', amount: '' }]);
  const [hisExpenses, setHisExpenses] = useState([{ element: '', amount: '' }]);

  // State for persistent data (not month-specific)
  const [notes, setNotes] = useState(['']);
  const [coupleGoals, setCoupleGoals] = useState([{ item: '', done: false }]);
  
  // New state for memories
  const [memories, setMemories] = useState([{ image: null, note: '' }]);

  // State to hold all historical financial data for reports
  const [allFinancialData, setAllFinancialData] = useState({});

  // Get current year and month for data storage key
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const financialDataKey = `partner_financials_${currentYear}_${currentMonth}`;

  // --- Data Persistence Logic ---
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "Exit App",
        "Are you sure you want to exit?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes", onPress: () => BackHandler.exitApp() }
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentFinancials = await DatabaseHelper.getUserData(mobile, financialDataKey);
        if (currentFinancials) {
          setHerMonthlyIncome(currentFinancials.herMonthlyIncome || '');
          setHerSavings(currentFinancials.herSavings || '');
          setHisMonthlyIncome(currentFinancials.hisMonthlyIncome || '');
          setHisSavings(currentFinancials.hisSavings || '');
          setHerExpenses(currentFinancials.herExpenses && currentFinancials.herExpenses.length > 0 ? currentFinancials.herExpenses : [{ element: '', amount: '' }]);
          setHisExpenses(currentFinancials.hisExpenses && currentFinancials.hisExpenses.length > 0 ? currentFinancials.hisExpenses : [{ element: '', amount: '' }]);
        }

        const notesData = await DatabaseHelper.getUserData(mobile, 'partner_notes');
        setNotes(notesData && notesData.length > 0 ? notesData : ['']);

        const coupleGoalsData = await DatabaseHelper.getUserData(mobile, 'coupleGoals');
        setCoupleGoals(coupleGoalsData && coupleGoalsData.length > 0 ? coupleGoalsData : [{ item: '', done: false }]);

        const memoriesData = await DatabaseHelper.getUserData(mobile, 'memories');
        setMemories(memoriesData && memoriesData.length > 0 ? memoriesData : [{ image: null, note: '' }]);

        const allFinancials = await DatabaseHelper.getAllUserFinancialKeys(mobile, 'partner_financials');
        setAllFinancialData(allFinancials);

      } catch (error) {
        console.error("Failed to load data from database", error);
      }
    };

    loadData();
  }, [mobile]);

  useEffect(() => {
    const saveData = async () => {
      try {
        const currentFinancials = {
          herMonthlyIncome,
          herSavings,
          hisMonthlyIncome,
          hisSavings,
          herExpenses,
          hisExpenses,
        };

        await DatabaseHelper.saveUserData(mobile, financialDataKey, currentFinancials);
        await DatabaseHelper.saveUserData(mobile, 'partner_notes', notes);
        await DatabaseHelper.saveUserData(mobile, 'coupleGoals', coupleGoals);
        await DatabaseHelper.saveUserData(mobile, 'memories', memories);

      } catch (error) {
        console.error("Failed to save data to database", error);
      }
    };

    saveData();
  }, [herMonthlyIncome, herSavings, hisMonthlyIncome, hisSavings, herExpenses, hisExpenses, notes, coupleGoals, memories, mobile]);

  // --- Calculation Logic ---
  const parseAmount = (amountStr) => {
    if (typeof amountStr === 'number') return amountStr;
    const num = parseFloat(String(amountStr || '').replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const totalHerExpenses = useMemo(() => herExpenses.reduce((sum, item) => sum + parseAmount(item.amount), 0), [herExpenses]);
  const totalHisExpenses = useMemo(() => hisExpenses.reduce((sum, item) => sum + parseAmount(item.amount), 0), [hisExpenses]);
  
  const { herIncomeBalance, herSavingsBalance } = useMemo(() => {
    const income = parseAmount(herMonthlyIncome);
    const savings = parseAmount(herSavings);
    let incomeRemaining = income - savings;
    let savingsRemaining = savings;

    if (totalHerExpenses <= incomeRemaining) {
      incomeRemaining -= totalHerExpenses;
    } else {
      const excess = totalHerExpenses - incomeRemaining;
      incomeRemaining = 0;
      savingsRemaining -= excess;
    }
    return { herIncomeBalance: incomeRemaining, herSavingsBalance: savingsRemaining };
  }, [herMonthlyIncome, herSavings, totalHerExpenses]);

  const { hisIncomeBalance, hisSavingsBalance } = useMemo(() => {
    const income = parseAmount(hisMonthlyIncome);
    const savings = parseAmount(hisSavings);
    let incomeRemaining = income - savings;
    let savingsRemaining = savings;

    if (totalHisExpenses <= incomeRemaining) {
      incomeRemaining -= totalHisExpenses;
    } else {
      const excess = totalHisExpenses - incomeRemaining;
      incomeRemaining = 0;
      savingsRemaining -= excess;
    }
    return { hisIncomeBalance: incomeRemaining, hisSavingsBalance: savingsRemaining };
  }, [hisMonthlyIncome, hisSavings, totalHisExpenses]);

  const { currentIncomeBalance, currentSavingsBalance } = useMemo(() => {
    const totalIncome = parseAmount(herMonthlyIncome) + parseAmount(hisMonthlyIncome);
    const totalSavings = parseAmount(herSavings) + parseAmount(hisSavings);
    let incomeRemaining = totalIncome - totalSavings;
    let savingsRemaining = totalSavings;
    const totalExpenses = totalHerExpenses + totalHisExpenses;

    if (totalExpenses <= incomeRemaining) {
      incomeRemaining -= totalExpenses;
    } else {
      const excess = totalExpenses - incomeRemaining;
      incomeRemaining = 0;
      savingsRemaining -= excess;
    }
    return { currentIncomeBalance: incomeRemaining, currentSavingsBalance: savingsRemaining };
  }, [herMonthlyIncome, hisMonthlyIncome, herSavings, hisSavings, totalHerExpenses, totalHisExpenses]);

  // --- Handlers ---
  const handleAddRow = (section) => {
    if (section === 'herExpenses' && herExpenses.length > 0 && (!herExpenses[herExpenses.length - 1].element.trim() || !herExpenses[herExpenses.length - 1].amount)) {
        Alert.alert("Validation Error", "Please fill in the current expense before adding a new one."); return;
    }
    if (section === 'hisExpenses' && hisExpenses.length > 0 && (!hisExpenses[hisExpenses.length - 1].element.trim() || !hisExpenses[hisExpenses.length - 1].amount)) {
        Alert.alert("Validation Error", "Please fill in the current expense before adding a new one."); return;
    }
    if (section === 'notes' && notes.length > 0 && !notes[notes.length - 1].trim()) {
        Alert.alert("Validation Error", "Please fill in the current 'Note' before adding a new one."); return;
    }
    if (section === 'coupleGoals' && coupleGoals.length > 0 && !coupleGoals[coupleGoals.length - 1].item.trim()) {
        Alert.alert("Validation Error", "Please fill in the current 'Couple Goal' before adding a new one."); return;
    }
    if (section === 'memories' && memories.length > 0 && (!memories[memories.length - 1].note.trim() && !memories[memories.length - 1].image)) {
        Alert.alert("Validation Error", "Please add an image or note before adding a new memory."); return;
    }

    if (section === 'herExpenses') setHerExpenses([...herExpenses, { element: '', amount: '' }]);
    if (section === 'hisExpenses') setHisExpenses([...hisExpenses, { element: '', amount: '' }]);
    if (section === 'notes') setNotes([...notes, '']);
    if (section === 'coupleGoals') setCoupleGoals([...coupleGoals, { item: '', done: false }]);
    if (section === 'memories') setMemories([...memories, { image: null, note: '' }]);
};

const handleRemoveRow = (section, index) => {
    if (section === 'herExpenses') {
        const updated = herExpenses.filter((_, i) => i !== index);
        setHerExpenses(updated.length > 0 ? updated : [{ element: '', amount: '' }]);
    }
    if (section === 'hisExpenses') {
        const updated = hisExpenses.filter((_, i) => i !== index);
        setHisExpenses(updated.length > 0 ? updated : [{ element: '', amount: '' }]);
    }
    if (section === 'notes') {
        const updated = notes.filter((_, i) => i !== index);
        setNotes(updated.length > 0 ? updated : ['']);
    }
    if (section === 'coupleGoals') {
        const updated = coupleGoals.filter((_, i) => i !== index);
        setCoupleGoals(updated.length > 0 ? updated : [{ item: '', done: false }]);
    }
    if (section === 'memories') {
        const updated = memories.filter((_, i) => i !== index);
        setMemories(updated.length > 0 ? updated : [{ image: null, note: '' }]);
    }
};

  const handleInputChange = (section, index, field, value) => {
    if (section === 'herExpenses') { const updated = [...herExpenses]; updated[index][field] = value; setHerExpenses(updated); }
    if (section === 'hisExpenses') { const updated = [...hisExpenses]; updated[index][field] = value; setHisExpenses(updated); }
    if (section === 'notes') { const updated = [...notes]; updated[index] = value; setNotes(updated); }
    if (section === 'coupleGoals') { const updated = [...coupleGoals]; updated[index].item = value; setCoupleGoals(updated); }
    if (section === 'memories') { const updated = [...memories]; updated[index][field] = value; setMemories(updated); }
  };

  const toggleDone = (index) => {
    const updated = [...coupleGoals]; updated[index].done = !updated[index].done; setCoupleGoals(updated);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('userToken'); 
            navigation.navigate('Login');
          } catch (e) {
            console.error("Logout error:", e);
            Alert.alert("Error", "An error occurred during logout.");
          }
        },
      },
    ]);
  };

  // --- Image Picker Handler ---
  const handleImagePick = (index) => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert("Error", "Failed to pick image. Ensure you have granted permissions.");
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        const updatedMemories = [...memories];
        updatedMemories[index].image = imageUri;
        setMemories(updatedMemories);
      }
    });
  };

  // --- Render Functions ---
  const renderExpenseRow = (data, section) => (
    <ScrollView style={styles.sectionContentScroll}>
      {data.map((row, index) => (
        <View key={index} style={styles.rowContainer}>
          <TextInput style={styles.smallInput} placeholder="Expense Item" value={row.element} onChangeText={(val) => handleInputChange(section, index, 'element', val)} />
          <TextInput style={styles.smallInput} placeholder="Amount" keyboardType="numeric" value={String(row.amount)} onChangeText={(val) => handleInputChange(section, index, 'amount', val)} />
          <TouchableOpacity onPress={() => handleRemoveRow(section, index)}>
            <Ionicons name="remove-circle-outline" size={28} color="#D81B60" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow(section)}>
        <Ionicons name="add-circle" size={30} color="#AD1457" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderGoalsOrNotesRow = (data, section) => (
    <ScrollView style={styles.sectionContentScroll}>
      {data.map((item, index) => (
        <View key={index} style={styles.rowContainer}>
          <TextInput 
            style={styles.largeInput} 
            placeholder={section === 'notes' ? "Note" : "Couple Goal"} 
            value={section === 'notes' ? item : item.item} 
            onChangeText={(val) => handleInputChange(section, index, section === 'notes' ? null : 'item', val)} 
          />
          {section === 'coupleGoals' ? (
            <TouchableOpacity onPress={() => toggleDone(index)}>
              <Ionicons name={item.done ? "heart" : "heart-outline"} size={28} color="#C2185B" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => handleRemoveRow(section, index)}>
              <Ionicons name="remove-circle-outline" size={28} color="#D81B60" />
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow(section)}>
        <Ionicons name="add-circle" size={30} color="#AD1457" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderMemoriesRow = () => (
    <ScrollView style={styles.sectionContentScroll}>
      {memories.map((memory, index) => (
        <View key={index} style={styles.memoryRowContainer}>
          <TouchableOpacity 
            style={styles.imagePickerContainer}
            onPress={() => handleImagePick(index)}
          >
            {memory.image ? (
              <Image source={{ uri: memory.image }} style={styles.memoryImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#C2185B" />
                <Text style={styles.imagePlaceholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <TextInput 
            style={styles.memoryNoteInput} 
            placeholder="Memory note..." 
            value={memory.note}
            onChangeText={(val) => handleInputChange('memories', index, 'note', val)}
            multiline
          />
          <TouchableOpacity onPress={() => handleRemoveRow('memories', index)}>
            <Ionicons name="remove-circle-outline" size={28} color="#D81B60" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow('memories')}>
        <Ionicons name="add-circle" size={30} color="#AD1457" />
      </TouchableOpacity>
    </ScrollView>
  );
  
  const renderReports = () => {
    const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const reportsByYear = Object.keys(allFinancialData).reduce((acc, key) => {
        const parts = key.split('_');
        if (parts.length < 4) return acc; 
        const year = parts[2];
        const month = parseInt(parts[3], 10);
        const data = allFinancialData[key];

        if (!acc[year]) {
            acc[year] = [];
        }

        const totalHerExp = (data.herExpenses || []).reduce((sum, item) => sum + parseAmount(item.amount), 0);
        const totalHisExp = (data.hisExpenses || []).reduce((sum, item) => sum + parseAmount(item.amount), 0);
        const totalIncome = parseAmount(data.herMonthlyIncome) + parseAmount(data.hisMonthlyIncome);
        const totalSavings = parseAmount(data.herSavings) + parseAmount(data.hisSavings);

        acc[year].push({
            month,
            monthName: monthNames[month],
            totalIncome,
            totalSavings,
            totalExpenses: totalHerExp + totalHisExp,
        });

        return acc;
    }, {});

    const sortedYears = Object.keys(reportsByYear).sort((a, b) => b - a);

    return (
        <View style={styles.fullScreenSectionContainer}>
            <TouchableOpacity onPress={() => setShowReports(false)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={30} color="#C2185B" />
            </TouchableOpacity>
            <Text style={styles.sectionHeader}>Financial Reports</Text>
            <ScrollView>
                {sortedYears.length > 0 ? (
                    sortedYears.map(year => (
                        <View key={year} style={styles.reportYearContainer}>
                            <Text style={styles.reportYearHeader}>{year}</Text>
                            {reportsByYear[year].sort((a, b) => b.month - a.month).map(monthData => (
                                <View key={monthData.month} style={styles.reportMonthContainer}>
                                    <Text style={styles.reportMonthHeader}>{monthData.monthName}</Text>
                                    <Text style={styles.reportSummaryText}>Total Income: ${monthData.totalIncome.toFixed(2)}</Text>
                                    <Text style={styles.reportSummaryText}>Total Savings: ${monthData.totalSavings.toFixed(2)}</Text>
                                    <Text style={styles.reportHighlightText}>Total Expenses: ${monthData.totalExpenses.toFixed(2)}</Text>
                                </View>
                            ))}
                        </View>
                    ))
                ) : (
                    <Text style={styles.noDataText}>No financial data recorded yet.</Text>
                )}
            </ScrollView>
        </View>
    );
};

  return (
    <ImageBackground
      source={require('../assets/coupleback.jpg')}
      style={styles.background} resizeMode="cover"
    >
      <KeyboardAvoidingView style={styles.keyboardAvoidingContainer} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome, {name}</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutIconButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {showReports ? (
            renderReports()
          ) : !selectedSection ? (
            <>
              <View style={styles.incomeInputContainer}>
                <View style={styles.partnerIncomeContainer}>
                  <TextInput style={styles.input} placeholder="Her Monthly Income" placeholderTextColor="#666" keyboardType="numeric" value={String(herMonthlyIncome)} onChangeText={setHerMonthlyIncome} />
                  <TextInput style={styles.input} placeholder="Her Savings" placeholderTextColor="#666" keyboardType="numeric" value={String(herSavings)} onChangeText={setHerSavings} />
                </View>
                <View style={styles.partnerIncomeContainer}>
                  <TextInput style={styles.input} placeholder="His Monthly Income" placeholderTextColor="#666" keyboardType="numeric" value={String(hisMonthlyIncome)} onChangeText={setHisMonthlyIncome} />
                  <TextInput style={styles.input} placeholder="His Savings" placeholderTextColor="#666" keyboardType="numeric" value={String(hisSavings)} onChangeText={setHisSavings} />
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowReports(true)} style={styles.reportsButton}>
                <Text style={styles.reportsLink}>Financial Overview</Text>
              </TouchableOpacity>
              <View style={styles.sectionsContainer}>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('herExpenses')}>
                <View style={styles.sectionImageWrapper}><Image source={require('../assets/her.png')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Her Expenses</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('hisExpenses')}>
                <View style={styles.sectionImageWrapper}><Image source={require('../assets/his.webp')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>His Expenses</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('coupleGoals')}>
                <View style={styles.sectionImageWrapper}><Image source={require('../assets/couplegoals.jpg')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Couple Goals</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('notes')}>
                <View style={styles.sectionImageWrapper}><Image source={require('../assets/notesc.jpg')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('memories')}>
                <View style={styles.sectionImageWrapper}><Image source={require('../assets/memories.jpg')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Memories</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.fullScreenSectionContainer}>
              <TouchableOpacity onPress={() => setSelectedSection(null)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={30} color="#C2185B" />
              </TouchableOpacity>
              <Text style={styles.sectionHeader}>
                {selectedSection === 'herExpenses' && "Her Expenses"}
                {selectedSection === 'hisExpenses' && "His Expenses"}
                {selectedSection === 'coupleGoals' && "Couple Goals"}
                {selectedSection === 'notes' && "Notes"}
                {selectedSection === 'memories' && "Memories"}
              </Text>
              <View style={styles.sectionSummaryDisplay}>
                {selectedSection === 'herExpenses' && (
                  <>
                    <Text style={styles.sectionSummaryText}>Her Remaining Income: <Text style={styles.sectionSummaryAmount}>${herIncomeBalance.toFixed(2)}</Text></Text>
                    <Text style={styles.sectionSummaryText}>Her Remaining Savings: <Text style={styles.sectionSummaryAmount}>${herSavingsBalance.toFixed(2)}</Text></Text>
                  </>
                )}
                {selectedSection === 'hisExpenses' && (
                  <>
                    <Text style={styles.sectionSummaryText}>His Remaining Income: <Text style={styles.sectionSummaryAmount}>${hisIncomeBalance.toFixed(2)}</Text></Text>
                    <Text style={styles.sectionSummaryText}>His Remaining Savings: <Text style={styles.sectionSummaryAmount}>${hisSavingsBalance.toFixed(2)}</Text></Text>
                  </>
                )}
                {(selectedSection === 'coupleGoals' || selectedSection === 'notes' || selectedSection === 'memories') && (
                  <>
                    <Text style={styles.sectionSummaryText}>Combined Remaining Income: <Text style={styles.sectionSummaryAmount}>${currentIncomeBalance.toFixed(2)}</Text></Text>
                    <Text style={styles.sectionSummaryText}>Combined Remaining Savings: <Text style={styles.sectionSummaryAmount}>${currentSavingsBalance.toFixed(2)}</Text></Text>
                  </>
                )}
              </View>
              {selectedSection === 'herExpenses' && renderExpenseRow(herExpenses, 'herExpenses')}
              {selectedSection === 'hisExpenses' && renderExpenseRow(hisExpenses, 'hisExpenses')}
              {selectedSection === 'coupleGoals' && renderGoalsOrNotesRow(coupleGoals, 'coupleGoals')}
              {selectedSection === 'notes' && renderGoalsOrNotesRow(notes, 'notes')}
              {selectedSection === 'memories' && renderMemoriesRow()}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%', backgroundColor: '#FCE4EC' },
   keyboardAvoidingContainer: { flex: 1 },
   container: {
     paddingVertical: 40,
     paddingHorizontal: 25,
     alignItems: 'center',
     flexGrow: 1,
   },
   welcomeText: {
     fontSize: 28,
     fontWeight: 'bold',
     color: '#880E4F',
     textAlign: 'center',
     flexShrink: 1, // Allow text to shrink if needed
   },
   incomeInputContainer: {
     width: '100%',
     marginBottom: 10,
     backgroundColor: 'rgba(255, 255, 255, 0.8)',
     borderRadius: 15,
     padding: 10,
   },
   partnerIncomeContainer:{
     flexDirection: 'row',
     justifyContent: 'space-between',
   },
   input: {
     backgroundColor: 'rgba(255,255,255,0.95)',
     borderRadius: 14,
     paddingVertical: 12,
     paddingHorizontal: 15,
     fontSize: 16,
     marginBottom: 10,
     color: '#333',
     width: '48%',
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
     fontSize: 18,
     fontWeight: '700',
     color: '#880E4F',
     marginTop: 10,
   },
   fullScreenSectionContainer: {
     width: '100%',
     height: '100%', // Make it take full available space
     backgroundColor: 'rgba(255,255,255,0.95)',
     borderRadius: 20,
     padding: 20,
   },
   backButton: {
     marginBottom: 15,
     alignSelf: 'flex-start',
   },
   sectionHeader: {
     fontSize: 28,
     fontWeight: '800',
     color: '#880E4F',
     marginBottom: 20,
     textAlign: 'center',
   },
   sectionSummaryDisplay: {
     backgroundColor: 'rgba(194, 24, 91, 0.1)',
     borderRadius: 12,
     padding: 10,
     marginBottom: 20,
     alignItems: 'center',
   },
   sectionSummaryText: {
     fontSize: 16,
     color: '#880E4F',
     fontWeight: '500',
     marginVertical: 2,
   },
   sectionSummaryAmount: {
     fontWeight: 'bold',
     color: '#C2185B',
   },
   logoutText: {
     color: '#880E4F',
     fontWeight: 'bold',
     fontSize: 16,
   },
   sectionContentScroll: {
     flex: 1,
     width: '100%',
   },
   rowContainer: { 
     flexDirection: 'row', 
     alignItems: 'center', 
     marginBottom: 12 
   },
   memoryRowContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 15,
   },
   smallInput: {
     flex: 1,
     backgroundColor: '#FCE4EC',
     borderRadius: 12,
     padding: 12,
     marginRight: 8,
     fontSize: 16,
   },
   largeInput: {
     flex: 1,
     backgroundColor: '#FCE4EC',
     borderRadius: 12,
     padding: 12,
     marginRight: 8,
     fontSize: 16,
   },
   memoryNoteInput: {
     flex: 1,
     backgroundColor: '#FCE4EC',
     borderRadius: 12,
     padding: 12,
     marginHorizontal: 8,
     fontSize: 16,
     minHeight: 80,
     textAlignVertical: 'top',
   },
   imagePickerContainer: {
     width: 100,
     height: 100,
     borderRadius: 12,
     overflow: 'hidden',
   },
   memoryImage: {
     width: '100%',
     height: '100%',
     borderRadius: 12,
   },
   imagePlaceholder: {
     width: '100%',
     height: '100%',
     backgroundColor: '#F8BBD0',
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: 12,
     borderWidth: 2,
     borderColor: '#C2185B',
     borderStyle: 'dashed',
   },
   imagePlaceholderText: {
     color: '#880E4F',
     fontSize: 12,
     marginTop: 5,
     textAlign: 'center',
   },
   addButton: {
     marginTop: 10,
     alignSelf: 'center',
   },
   reportsButton: {
     backgroundColor: 'rgba(236, 64, 122, 0.8)',
     paddingVertical: 12,
     paddingHorizontal: 20,
     borderRadius: 50,
     alignItems: 'center',
     marginBottom: 20
   },
   reportsLink: {
     fontSize: 18,
     color: '#fff',
     fontWeight: '600',
   },
   reportYearContainer: {
     marginBottom: 20,
     backgroundColor: '#fff',
     padding: 15,
     borderRadius: 10,
     elevation: 2,
   },
   reportYearHeader: {
     fontSize: 22,
     fontWeight: 'bold',
     color: '#880E4F',
     marginBottom: 10
   },
   reportMonthContainer: {
     marginTop: 10,
     marginLeft: 10,
     borderLeftWidth: 3,
     borderLeftColor: '#F48FB1',
     paddingLeft: 10
   },
   reportMonthHeader: {
     fontSize: 18,
     fontWeight: '600',
     color: '#C2185B'
   },
   reportSummaryText: {
     fontSize: 16,
     fontWeight: '500',
     color: '#333',
     marginBottom: 5
   },
   reportHighlightText: {
     fontSize: 14,
     fontWeight: '600',
     color: '#AD1457',
     marginTop: 4,
     marginBottom: 2,
     fontStyle: 'italic',
   },
   noDataText: {
     textAlign: 'center',
     marginTop: 40,
     fontSize: 16,
     color: '#880E4F',
   },
   welcomeContainer: {
     flexDirection: 'row',
     width: '100%',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginTop: 20,
     marginBottom: 25,
     paddingHorizontal: 5,
   },
   logoutIconButton: {
     padding: 15,
     borderRadius: 30,
     backgroundColor: 'rgba(255, 255, 255, 0.8)',
   },
 });
 
 export default PartnersScreen;
