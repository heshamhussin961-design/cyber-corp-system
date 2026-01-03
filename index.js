// index.js (الإصدار المطور)
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json()); // مهم جداً: عشان السيرفر يفهم البيانات اللي جاية بصيغة JSON

// 1. (GET) هات كل الموظفين
app.get('/users', (req, res) => {
    const sql = `
        SELECT users.id, users.username, users.email, roles.name as role 
        FROM users 
        JOIN roles ON users.role_id = roles.id
    `;
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// 2. (POST) ضيف موظف جديد
app.post('/users', (req, res) => {
    // بناخد البيانات اللي مبعوتة من "الجسم" (Body) بتاع الطلب
    const { username, email, password, role_id } = req.body;

    const sql = "INSERT INTO users (`username`, `email`, `password`, `role_id`) VALUES (?)";
    const values = [username, email, password, role_id];

    db.query(sql, [values], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Employee created successfully!", id: data.insertId });
    });
});

// --- الجزء الجديد: إدارة المهام ---

// 3. (POST) إسناد مهمة لموظف
app.post('/tasks', (req, res) => {
    const { title, user_id, due_date } = req.body;
    const sql = "INSERT INTO tasks (`title`, `user_id`, `due_date`) VALUES (?)";
    const values = [title, user_id, due_date];

    db.query(sql, [values], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Task assigned successfully!" });
    });
});

// 4. (GET) هات المهام باسم الموظف
app.get('/tasks', (req, res) => {
    // هنا بنعمل JOIN عشان نجيب اسم الموظف بدل رقمه
    const sql = `
        SELECT tasks.title, tasks.due_date, users.username 
        FROM tasks 
        JOIN users ON tasks.user_id = users.id
        ORDER BY tasks.created_at DESC
    `;
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// --- الجزء الأخير: الحضور والانصراف ---

// 5. (POST) تسجيل دخول (Clock In)
app.post('/attendance/clock-in', (req, res) => {
    const { user_id } = req.body;
    // بنسجل وقت الدخول الحالي وتاريخ النهاردة
    const sql = "INSERT INTO attendance (`user_id`, `clock_in`, `date`, `status`) VALUES (?, NOW(), CURDATE(), 'present')";

    db.query(sql, [user_id], (err, data) => {
        if (err) return res.status(500).json({ error: "ممكن يكون الموظف ده سجل دخول قبل كده النهاردة!" });
        return res.json({ message: "تم تسجيل الدخول بنجاح! 🌞" });
    });
});

// 6. (POST) تسجيل خروج (Clock Out)
app.post('/attendance/clock-out', (req, res) => {
    const { user_id } = req.body;
    // بنحدث السطر بتاع النهاردة ونضيف وقت الخروج
    const sql = "UPDATE attendance SET clock_out = NOW() WHERE user_id = ? AND date = CURDATE()";

    db.query(sql, [user_id], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "تم تسجيل الانصراف! تروح بالسلامة 👋" });
    });
});

// 7. (GET) سجل الحضور بتاع النهاردة
app.get('/attendance', (req, res) => {
    const sql = `
        SELECT users.username, attendance.clock_in, attendance.clock_out 
        FROM attendance 
        JOIN users ON attendance.user_id = users.id 
        WHERE attendance.date = CURDATE()
    `;
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// --- الجزء السادس: تسجيل الدخول (Login) ---

// 8. (POST) التحقق من بيانات المستخدم
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // بنقول للداتابيز: دوري على واحد بالإيميل والباسورد دول
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, data) => {
        if (err) return res.status(500).json(err);

        // لو ملقناش حد (المصفوفة فاضية)
        if (data.length === 0) {
            return res.status(401).json({ message: "الإيميل أو الباسورد غلط! ❌" });
        }

        // لو لقيناه، نرجع بياناته (من غير الباسورد عشان الأمان)
        const user = data[0];
        return res.json({
            message: "Login Successful",
            user: { id: user.id, username: user.username, role_id: user.role_id }
        });
    });
});

// --- كود بناء الداتابيز (تشغيل مرة واحدة فقط) ---
app.get('/init', (req, res) => {
    const sql = `
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
            user_id INT,
            due_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            clock_in DATETIME,
            clock_out DATETIME,
            status ENUM('present', 'absent', 'late') DEFAULT 'present',
            date DATE NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        INSERT IGNORE INTO roles (id, name) VALUES (1, 'Admin'), (2, 'Manager'), (3, 'Employee');
    `;

    // بنقسم الكود لأوامر منفصلة عشان يتنفذ
    const queries = sql.split(';').filter(q => q.trim() !== '');

    queries.forEach(query => {
        db.query(query, (err) => {
            if (err) console.error("Error creating table:", err.message);
        });
    });

    res.send("✅ تم بناء الجداول في الداتابيز السحابية بنجاح!");
});

// تشغيل السيرفر
app.listen(3000, () => {
    console.log('🚀 Server is ready on http://localhost:3000');
});