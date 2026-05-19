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
    const bookings =
      req.user.role === "admin"
        ? await Booking.find().sort({ createdAt: -1 })
        : await Booking.find({
            $or: [
              { userId: req.user._id },
              { customerEmail: req.user.email.toLowerCase() },
            ],
          }).sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get bookings",
      error: error.message,
    });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(booking);
  } catch (error) {
    res.status(500).json({
      message: "Update failed",
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