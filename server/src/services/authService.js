const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

exports.findUserByEmail = async (email) => {
  const user = await prisma.users.findUnique({ where: { email } });
  return user ? [user] : [];
};

exports.findUserByEmailExceptId = async (email, userId) => {
  const user = await prisma.users.findFirst({
    where: {
      email,
      id: { not: parseInt(userId, 10) }
    },
    select: { id: true }
  });
  return user ? [user] : [];
};

exports.registerUser = async (userData) => {
  const { name, email, password, role, phone } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      phone: phone || null
    }
  });
  return user.id;
};

exports.createUser = async (userData) => {
  const { name, email, password, role, phone, street, village, taluka, district, state } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      phone: phone || null,
      street: street || null,
      village: village || null,
      taluka: taluka || null,
      district: district || null,
      state: state || null
    }
  });
  return user.id;
};

exports.loginUser = async (email, password) => {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

exports.getUserProfile = async (userId) => {
  return prisma.users.findUnique({
    where: { id: parseInt(userId, 10) },
    select: {
      id: true, name: true, email: true, role: true, phone: true,
      street: true, village: true, taluka: true, district: true, state: true,
      created_at: true
    }
  });
};

exports.getAllUsers = async () => {
  return prisma.users.findMany({
    select: {
      id: true, name: true, email: true, role: true, phone: true,
      street: true, village: true, taluka: true, district: true, state: true,
      created_at: true
    },
    orderBy: { created_at: 'desc' }
  });
};

exports.updateUser = async (userId, userData) => {
  const { name, email, role, phone, street, village, taluka, district, state, password } = userData;
  const data = {
    name, email, role, phone: phone || null,
    street: street || null, village: village || null,
    taluka: taluka || null, district: district || null, state: state || null
  };
  
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  await prisma.users.update({
    where: { id: parseInt(userId, 10) },
    data
  });
};

exports.deleteUser = async (userId) => {
  try {
    const user = await prisma.users.delete({ where: { id: parseInt(userId, 10) } });
    return 1;
  } catch (error) {
    return 0;
  }
};
