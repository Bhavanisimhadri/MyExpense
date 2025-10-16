// DatabaseHelper.js
import SQLite from 'react-native-sqlite-storage';

// Open database connection
const db = SQLite.openDatabase({ name: 'ExpenseDB.db', location: 'default' });

// ✅ Create required tables (runs once automatically)
db.transaction(tx => {
  // Main financial table (already exists)
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS UserFinancialData (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mobile TEXT,
      data_key TEXT,
      data_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(mobile, data_key)
    );`
  );

  // ✅ New Reminders table for storing reminders
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS Reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mobile TEXT,
      note TEXT,
      reminder_time TEXT,
      notified INTEGER DEFAULT 0
    );`,
    [],
    () => console.log("✅ Reminders table ready"),
    (_, err) => console.log("❌ Error creating Reminders table:", err)
  );
});

export const DatabaseHelper = {
  /* ----------------- EXISTING FUNCTIONS ----------------- */

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
  },

  /* ----------------- NEW REMINDERS FUNCTIONS ----------------- */

  // ✅ Save a new reminder
  saveReminder: (mobile, note, reminderTime) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO Reminders (mobile, note, reminder_time) VALUES (?, ?, ?)`,
          [mobile, note, reminderTime],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  },

  // ✅ Get all reminders for a user
  getReminders: (mobile) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM Reminders WHERE mobile = ? ORDER BY reminder_time ASC`,
          [mobile],
          (_, results) => {
            const reminders = [];
            for (let i = 0; i < results.rows.length; i++) {
              reminders.push(results.rows.item(i));
            }
            resolve(reminders);
          },
          (_, error) => reject(error)
        );
      });
    });
  },

  // ✅ Delete a specific reminder
  deleteReminder: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `DELETE FROM Reminders WHERE id = ?`,
          [id],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  },

  // ✅ Mark reminder as notified
  markAsNotified: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE Reminders SET notified = 1 WHERE id = ?`,
          [id],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  },
};

export default DatabaseHelper;
