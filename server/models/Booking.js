```js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      trim: true,
    },

    service: {
      type: String,
      required: true,
      trim: true,
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
      min: 0,
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
      default: "",
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
      enum: [
        "pending",
        "approved",
        "completed",
        "cancelled",
        "rebooked",
      ],
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
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| PREVENT DUPLICATE BOOKINGS
|--------------------------------------------------------------------------
| Same user cannot create the exact same booking twice.
|--------------------------------------------------------------------------
*/
bookingSchema.index(
  {
    userId: 1,
    date: 1,
    time: 1,
    service: 1,
  },
  {
    unique: true,
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN QUERIES
|--------------------------------------------------------------------------
*/
bookingSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Booking", bookingSchema);
```
