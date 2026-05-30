```js
exports.createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({
      userId: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email.toLowerCase(),
      customerPhone: req.user.phone,

      ...req.body,

      status: "pending",
      bookedByAdmin: false,
    });

    res.status(201).json({
      message: "Booking request submitted. Waiting for admin approval.",
      booking,
    });
  } catch (error) {
    console.error("BOOKING ERROR:", error);

    // Duplicate booking protection
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "You already have a booking for this service at this date and time.",
      });
    }

    res.status(500).json({
      message: "Booking failed",
      error: error.message,
    });
  }
};
```
