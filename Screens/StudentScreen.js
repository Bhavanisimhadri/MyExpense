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
  FlatList
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'ExpenseDB.db', location: 'default' });

const StudentScreen = ({ route }) => {
  const { mobile } = route.params;
  const [expenses, setExpenses] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

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

  useEffect(() => {
    initializeDatabase();
    loadExpenses();
    loadBudget();
  }, []);

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

  const loadExpenses = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM StudentExpenses WHERE mobile = ? AND date LIKE ? ORDER BY date DESC',
        [mobile, `${currentMonth}%`],
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

  const setBudget = () => {
    Alert.prompt(
      'Set Monthly Budget',
      'Enter your monthly budget:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (budget) => {
            const budgetAmount = parseFloat(budget);
            if (!isNaN(budgetAmount) && budgetAmount > 0) {
              db.transaction(tx => {
                tx.executeSql(
                  'INSERT OR REPLACE INTO StudentBudget (mobile, monthly_budget) VALUES (?, ?)',
                  [mobile, budgetAmount],
                  () => {
                    setMonthlyBudget(budgetAmount);
                    Alert.alert('Success', 'Budget set successfully!');
                  }
                );
              });
            }
          }
        }
      ],
      'plain-text',
      monthlyBudget.toString()
    );
  };

  const getBudgetStatus = () => {
    if (monthlyBudget === 0) return { color: '#666', text: 'No budget set' };
    const percentage = (totalSpent / monthlyBudget) * 100;
    if (percentage > 100) return { color: '#F44336', text: `Over budget by ₹${(totalSpent - monthlyBudget).toFixed(2)}` };
    if (percentage > 80) return { color: '#FF9800', text: `${percentage.toFixed(1)}% used` };
    return { color: '#4CAF50', text: `₹${(monthlyBudget - totalSpent).toFixed(2)} remaining` };
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Student Expense Tracker</Text>
        <Text style={styles.subtitle}>Welcome, {mobile}</Text>
      </View>

      {/* Budget Overview */}
      <View style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetTitle}>Monthly Budget</Text>
          <TouchableOpacity style={styles.setBudgetBtn} onPress={setBudget}>
            <Text style={styles.setBudgetText}>Set Budget</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.budgetAmount}>₹{monthlyBudget.toFixed(2)}</Text>
        <Text style={styles.spentAmount}>Spent: ₹{totalSpent.toFixed(2)}</Text>
        <Text style={[styles.budgetStatus, { color: budgetStatus.color }]}>
          {budgetStatus.text}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.addExpenseBtn} 
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addExpenseBtnText}>+ Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Expenses */}
      <View style={styles.expensesSection}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        {expenses.length > 0 ? (
          <FlatList
            data={expenses.slice(0, 5)}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.expensesList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.noExpenses}>
            <Text style={styles.noExpensesText}>No expenses yet this month</Text>
          </View>
        )}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F7FA' 
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff',
    marginBottom: 5 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#E3F2FD' 
  },
  budgetCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
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
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  addExpenseBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addExpenseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expensesSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  expensesList: {
    flex: 1,
  },
  expenseItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
});

export default StudentScreen;
