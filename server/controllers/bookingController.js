const Booking = require("../models/Booking");

exports.createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({
      userId: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email.toLowerCase(),
      customerPhone: req.user.phone,

      ...req.body,

      // New customer bookings should wait for admin approval
      status: "pending",
      bookedByAdmin: false,
    });

    res.status(201).json({
      message: "Booking request submitted. Waiting for admin approval.",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Booking failed",
      error: error.message,
    });
  }
};

exports.getBookings = async (req, res) => {
  try {
    let bookings;

    if (req.user.role === "admin") {
      bookings = await Booking.find().sort({ createdAt: -1 });
    } else {
      bookings = await Booking.find({ userId: req.user._id }).sort({
        createdAt: -1,
      });
    }

    res.json(bookings);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch bookings",
      error: error.message,
    });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const oldStatus = booking.status;

    Object.assign(booking, req.body);
    await booking.save();

    if (oldStatus !== "approved" && booking.status === "approved") {
      // send confirmation email here
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({
      message: "Could not update booking",
      error: error.message,
    });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: "Booking deleted" });
  } catch (error) {
    res.status(500).json({
      message: "Delete failed",
      error: error.message,
    });
  }
};