const authService = require('../services/authService');

exports.register = async (req, res) => {
  try {
    const existing = await authService.findUserByEmail(req.body.email);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const userId = await authService.registerUser(req.body);
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    if (!result) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const existing = await authService.findUserByEmail(req.body.email);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const userId = await authService.createUser(req.body);
    res.status(201).json({ message: 'User created successfully', userId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.body.email) {
      const existing = await authService.findUserByEmailExceptId(req.body.email, userId);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    await authService.updateUser(userId, req.body);
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (String(userId) === String(req.user.id)) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    const rowCount = await authService.deleteUser(userId);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
