import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert,
  Modal,
  FlatList,
  ImageBackground,
  Image
} from 'react-native';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'ExpenseDB.db', location: 'default' });

const StudentScreen = ({ route, navigation }) => {
  console.log("StudentScreen route params:", route.params);
  const { mobile, name } = route.params;
  console.log("Extracted mobile:", mobile);
  console.log("Extracted name:", name);
  const [expenses, setExpenses] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1 Month');
  const [selectedSection, setSelectedSection] = useState(null);

  // Student-specific expense categories
  const studentCategories = [
    { name: 'Books & Supplies', icon: '📚', color: '#4CAF50' },
    { name: 'Food & Meals', icon: '🍔', color: '#FF9800' },
    { name: 'Transportation', icon: '🚌', color: '#2196F3' },
    { name: 'Entertainment', icon: '🎬', color: '#9C27B0' },
    { name: 'Clothing', icon: '👕', color: '#F44336' },
    { name: 'Health & Medical', icon: '🏥', color: '#00BCD4' },
    { name: 'Technology', icon: '💻', color: '#607D8B' },
    { name: 'Miscellaneous', icon: '📋', color: '#795548' }
  ];

  // Time periods for expense tracking
  const timePeriods = [
    { name: '1 Month', months: 1, icon: '📅' },
    { name: '3 Months', months: 3, icon: '📊' },
    { name: '6 Months', months: 6, icon: '📈' },
    { name: '1 Year', months: 12, icon: '🗓️' }
  ];

  // Student sections like Women screen
  const studentSections = [
    { 
      id: 'expenses', 
      name: 'Expenses', 
      icon: '💰', 
      color: '#4CAF50',
      description: 'Track your daily expenses'
    },
    { 
      id: 'budget', 
      name: 'Budget Plan', 
      icon: '📊', 
      color: '#2196F3',
      description: 'Set and manage budgets'
    },
    { 
      id: 'goals', 
      name: 'Financial Goals', 
      icon: '🎯', 
      color: '#FF9800',
      description: 'Set savings and financial goals'
    },
    { 
      id: 'analysis', 
      name: 'Expense Analysis', 
      icon: '📈', 
      color: '#9C27B0',
      description: 'View spending patterns'
    }
  ];

  useEffect(() => {
    initializeDatabase();
    loadExpenses();
    loadBudget();
  }, [selectedPeriod]); // Reload when period changes

  const initializeDatabase = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS StudentExpenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mobile TEXT,
          category TEXT,
          amount REAL,
          description TEXT,
          date TEXT
        )`
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS StudentBudget (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mobile TEXT UNIQUE,
          monthly_budget REAL
        )`
      );
    });
  };

  const getDateRangeForPeriod = (periodName) => {
    const now = new Date();
    const period = timePeriods.find(p => p.name === periodName);
    const startDate = new Date(now.getFullYear(), now.getMonth() - period.months + 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: startDate.toISOString().slice(0, 10), // YYYY-MM-DD format
      end: endDate.toISOString().slice(0, 10)
    };
  };

  const loadExpenses = () => {
    const dateRange = getDateRangeForPeriod(selectedPeriod);
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM StudentExpenses WHERE mobile = ? AND date >= ? AND date <= ? ORDER BY date DESC',
        [mobile, dateRange.start, dateRange.end],
        (_, result) => {
          const rows = result.rows;
          let expenseList = [];
          let total = 0;
          for (let i = 0; i < rows.length; i++) {
            expenseList.push(rows.item(i));
            total += rows.item(i).amount;
          }
          setExpenses(expenseList);
          setTotalSpent(total);
        }
      );
    });
  };

  const loadBudget = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT monthly_budget FROM StudentBudget WHERE mobile = ?',
        [mobile],
        (_, result) => {
          if (result.rows.length > 0) {
            setMonthlyBudget(result.rows.item(0).monthly_budget);
          }
        }
      );
    });
  };

  const addExpense = () => {
    if (!selectedCategory || !expenseAmount || !expenseDescription) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const currentDate = new Date().toISOString();
    
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO StudentExpenses (mobile, category, amount, description, date) VALUES (?, ?, ?, ?, ?)',
        [mobile, selectedCategory, amount, expenseDescription, currentDate],
        () => {
          setIsModalVisible(false);
          setSelectedCategory('');
          setExpenseAmount('');
          setExpenseDescription('');
          loadExpenses();
          Alert.alert('Success', 'Expense added successfully!');
        },
        (_, error) => {
          Alert.alert('Error', 'Failed to add expense');
        }
      );
    });
  };

  const openBudgetModal = () => {
    setBudgetInput(monthlyBudget.toString());
    setIsBudgetModalVisible(true);
  };

  const saveBudget = () => {
    const budgetAmount = parseFloat(budgetInput);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        'INSERT OR REPLACE INTO StudentBudget (mobile, monthly_budget) VALUES (?, ?)',
        [mobile, budgetAmount],
        () => {
          setMonthlyBudget(budgetAmount);
          setIsBudgetModalVisible(false);
          setBudgetInput('');
          Alert.alert('Success', 'Budget set successfully!');
        },
        (_, error) => {
          Alert.alert('Error', 'Failed to save budget');
        }
      );
    });
  };

  const getBudgetStatus = () => {
    if (monthlyBudget === 0) return { color: '#666', text: 'No budget set' };
    
    // Calculate period budget based on selected period
    const period = timePeriods.find(p => p.name === selectedPeriod);
    const periodBudget = monthlyBudget * period.months;
    
    const percentage = (totalSpent / periodBudget) * 100;
    if (percentage > 100) return { color: '#F44336', text: `Over budget by ₹${(totalSpent - periodBudget).toFixed(2)}` };
    if (percentage > 80) return { color: '#FF9800', text: `${percentage.toFixed(1)}% used` };
    return { color: '#4CAF50', text: `₹${(periodBudget - totalSpent).toFixed(2)} remaining` };
  };

  const getPeriodBudgetAmount = () => {
    if (monthlyBudget === 0) return '0.00';
    const period = timePeriods.find(p => p.name === selectedPeriod);
    return (monthlyBudget * period.months).toFixed(2);
  };

  const budgetStatus = getBudgetStatus();

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
      </View>
      <Text style={styles.expenseDescription}>{item.description}</Text>
      <Text style={styles.expenseDate}>{new Date(item.date).toLocaleDateString()}</Text>
    </View>
  );

  const renderSectionCards = () => (
    <View style={styles.sectionsContainer}>
      {studentSections.map((section, index) => (
        <TouchableOpacity 
          key={index} 
          style={[styles.sectionCard, { borderColor: section.color }]}
          onPress={() => setSelectedSection(section.id)}
        >
          <Text style={styles.sectionIcon}>{section.icon}</Text>
          <Text style={styles.sectionName}>{section.name}</Text>
          <Text style={styles.sectionDescription}>{section.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderExpenseSection = () => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setSelectedSection(null)}
      >
        <Text style={styles.backButtonText}>← Back to Sections</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Expense Tracker</Text>
      
      {/* Period Selection */}
      <View style={styles.periodContainer}>
        <Text style={styles.periodLabel}>Tracking Period:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
          {timePeriods.map((period, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.periodButton,
                selectedPeriod === period.name && styles.selectedPeriodButton
              ]}
              onPress={() => setSelectedPeriod(period.name)}
            >
              <Text style={styles.periodIcon}>{period.icon}</Text>
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.name && styles.selectedPeriodText
              ]}>
                {period.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Budget Overview */}
      <View style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetTitle}>
            {selectedPeriod === '1 Month' ? 'Monthly Budget' : `${selectedPeriod} Budget`}
          </Text>
          <TouchableOpacity style={styles.setBudgetBtn} onPress={openBudgetModal}>
            <Text style={styles.setBudgetText}>Set Budget</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.budgetAmount}>₹{getPeriodBudgetAmount()}</Text>
        <Text style={styles.spentAmount}>Spent: ₹{totalSpent.toFixed(2)}</Text>
        <Text style={[styles.budgetStatus, { color: budgetStatus.color }]}>
          {budgetStatus.text}
        </Text>
        {selectedPeriod !== '1 Month' && (
          <Text style={styles.budgetNote}>
            Based on monthly budget: ₹{monthlyBudget.toFixed(2)}
          </Text>
        )}
      </View>

      {/* Add Expense Button */}
      <TouchableOpacity 
        style={styles.addExpenseBtn} 
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.addExpenseBtnText}>+ Add Expense</Text>
      </TouchableOpacity>

      {/* Recent Expenses */}
      <View style={styles.expensesListContainer}>
        <View style={styles.expensesHeader}>
          <Text style={styles.expensesTitle}>
            {selectedPeriod} Expenses ({expenses.length})
          </Text>
          <Text style={styles.totalAmount}>₹{totalSpent.toFixed(2)}</Text>
        </View>
        {expenses.length > 0 ? (
          <FlatList
            data={expenses.slice(0, 10)}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.expensesList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.noExpenses}>
            <Text style={styles.noExpensesText}>
              No expenses yet for {selectedPeriod.toLowerCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ImageBackground 
      source={require('../assets/studentsback.jpg')} 
      style={styles.background} 
      resizeMode="cover"
    >
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

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Main Content */}
          {!selectedSection ? (
            renderSectionCards()
          ) : selectedSection === 'expenses' ? (
            renderExpenseSection()
          ) : (
            <View style={styles.sectionContainer}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setSelectedSection(null)}
              >
                <Text style={styles.backButtonText}>← Back to Sections</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Coming Soon!</Text>
              <Text style={styles.comingSoonText}>
                This feature will be available in the next update.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Add Expense Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Expense</Text>
            
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {studentCategories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.name && { backgroundColor: category.color }
                  ]}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category.name && { color: '#fff' }
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={expenseDescription}
              onChangeText={setExpenseDescription}
              placeholder="What did you buy?"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={addExpense}
              >
                <Text style={styles.saveButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set Budget Modal */}
      <Modal
        visible={isBudgetModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.budgetModalContent}>
            <Text style={styles.modalTitle}>Set Monthly Budget</Text>
            <Text style={styles.budgetModalSubtitle}>
              Set your monthly budget. It will be calculated for different periods automatically.
            </Text>
            
            <Text style={styles.inputLabel}>Monthly Budget Amount (₹)</Text>
            <TextInput
              style={styles.budgetInput}
              value={budgetInput}
              onChangeText={setBudgetInput}
              placeholder="Enter your monthly budget"
              keyboardType="numeric"
              autoFocus={true}
            />
            
            <View style={styles.budgetPresets}>
              <Text style={styles.presetsLabel}>Quick presets:</Text>
              <View style={styles.presetButtons}>
                {[2000, 5000, 10000, 15000].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={styles.presetButton}
                    onPress={() => setBudgetInput(preset.toString())}
                  >
                    <Text style={styles.presetButtonText}>₹{preset}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setIsBudgetModalVisible(false);
                  setBudgetInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveBudget}
              >
                <Text style={styles.saveButtonText}>Save Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { 
    flex: 1, 
    width: '100%', 
    height: '100%' 
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.3)' 
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionsContainer: {
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    minHeight: 140,
    justifyContent: 'center',
  },
  sectionIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionContainer: {
    marginTop: 20,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  periodContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  periodScroll: {
    marginBottom: 5,
  },
  periodButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPeriodButton: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  periodIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  periodButtonText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedPeriodText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignSelf: 'flex-end',
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
  budgetCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  setBudgetBtn: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  setBudgetText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  budgetAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 5,
  },
  spentAmount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  budgetStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addExpenseBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  addExpenseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expensesListContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    maxHeight: 400,
  },
  expensesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  expensesList: {
    flex: 1,
  },
  expenseItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
  },
  noExpenses: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noExpensesText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  categoryScroll: {
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  budgetModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    maxHeight: '70%',
  },
  budgetModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  budgetInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  budgetPresets: {
    marginBottom: 25,
  },
  presetsLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    fontWeight: '500',
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
  },
  presetButtonText: {
    color: '#4A90E2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  periodSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  periodScroll: {
    marginBottom: 5,
  },
  periodButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPeriodButton: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  periodIcon: {
    fontSize: 16,
    marginBottom: 3,
  },
  periodButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedPeriodText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  budgetNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});

export default StudentScreen;
