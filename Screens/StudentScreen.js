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
  const [allExpenses, setAllExpenses] = useState([]);
  const [historyPeriod, setHistoryPeriod] = useState('All Time');
  const [selectedHistoryCategory, setSelectedHistoryCategory] = useState('All');
  
  // Budget Plan states
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [isCategoryBudgetModalVisible, setIsCategoryBudgetModalVisible] = useState(false);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState('');
  const [budgetAmountInput, setBudgetAmountInput] = useState('');
  
  // Financial Goals states
  const [financialGoals, setFinancialGoals] = useState([]);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');

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
    },
    { 
      id: 'history', 
      name: 'Expense History', 
      icon: '📋', 
      color: '#FF5722',
      description: 'View complete expense history'
    }
  ];

  useEffect(() => {
    initializeDatabase();
    loadExpenses();
    loadBudget();
    loadAllExpenses();
    loadCategoryBudgets();
    loadFinancialGoals();
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
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS CategoryBudgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mobile TEXT,
          category TEXT,
          budget_amount REAL,
          UNIQUE(mobile, category)
        )`
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS FinancialGoals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mobile TEXT,
          title TEXT,
          target_amount REAL,
          current_amount REAL,
          target_date TEXT,
          created_date TEXT
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

  const loadAllExpenses = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM StudentExpenses WHERE mobile = ? ORDER BY date DESC',
        [mobile],
        (_, result) => {
          const rows = result.rows;
          let expenseList = [];
          for (let i = 0; i < rows.length; i++) {
            expenseList.push(rows.item(i));
          }
          setAllExpenses(expenseList);
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

  const loadCategoryBudgets = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM CategoryBudgets WHERE mobile = ?',
        [mobile],
        (_, result) => {
          const rows = result.rows;
          const budgets = {};
          for (let i = 0; i < rows.length; i++) {
            const row = rows.item(i);
            budgets[row.category] = row.budget_amount;
          }
          setCategoryBudgets(budgets);
        }
      );
    });
  };

  const loadFinancialGoals = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM FinancialGoals WHERE mobile = ? ORDER BY created_date DESC',
        [mobile],
        (_, result) => {
          const rows = result.rows;
          const goals = [];
          for (let i = 0; i < rows.length; i++) {
            goals.push(rows.item(i));
          }
          setFinancialGoals(goals);
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
          loadAllExpenses();
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

  const addGoal = () => {
    if (!goalTitle || !targetAmount || !targetDate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const amount = parseFloat(targetAmount);
    const current = parseFloat(currentSavings) || 0;
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    const currentDate = new Date().toISOString();
    
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO FinancialGoals (mobile, title, target_amount, current_amount, target_date, created_date) VALUES (?, ?, ?, ?, ?, ?)',
        [mobile, goalTitle, amount, current, targetDate, currentDate],
        () => {
          loadFinancialGoals();
          setIsGoalModalVisible(false);
          setGoalTitle('');
          setTargetAmount('');
          setCurrentSavings('');
          setTargetDate('');
          Alert.alert('Success', 'Goal added successfully!');
        },
        (_, error) => {
          Alert.alert('Error', 'Failed to add goal');
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

  const renderHistorySection = () => {
    // Filter expenses based on period and category
    let filteredExpenses = allExpenses;
    
    if (historyPeriod !== 'All Time') {
      const period = timePeriods.find(p => p.name === historyPeriod);
      const dateRange = getDateRangeForPeriod(historyPeriod);
      filteredExpenses = allExpenses.filter(expense => 
        expense.date >= dateRange.start && expense.date <= dateRange.end
      );
    }
    
    if (selectedHistoryCategory !== 'All') {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.category === selectedHistoryCategory
      );
    }

    const totalHistoryAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setSelectedSection(null)}
        >
          <Text style={styles.backButtonText}>← Back to Sections</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Expense History</Text>
        
        {/* Period Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Period:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                historyPeriod === 'All Time' && styles.selectedFilterButton
              ]}
              onPress={() => setHistoryPeriod('All Time')}
            >
              <Text style={[
                styles.filterButtonText,
                historyPeriod === 'All Time' && styles.selectedFilterText
              ]}>
                All Time
              </Text>
            </TouchableOpacity>
            {timePeriods.map((period, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterButton,
                  historyPeriod === period.name && styles.selectedFilterButton
                ]}
                onPress={() => setHistoryPeriod(period.name)}
              >
                <Text style={[
                  styles.filterButtonText,
                  historyPeriod === period.name && styles.selectedFilterText
                ]}>
                  {period.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedHistoryCategory === 'All' && styles.selectedFilterButton
              ]}
              onPress={() => setSelectedHistoryCategory('All')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedHistoryCategory === 'All' && styles.selectedFilterText
              ]}>
                All Categories
              </Text>
            </TouchableOpacity>
            {studentCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterButton,
                  selectedHistoryCategory === category.name && styles.selectedFilterButton
                ]}
                onPress={() => setSelectedHistoryCategory(category.name)}
              >
                <Text style={styles.filterIcon}>{category.icon}</Text>
                <Text style={[
                  styles.filterButtonText,
                  selectedHistoryCategory === category.name && styles.selectedFilterText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Summary */}
        <View style={styles.historySummary}>
          <Text style={styles.historySummaryTitle}>
            {historyPeriod} Summary ({selectedHistoryCategory})
          </Text>
          <Text style={styles.historySummaryAmount}>
            Total: ₹{totalHistoryAmount.toFixed(2)}
          </Text>
          <View style={styles.historySummaryDetails}>
            <Text style={styles.historySummaryCount}>
              {filteredExpenses.length} transactions found
            </Text>
            {filteredExpenses.length > 0 && (
              <Text style={styles.historySummaryAverage}>
                Avg: ₹{(totalHistoryAmount / filteredExpenses.length).toFixed(2)} per transaction
              </Text>
            )}
          </View>
          {filteredExpenses.length > 50 && (
            <Text style={styles.largeHistoryNote}>
              📊 Large dataset - scroll to view all transactions
            </Text>
          )}
        </View>

        {/* History List */}
        <View style={styles.historyListContainer}>
          <View style={styles.historyListHeader}>
            <Text style={styles.historyListTitle}>
              Complete Transaction History
            </Text>
            <Text style={styles.historyListCount}>
              {filteredExpenses.length} transactions
            </Text>
          </View>
          {filteredExpenses.length > 0 ? (
            <FlatList
              data={filteredExpenses}
              renderItem={({ item, index }) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyItemHeader}>
                    <View style={styles.historyItemLeft}>
                      <Text style={styles.historyCategoryIcon}>
                        {studentCategories.find(cat => cat.name === item.category)?.icon || '💰'}
                      </Text>
                      <View>
                        <Text style={styles.historyCategory}>{item.category}</Text>
                        <Text style={styles.historyDescription}>{item.description}</Text>
                      </View>
                    </View>
                    <View style={styles.historyItemRight}>
                      <Text style={styles.historyAmount}>₹{item.amount.toFixed(2)}</Text>
                      <Text style={styles.historyDate}>
                        {new Date(item.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                  {/* Transaction number for reference */}
                  <Text style={styles.transactionNumber}>
                    #{filteredExpenses.length - index}
                  </Text>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              style={styles.historyList}
              showsVerticalScrollIndicator={true}
              getItemLayout={(data, index) => (
                {length: 80, offset: 80 * index, index}
              )}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          ) : (
            <View style={styles.noHistory}>
              <Text style={styles.noHistoryText}>
                No expenses found for the selected filters
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderBudgetSection = () => {
    // Calculate spending by category for current period
    const categorySpending = {};
    expenses.forEach(expense => {
      if (categorySpending[expense.category]) {
        categorySpending[expense.category] += expense.amount;
      } else {
        categorySpending[expense.category] = expense.amount;
      }
    });



    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setSelectedSection(null)}
        >
          <Text style={styles.backButtonText}>← Back to Sections</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Budget Planning</Text>
        
        {/* Overall Budget Card */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetTitle}>Overall Monthly Budget</Text>
            <TouchableOpacity style={styles.setBudgetBtn} onPress={openBudgetModal}>
              <Text style={styles.setBudgetText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.budgetAmount}>₹{monthlyBudget.toFixed(2)}</Text>
          <Text style={styles.spentAmount}>Spent this period: ₹{totalSpent.toFixed(2)}</Text>
        </View>

        {/* Category Budgets */}
        <View style={styles.categoryBudgetsContainer}>
          <Text style={styles.categoryBudgetsTitle}>Category Budgets ({selectedPeriod})</Text>
          
          {studentCategories.map((category, index) => {
            const spent = categorySpending[category.name] || 0;
            const budget = categoryBudgets[category.name] || 0;
            const percentage = budget > 0 ? (spent / budget) * 100 : 0;
            
            return (
              <View key={index} style={styles.categoryBudgetItem}>
                <View style={styles.categoryBudgetHeader}>
                  <View style={styles.categoryBudgetLeft}>
                    <Text style={styles.categoryBudgetIcon}>{category.icon}</Text>
                    <Text style={styles.categoryBudgetName}>{category.name}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.setBudgetCategoryBtn}
                    onPress={() => {
                      setSelectedBudgetCategory(category.name);
                      setBudgetAmountInput(budget.toString() || '');
                      setIsCategoryBudgetModalVisible(true);
                    }}
                  >
                    <Text style={styles.setBudgetCategoryText}>
                      {budget > 0 ? 'Edit' : 'Set'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.categoryBudgetProgress}>
                  <View style={styles.categoryBudgetAmounts}>
                    <Text style={styles.categoryBudgetSpent}>₹{spent.toFixed(2)} spent</Text>
                    <Text style={styles.categoryBudgetTotal}>
                      {budget > 0 ? `of ₹${budget.toFixed(2)}` : 'No budget set'}
                    </Text>
                  </View>
                  {budget > 0 && (
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { 
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: percentage > 100 ? '#F44336' : 
                                           percentage > 80 ? '#FF9800' : '#4CAF50'
                          }
                        ]} 
                      />
                      <Text style={[
                        styles.progressText,
                        { color: percentage > 100 ? '#F44336' : '#666' }
                      ]}>
                        {percentage.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderGoalsSection = () => {
    const updateGoalProgress = (goalId, newAmount) => {
      const amount = parseFloat(newAmount);
      if (isNaN(amount) || amount < 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      db.transaction(tx => {
        tx.executeSql(
          'UPDATE FinancialGoals SET current_amount = ? WHERE id = ?',
          [amount, goalId],
          () => {
            loadFinancialGoals();
            Alert.alert('Success', 'Goal progress updated!');
          }
        );
      });
    };

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setSelectedSection(null)}
        >
          <Text style={styles.backButtonText}>← Back to Sections</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Financial Goals</Text>
        
        <TouchableOpacity 
          style={styles.addGoalBtn} 
          onPress={() => setIsGoalModalVisible(true)}
        >
          <Text style={styles.addGoalBtnText}>+ Add New Goal</Text>
        </TouchableOpacity>

        <ScrollView style={styles.goalsContainer}>
          {financialGoals.length > 0 ? (
            financialGoals.map((goal, index) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const isCompleted = progress >= 100;
              const remainingAmount = goal.target_amount - goal.current_amount;
              
              return (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={[
                      styles.goalStatus,
                      { color: isCompleted ? '#4CAF50' : '#FF9800' }
                    ]}>
                      {isCompleted ? 'Completed!' : 'In Progress'}
                    </Text>
                  </View>
                  
                  <View style={styles.goalAmounts}>
                    <Text style={styles.goalCurrentAmount}>
                      ₹{goal.current_amount.toFixed(2)}
                    </Text>
                    <Text style={styles.goalTargetAmount}>
                      of ₹{goal.target_amount.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.goalProgressContainer}>
                    <View style={styles.goalProgressBar}>
                      <View 
                        style={[
                          styles.goalProgress, 
                          { 
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: isCompleted ? '#4CAF50' : '#2196F3'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.goalProgressText}>{progress.toFixed(1)}%</Text>
                  </View>
                  
                  <View style={styles.goalDetails}>
                    <Text style={styles.goalTargetDate}>
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </Text>
                    {!isCompleted && (
                      <Text style={styles.goalRemaining}>
                        ₹{remainingAmount.toFixed(2)} remaining
                      </Text>
                    )}
                  </View>
                  
                  {!isCompleted && (
                    <TouchableOpacity 
                      style={styles.updateProgressBtn}
                      onPress={() => {
                        Alert.prompt(
                          'Update Progress',
                          'Enter your current savings amount:',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Update', 
                              onPress: (value) => updateGoalProgress(goal.id, value)
                            }
                          ],
                          'plain-text',
                          goal.current_amount.toString()
                        );
                      }}
                    >
                      <Text style={styles.updateProgressText}>Update Progress</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.noGoals}>
              <Text style={styles.noGoalsText}>
                No financial goals set yet. Add your first goal to start tracking!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderAnalysisSection = () => {
    // Calculate category spending for analysis
    const categorySpending = {};
    const monthlySpending = {};
    
    allExpenses.forEach(expense => {
      // Category analysis
      if (categorySpending[expense.category]) {
        categorySpending[expense.category] += expense.amount;
      } else {
        categorySpending[expense.category] = expense.amount;
      }
      
      // Monthly analysis
      const month = new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (monthlySpending[month]) {
        monthlySpending[month] += expense.amount;
      } else {
        monthlySpending[month] = expense.amount;
      }
    });

    const totalAllTimeSpending = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averagePerTransaction = totalAllTimeSpending / (allExpenses.length || 1);
    
    // Get top spending categories
    const sortedCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // Get recent months spending
    const sortedMonths = Object.entries(monthlySpending)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .slice(0, 6);

    const getMaxSpending = () => {
      const amounts = Object.values(categorySpending);
      return Math.max(...amounts, 1);
    };

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setSelectedSection(null)}
        >
          <Text style={styles.backButtonText}>← Back to Sections</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Expense Analysis</Text>
        
        {/* Overview Stats */}
        <View style={styles.analysisOverview}>
          <View style={styles.analysisStatCard}>
            <Text style={styles.analysisStatValue}>₹{totalAllTimeSpending.toFixed(2)}</Text>
            <Text style={styles.analysisStatLabel}>Total Spent</Text>
          </View>
          <View style={styles.analysisStatCard}>
            <Text style={styles.analysisStatValue}>{allExpenses.length}</Text>
            <Text style={styles.analysisStatLabel}>Transactions</Text>
          </View>
          <View style={styles.analysisStatCard}>
            <Text style={styles.analysisStatValue}>₹{averagePerTransaction.toFixed(2)}</Text>
            <Text style={styles.analysisStatLabel}>Avg/Transaction</Text>
          </View>
        </View>

        <ScrollView style={styles.analysisScrollContainer}>
          {/* Category Breakdown */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Top Spending Categories</Text>
            {sortedCategories.length > 0 ? (
              sortedCategories.map(([category, amount], index) => {
                const percentage = (amount / totalAllTimeSpending) * 100;
                const categoryData = studentCategories.find(cat => cat.name === category);
                const maxAmount = getMaxSpending();
                
                return (
                  <View key={category} style={styles.categoryAnalysisItem}>
                    <View style={styles.categoryAnalysisHeader}>
                      <View style={styles.categoryAnalysisLeft}>
                        <Text style={styles.categoryAnalysisIcon}>
                          {categoryData?.icon || '💰'}
                        </Text>
                        <Text style={styles.categoryAnalysisName}>{category}</Text>
                      </View>
                      <Text style={styles.categoryAnalysisAmount}>₹{amount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.categoryAnalysisBarContainer}>
                      <View 
                        style={[
                          styles.categoryAnalysisBar,
                          { 
                            width: `${(amount / maxAmount) * 100}%`,
                            backgroundColor: categoryData?.color || '#4A90E2'
                          }
                        ]}
                      />
                      <Text style={styles.categoryAnalysisPercentage}>
                        {percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noAnalysisData}>No spending data available</Text>
            )}
          </View>

          {/* Monthly Trends */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Monthly Spending Trends</Text>
            {sortedMonths.length > 0 ? (
              sortedMonths.map(([month, amount], index) => {
                const maxMonthlyAmount = Math.max(...Object.values(monthlySpending));
                
                return (
                  <View key={month} style={styles.monthlyAnalysisItem}>
                    <View style={styles.monthlyAnalysisHeader}>
                      <Text style={styles.monthlyAnalysisMonth}>{month}</Text>
                      <Text style={styles.monthlyAnalysisAmount}>₹{amount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.monthlyAnalysisBarContainer}>
                      <View 
                        style={[
                          styles.monthlyAnalysisBar,
                          { 
                            width: `${(amount / maxMonthlyAmount) * 100}%`,
                            backgroundColor: '#2196F3'
                          }
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noAnalysisData}>No monthly data available</Text>
            )}
          </View>

          {/* Spending Insights */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Spending Insights</Text>
            <View style={styles.insightsContainer}>
              {sortedCategories.length > 0 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Top Category:</Text>
                  <Text style={styles.insightValue}>
                    {sortedCategories[0][0]} (₹{sortedCategories[0][1].toFixed(2)})
                  </Text>
                </View>
              )}
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Average Monthly:</Text>
                <Text style={styles.insightValue}>
                  ₹{(totalAllTimeSpending / Math.max(Object.keys(monthlySpending).length, 1)).toFixed(2)}
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Budget Status:</Text>
                <Text style={[
                  styles.insightValue,
                  { color: totalSpent > monthlyBudget ? '#F44336' : '#4CAF50' }
                ]}>
                  {totalSpent > monthlyBudget ? 'Over Budget' : 'Within Budget'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

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
          ) : selectedSection === 'history' ? (
            renderHistorySection()
          ) : selectedSection === 'budget' ? (
            renderBudgetSection()
          ) : selectedSection === 'goals' ? (
            renderGoalsSection()
          ) : selectedSection === 'analysis' ? (
            renderAnalysisSection()
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

      {/* Category Budget Modal */}
      <Modal
        visible={isCategoryBudgetModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.budgetModalContent}>
            <Text style={styles.modalTitle}>Set Category Budget</Text>
            <Text style={styles.budgetModalSubtitle}>
              Set budget for {selectedBudgetCategory}
            </Text>
            
            <Text style={styles.inputLabel}>Budget Amount (₹)</Text>
            <TextInput
              style={styles.budgetInput}
              value={budgetAmountInput}
              onChangeText={setBudgetAmountInput}
              placeholder="Enter budget amount"
              keyboardType="numeric"
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setIsCategoryBudgetModalVisible(false);
                  setBudgetAmountInput('');
                  setSelectedBudgetCategory('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={() => {
                  const budgetAmount = parseFloat(budgetAmountInput);
                  if (isNaN(budgetAmount) || budgetAmount <= 0) {
                    Alert.alert('Error', 'Please enter a valid budget amount');
                    return;
                  }

                  db.transaction(tx => {
                    tx.executeSql(
                      'INSERT OR REPLACE INTO CategoryBudgets (mobile, category, budget_amount) VALUES (?, ?, ?)',
                      [mobile, selectedBudgetCategory, budgetAmount],
                      () => {
                        loadCategoryBudgets();
                        setIsCategoryBudgetModalVisible(false);
                        setBudgetAmountInput('');
                        setSelectedBudgetCategory('');
                        Alert.alert('Success', `Budget set for ${selectedBudgetCategory}!`);
                      },
                      (_, error) => {
                        Alert.alert('Error', 'Failed to set category budget');
                      }
                    );
                  });
                }}
              >
                <Text style={styles.saveButtonText}>Save Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Financial Goal Modal */}
      <Modal
        visible={isGoalModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Financial Goal</Text>
            
            <Text style={styles.inputLabel}>Goal Title</Text>
            <TextInput
              style={styles.input}
              value={goalTitle}
              onChangeText={setGoalTitle}
              placeholder="e.g., New Laptop, Emergency Fund"
            />

            <Text style={styles.inputLabel}>Target Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="Enter target amount"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Current Savings (₹)</Text>
            <TextInput
              style={styles.input}
              value={currentSavings}
              onChangeText={setCurrentSavings}
              placeholder="Enter current amount (optional)"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Target Date</Text>
            <TextInput
              style={styles.input}
              value={targetDate}
              onChangeText={setTargetDate}
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsGoalModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={addGoal}
              >
                <Text style={styles.saveButtonText}>Add Goal</Text>
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
  // History Section Styles
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  filterScroll: {
    marginBottom: 5,
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFilterButton: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  filterButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  selectedFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  historySummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  historySummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  historySummaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 5,
  },
  historySummaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  historySummaryCount: {
    fontSize: 14,
    color: '#666',
  },
  historySummaryAverage: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  largeHistoryNote: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  historyListContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flex: 1,
    minHeight: 400,
  },
  historyListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  historyListCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyCategoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  historyCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  historyDescription: {
    fontSize: 14,
    color: '#666',
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionNumber: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  noHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noHistoryText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  // Budget Section Styles
  categoryBudgetsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  categoryBudgetsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categoryBudgetItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryBudgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBudgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBudgetIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  categoryBudgetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  setBudgetCategoryBtn: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  setBudgetCategoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBudgetProgress: {
    marginTop: 5,
  },
  categoryBudgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  categoryBudgetSpent: {
    fontSize: 14,
    color: '#333',
  },
  categoryBudgetTotal: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    height: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    position: 'absolute',
    right: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Goals Section Styles
  addGoalBtn: {
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  addGoalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalsContainer: {
    flex: 1,
  },
  goalItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  goalStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  goalCurrentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: 8,
  },
  goalTargetAmount: {
    fontSize: 16,
    color: '#666',
  },
  goalProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalProgressBar: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    height: 20,
    overflow: 'hidden',
    marginRight: 10,
  },
  goalProgress: {
    height: '100%',
    borderRadius: 10,
  },
  goalProgressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 50,
  },
  goalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  goalTargetDate: {
    fontSize: 14,
    color: '#666',
  },
  goalRemaining: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
  },
  updateProgressBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateProgressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noGoals: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noGoalsText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Analysis Section Styles
  analysisOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  analysisStatCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  analysisStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  analysisStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  analysisScrollContainer: {
    flex: 1,
  },
  analysisSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  analysisSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categoryAnalysisItem: {
    marginBottom: 15,
  },
  categoryAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryAnalysisLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAnalysisIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  categoryAnalysisName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryAnalysisAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryAnalysisBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    height: 25,
    overflow: 'hidden',
  },
  categoryAnalysisBar: {
    height: '100%',
    borderRadius: 8,
  },
  categoryAnalysisPercentage: {
    position: 'absolute',
    right: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  monthlyAnalysisItem: {
    marginBottom: 15,
  },
  monthlyAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthlyAnalysisMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  monthlyAnalysisAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  monthlyAnalysisBarContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    height: 20,
    overflow: 'hidden',
  },
  monthlyAnalysisBar: {
    height: '100%',
    borderRadius: 8,
  },
  insightsContainer: {
    marginTop: 5,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  insightLabel: {
    fontSize: 14,
    color: '#666',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  noAnalysisData: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default StudentScreen;
