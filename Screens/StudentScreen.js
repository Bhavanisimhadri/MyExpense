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
import DatabaseHelper from '../Screens/DatabaseHelper'; // Assuming DatabaseHelper is in the same folder

const StudentsScreen = ({ route, navigation }) => {
  const { name, mobile } = route.params;

  const [selectedSection, setSelectedSection] = useState(null);
  const [showReports, setShowReports] = useState(false);

  // State for current month's data
  const [pocketMoney, setPocketMoney] = useState('');
  const [savings, setSavings] = useState('');
  const [educationalExpenses, setEducationalExpenses] = useState([{ item: '', amount: '' }]);
  const [lifestyleExpenses, setLifestyleExpenses] = useState([{ item: '', amount: '' }]);

  // State for persistent data
  const [notes, setNotes] = useState(['']);
  const [skillGoals, setSkillGoals] = useState([{ goal: '', completed: false }]);

  // State for historical data for reports
  const [allFinancialData, setAllFinancialData] = useState({});

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const financialDataKey = `financials_${currentYear}_${currentMonth}`;

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
          setPocketMoney(currentFinancials.pocketMoney || '');
          setSavings(currentFinancials.savings || '');
          setEducationalExpenses(currentFinancials.educationalExpenses && currentFinancials.educationalExpenses.length > 0 ? currentFinancials.educationalExpenses : [{ item: '', amount: '' }]);
          setLifestyleExpenses(currentFinancials.lifestyleExpenses && currentFinancials.lifestyleExpenses.length > 0 ? currentFinancials.lifestyleExpenses : [{ item: '', amount: '' }]);
        }

        const notesData = await DatabaseHelper.getUserData(mobile, 'notes');
        setNotes(notesData && notesData.length > 0 ? notesData : ['']);

        const skillGoalsData = await DatabaseHelper.getUserData(mobile, 'skillGoals');
        setSkillGoals(skillGoalsData && skillGoalsData.length > 0 ? skillGoalsData : [{ goal: '', completed: false }]);

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
          pocketMoney,
          savings,
          educationalExpenses,
          lifestyleExpenses,
        };
        await DatabaseHelper.saveUserData(mobile, financialDataKey, currentFinancials);
        await DatabaseHelper.saveUserData(mobile, 'notes', notes);
        await DatabaseHelper.saveUserData(mobile, 'skillGoals', skillGoals);
      } catch (error) {
        console.error("Failed to save data to database", error);
      }
    };
    saveData();
  }, [pocketMoney, savings, educationalExpenses, lifestyleExpenses, notes, skillGoals, mobile]);

  const parseAmount = (amountStr) => {
    const num = parseFloat(String(amountStr).replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const totalEducationalExpenses = useMemo(() => educationalExpenses.reduce((sum, item) => sum + parseAmount(item.amount), 0), [educationalExpenses]);
  const totalLifestyleExpenses = useMemo(() => lifestyleExpenses.reduce((sum, item) => sum + parseAmount(item.amount), 0), [lifestyleExpenses]);

  const effectivePocketMoney = useMemo(() => {
    return parseAmount(pocketMoney) - parseAmount(savings);
  }, [pocketMoney, savings]);

  const { currentPocketMoneyBalance, currentSavingsBalance } = useMemo(() => {
    let moneyRemaining = effectivePocketMoney;
    let savingsRemaining = parseAmount(savings);
    const totalExpenses = totalEducationalExpenses + totalLifestyleExpenses;

    if (totalExpenses <= moneyRemaining) {
      moneyRemaining -= totalExpenses;
    } else {
      const excessExpenses = totalExpenses - moneyRemaining;
      moneyRemaining = 0;
      savingsRemaining -= excessExpenses;
    }
    return {
      currentPocketMoneyBalance: moneyRemaining,
      currentSavingsBalance: savingsRemaining,
    };
  }, [effectivePocketMoney, savings, totalEducationalExpenses, totalLifestyleExpenses]);

  const handleAddRow = (section) => {
    if (section === 'educational') {
      const lastItem = educationalExpenses[educationalExpenses.length - 1];
      if (!lastItem.item.trim() || !lastItem.amount.trim()) {
        Alert.alert("Validation Error", "Please fill in the current expense before adding a new one.");
        return;
      }
      setEducationalExpenses([...educationalExpenses, { item: '', amount: '' }]);
    }
    if (section === 'lifestyle') {
      const lastItem = lifestyleExpenses[lifestyleExpenses.length - 1];
      if (!lastItem.item.trim() || !lastItem.amount.trim()) {
        Alert.alert("Validation Error", "Please fill in the current expense before adding a new one.");
        return;
      }
      setLifestyleExpenses([...lifestyleExpenses, { item: '', amount: '' }]);
    }
    if (section === 'notes') {
      if (!notes[notes.length - 1].trim()) {
        Alert.alert("Validation Error", "Please fill in the current note before adding a new one.");
        return;
      }
      setNotes([...notes, '']);
    }
    if (section === 'skills') {
        const lastGoal = skillGoals[skillGoals.length - 1];
      if (!lastGoal.goal.trim()) {
        Alert.alert("Validation Error", "Please fill in the current skill goal before adding a new one.");
        return;
      }
      setSkillGoals([...skillGoals, { goal: '', completed: false }]);
    }
  };

  const handleRemoveRow = (section, index) => {
    if (section === 'educational') setEducationalExpenses(educationalExpenses.filter((_, i) => i !== index));
    if (section === 'lifestyle') setLifestyleExpenses(lifestyleExpenses.filter((_, i) => i !== index));
    if (section === 'notes') setNotes(notes.filter((_, i) => i !== index));
    if (section === 'skills') setSkillGoals(skillGoals.filter((_, i) => i !== index));
  };

  const handleInputChange = (section, index, field, value) => {
    if (section === 'educational') {
      const updated = [...educationalExpenses]; updated[index][field] = value; setEducationalExpenses(updated);
    }
    if (section === 'lifestyle') {
      const updated = [...lifestyleExpenses]; updated[index][field] = value; setLifestyleExpenses(updated);
    }
    if (section === 'notes') {
      const updated = [...notes]; updated[index] = value; setNotes(updated);
    }
    if (section === 'skills') {
      const updated = [...skillGoals]; updated[index].goal = value; setSkillGoals(updated);
    }
  };

  const toggleSkillCompleted = (index) => {
    const updated = [...skillGoals]; updated[index].completed = !updated[index].completed; setSkillGoals(updated);
  };

  const renderTwoInputRow = (data, section, placeholder) => (
    <ScrollView style={styles.sectionContentScroll}>
      {data.map((row, index) => (
        <View key={index} style={styles.rowContainer}>
          <TextInput
            style={styles.smallInput}
            placeholder={placeholder}
            value={row.item}
            onChangeText={(val) => handleInputChange(section, index, 'item', val)}
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

  const renderSkillGoals = () => (
    <ScrollView style={styles.sectionContentScroll}>
        {skillGoals.map((goal, index) => (
            <View key={index} style={styles.rowContainer}>
                <TextInput
                    style={styles.largeInput}
                    placeholder="Skill Goal"
                    value={goal.goal}
                    onChangeText={(val) => handleInputChange('skills', index, 'goal', val)}
                />
                <TouchableOpacity onPress={() => toggleSkillCompleted(index)}>
                    <Ionicons name={goal.completed ? "checkmark-circle" : "ellipse-outline"} size={28} color="#28a745" />
                </TouchableOpacity>
                 <TouchableOpacity onPress={() => handleRemoveRow('skills', index)}>
                    <Ionicons name="remove-circle-outline" size={28} color="#d9534f" />
                </TouchableOpacity>
            </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow('skills')}>
            <Ionicons name="add-circle-outline" size={30} color="#007bff" />
        </TouchableOpacity>
    </ScrollView>
);

  const renderNotes = () => (
    <ScrollView style={styles.sectionContentScroll}>
        {notes.map((note, index) => (
            <View key={index} style={styles.rowContainer}>
                <TextInput
                    style={styles.largeInput}
                    placeholder="Note"
                    value={note}
                    onChangeText={(val) => handleInputChange('notes', index, null, val)}
                />
                <TouchableOpacity onPress={() => handleRemoveRow('notes', index)}>
                    <Ionicons name="remove-circle-outline" size={28} color="#d9534f" />
                </TouchableOpacity>
            </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow('notes')}>
            <Ionicons name="add-circle-outline" size={30} color="#007bff" />
        </TouchableOpacity>
    </ScrollView>
);

const renderReports = () => {
    const yearlyReports = {};

    Object.keys(allFinancialData).forEach(key => {
        if (!key.startsWith('financials_')) return;
        const [_, year, month] = key.split('_');
        if (!yearlyReports[year]) {
            yearlyReports[year] = { months: {}, totalSpent: 0, totalPocketMoney: 0, totalSavings: 0 };
        }
        const data = allFinancialData[key];
        const monthlyEduExpenses = (data.educationalExpenses || []).reduce((sum, item) => sum + parseAmount(item.amount), 0);
        const monthlyLifeExpenses = (data.lifestyleExpenses || []).reduce((sum, item) => sum + parseAmount(item.amount), 0);
        const monthlySpent = monthlyEduExpenses + monthlyLifeExpenses;
        const monthlyPocketMoney = parseAmount(data.pocketMoney);
        const monthlySavings = parseAmount(data.savings);

        yearlyReports[year].months[month] = {
            pocketMoney: monthlyPocketMoney,
            savings: monthlySavings,
            spent: monthlySpent,
            remainingSavings: monthlySavings - Math.max(0, monthlySpent - (monthlyPocketMoney - monthlySavings)),
            expenses: [...(data.educationalExpenses || []), ...(data.lifestyleExpenses || [])]
        };
        yearlyReports[year].totalSpent += monthlySpent;
        yearlyReports[year].totalPocketMoney += monthlyPocketMoney;
        yearlyReports[year].totalSavings += monthlySavings;
    });

    if (Object.keys(yearlyReports).length === 0) {
        return (
            <View style={styles.fullScreenSectionContainer}>
                <TouchableOpacity onPress={() => setShowReports(false)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={30} color="#333" />
                </TouchableOpacity>
                <Text style={styles.sectionHeader}>Reports</Text>
                <Text style={styles.noReportsText}>No reports to show yet. Start adding your expenses to see your financial overview!</Text>
            </View>
        );
    }

    return (
        <View style={styles.fullScreenSectionContainer}>
            <TouchableOpacity onPress={() => setShowReports(false)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={30} color="#333" />
            </TouchableOpacity>
            <Text style={styles.sectionHeader}>Reports</Text>
            <ScrollView>
                {Object.keys(yearlyReports).sort((a, b) => b - a).map(year => (
                    <View key={year} style={styles.reportYearContainer}>
                        <Text style={styles.reportYearHeader}>{year}</Text>
                        <Text style={styles.reportSummaryText}>Total Pocket Money: ${yearlyReports[year].totalPocketMoney.toFixed(2)}</Text>
                        <Text style={styles.reportSummaryText}>Total Savings: ${yearlyReports[year].totalSavings.toFixed(2)}</Text>
                        <Text style={styles.reportSummaryText}>Total Spent: ${yearlyReports[year].totalSpent.toFixed(2)}</Text>
                        
                        {skillGoals.filter(g => g.completed).length > 0 && (
                            <View style={{ marginTop: 5 }}>
                                <Text style={styles.reportHighlightText}>Achieved Skill Goals:</Text>
                                {skillGoals.filter(g => g.completed).map((goal, index) => (
                                    <Text key={index} style={styles.reportHighlightText}>- {goal.goal}</Text>
                                ))}
                            </View>
                        )}

                        {Object.keys(yearlyReports[year].months).sort((a, b) => b - a).map(month => {
                            const monthData = yearlyReports[year].months[month];
                            const validExpenses = monthData.expenses.filter(item => item.item && parseAmount(item.amount) > 0);
                            
                            let mostSpentText = null;
                            let leastSpentText = null;
            
                            if (validExpenses.length > 0) {
                                const sortedExpenses = [...validExpenses].sort((a, b) => parseAmount(b.amount) - parseAmount(a.amount));
                                const mostSpentItem = sortedExpenses[0];
                                const leastSpentItem = sortedExpenses[sortedExpenses.length - 1];
                                
                                mostSpentText = `Most spent on: ${mostSpentItem.item} ($${parseAmount(mostSpentItem.amount).toFixed(2)})`;
            
                                if (sortedExpenses.length > 1 && parseAmount(mostSpentItem.amount) !== parseAmount(leastSpentItem.amount)) {
                                    leastSpentText = `Least spent on: ${leastSpentItem.item} ($${parseAmount(leastSpentItem.amount).toFixed(2)})`;
                                }
                            }

                            return (
                                <View key={month} style={styles.reportMonthContainer}>
                                    <Text style={styles.reportMonthHeader}>{new Date(year, month - 1).toLocaleString('default', { month: 'long' })}</Text>
                                    <Text>Pocket Money: ${monthData.pocketMoney.toFixed(2)}</Text>
                                    <Text>Initial Savings: ${monthData.savings.toFixed(2)}</Text>
                                    <Text>Total Spent: ${monthData.spent.toFixed(2)}</Text>
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
      source={require('../assets/studentsback.jpg')}
      style={styles.background} resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome, {name}</Text>
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
                  placeholder="Pocket Money"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={pocketMoney}
                  onChangeText={setPocketMoney}
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
                <Text style={styles.reportsLink}>View Reports</Text>
              </TouchableOpacity>
              <View style={styles.sectionsContainer}>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('educational')}>
                    <View style={styles.sectionImageWrapper}><Image source={require('../assets/edu.jpg')} style={styles.sectionImage} /></View>
                    <Text style={styles.sectionText}>Educational Expenses</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('lifestyle')}>
                    <View style={styles.sectionImageWrapper}><Image source={require('../assets/lifestyle.jpg')} style={styles.sectionImage} /></View>
                    <Text style={styles.sectionText}>Lifestyle/Enterntainment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('skills')}>
                    <View style={styles.sectionImageWrapper}><Image source={require('../assets/skill.jpg')} style={styles.sectionImage} /></View>
                    <Text style={styles.sectionText}>Skill Goals</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('notes')}>
                    <View style={styles.sectionImageWrapper}><Image source={require('../assets/notess.jpg')} style={styles.sectionImage} /></View>
                    <Text style={styles.sectionText}>Notes</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.fullScreenSectionContainer}>
              <TouchableOpacity onPress={() => setSelectedSection(null)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={30} color="#333" />
              </TouchableOpacity>
              <Text style={styles.sectionHeader}>
                {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1).replace(/([A-Z])/g, ' $1').trim()}
              </Text>

              <View style={styles.sectionSummaryDisplay}>
                <Text style={styles.sectionSummaryText}>
                  Remaining Pocket Money: <Text style={styles.sectionSummaryAmount}>${currentPocketMoneyBalance.toFixed(2)}</Text>
                </Text>
                <Text style={styles.sectionSummaryText}>
                  Remaining Savings: <Text style={styles.sectionSummaryAmount}>${currentSavingsBalance.toFixed(2)}</Text>
                </Text>
              </View>

              {selectedSection === 'educational' && renderTwoInputRow(educationalExpenses, 'educational', 'Expense Item')}
              {selectedSection === 'lifestyle' && renderTwoInputRow(lifestyleExpenses, 'lifestyle', 'Expense Item')}
              {selectedSection === 'skills' && renderSkillGoals()}
              {selectedSection === 'notes' && renderNotes()}
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
    welcomeContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4A4A4A',
        textAlign: 'left',
    },
    logoutIconButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    logoutText: {
        color: '#E87A3D',
        fontWeight: 'bold',
        fontSize: 16,
    },
    incomeInputContainer: {
        width: '100%',
        marginBottom: 10,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 14,
        padding: 15,
        fontSize: 17,
        marginBottom: 15,
        color: '#333',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    reportsButton: {
        backgroundColor: '#E87A3D',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginBottom: 20,
        alignItems: 'center',
    },
    reportsLink: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
    },
    sectionsContainer: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    sectionCard: {
        width: '48%',
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
    },
    sectionImageWrapper: {
        width: 70,
        height: 70,
        borderRadius: 35,
        overflow: 'hidden',
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F1E9',
      },
    sectionImage: {
        width: '90%',
        height: '90%',
        borderRadius: 30,
    },
    sectionText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4A4A4A',
        textAlign: 'center'
    },
    fullScreenSectionContainer: {
        width: '100%',
        flex: 1,
        backgroundColor: 'rgba(245, 241, 233, 0.98)',
        borderRadius: 20,
        padding: 20,
    },
    noReportsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 40
    },
    backButton: {
        marginBottom: 15,
        alignSelf: 'flex-start',
    },
    sectionHeader: {
        fontSize: 26,
        fontWeight: '800',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionSummaryDisplay: {
        backgroundColor: 'rgba(232, 122, 61, 0.1)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    sectionSummaryText: {
        fontSize: 16,
        color: '#4A4A4A',
        fontWeight: '500',
    },
    sectionSummaryAmount: {
        fontWeight: 'bold',
        color: '#E87A3D',
    },
    sectionContentScroll: {
        flex: 1,
        width: '100%',
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    smallInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    largeInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    addButton: {
        marginTop: 15,
        alignSelf: 'center',
    },
    reportYearContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
    },
    reportYearHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#E87A3D',
        marginBottom: 10,
    },
    reportMonthContainer: {
        marginTop: 15,
        marginLeft: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#f0a57d',
        paddingLeft: 10
    },
    reportMonthHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    reportSummaryText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4A4A4A',
        marginBottom: 5,
    },
    reportHighlightText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#B5651D',
        marginTop: 5,
        marginBottom: 5,
        fontStyle: 'italic',
    },
});

export default StudentsScreen;