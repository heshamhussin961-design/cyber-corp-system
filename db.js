const mysql = require('mysql2');

// الكود ده بيقول: لو لقيت رابط داتابيز خارجي استخدمه، لو ملقيتش استخدم XAMPP بتاعنا
const connection = mysql.createConnection(process.env.DATABASE_URL || {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'company_system_db'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to Database:', err.message);
        return;
    }
    console.log('✅ Connected to MySQL Database successfully!');
});

module.exports = connection;