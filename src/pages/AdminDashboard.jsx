import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

// =====================================================
// API URLS
// =====================================================
const BOOKINGS_API_URL = "https://urbarbermodel1.onrender.com/api/bookings";
const ADMIN_API_URL = "https://urbarbermodel1.onrender.com/api/admin";

// =====================================================
// ADMIN DASHBOARD COMPONENT
// NOTE: We do NOT update localStorage user here.
// Approve Points returns the CUSTOMER, not the admin.
// =====================================================
export default function AdminDashboard() {
  // =====================================================
  // STATE: BOOKINGS / LOADING / NOTICES
  // =====================================================
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  // =====================================================
  // STATE: MANUAL ADMIN BOOKING FORM
  // =====================================================
  const [adminBooking, setAdminBooking] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    service: "Standard Cut",
    date: "",
    time: "",
    price: 25,
    inHome: false,
    location: "",
    notes: "",
  });

  // =====================================================
  // AUTH HEADER HELPER
  // =====================================================
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // =====================================================
  // LOAD ALL BOOKINGS
  // =====================================================
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const res = await axios.get(BOOKINGS_API_URL, getAuthHeaders());
      setBookings(res.data);
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.message || "Could not load bookings.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);


  const redeemPoints = async (userId) => {
  try {
    await axios.patch(
      `${ADMIN_API_URL}/users/${userId}/redeem-points`,
      { points: 30 },
      getAuthHeaders()
    );

    setNotice({
      type: "success",
      message: "Customer points redeemed successfully.",
    });

    loadBookings();
  } catch (error) {
    setNotice({
      type: "error",
      message: error.response?.data?.message || "Could not redeem points.",
    });
  }
};

  // =====================================================
  // HANDLE MANUAL BOOKING FORM CHANGES
  // =====================================================
  const handleAdminBookingChange = (e) => {
    const { name, value, type, checked } = e.target;

    setAdminBooking((form) => ({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =====================================================
  // CREATE MANUAL ADMIN BOOKING
  // =====================================================
  const createAdminBooking = async () => {
    setNotice(null);

    try {
      await axios.post(
        BOOKINGS_API_URL,
        {
          ...adminBooking,
          status: "approved",
          bookedByAdmin: true,
        },
        getAuthHeaders()
      );

      setNotice({
        type: "success",
        message: "Booking created successfully.",
      });

      setAdminBooking({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        service: "Standard Cut",
        date: "",
        time: "",
        price: 25,
        inHome: false,
        location: "",
        notes: "",
      });

      loadBookings();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.message || "Could not create booking.",
      });
    }
  };

  // =====================================================
  // APPROVE BOOKING
  // Sends approval email from backend.
  // =====================================================
  const approveBooking = async (bookingId) => {
    try {
      await axios.patch(
        `${ADMIN_API_URL}/bookings/${bookingId}/approve`,
        {},
        getAuthHeaders()
      );

      setNotice({
        type: "success",
        message: "Booking approved successfully.",
      });

      loadBookings();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.message || "Could not approve booking.",
      });
    }
  };

  // =====================================================
  // COMPLETE BOOKING
  // Booking must be completed before points can be approved.
  // =====================================================
  const completeBooking = async (bookingId) => {
    try {
      await axios.patch(
        `${ADMIN_API_URL}/bookings/${bookingId}/complete`,
        {},
        getAuthHeaders()
      );

      setNotice({
        type: "success",
        message: "Booking marked as completed.",
      });

      loadBookings();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.message || "Could not complete booking.",
      });
    }
  };

  // =====================================================
  // APPROVE CUSTOMER POINTS
  // IMPORTANT:
  // Do NOT save res.data.user to localStorage here.
  // That user is the customer, not the admin.
  // =====================================================
  const approvePoints = async (bookingId) => {
    try {
      await axios.patch(
        `${ADMIN_API_URL}/bookings/${bookingId}/approve-points`,
        {},
        getAuthHeaders()
      );

      setNotice({
        type: "success",
        message: "Customer points approved successfully.",
      });

      loadBookings();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.message || "Could not approve points.",
      });
    }
  };

  // =====================================================
  // CANCEL BOOKING
  // Sends cancellation email from backend.
  // =====================================================
  const cancelBooking = async (bookingId) => {
    try {
      await axios.patch(
        `${ADMIN_API_URL}/bookings/${bookingId}/cancel`,
        {},
        getAuthHeaders()
      );

      setNotice({
        type: "success",
        message: "Booking cancelled successfully.",
      });

      loadBookings();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.message || "Could not cancel booking.",
      });
    }
  };

  // =====================================================
  // NOTICE COMPONENT
  // =====================================================
  const Notice = () => {
    if (!notice) return null;

    const color =
      notice.type === "success"
        ? "border-emerald-500 bg-emerald-600/20 text-emerald-100"
        : "border-red-500 bg-red-600/20 text-red-100";

    return (
      <div className={`mt-4 p-3 rounded-xl border ${color}`}>
        {notice.message}
      </div>
    );
  };

  // =====================================================
  // RENDER ADMIN DASHBOARD
  // =====================================================
  return (
    <section id="admin" className="w-full px-6 py-14 bg-[#3b2f2f] text-white">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="mt-2 text-gray-200 text-sm">
            Manage bookings, approve appointments, complete appointments, cancel
            bookings, and approve customer loyalty points.
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="px-5 py-3 rounded-2xl bg-black text-white text-sm shadow"
        >
          {loading ? "Loading..." : "Refresh Bookings"}
        </button>
      </div>

      <Notice />

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        {/* =====================================================
            MANUAL BOOKING FORM
        ===================================================== */}
        <div className="lg:col-span-1 p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646]">
          <h3 className="font-semibold text-lg">Book Customer Manually</h3>

          <div className="mt-4 grid gap-3">
            <input
              name="customerName"
              value={adminBooking.customerName}
              onChange={handleAdminBookingChange}
              placeholder="Customer name"
              className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
            />

            <input
              name="customerEmail"
              value={adminBooking.customerEmail}
              onChange={handleAdminBookingChange}
              placeholder="Customer email"
              className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
            />

            <input
              name="customerPhone"
              value={adminBooking.customerPhone}
              onChange={handleAdminBookingChange}
              placeholder="Customer phone"
              className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
            />

            <select
              name="service"
              value={adminBooking.service}
              onChange={handleAdminBookingChange}
              className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
            >
              <option>Standard Cut</option>
              <option>Beard Trim</option>
              <option>Line Up</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                name="date"
                value={adminBooking.date}
                onChange={handleAdminBookingChange}
                className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
              />

              <input
                type="time"
                name="time"
                value={adminBooking.time}
                onChange={handleAdminBookingChange}
                className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
              />
            </div>

            <input
              type="number"
              name="price"
              value={adminBooking.price}
              onChange={handleAdminBookingChange}
              placeholder="Price"
              className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
            />

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="inHome"
                checked={adminBooking.inHome}
                onChange={handleAdminBookingChange}
              />
              <span>Home service</span>
            </label>

            {adminBooking.inHome && (
              <input
                name="location"
                value={adminBooking.location}
                onChange={handleAdminBookingChange}
                placeholder="Customer address"
                className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
              />
            )}

            <textarea
              name="notes"
              value={adminBooking.notes}
              onChange={handleAdminBookingChange}
              placeholder="Notes"
              className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
            />

            <button
              onClick={createAdminBooking}
              className="px-5 py-3 rounded-2xl bg-black text-white text-sm shadow"
            >
              Create Booking
            </button>
          </div>
        </div>

        {/* =====================================================
            BOOKINGS TABLE
        ===================================================== */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646] overflow-x-auto">
          <h3 className="font-semibold text-lg">All Bookings</h3>

          <div className="mt-4 min-w-[1050px]">
            {/* Table header */}
            <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.8fr_0.8fr_2.4fr] gap-2 text-xs uppercase text-gray-300 border-b border-[#7a6161] pb-2">
              <div>Customer</div>
              <div>Service</div>
              <div>Date</div>
              <div>Time</div>
              <div>Status</div>
              <div>Points</div>
              <div>Actions</div>
            </div>

            {/* Empty state */}
            {bookings.length === 0 ? (
              <div className="py-6 text-sm text-gray-300">
                No bookings found.
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking._id}
                  className="grid grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.8fr_0.8fr_2.4fr] gap-2 text-sm py-3 border-b border-[#7a6161] items-center"
                >
                  {/* Customer */}
                  <div>
                    <div className="font-semibold">
                      {booking.customerName}
                    </div>
                    <div className="text-xs text-gray-300 break-all">
                      {booking.customerEmail}
                    </div>
                  </div>

                  {/* Service */}
                  <div>{booking.service}</div>

                  {/* Date */}
                  <div>{booking.date}</div>

                  {/* Time */}
                  <div>{booking.time}</div>

                  {/* Status */}
                  <div>
                    <span className="px-2 py-1 rounded-full bg-[#3b2f2f] text-xs whitespace-nowrap">
                      {booking.status || "pending"}
                    </span>
                  </div>

                  {/* Points */}
                  <div>
                    {booking.pointsApproved ? (
                      <span className="text-emerald-300 whitespace-nowrap">
                        Approved
                      </span>
                    ) : (
                      <span className="text-gray-300 whitespace-nowrap">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-nowrap gap-2 whitespace-nowrap overflow-x-auto">
                    {booking.status !== "approved" &&
                      booking.status !== "completed" &&
                      booking.status !== "cancelled" && (
                        <button
                          onClick={() => approveBooking(booking._id)}
                          className="px-3 py-1 rounded-xl bg-emerald-700 text-white text-xs"
                        >
                          Approve
                        </button>
                      )}

                    {booking.status !== "completed" &&
                      booking.status !== "cancelled" && (
                        <button
                          onClick={() => completeBooking(booking._id)}
                          className="px-3 py-1 rounded-xl bg-black text-white text-xs"
                        >
                          Complete
                        </button>
                      )}

                    <button
                      onClick={() => approvePoints(booking._id)}
                      disabled={
                        booking.pointsApproved ||
                        booking.status !== "completed"
                      }
                      className={`px-3 py-1 rounded-xl text-xs ${
                        booking.pointsApproved ||
                        booking.status !== "completed"
                          ? "bg-[#7a6161] text-gray-300"
                          : "bg-emerald-700 text-white"
                      }`}
                    >
                      {booking.pointsApproved
                        ? "Points Approved"
                        : "Approve Points"}
                    </button>

                    <button
  onClick={() => redeemPoints(booking.userId)}
  disabled={!booking.userId}
  className={`px-3 py-1 rounded-xl text-xs ${
    booking.userId
      ? "bg-yellow-600 text-white"
      : "bg-[#7a6161] text-gray-300"
  }`}
>
  Redeem
</button>

                    {booking.status !== "cancelled" && (
                      <button
                        onClick={() => cancelBooking(booking._id)}
                        className="px-3 py-1 rounded-xl bg-red-700 text-white text-xs"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}