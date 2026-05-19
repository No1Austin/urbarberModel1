const express = require("express");
const {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/", protect, getBookings);
router.get("/my-bookings", protect, getBookings);
router.patch("/:id", protect, updateBooking);
router.delete("/:id", protect, deleteBooking);

module.exports = router;