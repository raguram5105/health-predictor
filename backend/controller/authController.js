const { createUser, normalizeEmail, verifyUserPassword } = require('../model/User');

const getCredentials = (body = {}) => ({
  email: normalizeEmail(body.email || body.usermail),
  name: String(body.name || '').trim(),
  password: String(body.password || '')
});

exports.register = async (req, res) => {
  try {
    const { email, name, password } = getCredentials(req.body);

    if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const user = await createUser({ name, email, password });
    res.status(201).json({ message: 'Account created successfully.', user });
  } catch (error) {
    if (error.code === 'USER_EXISTS') {
      return res.status(409).json({ error: error.message });
    }

    console.error('Register Error: ', error);
    res.status(500).json({ error: 'An error occurred during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = getCredentials(req.body);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await verifyUserPassword(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.status(200).json({ message: 'Login successful.', user });
  } catch (error) {
    console.error('Login Error: ', error);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
};
