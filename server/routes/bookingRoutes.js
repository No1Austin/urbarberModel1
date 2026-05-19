const express = require("express");
const router = express.Router();

const {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
} = require("../controllers/bookingController");

const { protect } = require("../middleware/authMiddleware");

// Create booking
router.post("/", protect, createBooking);

// Get all bookings (Admin)
router.get("/", protect, getBookings);

// Get logged-in user's bookings
router.get("/my-bookings", protect, getBookings);

// Update booking
router.patch("/:id", protect, updateBooking);

// Delete booking
router.delete("/:id", protect, deleteBooking);

module.exports = router;