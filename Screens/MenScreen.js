import React, { useState, useMemo, useEffect } from 'react';
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
  Platform,
  Alert,
  BackHandler
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseHelper from '../Screens/DatabaseHelper';
const MenScreen = ({ route, navigation }) => {
  const { name, mobile } = route.params; // mobileNumber is used as a key for storage

  const [selectedSection, setSelectedSection] = useState(null);
  const [showReports, setShowReports] = useState(false);

  // State for current month's data
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [needs, setNeeds] = useState([{ element: '', amount: '' }]);
  const [wants, setWants] = useState([{ element: '', amount: '' }]);

  // State for persistent data (not month-specific)
  const [notes, setNotes] = useState(['']);
  const [bucketList, setBucketList] = useState([{ item: '', done: false }]);

  // State to hold all historical financial data for reports
  const [allFinancialData, setAllFinancialData] = useState({});

  // Get current year and month for data storage key
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const financialDataKey = `financials_${currentYear}_${currentMonth}`;

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
      return true; // prevent default behavior
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
        // Load current month's financial data
        const currentFinancials = await DatabaseHelper.getUserData(mobile, financialDataKey);
        if (currentFinancials) {
          setMonthlyIncome(currentFinancials.monthlyIncome || '');
          setSavings(currentFinancials.savings || '');
          setNeeds(currentFinancials.needs && currentFinancials.needs.length > 0 ? currentFinancials.needs : [{ element: '', amount: '' }]);
          setWants(currentFinancials.wants && currentFinancials.wants.length > 0 ? currentFinancials.wants : [{ element: '', amount: '' }]);
        }

        // Load persistent data
        const notesData = await DatabaseHelper.getUserData(mobile, 'notes');
        setNotes(notesData && notesData.length > 0 ? notesData : ['']);

        const bucketListData = await DatabaseHelper.getUserData(mobile, 'bucketList');
        setBucketList(bucketListData && bucketListData.length > 0 ? bucketListData : [{ item: '', done: false }]);

        // Load all financial data for reports
        const allFinancials = await DatabaseHelper.getAllUserFinancialKeys(mobile);
        setAllFinancialData(allFinancials);

      } catch (error) {
        console.error("Failed to load data from database", error);
      }
    };

    loadData();
  }, [mobile]);

  // Save data to SQLite
  useEffect(() => {
    const saveData = async () => {
      try {
        const currentFinancials = {
          monthlyIncome,
          savings,
          needs,
          wants,
        };

        // Save current month's financial data
        await DatabaseHelper.saveUserData(mobile, financialDataKey, currentFinancials);
        
        // Save persistent data
        await DatabaseHelper.saveUserData(mobile, 'notes', notes);
        await DatabaseHelper.saveUserData(mobile, 'bucketList', bucketList);

      } catch (error) {
        console.error("Failed to save data to database", error);
      }
    };

    saveData();
  }, [monthlyIncome, savings, needs, wants, notes, bucketList, mobile]);



  // --- Calculation Logic (Memoized for performance) ---

  const parseAmount = (amountStr) => {
    const num = parseFloat(String(amountStr).replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const totalNeeds = useMemo(() => needs.reduce((sum, item) => sum + parseAmount(item.amount), 0), [needs]);
  const totalWants = useMemo(() => wants.reduce((sum, item) => sum + parseAmount(item.amount), 0), [wants]);

  const effectiveMonthlyIncome = useMemo(() => {
    const income = parseAmount(monthlyIncome);
    const initialSavings = parseAmount(savings);
    return income - initialSavings;
  }, [monthlyIncome, savings]);

  const { currentIncomeBalance, currentSavingsBalance } = useMemo(() => {
    let incomeRemaining = effectiveMonthlyIncome;
    let savingsRemaining = parseAmount(savings);
    const totalExpenses = totalNeeds + totalWants;

    if (totalExpenses <= incomeRemaining) {
      incomeRemaining -= totalExpenses;
    } else {
      const excessExpenses = totalExpenses - incomeRemaining;
      incomeRemaining = 0;
      savingsRemaining -= excessExpenses;
    }

    return {
      currentIncomeBalance: incomeRemaining,
      currentSavingsBalance: savingsRemaining,
    };
  }, [effectiveMonthlyIncome, savings, totalNeeds, totalWants]);


  // --- Handlers for adding/removing/updating rows ---

  const handleAddRow = (section) => {
    // Validation: Prevent adding a new row if the last one is empty
    if (section === 'needs') {
      const lastNeed = needs[needs.length - 1];
      if (!lastNeed.element.trim() || !lastNeed.amount.trim()) {
        Alert.alert("Validation Error", "Please fill in the current 'Need' before adding a new one.");
        return;
      }
      setNeeds([...needs, { element: '', amount: '' }]);
    }
    if (section === 'wants') {
      const lastWant = wants[wants.length - 1];
      if (!lastWant.element.trim() || !lastWant.amount.trim()) {
        Alert.alert("Validation Error", "Please fill in the current 'Want' before adding a new one.");
        return;
      }
      setWants([...wants, { element: '', amount: '' }]);
    }
    if (section === 'notes') {
      if (!notes[notes.length - 1].trim()) {
        Alert.alert("Validation Error", "Please fill in the current 'Note' before adding a new one.");
        return;
      }
      setNotes([...notes, '']);
    }
    if (section === 'bucket') {
      if (!bucketList[bucketList.length - 1].item.trim()) {
        Alert.alert("Validation Error", "Please fill in the current 'Bucket List' item before adding a new one.");
        return;
      }
      setBucketList([...bucketList, { item: '', done: false }]);
    }
  };

  const handleRemoveRow = (section, index) => {
    if (section === 'needs') setNeeds(needs.filter((_, i) => i !== index));
    if (section === 'wants') setWants(wants.filter((_, i) => i !== index));
    if (section === 'notes') setNotes(notes.filter((_, i) => i !== index));
    if (section === 'bucket') setBucketList(bucketList.filter((_, i) => i !== index));
  };

  const handleInputChange = (section, index, field, value) => {
    if (section === 'needs') {
      const updated = [...needs]; updated[index][field] = value; setNeeds(updated);
    }
    if (section === 'wants') {
      const updated = [...wants]; updated[index][field] = value; setWants(updated);
    }
    if (section === 'notes') {
      const updated = [...notes]; updated[index] = value; setNotes(updated);
    }
    if (section === 'bucket') {
      const updated = [...bucketList]; updated[index].item = value; setBucketList(updated);
    }
  };

  const toggleDone = (index) => {
    const updated = [...bucketList]; updated[index].done = !updated[index].done; setBucketList(updated);
  };

  // --- Render Functions ---

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
            value={String(row.amount)}
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

  const renderReports = () => {
    const yearlyReports = {};


    // Better: get directly from bucketList
    const accomplishedBuckets = bucketList.filter(item => item.done);

    // Group data by year and month
    Object.keys(allFinancialData).forEach(key => {
      const [_, year, month] = key.split('_');
      if (!yearlyReports[year]) {
        yearlyReports[year] = { months: {}, totalSpent: 0, totalIncome: 0, totalSavings: 0 };
      }
      const data = allFinancialData[key];
      const monthlyNeeds = (data.needs || []).reduce((sum, item) => sum + parseAmount(item.amount), 0);
      const monthlyWants = (data.wants || []).reduce((sum, item) => sum + parseAmount(item.amount), 0);
      const monthlySpent = monthlyNeeds + monthlyWants;
      const monthlyIncomeVal = parseAmount(data.monthlyIncome);
      const monthlySavingsVal = parseAmount(data.savings);

      yearlyReports[year].months[month] = {
        income: monthlyIncomeVal,
        savings: monthlySavingsVal,
        spent: monthlySpent,
        remainingSavings: monthlySavingsVal - Math.max(0, monthlySpent - (monthlyIncomeVal - monthlySavingsVal)),
        // Pass the detailed expenses for analysis
        expenses: [...(data.needs || []), ...(data.wants || [])]
      };
      yearlyReports[year].totalSpent += monthlySpent;
      yearlyReports[year].totalIncome += monthlyIncomeVal;
      yearlyReports[year].totalSavings += monthlySavingsVal;
    });

    return (
      <View style={styles.fullScreenSectionContainer}>
        <TouchableOpacity onPress={() => setShowReports(false)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={30} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.sectionHeader}>Reports</Text>
        <ScrollView>
          {Object.keys(yearlyReports).sort((a, b) => b - a).map(year => (
            <View key={year} style={styles.reportYearContainer}>
              <Text style={styles.reportYearHeader}>{year}</Text>
              <Text style={styles.reportSummaryText}>Yearly Income: ${yearlyReports[year].totalIncome.toFixed(2)}</Text>
              <Text style={styles.reportSummaryText}>Yearly Savings: ${yearlyReports[year].totalSavings.toFixed(2)}</Text>
              <Text style={styles.reportSummaryText}>Yearly Spent: ${yearlyReports[year].totalSpent.toFixed(2)}</Text>
              {bucketList.filter(item => item.done).length > 0 && (
                <View style={{ marginTop: 5 }}>
                  <Text style={styles.reportHighlightText}>Accomplished Bucket items:</Text>
                  {bucketList
                    .filter(item => item.done)
                    .map((item, index) => (
                      <Text key={index} style={styles.reportHighlightText}>
                        - {item.item}
                      </Text>
                    ))}
                </View>
              )}

              {Object.keys(yearlyReports[year].months).sort((a, b) => b - a).map(month => {
                const monthData = yearlyReports[year].months[month];
                const validExpenses = monthData.expenses.filter(item => item.element && parseAmount(item.amount) > 0);

                let mostSpentText = null;
                let leastSpentText = null;

                if (validExpenses.length > 0) {
                  const sortedExpenses = [...validExpenses].sort((a, b) => parseAmount(b.amount) - parseAmount(a.amount));
                  const mostSpentItem = sortedExpenses[0];
                  const leastSpentItem = sortedExpenses[sortedExpenses.length - 1];

                  mostSpentText = `Most spent on: ${mostSpentItem.element} ($${parseAmount(mostSpentItem.amount).toFixed(2)})`;

                  if (sortedExpenses.length > 1 && parseAmount(mostSpentItem.amount) !== parseAmount(leastSpentItem.amount)) {
                    leastSpentText = `Least spent on: ${leastSpentItem.element} ($${parseAmount(leastSpentItem.amount).toFixed(2)})`;
                  }
                }

                return (
                  <View key={month} style={styles.reportMonthContainer}>
                    <Text style={styles.reportMonthHeader}>{new Date(year, month - 1).toLocaleString('default', { month: 'long' })}</Text>
                    <Text>Monthly Income: ${monthData.income.toFixed(2)}</Text>
                    <Text>Initial Savings: ${monthData.savings.toFixed(2)}</Text>
                    <Text>Total Spent: ${monthData.spent.toFixed(2)}</Text>
                    {/* New spending analysis text */}
                    {mostSpentText && <Text style={styles.reportHighlightText}>{mostSpentText}</Text>}
                    {leastSpentText && <Text style={styles.reportHighlightText}>{leastSpentText}</Text>}
                    <Text>Remaining Savings: ${monthData.remainingSavings.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../assets/menback.jpg')} // Changed background image
      style={styles.background} resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >

        <ScrollView contentContainerStyle={styles.container}>

          <View style={styles.welcomeContainer}>
            <View style={{backgroundColor:'white',borderRadius:45}}>
            <Text style={styles.welcomeText}>Welcome, {name}</Text></View>
            <TouchableOpacity
              onPress={async () => {
  Alert.alert(
    "Logout",
    "Are you sure you want to logout?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          // ✅ Clear session from SQLite
          db.transaction(tx => {
            tx.executeSql('DELETE FROM Session', [], 
              () => console.log("✅ Session cleared on logout"),
              (err) => console.log("❌ Error clearing session:", err)
            );
          });

          // 🔹 Navigate back to Login screen
          navigation.navigate('Login');
        }
      }
    ]
  );
}}

              style={styles.logoutIconButton}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>


          {showReports ? (
            renderReports()
          ) : !selectedSection ? (
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
              <TouchableOpacity
                onPress={() => setShowReports(true)}
                style={styles.reportsButton}
              >
                <Text style={styles.reportsLink}>Monthly & Yearly Overview</Text>
              </TouchableOpacity>
              <View style={styles.sectionsContainer}>

                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('needs')}>
                  <View style={styles.sectionImageWrapper}><Image source={require('../assets/manneeds.jpg')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Needs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('wants')}>
                  <View style={styles.sectionImageWrapper}><Image source={require('../assets/manwants.jpg')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Wants</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('notes')}>
                  <View style={styles.sectionImageWrapper}><Image source={require('../assets/mannotes.jpg')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('bucket')}>
                  <View style={styles.sectionImageWrapper}><Image source={require('../assets/manbucket.jpg')} style={styles.sectionImage} /></View>
                  <Text style={styles.sectionText}>Bucket List</Text>
                </TouchableOpacity>
              </View>


            </>
          ) : (
            <View style={styles.fullScreenSectionContainer}>
              <TouchableOpacity onPress={() => setSelectedSection(null)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={30} color="#003366" />
              </TouchableOpacity>
              <Text style={styles.sectionHeader}>
                {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)}
              </Text>

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
  container: {
    paddingVertical: 40,
    paddingHorizontal: 25,
    alignItems: 'center',
    flexGrow: 1,
  },
  welcomeText: {
    fontSize: 30, marginTop: 10, fontWeight: 'bold', color: '#003366', textAlign: 'center', width: 200, // Blue Theme
    marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4, letterSpacing: 1,
  },
  incomeInputContainer: {
    width: '100%',
    marginBottom: 10,
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
    backgroundColor: '#D6EAF8', // Light Blue
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
    color: '#003366', // Dark Blue
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
    color: '#003366', // Dark Blue
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionSummaryDisplay: {
    backgroundColor: 'rgba(0, 51, 102, 0.1)', // Light blue tint
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sectionSummaryText: {
    fontSize: 16,
    color: '#003366', // Dark Blue
    fontWeight: '500',
  },
  sectionSummaryAmount: {
    fontWeight: 'bold',
    color: '#003366', // Dark Blue
  }, logoutText: {
    color: '#003366', // Dark Blue
    fontWeight: 'bold',
    fontSize: 16,
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
  reportsButton: {
    backgroundColor: '#A9CCE3', // Muted Blue
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 50,
    alignItems: 'center', // centers the text
    marginBottom: 20
  },
  reportsLink: {
    fontSize: 18,
    color: '#003366', // Dark Blue
    fontWeight: '600',
  },
  reportYearContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10
  },
  reportYearHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366', // Dark Blue
    marginBottom: 10
  },
  reportMonthContainer: {
    marginTop: 10,
    marginLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#5DADE2', // Brighter Blue for accent
    paddingLeft: 10
  },
  reportMonthHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003366', // Dark Blue
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
    color: '#1A5276', // Another shade of blue
    marginTop: 4,
    marginBottom: 4,
    fontStyle: 'italic',
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
    backgroundColor: '#A9CCE3', // Muted Blue
    alignItems: 'center',
    justifyContent: 'center',
  },

});

export default MenScreen;