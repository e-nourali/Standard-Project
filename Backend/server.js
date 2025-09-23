// این فایل سرور بک‌اند با استفاده از Node.js و Express است.
// برای استفاده از این فایل، ابتدا باید Node.js را نصب کنید و سپس از طریق ترمینال دستورات زیر را اجرا کنید:
// npm init -y
// npm install express pg cors cookie-parser jsonwebtoken

import express from 'express';
import pg from 'pg';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const { Pool } = pg;
const app = express();
const port = 3000;
const SECRET_KEY = 'your_super_secret_key'; // یک کلید مخفی برای JWT

// Middleware
app.use(cors({
    origin: 'http://127.0.0.1:5500', // آدرس کامل جایی که فایل HTML شما اجرا می‌شود
    //origin: 'http://localhost:5500', // آدرس کامل جایی که فایل HTML شما اجرا می‌شود
    credentials: true, // این خط برای ارسال و دریافت کوکی ضروری است
}));
app.use(express.json());
app.use(cookieParser());

// پیکربندی اتصال به پایگاه داده PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'hteZm1900',
    port: 5432,
});

// ایجاد جدول در صورت عدم وجود
const createTable = async () => {
    try {
        const client = await pool.connect();
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            );
        `;
        await client.query(query);
        client.release();
        console.log('جدول "users" با موفقیت ایجاد یا تأیید شد.');
    } catch (err) {
        console.error('خطا در ایجاد جدول:', err);
    }
};

createTable();

// Endpoint برای ثبت‌نام کاربر جدید
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'نام کاربری و رمز عبور الزامی است.' });
    }

    try {
        const client = await pool.connect();
        const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username';
        const values = [username, password];
        const result = await client.query(query, values);
        client.release();

        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

        res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000, sameSite: 'Lax' }); // تنظیم کوکی
        res.status(201).json({ message: 'ثبت‌نام موفقیت‌آمیز', user: user });
    } catch (err) {
        if (err.code === '23505') {
            res.status(409).json({ message: 'این نام کاربری از قبل وجود دارد.' });
        } else {
            console.error('خطا در ثبت‌نام:', err);
            res.status(500).json({ message: 'خطای سرور داخلی' });
        }
    }
});

// Endpoint برای ورود کاربر
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const client = await pool.connect();
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await client.query(query, [username]);
        client.release();

        const user = result.rows[0];

        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است.' });
        }

        const token = jwt.sign({ userId: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

        res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000, sameSite: 'Lax' });
        res.status(200).json({ message: 'ورود موفقیت‌آمیز', user: user });

    } catch (err) {
        console.error('خطا در ورود:', err);
        res.status(500).json({ message: 'خطای سرور داخلی' });
    }
});

// Endpoint برای بررسی وضعیت لاگین
app.get('/check-auth', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ isAuthenticated: false, message: 'کاربر لاگین نیست.' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        res.status(200).json({ isAuthenticated: true, username: decoded.username });
    } catch (err) {
        res.status(401).json({ isAuthenticated: false, message: 'توکن نامعتبر است.' });
    }
});

app.listen(port, () => {
    console.log(`سرور در حال اجرا در http://localhost:${port}`);
});

// Endpoint برای خروج کاربر
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'با موفقیت از حساب خارج شدید.' });
});
