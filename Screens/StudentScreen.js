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
  
  // Pocket Money states
  const [pocketMoney, setPocketMoney] = useState(0);
  const [savings, setSavings] = useState(0);
  const [allowanceType, setAllowanceType] = useState('monthly'); // 'monthly' or 'weekly'
  const [allowanceSource, setAllowanceSource] = useState(''); // 'parents' or 'part-time'
  const [isPocketMoneyModalVisible, setIsPocketMoneyModalVisible] = useState(false);
  const [isAddIncomeModalVisible, setIsAddIncomeModalVisible] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  
  // Skill Goals states (replacing financial goals)
  const [skillGoals, setSkillGoals] = useState([]);
  const [isSkillGoalModalVisible, setIsSkillGoalModalVisible] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCost, setGoalCost] = useState('');
  const [goalPriority, setGoalPriority] = useState('medium');
  
  // Expense subcategory state
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Student-specific expense categories
  const studentCategories = [
    { name: 'Education Expenses', icon: '🎓', color: '#4CAF50', subcategories: ['Tuition', 'Books', 'Stationery', 'Courses', 'Online Classes'] },
    { name: 'Lifestyle/Entertainment', icon: '😎', color: '#FF9800', subcategories: ['Food', 'Movies', 'Outings', 'Gaming', 'Shopping', 'Hobbies'] }
  ];

  // Time periods for expense tracking
  const timePeriods = [
    { name: '1 Month', months: 1, icon: '📅' },
    { name: '3 Months', months: 3, icon: '📊' },
    { name: '6 Months', months: 6, icon: '📈' },
    { name: '1 Year', months: 12, icon: '🗓️' }
  ];

  // Student sections
  const studentSections = [
    { 
      id: 'pocket-money', 
      name: 'Pocket Money', 
      icon: '💰', 
      color: '#4CAF50',
      description: 'Track your allowance and income'
    },
    { 
      id: 'education', 
      name: 'Education Expenses', 
      icon: '🎓', 
      color: '#2196F3',
      description: 'Tuition, books, courses'
    },
    { 
      id: 'lifestyle', 
      name: 'Lifestyle & Fun', 
      icon: '😎', 
      color: '#FF9800',
      description: 'Food, movies, outings'
    },
    { 
      id: 'skill-goals', 
      name: 'Skill Goals', 
      icon: '🎯', 
      color: '#9C27B0',
      description: 'Your bucket list goals'
    },
    { 
      id: 'analysis', 
      name: 'Spending Overview', 
      icon: '🔖', 
      color: '#FF5722',
      description: 'View your spending patterns'
    }
  ];

  useEffect(() => {
    initializeDatabase();
    loadExpenses();
    loadPocketMoney();
    loadAllExpenses();
    loadSkillGoals();
  }, [selectedPeriod]); // Reload when period changes

  const initializeDatabase = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS StudentExpenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mobile TEXT,
          category TEXT,
          subcategory TEXT,
          amount REAL,
          description TEXT,
          date TEXT,
          payment_source TEXT
        )`
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS PocketMoney (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mobile TEXT UNIQUE,
          current_allowance REAL,
          savings REAL,
          allowance_type TEXT,
          allowance_source TEXT,
          last_updated TEXT
        )`
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS IncomeHistory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mobile TEXT,
          amount REAL,
          source TEXT,
          description TEXT,
          date TEXT
        )`
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS SkillGoals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mobile TEXT,
          title TEXT,
          description TEXT,
          estimated_cost REAL,
          priority TEXT,
          status TEXT,
          created_date TEXT,
          completed_date TEXT
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

  const loadPocketMoney = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM PocketMoney WHERE mobile = ?',
        [mobile],
        (_, result) => {
          if (result.rows.length > 0) {
            const data = result.rows.item(0);
            setPocketMoney(data.current_allowance || 0);
            setSavings(data.savings || 0);
            setAllowanceType(data.allowance_type || 'monthly');
            setAllowanceSource(data.allowance_source || 'parents');
          }
        }
      );
    });
  };

  const loadSkillGoals = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM SkillGoals WHERE mobile = ? ORDER BY created_date DESC',
        [mobile],
        (_, result) => {
          const rows = result.rows;
          const goals = [];
          for (let i = 0; i < rows.length; i++) {
            goals.push(rows.item(i));
          }
          setSkillGoals(goals);
        }
      );
    });
  };

  const addExpense = () => {
    if (!selectedCategory || !selectedSubcategory || !expenseAmount || !expenseDescription) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Determine payment source based on category and available money
    let paymentSource = '';
    let newPocketMoney = pocketMoney;
    let newSavings = savings;

    if (selectedCategory === 'Education Expenses') {
      // Education expenses always deduct from allowance
      if (pocketMoney >= amount) {
        newPocketMoney = pocketMoney - amount;
        paymentSource = 'allowance';
      } else {
        Alert.alert('Insufficient Funds', 'You need more allowance for education expenses. Consider asking for additional funds or using savings.');
        return;
      }
    } else if (selectedCategory === 'Lifestyle/Entertainment') {
      // Lifestyle expenses deduct from allowance first, then savings
      if (pocketMoney >= amount) {
        newPocketMoney = pocketMoney - amount;
        paymentSource = 'allowance';
      } else if ((pocketMoney + savings) >= amount) {
        const remainingAmount = amount - pocketMoney;
        newPocketMoney = 0;
        newSavings = savings - remainingAmount;
        paymentSource = 'allowance_and_savings';
        
        Alert.alert('Overspent Alert', 
          `You've overspent your allowance by ₹${remainingAmount.toFixed(2)}. This amount will be deducted from your savings.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            { text: 'Continue', onPress: () => proceedWithExpense() }
          ]
        );
        return;
      } else {
        Alert.alert('Insufficient Funds', 'You don\'t have enough money (allowance + savings) for this expense.');
        return;
      }
    }

    proceedWithExpense();

    function proceedWithExpense() {
      const currentDate = new Date().toISOString();
      
      db.transaction(tx => {
        // Add expense
        tx.executeSql(
          'INSERT INTO StudentExpenses (mobile, category, subcategory, amount, description, date, payment_source) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [mobile, selectedCategory, selectedSubcategory, amount, expenseDescription, currentDate, paymentSource],
          () => {
            // Update pocket money
            tx.executeSql(
              'INSERT OR REPLACE INTO PocketMoney (mobile, current_allowance, savings, allowance_type, allowance_source, last_updated) VALUES (?, ?, ?, ?, ?, ?)',
              [mobile, newPocketMoney, newSavings, allowanceType, allowanceSource, currentDate],
              () => {
                setIsModalVisible(false);
                setSelectedCategory('');
                setSelectedSubcategory('');
                setExpenseAmount('');
                setExpenseDescription('');
                loadExpenses();
                loadAllExpenses();
                loadPocketMoney();
                Alert.alert('Success', 'Expense added successfully!');
              }
            );
          },
          (_, error) => {
            Alert.alert('Error', 'Failed to add expense');
          }
        );
      });
    }
  };

  const addIncome = () => {
    if (!incomeAmount || !incomeSource) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const amount = parseFloat(incomeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const currentDate = new Date().toISOString();
    
    db.transaction(tx => {
      // Add to income history
      tx.executeSql(
        'INSERT INTO IncomeHistory (mobile, amount, source, description, date) VALUES (?, ?, ?, ?, ?)',
        [mobile, amount, incomeSource, `Added ₹${amount} from ${incomeSource}`, currentDate],
        () => {
          // Update pocket money
          const newAllowance = pocketMoney + amount;
          tx.executeSql(
            'INSERT OR REPLACE INTO PocketMoney (mobile, current_allowance, savings, allowance_type, allowance_source, last_updated) VALUES (?, ?, ?, ?, ?, ?)',
            [mobile, newAllowance, savings, allowanceType, incomeSource, currentDate],
            () => {
              loadPocketMoney();
              setIsAddIncomeModalVisible(false);
              setIncomeAmount('');
              setIncomeSource('');
              Alert.alert('Success', 'Income added successfully!');
            }
          );
        }
      );
    });
  };

  const addSkillGoal = () => {
    if (!goalTitle || !goalDescription) {
      Alert.alert('Error', 'Please fill the required fields');
      return;
    }

    const cost = parseFloat(goalCost) || 0;
    const currentDate = new Date().toISOString();
    
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO SkillGoals (mobile, title, description, estimated_cost, priority, status, created_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [mobile, goalTitle, goalDescription, cost, goalPriority, 'active', currentDate],
        () => {
          loadSkillGoals();
          setIsSkillGoalModalVisible(false);
          setGoalTitle('');
          setGoalDescription('');
          setGoalCost('');
          setGoalPriority('medium');
          Alert.alert('Success', 'Skill goal added successfully!');
        },
        (_, error) => {
          Alert.alert('Error', 'Failed to add skill goal');
        }
      );
    });
  };

  const transferToSavings = (amount) => {
    if (pocketMoney >= amount) {
      const newPocketMoney = pocketMoney - amount;
      const newSavings = savings + amount;
      
      db.transaction(tx => {
        tx.executeSql(
          'INSERT OR REPLACE INTO PocketMoney (mobile, current_allowance, savings, allowance_type, allowance_source, last_updated) VALUES (?, ?, ?, ?, ?, ?)',
          [mobile, newPocketMoney, newSavings, allowanceType, allowanceSource, new Date().toISOString()],
          () => {
            loadPocketMoney();
            Alert.alert('Success', `₹${amount} transferred to savings!`);
          }
        );
      });
    } else {
      Alert.alert('Error', 'Insufficient allowance to transfer');
    }
  };

  const getSpendingStatus = () => {
    const totalAvailable = pocketMoney + savings;
    if (totalAvailable === 0) return { color: '#666', text: 'No money available' };
    
    const spentPercentage = (totalSpent / totalAvailable) * 100;
    if (spentPercentage > 80) return { color: '#F44336', text: `High spending: ${spentPercentage.toFixed(1)}%` };
    if (spentPercentage > 50) return { color: '#FF9800', text: `Moderate spending: ${spentPercentage.toFixed(1)}%` };
    return { color: '#4CAF50', text: `Good control: ${spentPercentage.toFixed(1)}% spent` };
  };

  const spendingStatus = getSpendingStatus();

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

  const renderPocketMoneySection = () => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setSelectedSection(null)}
      >
        <Text style={styles.backButtonText}>← Back to Sections</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Pocket Money Manager</Text>
      
      {/* Money Overview Cards */}
      <View style={styles.moneyOverviewContainer}>
        <View style={styles.moneyCard}>
          <Text style={styles.moneyCardLabel}>Current Allowance</Text>
          <Text style={styles.moneyCardAmount}>₹{pocketMoney.toFixed(2)}</Text>
          <Text style={styles.moneyCardSource}>From {allowanceSource}</Text>
        </View>
        <View style={styles.moneyCard}>
          <Text style={styles.moneyCardLabel}>Savings</Text>
          <Text style={styles.moneyCardAmount}>₹{savings.toFixed(2)}</Text>
          <TouchableOpacity 
            style={styles.transferBtn}
            onPress={() => {
              Alert.prompt(
                'Transfer to Savings',
                'How much would you like to save?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Transfer', onPress: (value) => {
                    const amount = parseFloat(value);
                    if (!isNaN(amount) && amount > 0) {
                      transferToSavings(amount);
                    }
                  }}
                ]
              );
            }}
          >
            <Text style={styles.transferBtnText}>Save Money</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Total Available */}
      <View style={styles.totalAvailableCard}>
        <Text style={styles.totalAvailableLabel}>Total Available</Text>
        <Text style={styles.totalAvailableAmount}>₹{(pocketMoney + savings).toFixed(2)}</Text>
        <Text style={[styles.spendingStatus, { color: spendingStatus.color }]}>
          {spendingStatus.text}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.quickActionBtn} 
          onPress={() => setIsAddIncomeModalVisible(true)}
        >
          <Text style={styles.quickActionIcon}>💰</Text>
          <Text style={styles.quickActionText}>Add Income</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionBtn} 
          onPress={() => setSelectedSection('education')}
        >
          <Text style={styles.quickActionIcon}>🎓</Text>
          <Text style={styles.quickActionText}>Education Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionBtn} 
          onPress={() => setSelectedSection('lifestyle')}
        >
          <Text style={styles.quickActionIcon}>🎉</Text>
          <Text style={styles.quickActionText}>Lifestyle Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <View style={styles.recentTransactionsContainer}>
        <Text style={styles.recentTransactionsTitle}>Recent Spending</Text>
        {expenses.length > 0 ? (
          <FlatList
            data={expenses.slice(0, 5)}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.recentTransactionsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.noRecentTransactions}>No recent transactions</Text>
        )}
      </View>
    </View>
  );

  const renderEducationSection = () => {
    const educationExpenses = expenses.filter(exp => exp.category === 'Education Expenses');
    const educationTotal = educationExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setSelectedSection(null)}
        >
          <Text style={styles.backButtonText}>← Back to Sections</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Education Expenses</Text>
        <Text style={styles.sectionSubtitle}>Tuition, books, courses - funded by allowance</Text>
        
        {/* Education Spending Overview */}
        <View style={styles.educationOverviewCard}>
          <Text style={styles.educationOverviewTitle}>Education Spending ({selectedPeriod})</Text>
          <Text style={styles.educationOverviewAmount}>₹{educationTotal.toFixed(2)}</Text>
          <Text style={styles.educationOverviewNote}>
            Deducted from allowance (₹{pocketMoney.toFixed(2)} available)
          </Text>
        </View>

        {/* Add Education Expense */}
        <TouchableOpacity 
          style={styles.addEducationExpenseBtn} 
          onPress={() => {
            setSelectedCategory('Education Expenses');
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.addEducationExpenseBtnText}>+ Add Education Expense</Text>
        </TouchableOpacity>

        {/* Subcategory Quick Actions */}
        <View style={styles.subcategoryContainer}>
          <Text style={styles.subcategoryTitle}>Quick Add:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subcategoryScroll}>
            {studentCategories[0].subcategories.map((subcat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.subcategoryBtn}
                onPress={() => {
                  setSelectedCategory('Education Expenses');
                  setSelectedSubcategory(subcat);
                  setIsModalVisible(true);
                }}
              >
                <Text style={styles.subcategoryBtnText}>{subcat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Education Expenses List */}
        <View style={styles.educationExpensesContainer}>
          <Text style={styles.educationExpensesTitle}>
            Recent Education Expenses ({educationExpenses.length})
          </Text>
          {educationExpenses.length > 0 ? (
            <FlatList
              data={educationExpenses}
              renderItem={({ item }) => (
                <View style={styles.educationExpenseItem}>
                  <View style={styles.educationExpenseHeader}>
                    <Text style={styles.educationExpenseSubcategory}>{item.subcategory}</Text>
                    <Text style={styles.educationExpenseAmount}>₹{item.amount.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.educationExpenseDescription}>{item.description}</Text>
                  <Text style={styles.educationExpenseDate}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              style={styles.educationExpensesList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noEducationExpenses}>
              <Text style={styles.noEducationExpensesText}>
                No education expenses yet. Add your first expense!
              </Text>
            </View>
          )}
        </View>

        {/* Educational Tips */}
        <View style={styles.educationalTipsCard}>
          <Text style={styles.educationalTipsTitle}>💡 Money Tips</Text>
          <Text style={styles.educationalTip}>
            • Compare textbook prices online vs. physical stores
          </Text>
          <Text style={styles.educationalTip}>
            • Look for student discounts on software and courses
          </Text>
          <Text style={styles.educationalTip}>
            • Share textbooks with classmates to save money
          </Text>
        </View>
      </View>
    );
  };

  const renderLifestyleSection = () => {
    const lifestyleExpenses = expenses.filter(exp => exp.category === 'Lifestyle/Entertainment');
    const lifestyleTotal = lifestyleExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const allowanceUsed = lifestyleExpenses.filter(exp => exp.payment_source === 'allowance').reduce((sum, exp) => sum + exp.amount, 0);
    const savingsUsed = lifestyleExpenses.filter(exp => exp.payment_source?.includes('savings')).reduce((sum, exp) => sum + exp.amount, 0);
    
    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setSelectedSection(null)}
        >
          <Text style={styles.backButtonText}>← Back to Sections</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Lifestyle & Entertainment</Text>
        <Text style={styles.sectionSubtitle}>Fun expenses - allowance first, then savings</Text>
        
        {/* Lifestyle Spending Overview */}
        <View style={styles.lifestyleOverviewCard}>
          <Text style={styles.lifestyleOverviewTitle}>Lifestyle Spending ({selectedPeriod})</Text>
          <Text style={styles.lifestyleOverviewAmount}>₹{lifestyleTotal.toFixed(2)}</Text>
          <View style={styles.lifestyleBreakdown}>
            <Text style={styles.lifestyleBreakdownItem}>
              From Allowance: ₹{allowanceUsed.toFixed(2)}
            </Text>
            {savingsUsed > 0 && (
              <Text style={[styles.lifestyleBreakdownItem, { color: '#FF9800' }]}>
                From Savings: ₹{savingsUsed.toFixed(2)}
              </Text>
            )}
          </View>
        </View>

        {/* Spending Limits Alert */}
        <View style={styles.spendingLimitsCard}>
          <Text style={styles.spendingLimitsTitle}>💳 Available Funds</Text>
          <Text style={styles.availableFundsText}>
            Allowance: ₹{pocketMoney.toFixed(2)} | Savings: ₹{savings.toFixed(2)}
          </Text>
          {pocketMoney < 100 && (
            <Text style={styles.lowFundsWarning}>
              ⚠️ Low allowance! Consider saving more or asking for additional funds.
            </Text>
          )}
        </View>

        {/* Add Lifestyle Expense */}
        <TouchableOpacity 
          style={styles.addLifestyleExpenseBtn} 
          onPress={() => {
            setSelectedCategory('Lifestyle/Entertainment');
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.addLifestyleExpenseBtnText}>+ Add Fun Expense</Text>
        </TouchableOpacity>

        {/* Subcategory Quick Actions */}
        <View style={styles.subcategoryContainer}>
          <Text style={styles.subcategoryTitle}>Quick Add:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subcategoryScroll}>
            {studentCategories[1].subcategories.map((subcat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.subcategoryBtn}
                onPress={() => {
                  setSelectedCategory('Lifestyle/Entertainment');
                  setSelectedSubcategory(subcat);
                  setIsModalVisible(true);
                }}
              >
                <Text style={styles.subcategoryBtnText}>{subcat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lifestyle Expenses List */}
        <View style={styles.lifestyleExpensesContainer}>
          <Text style={styles.lifestyleExpensesTitle}>
            Recent Fun Expenses ({lifestyleExpenses.length})
          </Text>
          {lifestyleExpenses.length > 0 ? (
            <FlatList
              data={lifestyleExpenses}
              renderItem={({ item }) => (
                <View style={styles.lifestyleExpenseItem}>
                  <View style={styles.lifestyleExpenseHeader}>
                    <View style={styles.lifestyleExpenseLeft}>
                      <Text style={styles.lifestyleExpenseSubcategory}>{item.subcategory}</Text>
                      <Text style={styles.lifestyleExpensePayment}>
                        {item.payment_source === 'allowance' ? '💰 Allowance' : 
                         item.payment_source?.includes('savings') ? '💰🏦 Allowance + Savings' : '💰 Allowance'}
                      </Text>
                    </View>
                    <Text style={styles.lifestyleExpenseAmount}>₹{item.amount.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.lifestyleExpenseDescription}>{item.description}</Text>
                  <Text style={styles.lifestyleExpenseDate}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              style={styles.lifestyleExpensesList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noLifestyleExpenses}>
              <Text style={styles.noLifestyleExpensesText}>
                No fun expenses yet. Enjoy responsibly!
              </Text>
            </View>
          )}
        </View>

        {/* Fun Tips */}
        <View style={styles.funTipsCard}>
          <Text style={styles.funTipsTitle}>🎉 Smart Fun Tips</Text>
          <Text style={styles.funTip}>
            • Look for student discounts at movies and restaurants
          </Text>
          <Text style={styles.funTip}>
            • Plan group activities to split costs
          </Text>
          <Text style={styles.funTip}>
            • Set a weekly fun budget to avoid overspending
          </Text>
        </View>
      </View>
    );
  };

  const renderSkillGoalsSection = () => {
    const toggleGoalStatus = (goalId, currentStatus) => {
      const newStatus = currentStatus === 'completed' ? 'active' : 'completed';
      const completedDate = newStatus === 'completed' ? new Date().toISOString() : null;
      
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE SkillGoals SET status = ?, completed_date = ? WHERE id = ?',
          [newStatus, completedDate, goalId],
          () => {
            loadSkillGoals();
            Alert.alert('Success', `Goal ${newStatus === 'completed' ? 'completed' : 'reactivated'}!`);
          }
        );
      });
    };

    const deleteGoal = (goalId) => {
      Alert.alert(
        'Delete Goal',
        'Are you sure you want to delete this goal?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              db.transaction(tx => {
                tx.executeSql(
                  'DELETE FROM SkillGoals WHERE id = ?',
                  [goalId],
                  () => {
                    loadSkillGoals();
                    Alert.alert('Success', 'Goal deleted successfully!');
                  }
                );
              });
            }
          }
        ]
      );
    };

    const activeGoals = skillGoals.filter(goal => goal.status === 'active');
    const completedGoals = skillGoals.filter(goal => goal.status === 'completed');

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setSelectedSection(null)}
        >
          <Text style={styles.backButtonText}>← Back to Sections</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Skill Goals</Text>
        <Text style={styles.sectionSubtitle}>Your bucket list - things you want to achieve!</Text>
        
        <TouchableOpacity 
          style={styles.addSkillGoalBtn} 
          onPress={() => setIsSkillGoalModalVisible(true)}
        >
          <Text style={styles.addSkillGoalBtnText}>+ Add New Goal</Text>
        </TouchableOpacity>

        <ScrollView style={styles.skillGoalsContainer}>
          {/* Active Goals */}
          <View style={styles.goalsSection}>
            <Text style={styles.goalsSectionTitle}>
              🎯 Active Goals ({activeGoals.length})
            </Text>
            {activeGoals.length > 0 ? (
              activeGoals.map((goal) => (
                <View key={goal.id} style={styles.skillGoalItem}>
                  <View style={styles.skillGoalHeader}>
                    <Text style={styles.skillGoalTitle}>{goal.title}</Text>
                    <Text style={styles.skillGoalPriority}>
                      {goal.priority === 'high' ? '🔴' : goal.priority === 'medium' ? '🟡' : '🟢'} {goal.priority}
                    </Text>
                  </View>
                  
                  <Text style={styles.skillGoalDescription}>{goal.description}</Text>
                  
                  {goal.estimated_cost > 0 && (
                    <Text style={styles.skillGoalCost}>
                      Estimated cost: ₹{goal.estimated_cost.toFixed(2)}
                    </Text>
                  )}
                  
                  <Text style={styles.skillGoalDate}>
                    Added: {new Date(goal.created_date).toLocaleDateString()}
                  </Text>
                  
                  <View style={styles.skillGoalActions}>
                    <TouchableOpacity 
                      style={styles.completeGoalBtn}
                      onPress={() => toggleGoalStatus(goal.id, goal.status)}
                    >
                      <Text style={styles.completeGoalText}>✅ Mark Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteGoalBtn}
                      onPress={() => deleteGoal(goal.id)}
                    >
                      <Text style={styles.deleteGoalText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noActiveGoals}>
                No active goals. Add some goals to work towards!
              </Text>
            )}
          </View>

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <View style={styles.goalsSection}>
              <Text style={styles.goalsSectionTitle}>
                🏆 Completed Goals ({completedGoals.length})
              </Text>
              {completedGoals.map((goal) => (
                <View key={goal.id} style={[styles.skillGoalItem, styles.completedGoalItem]}>
                  <View style={styles.skillGoalHeader}>
                    <Text style={[styles.skillGoalTitle, styles.completedGoalTitle]}>{goal.title}</Text>
                    <Text style={styles.completedBadge}>✅ Done!</Text>
                  </View>
                  
                  <Text style={styles.skillGoalDescription}>{goal.description}</Text>
                  
                  <Text style={styles.skillGoalCompletedDate}>
                    Completed: {new Date(goal.completed_date).toLocaleDateString()}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.reactivateGoalBtn}
                    onPress={() => toggleGoalStatus(goal.id, goal.status)}
                  >
                    <Text style={styles.reactivateGoalText}>↩️ Reactivate</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Goal Ideas */}
          <View style={styles.goalIdeasCard}>
            <Text style={styles.goalIdeasTitle}>💡 Goal Ideas</Text>
            <Text style={styles.goalIdea}>• Buy a laptop for better productivity</Text>
            <Text style={styles.goalIdea}>• Take an online course in coding/design</Text>
            <Text style={styles.goalIdea}>• Learn a new language with premium app</Text>
            <Text style={styles.goalIdea}>• Buy professional software/tools</Text>
            <Text style={styles.goalIdea}>• Attend a workshop or conference</Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderAnalysisSection = () => {
    // Calculate category and subcategory spending for analysis
    const categorySpending = {};
    const subcategorySpending = {};
    const monthlySpending = {};
    const paymentSourceSpending = { allowance: 0, savings: 0, mixed: 0 };
    
    allExpenses.forEach(expense => {
      // Category analysis
      if (categorySpending[expense.category]) {
        categorySpending[expense.category] += expense.amount;
      } else {
        categorySpending[expense.category] = expense.amount;
      }
      
      // Subcategory analysis
      if (expense.subcategory) {
        if (subcategorySpending[expense.subcategory]) {
          subcategorySpending[expense.subcategory] += expense.amount;
        } else {
          subcategorySpending[expense.subcategory] = expense.amount;
        }
      }
      
      // Payment source analysis
      if (expense.payment_source === 'allowance') {
        paymentSourceSpending.allowance += expense.amount;
      } else if (expense.payment_source?.includes('savings')) {
        paymentSourceSpending.mixed += expense.amount;
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
      .sort(([,a], [,b]) => b - a);
    
    // Get top subcategories
    const sortedSubcategories = Object.entries(subcategorySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // Get recent months spending
    const sortedMonths = Object.entries(monthlySpending)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .slice(0, 6);

    const educationTotal = categorySpending['Education Expenses'] || 0;
    const lifestyleTotal = categorySpending['Lifestyle/Entertainment'] || 0;

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setSelectedSection(null)}
        >
          <Text style={styles.backButtonText}>← Back to Sections</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Spending Overview</Text>
        
        {/* Money Summary */}
        <View style={styles.moneySummaryCard}>
          <Text style={styles.moneySummaryTitle}>💰 Your Money</Text>
          <View style={styles.moneySummaryRow}>
            <Text style={styles.moneySummaryLabel}>Allowance:</Text>
            <Text style={styles.moneySummaryAmount}>₹{pocketMoney.toFixed(2)}</Text>
          </View>
          <View style={styles.moneySummaryRow}>
            <Text style={styles.moneySummaryLabel}>Savings:</Text>
            <Text style={styles.moneySummaryAmount}>₹{savings.toFixed(2)}</Text>
          </View>
          <View style={styles.moneySummaryRow}>
            <Text style={styles.moneySummaryLabel}>Total Available:</Text>
            <Text style={[styles.moneySummaryAmount, styles.moneySummaryTotal]}>₹{(pocketMoney + savings).toFixed(2)}</Text>
          </View>
        </View>
        
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
            <Text style={styles.analysisSectionTitle}>Spending by Category</Text>
            {sortedCategories.length > 0 ? (
              sortedCategories.map(([category, amount]) => {
                const percentage = (amount / totalAllTimeSpending) * 100;
                const categoryData = studentCategories.find(cat => cat.name === category);
                
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
                            width: `${percentage}%`,
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

          {/* Top Subcategories */}
          {sortedSubcategories.length > 0 && (
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Top Spending Areas</Text>
              {sortedSubcategories.map(([subcategory, amount]) => {
                const percentage = (amount / totalAllTimeSpending) * 100;
                
                return (
                  <View key={subcategory} style={styles.subcategoryAnalysisItem}>
                    <View style={styles.subcategoryAnalysisHeader}>
                      <Text style={styles.subcategoryAnalysisName}>{subcategory}</Text>
                      <Text style={styles.subcategoryAnalysisAmount}>₹{amount.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.subcategoryAnalysisPercentage}>
                      {percentage.toFixed(1)}% of total spending
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Payment Source Analysis */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Payment Sources</Text>
            <View style={styles.paymentSourceCard}>
              <Text style={styles.paymentSourceLabel}>From Allowance: ₹{paymentSourceSpending.allowance.toFixed(2)}</Text>
              <Text style={styles.paymentSourceLabel}>Mixed (Allowance + Savings): ₹{paymentSourceSpending.mixed.toFixed(2)}</Text>
              {paymentSourceSpending.mixed > 0 && (
                <Text style={styles.overspendingWarning}>
                  ⚠️ You've overspent your allowance ₹{paymentSourceSpending.mixed.toFixed(2)} times
                </Text>
              )}
            </View>
          </View>

          {/* Smart Insights */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>💡 Smart Insights</Text>
            <View style={styles.insightsContainer}>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Education Priority:</Text>
                <Text style={styles.insightValue}>
                  ₹{educationTotal.toFixed(2)} ({((educationTotal / totalAllTimeSpending) * 100).toFixed(1)}% of spending)
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Fun Activities:</Text>
                <Text style={styles.insightValue}>
                  ₹{lifestyleTotal.toFixed(2)} ({((lifestyleTotal / totalAllTimeSpending) * 100).toFixed(1)}% of spending)
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Money Management:</Text>
                <Text style={[
                  styles.insightValue,
                  { color: paymentSourceSpending.mixed === 0 ? '#4CAF50' : '#FF9800' }
                ]}>
                  {paymentSourceSpending.mixed === 0 ? 'Great! Staying within allowance' : 'Need better budgeting'}
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Savings Rate:</Text>
                <Text style={styles.insightValue}>
                  ₹{savings.toFixed(2)} saved ({pocketMoney + savings > 0 ? ((savings / (pocketMoney + savings)) * 100).toFixed(1) : '0'}% of total money)
                </Text>
              </View>
            </View>
          </View>

          {/* Student Tips */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>🎓 Student Money Tips</Text>
            <View style={styles.studentTipsCard}>
              <Text style={styles.studentTip}>• Education should be your top spending priority</Text>
              <Text style={styles.studentTip}>• Try to keep lifestyle expenses under 30% of your allowance</Text>
              <Text style={styles.studentTip}>• Always save at least 10% of any money you receive</Text>
              <Text style={styles.studentTip}>• Track your goals and work towards achieving them</Text>
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
          ) : selectedSection === 'pocket-money' ? (
            renderPocketMoneySection()
          ) : selectedSection === 'education' ? (
            renderEducationSection()
          ) : selectedSection === 'lifestyle' ? (
            renderLifestyleSection()
          ) : selectedSection === 'skill-goals' ? (
            renderSkillGoalsSection()
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
                  onPress={() => {
                    setSelectedCategory(category.name);
                    setSelectedSubcategory(''); // Reset subcategory when category changes
                  }}
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

            {selectedCategory && (
              <>
                <Text style={styles.inputLabel}>Subcategory</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subcategoryScroll}>
                  {studentCategories
                    .find(cat => cat.name === selectedCategory)
                    ?.subcategories.map((subcat, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.subcategoryButton,
                        selectedSubcategory === subcat && styles.selectedSubcategoryButton
                      ]}
                      onPress={() => setSelectedSubcategory(subcat)}
                    >
                      <Text style={[
                        styles.subcategoryButtonText,
                        selectedSubcategory === subcat && styles.selectedSubcategoryText
                      ]}>
                        {subcat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

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

      {/* Add Income Modal */}
      <Modal
        visible={isAddIncomeModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Income</Text>
            <Text style={styles.modalSubtitle}>
              Add money to your allowance from various sources
            </Text>
            
            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={incomeAmount}
              onChangeText={setIncomeAmount}
              placeholder="Enter amount received"
              keyboardType="numeric"
              autoFocus={true}
            />
            
            <Text style={styles.inputLabel}>Source</Text>
            <View style={styles.incomeSourceContainer}>
              {['Parents (Allowance)', 'Part-time Job', 'Gift Money', 'Scholarship', 'Other'].map((source) => (
                <TouchableOpacity
                  key={source}
                  style={[
                    styles.sourceButton,
                    incomeSource === source && styles.selectedSourceButton
                  ]}
                  onPress={() => setIncomeSource(source)}
                >
                  <Text style={[
                    styles.sourceButtonText,
                    incomeSource === source && styles.selectedSourceText
                  ]}>
                    {source}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setIsAddIncomeModalVisible(false);
                  setIncomeAmount('');
                  setIncomeSource('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={addIncome}
              >
                <Text style={styles.saveButtonText}>Add Income</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Skill Goal Modal */}
      <Modal
        visible={isSkillGoalModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Skill Goal</Text>
            <Text style={styles.modalSubtitle}>What do you want to achieve?</Text>
            
            <Text style={styles.inputLabel}>Goal Title *</Text>
            <TextInput
              style={styles.input}
              value={goalTitle}
              onChangeText={setGoalTitle}
              placeholder="e.g., Buy a laptop, Learn Python"
            />

            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={styles.input}
              value={goalDescription}
              onChangeText={setGoalDescription}
              placeholder="Why is this important to you?"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Estimated Cost (₹) - Optional</Text>
            <TextInput
              style={styles.input}
              value={goalCost}
              onChangeText={setGoalCost}
              placeholder="How much might this cost?"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityContainer}>
              {[
                { label: 'High', value: 'high', icon: '🔴', color: '#F44336' },
                { label: 'Medium', value: 'medium', icon: '🟡', color: '#FF9800' },
                { label: 'Low', value: 'low', icon: '🟢', color: '#4CAF50' }
              ].map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  style={[
                    styles.priorityButton,
                    goalPriority === priority.value && { backgroundColor: priority.color }
                  ]}
                  onPress={() => setGoalPriority(priority.value)}
                >
                  <Text style={styles.priorityIcon}>{priority.icon}</Text>
                  <Text style={[
                    styles.priorityButtonText,
                    goalPriority === priority.value && { color: '#fff' }
                  ]}>
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setIsSkillGoalModalVisible(false);
                  setGoalTitle('');
                  setGoalDescription('');
                  setGoalCost('');
                  setGoalPriority('medium');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={addSkillGoal}
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

  // POCKET MONEY SECTION STYLES
  moneyOverviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  moneyCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    alignItems: 'center',
  },
  moneyCardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  moneyCardAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  moneyCardSource: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 10,
  },
  transferBtn: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 5,
  },
  transferBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalAvailableCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  totalAvailableLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  totalAvailableAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  spendingStatus: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  quickActionBtn: {
    backgroundColor: '#fff',
    width: '31%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  quickActionText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  recentTransactionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  recentTransactionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recentTransactionsList: {
    maxHeight: 200,
  },
  noRecentTransactions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },

  // MODAL STYLES
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  incomeSourceContainer: {
    marginBottom: 15,
  },
  sourceButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSourceButton: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  sourceButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedSourceText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  priorityButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  priorityIcon: {
    fontSize: 16,
    marginBottom: 3,
  },
  priorityButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  subcategoryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSubcategoryButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  subcategoryButtonText: {
    fontSize: 12,
    color: '#333',
  },
  selectedSubcategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // EDUCATION SECTION STYLES
  sectionSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  educationOverviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  educationOverviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  educationOverviewAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  educationOverviewNote: {
    fontSize: 12,
    color: '#666',
  },
  addEducationExpenseBtn: {
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
  addEducationExpenseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subcategoryContainer: {
    marginBottom: 15,
  },
  subcategoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subcategoryScroll: {
    marginBottom: 5,
  },
  subcategoryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 10,
  },
  subcategoryBtnText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  educationExpensesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  educationExpensesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  educationExpensesList: {
    maxHeight: 200,
  },
  educationExpenseItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  educationExpenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  educationExpenseSubcategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  educationExpenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  educationExpenseDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  educationExpenseDate: {
    fontSize: 10,
    color: '#999',
  },
  noEducationExpenses: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noEducationExpensesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  educationalTipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  educationalTipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  educationalTip: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 3,
  },

  // LIFESTYLE SECTION STYLES
  lifestyleOverviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  lifestyleOverviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  lifestyleOverviewAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 8,
  },
  lifestyleBreakdown: {
    marginTop: 5,
  },
  lifestyleBreakdownItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  spendingLimitsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  spendingLimitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  availableFundsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  lowFundsWarning: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
  },
  addLifestyleExpenseBtn: {
    backgroundColor: '#FF9800',
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
  addLifestyleExpenseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lifestyleExpensesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  lifestyleExpensesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  lifestyleExpensesList: {
    maxHeight: 200,
  },
  lifestyleExpenseItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  lifestyleExpenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  lifestyleExpenseLeft: {
    flex: 1,
  },
  lifestyleExpenseSubcategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  lifestyleExpensePayment: {
    fontSize: 10,
    color: '#666',
  },
  lifestyleExpenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  lifestyleExpenseDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  lifestyleExpenseDate: {
    fontSize: 10,
    color: '#999',
  },
  noLifestyleExpenses: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noLifestyleExpensesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  funTipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  funTipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  funTip: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 3,
  },

  // SKILL GOALS SECTION STYLES
  addSkillGoalBtn: {
    backgroundColor: '#9C27B0',
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
  addSkillGoalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skillGoalsContainer: {
    flex: 1,
  },
  goalsSection: {
    marginBottom: 20,
  },
  goalsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  skillGoalItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  skillGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillGoalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  skillGoalPriority: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  skillGoalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 18,
  },
  skillGoalCost: {
    fontSize: 12,
    color: '#9C27B0',
    fontWeight: '500',
    marginBottom: 5,
  },
  skillGoalDate: {
    fontSize: 10,
    color: '#999',
    marginBottom: 10,
  },
  skillGoalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completeGoalBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 10,
  },
  completeGoalText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteGoalBtn: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteGoalText: {
    fontSize: 16,
  },
  completedGoalItem: {
    opacity: 0.7,
    backgroundColor: '#f8f9fa',
  },
  completedGoalTitle: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  completedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  skillGoalCompletedDate: {
    fontSize: 10,
    color: '#4CAF50',
    marginBottom: 10,
    fontWeight: '500',
  },
  reactivateGoalBtn: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reactivateGoalText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noActiveGoals: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  goalIdeasCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  goalIdeasTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  goalIdea: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 3,
  },

  // ANALYSIS SECTION STYLES
  moneySummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  moneySummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  moneySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  moneySummaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  moneySummaryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  moneySummaryTotal: {
    color: '#2196F3',
    fontSize: 16,
  },
  subcategoryAnalysisItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subcategoryAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  subcategoryAnalysisName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  subcategoryAnalysisAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  subcategoryAnalysisPercentage: {
    fontSize: 12,
    color: '#999',
  },
  paymentSourceCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  paymentSourceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  overspendingWarning: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
    marginTop: 5,
  },
  studentTipsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  studentTip: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 3,
  },
});

export default StudentScreen;
