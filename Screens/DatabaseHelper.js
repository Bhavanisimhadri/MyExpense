// DatabaseHelper.js
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'ExpenseDB.db', location: 'default' });

export const DatabaseHelper = {
  // Save user data
  saveUserData: (mobile, key, value) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO UserFinancialData (mobile, data_key, data_value) 
           VALUES (?, ?, ?)`,
          [mobile, key, JSON.stringify(value)],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  },

  // Get user data
  getUserData: (mobile, key) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT data_value FROM UserFinancialData WHERE mobile = ? AND data_key = ?',
          [mobile, key],
          (_, results) => {
            if (results.rows.length > 0) {
              try {
                const data = JSON.parse(results.rows.item(0).data_value);
                resolve(data);
              } catch (e) {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          },
          (_, error) => reject(error)
        );
      });
    });
  },

  // Get all financial data keys for a user (for reports)
 getAllUserFinancialKeys: (mobile) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT data_key, data_value FROM UserFinancialData WHERE mobile = ? AND (data_key LIKE "financials_%" OR data_key LIKE "partner_financials_%")',
        [mobile],
        (_, results) => {
          const data = {};
          for (let i = 0; i < results.rows.length; i++) {
            try {
              const item = results.rows.item(i);
              data[item.data_key] = JSON.parse(item.data_value);
            } catch (e) {
              console.log("Error parsing data for key:", item.data_key);
            }
          }
          resolve(data);
        },
        (_, error) => reject(error)
      );
    });
  });
},

  // Delete user data
  deleteUserData: (mobile, key) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM UserFinancialData WHERE mobile = ? AND data_key = ?',
          [mobile, key],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }
};

export default DatabaseHelper;