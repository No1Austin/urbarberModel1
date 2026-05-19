const express = require("express");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");


const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({ message: "Admin access only" });
};

router.get("/bookings", protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch bookings",
      error: error.message,
    });
  }
});

router.post("/bookings", protect, adminOnly, async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      service,
      date,
      time,
      price,
      inHome,
      location,
      notes,
    } = req.body;

    if (!customerName || !customerEmail || !service || !date || !time || !price) {
      return res.status(400).json({
        message: "Name, email, service, date, time, and price are required",
      });
    }

    const customer = await User.findOne({
      email: customerEmail.toLowerCase(),
    });

    const booking = await Booking.create({
      userId: customer?._id || null,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      customerPhone,
      service,
      date,
      time,
      price,
      inHome: Boolean(inHome),
      location: inHome ? location : "Urbarber Barbershop",
      notes,
      bookedByAdmin: true,
      status: "approved",
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({
      message: "Admin booking failed",
      error: error.message,
    });
  }
});

router.patch("/bookings/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({
      message: "Booking approved. Confirmation email should be sent here next.",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not approve booking",
      error: error.message,
    });
  }
});

router.patch("/bookings/:id/rebook", protect, adminOnly, async (req, res) => {
  try {
    const { date, time, notes } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        date,
        time,
        notes,
        status: "rebooked",
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({
      message: "Booking rebooked successfully.",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not rebook booking",
      error: error.message,
    });
  }
});

router.patch("/bookings/:id/complete", protect, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({
      message: "Could not complete booking",
      error: error.message,
    });
  }
});

router.patch("/bookings/:id/approve-points", protect, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.pointsApproved) {
      return res.status(400).json({ message: "Points already approved" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "Complete the booking before approving points.",
      });
    }

    const pointsToAdd = 1.5;

    const user = await User.findOne({
      $or: [{ _id: booking.userId }, { email: booking.customerEmail }],
    });

    if (!user) {
      return res.status(404).json({
        message: "No matching user account found for this booking",
      });
    }

    user.points += pointsToAdd;
    await user.save();

    booking.pointsApproved = true;
    await booking.save();

    res.json({
      message: "Points approved",
      booking,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        points: user.points,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not approve points",
      error: error.message,
    });
  }
});

const sendEmail = require("../utils/sendEmail");

router.patch("/bookings/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    await sendEmail({
      to: booking.customerEmail,
      subject: "Booking Approved - Urbarber",
      text: `
Hi ${booking.customerName},

Your booking has been approved.

Service: ${booking.service}
Date: ${booking.date}
Time: ${booking.time}

Thanks,
Urbarber
`,
    });

    res.json({
      message: "Booking approved and email sent",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not approve booking",
      error: error.message,
    });
  }
});

router.delete("/bookings/:id", protect, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete booking",
      error: error.message,
    });
  }
});

module.exports = router;