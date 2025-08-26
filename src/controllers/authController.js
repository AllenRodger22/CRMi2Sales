// src/controllers/authController.js
const db = require('../config/database');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// AVISO: Usar um 'salt' estático é altamente inseguro e não é recomendado para produção.
const HASH_SEED = 'pikachu';

// Helper para gerar o hash da senha com SHA-256 + salt estático.
const hashPassword = (password) => {
  const hash = crypto.createHash('sha256');
  hash.update(password + HASH_SEED);
  return hash.digest('hex');
};


// Helper to convert snake_case from DB to camelCase for the frontend
const snakeToCamel = (str) => str.replace(/([-_][a-z])/g, (g) => g.toUpperCase().replace('_', ''));

const convertObjectKeys = (obj, converter) => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => convertObjectKeys(item, converter));
  }
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = converter(key);
      newObj[newKey] = convertObjectKeys(obj[key], converter);
    }
  }
  return newObj;
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const user = rows[0];
    
    if (!user.password_hash) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const hashedProvidedPassword = hashPassword(password);
    let isMatch = (hashedProvidedPassword === user.password_hash);

    // --- GRACEFUL PASSWORD MIGRATION ---
    // If hash check fails, check for plaintext password match for legacy users.
    if (!isMatch && password === user.password_hash) {
        console.log(`Plaintext password detected for user ${email}. Upgrading hash...`);
        // If they match, securely upgrade the hash in the database.
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedProvidedPassword, user.id]);
        isMatch = true; // Mark as a match to allow login.
    }
    // --- END MIGRATION ---

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your_default_secret_key_for_development',
      { expiresIn: '1d' }
    );
    
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({ token, user: userResponse });

  } catch (error) {
    console.error('Erro de login:', error);
    res.status(500).json({ message: 'Erro de servidor durante o login.' });
  }
};

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Nome, email, senha e cargo são obrigatórios.' });
    }
    
    const validRoles = ['BROKER', 'MANAGER', 'ADMIN'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Cargo especificado é inválido.' });
    }

    try {
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'Usuário com este email já existe.' });
        }

        const hashedPassword = hashPassword(password);

        const { rows } = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role]
        );

        res.status(201).json(convertObjectKeys(rows[0], snakeToCamel));

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro de servidor durante o registro.' });
    }
};