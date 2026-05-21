const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
};

// Simple authentication middlewares used by routes below
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword
    });

    const token = createToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        points: user.points
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Register error",
      error: error.message
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const token = createToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        points: user.points
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Login error",
      error: error.message
    });
  }

  
});

router.patch("/users/:id/redeem-points", protect, adminOnly, async (req, res) => {
  try {
    const pointsToRemove = Number(req.body.points || 30);

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if ((user.points || 0) < pointsToRemove) {
      return res.status(400).json({
        message: "Customer does not have enough points.",
      });
    }

    user.points -= pointsToRemove;
    await user.save();

    res.json({
      message: "Points redeemed successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not redeem points",
      error: error.message,
    });
  }
});

module.exports = router;