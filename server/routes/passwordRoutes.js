const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

const resetTokens = new Map();

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        message: "If that email exists, a reset link has been created.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    resetTokens.set(token, {
      userId: user._id.toString(),
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    res.json({
      message: "Password reset link created.",
      resetLink,
    });
  } catch (error) {
    res.status(500).json({
      message: "Forgot password error",
      error: error.message,
    });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const tokenData = resetTokens.get(token);

    if (!tokenData || tokenData.expiresAt < Date.now()) {
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(tokenData.userId, {
      password: hashedPassword,
    });

    resetTokens.delete(token);

    res.json({
      message: "Password reset successful. You can now login.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Reset password error",
      error: error.message,
    });
  }
});

module.exports = router;