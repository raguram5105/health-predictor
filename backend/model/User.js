const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'users.json');

const ensureStore = async () => {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, '[]', 'utf8');
  }
};

const readUsers = async () => {
  await ensureStore();
  const raw = await fs.readFile(dataFile, 'utf8');

  try {
    const users = JSON.parse(raw);
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
};

const writeUsers = async (users) => {
  await ensureStore();
  await fs.writeFile(dataFile, JSON.stringify(users, null, 2), 'utf8');
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const passwordHash = crypto
    .pbkdf2Sync(String(password), salt, 100000, 64, 'sha512')
    .toString('hex');

  return { salt, passwordHash };
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt
});

const findUserByEmail = async (email) => {
  const users = await readUsers();
  const normalizedEmail = normalizeEmail(email);

  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
};

const createUser = async ({ name, email, password }) => {
  const users = await readUsers();
  const normalizedEmail = normalizeEmail(email);

  if (users.some((user) => normalizeEmail(user.email) === normalizedEmail)) {
    const error = new Error('This email is already registered.');
    error.code = 'USER_EXISTS';
    throw error;
  }

  const { salt, passwordHash } = hashPassword(password);
  const user = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name: String(name || '').trim(),
    email: normalizedEmail,
    salt,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  await writeUsers(users);

  return sanitizeUser(user);
};

const verifyUserPassword = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user || !user.salt || !user.passwordHash) {
    return null;
  }

  const { passwordHash } = hashPassword(password, user.salt);
  const expected = Buffer.from(user.passwordHash, 'hex');
  const actual = Buffer.from(passwordHash, 'hex');

  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return null;
  }

  return sanitizeUser(user);
};

module.exports = {
  createUser,
  findUserByEmail,
  normalizeEmail,
  readUsers,
  verifyUserPassword
};
