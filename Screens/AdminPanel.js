import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'ExpenseDB.db', location: 'default' });

const AdminPanelScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userExpenses, setUserExpenses] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.mobile?.includes(searchQuery)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadUsers = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Users ORDER BY name ASC',
        [],
        (_, result) => {
          const rows = result.rows;
          let userList = [];
          for (let i = 0; i < rows.length; i++) {
            userList.push(rows.item(i));
          }
          setUsers(userList);
          setFilteredUsers(userList);
        },
        (_, error) => {
          console.log('Error loading users:', error);
        }
      );
    });
  };

  const loadUserExpenses = (mobile) => {
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
          setUserExpenses(expenseList);
        },
        (_, error) => {
          console.log('Error loading user expenses:', error);
          setUserExpenses([]);
        }
      );
    });
  };

  const handleUserPress = (user) => {
    setSelectedUser(user);
    loadUserExpenses(user.mobile);
  };

  const getTotalExpenses = () => {
    return userExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const logout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from admin panel?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => navigation.replace('Login') },
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.userItem,
        selectedUser?.mobile === item.mobile && styles.selectedUserItem
      ]}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || 'No Name'}</Text>
        <Text style={styles.userMobile}>{item.mobile}</Text>
        <Text style={styles.userCategory}>
          Category: {item.category || 'Not Selected'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
      </View>
      <Text style={styles.expenseDescription}>{item.description}</Text>
      <Text style={styles.expenseDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or mobile number..."
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.content}>
        {/* Users List */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>
            Users ({filteredUsers.length})
          </Text>
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.mobile}
            style={styles.usersList}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* User Details */}
        {selectedUser && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>
              {selectedUser.name}'s Expenses
            </Text>
            <View style={styles.expensesSummary}>
              <Text style={styles.summaryText}>
                Total Expenses: ₹{getTotalExpenses().toFixed(2)}
              </Text>
              <Text style={styles.summaryText}>
                Total Transactions: {userExpenses.length}
              </Text>
            </View>
            
            {userExpenses.length > 0 ? (
              <FlatList
                data={userExpenses}
                renderItem={renderExpenseItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.expensesList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noExpenses}>
                <Text style={styles.noExpensesText}>
                  No expenses recorded for this user
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#D35225',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  usersSection: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    elevation: 2,
  },
  detailsSection: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  usersList: {
    flex: 1,
  },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedUserItem: {
    backgroundColor: '#E3F2FD',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userMobile: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userCategory: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  expensesSummary: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  expensesList: {
    flex: 1,
  },
  expenseItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  expenseCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D35225',
  },
  expenseDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  expenseDate: {
    fontSize: 11,
    color: '#999',
  },
  noExpenses: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noExpensesText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default AdminPanelScreen;