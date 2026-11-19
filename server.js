const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'abes-flix-secret-key-2024';
const TABLE_NAME = 'AbesFlixUsers';

const client = new DynamoDBClient({ region: 'ap-south-1' });
const db = DynamoDBDocumentClient.from(client);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function generateToken(user) {
    return jwt.sign(
        { email: user.email, fullName: user.fullName },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function verifyToken(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied' });
    }
    try {
        req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid session' });
    }
}

app.post('/api/signup', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const existing = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { email }
        }));

        if (existing.Item) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = {
            email,
            password: hashedPassword,
            fullName,
            createdAt: new Date().toISOString()
        };

        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: user
        }));

        const token = generateToken(user);
        res.status(201).json({ token, user: { email: user.email, fullName: user.fullName } });
    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { email }
        }));

        if (!result.Item) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const valid = await bcrypt.compare(password, result.Item.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(result.Item);
        res.json({ token, user: { email: result.Item.email, fullName: result.Item.fullName } });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

app.get('/api/me', verifyToken, (req, res) => {
    res.json({ email: req.user.email, fullName: req.user.fullName });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`ABES Flix running at http://localhost:${PORT}`);
});
