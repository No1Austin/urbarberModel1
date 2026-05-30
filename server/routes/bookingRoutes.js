const express = require("express");
const router = express.Router();

const {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
} = require("../controllers/bookingController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createBooking);
router.get("/", protect, getBookings);
router.get("/my-bookings", protect, getBookings);
router.patch("/:id", protect, updateBooking);
router.delete("/:id", protect, deleteBooking);

module.exports = router;