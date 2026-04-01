// const express = require('express');
// const app = express();
// const pool = require('./config/db');

// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');

// app.use(express.json());

const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('./config/db');

app.use(cors());
app.use(express.json());

/* =========================
   TEST ROUTE
========================= */
app.get('/', (req, res) => {
  res.send('Server running with PostgreSQL + JWT 🚀');
});

/* =========================
   AUTH MIDDLEWARE
========================= */
const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(403).json({ error: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, 'secretkey');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/* =========================
   REGISTER
========================= */
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, hashed, role || 'employee']
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   LOGIN
========================= */
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      'secretkey',
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   CREATE LEAVE
========================= */
app.post('/leaves', auth, async (req, res) => {
  try {
    const { start_date, end_date, reason } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Missing dates' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (end < start) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    const result = await pool.query(
  `INSERT INTO leaves (user_id, start_date, end_date, reason)
   VALUES ($1, $2, $3, $4)
   RETURNING *`,
  [req.user.id, start_date, end_date, reason]
);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET LEAVES
========================= */
app.get('/leaves', auth, async (req, res) => {
  try {
    let result;

    // 👤 If employee → only their leaves
    if (req.user.role === 'employee') {
      result = await pool.query(
        `SELECT leaves.*, users.name, users.email
         FROM leaves
         JOIN users ON leaves.user_id = users.id
         WHERE leaves.user_id = $1
         ORDER BY leaves.id`,
        [req.user.id]
      );
    } 
    // 🧑‍💼 If manager → all leaves
    else {
      result = await pool.query(
        `SELECT leaves.*, users.name, users.email
         FROM leaves
         JOIN users ON leaves.user_id = users.id
         ORDER BY leaves.id`
      );
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   APPROVE (MANAGER ONLY)
========================= */
app.put('/leaves/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can approve' });
    }

    const result = await pool.query(
      `UPDATE leaves SET status = 'approved'
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   REJECT (MANAGER ONLY)
========================= */
app.put('/leaves/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can reject' });
    }

    const result = await pool.query(
      `UPDATE leaves SET status = 'rejected'
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(5000, () => {
  console.log('Running on http://localhost:5000');
});