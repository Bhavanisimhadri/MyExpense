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
import { launchImageLibrary } from 'react-native-image-picker';
import DatabaseHelper from '../Screens/DatabaseHelper'; // Assuming DatabaseHelper exists

const ElderScreen = ({ route, navigation }) => {
  const { name, mobile } = route.params;

  const [selectedSection, setSelectedSection] = useState(null);
  const [showReports, setShowReports] = useState(false);

  // State for current month's financial data
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [retirementPension, setRetirementPension] = useState('');

  // State for section-specific data
  const [medicalHealth, setMedicalHealth] = useState([{ item: '', amount: '', date: new Date().toLocaleDateString(), notes: '' }]);
  const [giftsDonations, setGiftsDonations] = useState([{ type: 'Family Gift', recipient: '', amount: '' }]);
  const [dailyEssentials, setDailyEssentials] = useState([{ item: '', amount: '' }]);
  const [legacyMemories, setLegacyMemories] = useState([{ note: '', image: null }]);
  const [notes, setNotes] = useState(['']); // <-- ADDED: State for Notes section

  // State to hold all historical financial data for reports
  const [allFinancialData, setAllFinancialData] = useState({});

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const financialDataKey = `elder_financials_${currentYear}_${currentMonth}`;

  // --- Data Persistence Logic ---
  useEffect(() => {
    const backAction = () => {
      Alert.alert("Exit App", "Are you sure you want to exit?", [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => BackHandler.exitApp() }
      ]);
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentFinancials = await DatabaseHelper.getUserData(mobile, financialDataKey);
        if (currentFinancials) {
          setMonthlyIncome(currentFinancials.monthlyIncome || '');
          setSavings(currentFinancials.savings || '');
          setRetirementPension(currentFinancials.retirementPension || '');
          setDailyEssentials(currentFinancials.dailyEssentials?.length > 0 ? currentFinancials.dailyEssentials : [{ item: '', amount: '' }]);
          setMedicalHealth(currentFinancials.medicalHealth?.length > 0 ? currentFinancials.medicalHealth : [{ item: '', amount: '', date: new Date().toLocaleDateString(), notes: '' }]);
          setGiftsDonations(currentFinancials.giftsDonations?.length > 0 ? currentFinancials.giftsDonations : [{ type: 'Family Gift', recipient: '', amount: '' }]);
        }

        const legacyData = await DatabaseHelper.getUserData(mobile, 'legacyMemories');
        setLegacyMemories(legacyData?.length > 0 ? legacyData : [{ note: '', image: null }]);
        
        // ADDED: Load notes data
        const notesData = await DatabaseHelper.getUserData(mobile, 'elder_notes');
        setNotes(notesData?.length > 0 ? notesData : ['']);
        
        const allFinancials = await DatabaseHelper.getAllUserFinancialKeys(mobile);
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
          monthlyIncome,
          savings,
          retirementPension,
          dailyEssentials,
          medicalHealth,
          giftsDonations,
        };
        await DatabaseHelper.saveUserData(mobile, financialDataKey, currentFinancials);
        await DatabaseHelper.saveUserData(mobile, 'legacyMemories', legacyMemories);
        await DatabaseHelper.saveUserData(mobile, 'elder_notes', notes); // <-- ADDED: Save notes

        // *** FIXED: Update in-memory financial data for immediate report viewing ***
        setAllFinancialData(prevData => ({
          ...prevData,
          [financialDataKey]: currentFinancials
        }));

      } catch (error) {
        console.error("Failed to save data to database", error);
      }
    };
    saveData();
  }, [monthlyIncome, savings, retirementPension, dailyEssentials, medicalHealth, giftsDonations, legacyMemories, notes, mobile]);

  // --- Calculation Logic ---
  const parseAmount = (amountStr) => {
    if (typeof amountStr === 'number') return amountStr;
    const num = parseFloat(String(amountStr || '').replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const totalEssentials = useMemo(() => dailyEssentials.reduce((sum, item) => sum + parseAmount(item.amount), 0), [dailyEssentials]);
  const totalMedical = useMemo(() => medicalHealth.reduce((sum, item) => sum + parseAmount(item.amount), 0), [medicalHealth]);
  const totalGifts = useMemo(() => giftsDonations.reduce((sum, item) => sum + parseAmount(item.amount), 0), [giftsDonations]);

  const { currentIncomeBalance, currentSavingsBalance, pensionBalance } = useMemo(() => {
    const totalIncome = parseAmount(monthlyIncome);
    const initialSavings = parseAmount(savings);
    const pension = parseAmount(retirementPension);
    const totalExpenses = totalEssentials + totalMedical + totalGifts;
    
    let incomeRemaining = totalIncome;
    let pensionRemaining = pension;
    let savingsRemaining = initialSavings;

    let remainingExpenses = totalExpenses;

    // 1. Deduct from Income
    const fromIncome = Math.min(incomeRemaining, remainingExpenses);
    incomeRemaining -= fromIncome;
    remainingExpenses -= fromIncome;

    // 2. Deduct from Pension
    if (remainingExpenses > 0) {
      const fromPension = Math.min(pensionRemaining, remainingExpenses);
      pensionRemaining -= fromPension;
      remainingExpenses -= fromPension;
    }

    // 3. Deduct from Savings
    if (remainingExpenses > 0) {
      const fromSavings = Math.min(savingsRemaining, remainingExpenses);
      savingsRemaining -= fromSavings;
    }

    return {
      currentIncomeBalance: incomeRemaining,
      currentSavingsBalance: savingsRemaining < 0 ? 0 : savingsRemaining,
      pensionBalance: pensionRemaining,
    };
  }, [monthlyIncome, savings, retirementPension, totalEssentials, totalMedical, totalGifts]);

  // --- Handlers ---
  const handleAddRow = (section) => {
    if (section === 'dailyEssentials') setDailyEssentials([...dailyEssentials, { item: '', amount: '' }]);
    if (section === 'medicalHealth') setMedicalHealth([...medicalHealth, { item: '', amount: '', date: new Date().toLocaleDateString(), notes: '' }]);
    if (section === 'giftsDonations') setGiftsDonations([...giftsDonations, { type: 'Family Gift', recipient: '', amount: '' }]);
    if (section === 'legacyMemories') setLegacyMemories([...legacyMemories, { note: '', image: null }]);
    if (section === 'notes') setNotes([...notes, '']); // <-- ADDED: Handle add for notes
  };

  const handleRemoveRow = (section, index) => {
    if (section === 'dailyEssentials') setDailyEssentials(dailyEssentials.filter((_, i) => i !== index));
    if (section === 'medicalHealth') setMedicalHealth(medicalHealth.filter((_, i) => i !== index));
    if (section === 'giftsDonations') setGiftsDonations(giftsDonations.filter((_, i) => i !== index));
    if (section === 'legacyMemories') setLegacyMemories(legacyMemories.filter((_, i) => i !== index));
    // ADDED: Handle remove for notes
    if (section === 'notes') {
        const updated = notes.filter((_, i) => i !== index);
        setNotes(updated.length > 0 ? updated : ['']);
    }
  };

  const handleInputChange = (section, index, field, value) => {
    if (section === 'dailyEssentials') { const updated = [...dailyEssentials]; updated[index][field] = value; setDailyEssentials(updated); }
    if (section === 'medicalHealth') { const updated = [...medicalHealth]; updated[index][field] = value; setMedicalHealth(updated); }
    if (section === 'giftsDonations') { const updated = [...giftsDonations]; updated[index][field] = value; setGiftsDonations(updated); }
    if (section === 'legacyMemories') { const updated = [...legacyMemories]; updated[index][field] = value; setLegacyMemories(updated); }
    // ADDED: Handle input change for notes
    if (section === 'notes') {
      const updated = [...notes];
      updated[index] = value;
      setNotes(updated);
    }
  };
  
  const handleImagePick = (index) => {
    const options = { mediaType: 'photo', includeBase64: false };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        const updatedMemories = [...legacyMemories];
        updatedMemories[index].image = imageUri;
        setLegacyMemories(updatedMemories);
      }
    });
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => navigation.navigate('Login') },
    ]);
  };

  // --- Render Functions ---
  const renderDailyEssentials = () => (
    <ScrollView style={styles.sectionContentScroll}>
      {dailyEssentials.map((row, index) => (
        <View key={index} style={styles.rowContainer}>
          <TextInput style={styles.smallInput} placeholder="Essential Item (e.g., Groceries)" value={row.item} onChangeText={(val) => handleInputChange('dailyEssentials', index, 'item', val)} />
          <TextInput style={styles.smallInput} placeholder="Amount" keyboardType="numeric" value={String(row.amount)} onChangeText={(val) => handleInputChange('dailyEssentials', index, 'amount', val)} />
          <TouchableOpacity onPress={() => handleRemoveRow('dailyEssentials', index)}><Ionicons name="remove-circle-outline" size={28} color="#A52A2A" /></TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow('dailyEssentials')}><Ionicons name="add-circle" size={30} color="#800000" /></TouchableOpacity>
    </ScrollView>
  );

  const renderMedicalHealth = () => (
    <ScrollView style={styles.sectionContentScroll}>
      {medicalHealth.map((row, index) => (
        <View key={index} style={styles.medicalRowContainer}>
          <TextInput style={styles.medicalInput} placeholder="Medical Item (e.g., Hospital Visit)" value={row.item} onChangeText={(val) => handleInputChange('medicalHealth', index, 'item', val)} />
          <TextInput style={styles.medicalInput} placeholder="Amount" keyboardType="numeric" value={String(row.amount)} onChangeText={(val) => handleInputChange('medicalHealth', index, 'amount', val)} />
          <TextInput style={styles.medicalInput} placeholder="Date" value={row.date} onChangeText={(val) => handleInputChange('medicalHealth', index, 'date', val)} />
          <TextInput style={styles.largeInput} multiline placeholder="Notes..." value={row.notes} onChangeText={(val) => handleInputChange('medicalHealth', index, 'notes', val)} />
          <TouchableOpacity onPress={() => handleRemoveRow('medicalHealth', index)}><Ionicons name="trash-bin-outline" size={28} color="#A52A2A" /></TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow('medicalHealth')}><Ionicons name="add-circle" size={30} color="#800000" /></TouchableOpacity>
    </ScrollView>
  );

  const renderGiftsDonations = () => (
    <ScrollView style={styles.sectionContentScroll}>
        {giftsDonations.map((row, index) => (
            <View key={index} style={styles.rowContainer}>
                <TextInput style={styles.smallInput} placeholder="Recipient" value={row.recipient} onChangeText={(val) => handleInputChange('giftsDonations', index, 'recipient', val)} />
                <TextInput style={styles.smallInput} placeholder="Amount" keyboardType="numeric" value={String(row.amount)} onChangeText={(val) => handleInputChange('giftsDonations', index, 'amount', val)} />
                <TouchableOpacity onPress={() => handleRemoveRow('giftsDonations', index)}><Ionicons name="remove-circle-outline" size={28} color="#A52A2A" /></TouchableOpacity>
            </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow('giftsDonations')}><Ionicons name="add-circle" size={30} color="#800000" /></TouchableOpacity>
    </ScrollView>
  );

  const renderLegacyMemories = () => (
    <ScrollView style={styles.sectionContentScroll}>
      {legacyMemories.map((memory, index) => (
        <View key={index} style={styles.memoryRowContainer}>
          <TouchableOpacity style={styles.imagePickerContainer} onPress={() => handleImagePick(index)}>
            {memory.image ? (
              <Image source={{ uri: memory.image }} style={styles.memoryImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={35} color="#5A2E18" />
                <Text style={styles.imagePlaceholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.memoryNoteInput}
            multiline
            placeholder="Write a life lesson, memory, or wish..."
            value={memory.note}
            onChangeText={(val) => handleInputChange('legacyMemories', index, 'note', val)}
          />
          <TouchableOpacity onPress={() => handleRemoveRow('legacyMemories', index)}>
            <Ionicons name="remove-circle-outline" size={28} color="#A52A2A" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow('legacyMemories')}>
        <Ionicons name="add-circle" size={30} color="#800000" />
      </TouchableOpacity>
    </ScrollView>
  );

  // <-- ADDED: Render function for Notes section -->
  const renderNotes = () => (
    <ScrollView style={styles.sectionContentScroll}>
      {notes.map((note, index) => (
        <View key={index} style={styles.rowContainer}>
          <TextInput 
            style={styles.largeInput} 
            placeholder="Enter your note..." 
            value={note}
            onChangeText={(val) => handleInputChange('notes', index, null, val)} 
            multiline
          />
          <TouchableOpacity onPress={() => handleRemoveRow('notes', index)}>
            <Ionicons name="remove-circle-outline" size={28} color="#A52A2A" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow('notes')}>
        <Ionicons name="add-circle" size={30} color="#800000" />
      </TouchableOpacity>
    </ScrollView>
  );
  
 const renderReports = () => {
    const yearlyReports = {};

    // Group data by year and calculate yearly totals
    Object.keys(allFinancialData).forEach(key => {
        if (!key.startsWith('elder_financials_')) return;
        const parts = key.split('_');
        if (parts.length < 4) return;
        
        const year = parts[2];
        const month = parts[3];

        // Initialize year object if it doesn't exist
        if (!yearlyReports[year]) {
            yearlyReports[year] = { 
                months: {},
                totalYearlyIncome: 0,
                totalYearlyPension: 0,
                totalYearlySavings: 0,
                totalYearlySpent: 0,
            };
        }

        const data = allFinancialData[key];
        const essentials = (data.dailyEssentials || []).reduce((sum, item) => sum + parseAmount(item.amount), 0);
        const medical = (data.medicalHealth || []).reduce((sum, item) => sum + parseAmount(item.amount), 0);
        const gifts = (data.giftsDonations || []).reduce((sum, item) => sum + parseAmount(item.amount), 0);
        const totalMonthlySpent = essentials + medical + gifts;
        
        const monthlyIncome = parseAmount(data.monthlyIncome || 0);
        const monthlyPension = parseAmount(data.retirementPension || 0);
        const monthlySavings = parseAmount(data.savings || 0);

        // Add monthly data to the year's months object
        yearlyReports[year].months[month] = {
            income: monthlyIncome,
            savings: monthlySavings,
            pension: monthlyPension,
            spent: totalMonthlySpent,
            allExpenses: [
                ...(data.dailyEssentials || []).map(i => ({ name: i.item, amount: i.amount })),
                ...(data.medicalHealth || []).map(i => ({ name: i.item, amount: i.amount })),
                ...(data.giftsDonations || []).map(i => ({ name: i.recipient, amount: i.amount }))
            ]
        };

        // Accumulate totals for the year
        yearlyReports[year].totalYearlyIncome += monthlyIncome;
        yearlyReports[year].totalYearlyPension += monthlyPension;
        yearlyReports[year].totalYearlySavings += monthlySavings;
        yearlyReports[year].totalYearlySpent += totalMonthlySpent;
    });

    return (
        <View style={styles.fullScreenSectionContainer}>
            <TouchableOpacity onPress={() => setShowReports(false)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={30} color="#800000" />
            </TouchableOpacity>
            <Text style={styles.sectionHeader}>Financial Reports</Text>
            <ScrollView>
                {Object.keys(yearlyReports).sort((a, b) => b - a).map(year => (
                    <View key={year} style={styles.reportYearContainer}>
                        <Text style={styles.reportYearHeader}>{year}</Text>

                        {/* --- ADDED: Yearly Summary --- */}
                        <Text style={styles.reportSummaryText}>Total Yearly Income: ${yearlyReports[year].totalYearlyIncome.toFixed(2)}</Text>
                        <Text style={styles.reportSummaryText}>Total Yearly Pension: ${yearlyReports[year].totalYearlyPension.toFixed(2)}</Text>
                        <Text style={styles.reportSummaryText}>Total Yearly Savings: ${yearlyReports[year].totalYearlySavings.toFixed(2)}</Text>
                        <Text style={styles.reportSummaryText}>Total Yearly Expenses: ${yearlyReports[year].totalYearlySpent.toFixed(2)}</Text>
                        
                        {/* Monthly breakdown */}
                        {Object.keys(yearlyReports[year].months).sort((a, b) => b - a).map(month => {
                            const monthData = yearlyReports[year].months[month];

                            // Calculate remaining balances for the report month
                            let incomeRem = monthData.income;
                            let pensionRem = monthData.pension;
                            let savingsRem = monthData.savings;
                            let expensesRem = monthData.spent;

                            const fromInc = Math.min(incomeRem, expensesRem);
                            incomeRem -= fromInc;
                            expensesRem -= fromInc;

                            if (expensesRem > 0) {
                                const fromPen = Math.min(pensionRem, expensesRem);
                                pensionRem -= fromPen;
                                expensesRem -= fromPen;
                            }
                            if (expensesRem > 0) {
                                savingsRem -= expensesRem;
                            }
                            
                            // Find most and least spent
                            const validExpenses = monthData.allExpenses
                                .map(e => ({...e, amount: parseAmount(e.amount)}))
                                .filter(e => e.name && e.name.trim() && e.amount > 0);
                            
                            let mostSpentText = "N/A";
                            let leastSpentText = "N/A";

                            if (validExpenses.length > 0) {
                                const sorted = [...validExpenses].sort((a,b) => b.amount - a.amount);
                                mostSpentText = `${sorted[0].name} - $${sorted[0].amount.toFixed(2)}`;
                                if (sorted.length > 1 && sorted[0].amount !== sorted[sorted.length - 1].amount) {
                                    leastSpentText = `${sorted[sorted.length - 1].name} - $${sorted[sorted.length - 1].amount.toFixed(2)}`;
                                }
                            }

                            return (
                                <View key={month} style={styles.reportMonthContainer}>
                                    <Text style={styles.reportMonthHeader}>{new Date(year, month - 1).toLocaleString('default', { month: 'long' })}</Text>
                                    <Text style={styles.reportSummaryText}>Initial Income: ${monthData.income.toFixed(2)}</Text>
                                    <Text style={styles.reportSummaryText}>Initial Pension: ${monthData.pension.toFixed(2)}</Text>
                                    <Text style={styles.reportSummaryText}>Total Spent: ${monthData.spent.toFixed(2)}</Text>
                                    <Text style={styles.reportHighlightText}>Most Spent On: {mostSpentText}</Text>
                                    <Text style={styles.reportHighlightText}>Least Spent On: {leastSpentText}</Text>
                                    <Text style={styles.reportSummaryText}>Remaining Pension: ${pensionRem.toFixed(2)}</Text>
                                    <Text style={styles.reportSummaryText}>Remaining Savings: ${savingsRem < 0 ? 0 : savingsRem.toFixed(2)}</Text>
                                </View>
                            );
                        })}
                    </View>
                ))}
                {Object.keys(yearlyReports).length === 0 && (
                  <Text style={styles.noDataText}>No financial data recorded yet.</Text>
                )}
            </ScrollView>
        </View>
    );
  };

  return (
    <ImageBackground source={require('../assets/eldersback.jpg')} style={styles.background} resizeMode="cover">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome, {name}</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutIconButton}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
          </View>

          {showReports ? renderReports() : !selectedSection ? (
            <>
              <View style={styles.incomeInputContainer}>
                <TextInput style={styles.input} placeholder="Monthly Income" placeholderTextColor="#666" keyboardType="numeric" value={String(monthlyIncome)} onChangeText={setMonthlyIncome} />
                <TextInput style={styles.input} placeholder="Savings" placeholderTextColor="#666" keyboardType="numeric" value={String(savings)} onChangeText={setSavings} />
                <TextInput style={styles.input} placeholder="Retirement / Pension Income" placeholderTextColor="#666" keyboardType="numeric" value={String(retirementPension)} onChangeText={setRetirementPension} />
              </View>
              <TouchableOpacity onPress={() => setShowReports(true)} style={styles.reportsButton}><Text style={styles.reportsLink}>View Financial Overview</Text></TouchableOpacity>
              <View style={styles.sectionsContainer}>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('medicalHealth')}><View style={styles.sectionImageWrapper}><Image source={require('../assets/medical.jpg')} style={styles.sectionImage} /></View><Text style={styles.sectionText}>Medical/Health</Text></TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('dailyEssentials')}><View style={styles.sectionImageWrapper}><Image source={require('../assets/daily.jpg')} style={styles.sectionImage} /></View><Text style={styles.sectionText}>Daily Essentials</Text></TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('giftsDonations')}><View style={styles.sectionImageWrapper}><Image source={require('../assets/gifts.jpg')} style={styles.sectionImage} /></View><Text style={styles.sectionText}>Gifts/Donations</Text></TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('legacyMemories')}><View style={styles.sectionImageWrapper}><Image source={require('../assets/legacy.jpg')} style={styles.sectionImage} /></View><Text style={styles.sectionText}>Legacy/Memories</Text></TouchableOpacity>
                {/* ADDED: Notes Section Card */}
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('notes')}><View style={styles.sectionImageWrapper}><Image source={require('../assets/notese.jpg')} style={styles.sectionImage} /></View><Text style={styles.sectionText}>Notes</Text></TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.fullScreenSectionContainer}>
              <TouchableOpacity onPress={() => setSelectedSection(null)} style={styles.backButton}><Ionicons name="arrow-back" size={30} color="#800000" /></TouchableOpacity>
              <Text style={styles.sectionHeader}>
                {selectedSection === 'medicalHealth' && "Medical & Health Tracker"}
                {selectedSection === 'dailyEssentials' && "Daily Essentials"}
                {selectedSection === 'giftsDonations' && "Gifts & Donations"}
                {selectedSection === 'legacyMemories' && "Legacy / Memories"}
                {selectedSection === 'notes' && "Notes"}
              </Text>
              <View style={styles.sectionSummaryDisplay}>
                <Text style={styles.sectionSummaryText}>Remaining Income: <Text style={styles.sectionSummaryAmount}>${currentIncomeBalance.toFixed(2)}</Text></Text>
                <Text style={styles.sectionSummaryText}>Remaining Pension: <Text style={styles.sectionSummaryAmount}>${pensionBalance.toFixed(2)}</Text></Text>
                <Text style={styles.sectionSummaryText}>Remaining Savings: <Text style={styles.sectionSummaryAmount}>${currentSavingsBalance.toFixed(2)}</Text></Text>
              </View>
              {selectedSection === 'dailyEssentials' && renderDailyEssentials()}
              {selectedSection === 'medicalHealth' && renderMedicalHealth()}
              {selectedSection === 'giftsDonations' && renderGiftsDonations()}
              {selectedSection === 'legacyMemories' && renderLegacyMemories()}
              {selectedSection === 'notes' && renderNotes()}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%', backgroundColor: '#FDF5E6' },
  container: { paddingVertical: 40, paddingHorizontal: 25, alignItems: 'center', flexGrow: 1 },
  welcomeContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcomeText: { fontSize: 28, fontWeight: 'bold', color: '#5A2E18' },
  logoutIconButton: { padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 20 },
  logoutText: { color: '#5A2E18', fontWeight: 'bold' },
  incomeInputContainer: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 15, padding: 15, marginBottom: 15 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 10, color: '#333' },
  reportsButton: { backgroundColor: '#D35225', padding: 15, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  reportsLink: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  sectionsContainer: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  sectionCard: { width: '46%', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 15, alignItems: 'center', paddingVertical: 20, marginBottom: 20, elevation: 5 },
  sectionImageWrapper: { width: 70, height: 70, borderRadius: 35, overflow: 'hidden', marginBottom: 10, backgroundColor: '#F7E3B0', justifyContent: 'center', alignItems: 'center' },
  sectionImage: { width: '90%', height: '90%', borderRadius: 30, },
  sectionText: { fontSize: 16, fontWeight: '600', color: '#5A2E18', textAlign: 'center' },
  fullScreenSectionContainer: { flex: 1, width: '100%', backgroundColor: 'rgba(253, 245, 230, 0.98)', borderRadius: 20, padding: 20 },
  backButton: { marginBottom: 15, alignSelf: 'flex-start' },
  sectionHeader: { fontSize: 26, fontWeight: '700', color: '#5A2E18', marginBottom: 15, textAlign: 'center' },
  sectionSummaryDisplay: { backgroundColor: 'rgba(211, 82, 37, 0.1)', borderRadius: 10, padding: 12, marginBottom: 15 },
  sectionSummaryText: { fontSize: 16, color: '#5A2E18', fontWeight: '500', marginVertical: 2 },
  sectionSummaryAmount: { fontWeight: 'bold' },
  sectionContentScroll: { flex: 1, width: '100%' },
  rowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  medicalRowContainer: { marginBottom: 15, padding: 10, backgroundColor: '#fff', borderRadius: 10 },
  smallInput: { flex: 1, backgroundColor: '#FDF5E6', borderRadius: 8, padding: 10, marginRight: 8, fontSize: 16 },
  largeInput: { flex: 1, backgroundColor: '#FDF5E6', borderRadius: 8, padding: 10, marginRight: 8, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  medicalInput: { backgroundColor: '#FDF5E6', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 16 },
  addButton: { marginTop: 10, alignSelf: 'center' },
  reportYearContainer: { marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 2 },
  reportYearHeader: { fontSize: 22, fontWeight: 'bold', color: '#5A2E18', marginBottom: 10 },
  reportMonthContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  reportMonthHeader: { fontSize: 18, fontWeight: '600', color: '#800000', marginBottom: 5 },
  reportSummaryText: { fontSize: 16, color: '#333', marginBottom: 5 },
  reportHighlightText: { fontSize: 15, fontWeight: '600', color: '#D35225', marginBottom: 5, fontStyle: 'italic' },
  memoryRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePickerContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
  },
  memoryImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F7E3B0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D35225',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#5A2E18',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  memoryNoteInput: {
    flex: 1,
    backgroundColor: '#FDF5E6',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 8,
    fontSize: 16,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#800000',
  },
});

export default ElderScreen;