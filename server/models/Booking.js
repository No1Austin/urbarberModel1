const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
    },
    service: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    inHome: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      default: "Urbarber Barbershop",
    },
    notes: {
      type: String,
    },
    depositOption: {
      type: String,
      enum: ["skip", "pay"],
      default: "skip",
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
   status: {
  type: String,
     enum: ["pending", "approved", "completed", "cancelled", "rebooked"],
     default: "pending",
    },

    pointsApproved: {
      type: Boolean,
      default: false,
    },
    bookedByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);