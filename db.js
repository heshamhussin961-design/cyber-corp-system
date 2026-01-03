// db.js
const mysql = require('mysql2');

// إعدادات الاتصال بـ XAMPP
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // اليوزر الافتراضي
    password: '',      // الباسورد الافتراضي فاضي
    database: 'company_system_db' // اسم الداتابيز بتاعتنا
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to Database:', err.message);
        return;
    }
    console.log('✅ Connected to MySQL Database successfully!');
});

module.exports = connection;