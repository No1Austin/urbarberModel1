import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://urbarbermodel1.onrender.com/api/bookings";

export default function AdminDashboard({ onUserUpdate }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

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

  const token = localStorage.getItem("token");

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    const token = localStorage.getItem("token");
    const authHeaders = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const res = await axios.get(API_URL, authHeaders);
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

  const handleAdminBookingChange = (e) => {
    const { name, value, type, checked } = e.target;

    setAdminBooking((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const createAdminBooking = async () => {
    setNotice(null);

    try {
      await axios.post(
        API_URL,
        {
          ...adminBooking,
          status: "approved",
          bookedByAdmin: true,
        },
        authHeaders
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

  const approveBooking = async (bookingId) => {
    try {
      await axios.patch(
        `${API_URL}/${bookingId}`,
        { status: "approved" },
        authHeaders
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

  const completeBooking = async (bookingId) => {
    try {
      await axios.patch(
        `${API_URL}/${bookingId}`,
        { status: "completed" },
        authHeaders
      );

      loadBookings();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.message || "Could not complete booking.",
      });
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      await axios.patch(
        `${API_URL}/${bookingId}`,
        { status: "cancelled" },
        authHeaders
      );

      loadBookings();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.message || "Could not cancel booking.",
      });
    }
  };

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

  return (
    <section id="admin" className="w-full px-6 py-14 bg-[#3b2f2f] text-white">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="mt-2 text-gray-200 text-sm">
            Manage customer bookings, approve appointments, complete bookings,
            and cancel bookings.
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
        <div className="lg:col-span-1 p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646]">
          <h3 className="font-semibold text-lg">Book Customer Manually</h3>

          <div className="mt-4 grid gap-3">
            <input name="customerName" value={adminBooking.customerName} onChange={handleAdminBookingChange} placeholder="Customer name" className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white" />
            <input name="customerEmail" value={adminBooking.customerEmail} onChange={handleAdminBookingChange} placeholder="Customer email" className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white" />
            <input name="customerPhone" value={adminBooking.customerPhone} onChange={handleAdminBookingChange} placeholder="Customer phone" className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white" />

            <select name="service" value={adminBooking.service} onChange={handleAdminBookingChange} className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white">
              <option>Standard Cut</option>
              <option>Beard Trim</option>
              <option>Line Up</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input type="date" name="date" value={adminBooking.date} onChange={handleAdminBookingChange} className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white" />
              <input type="time" name="time" value={adminBooking.time} onChange={handleAdminBookingChange} className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white" />
            </div>

            <input type="number" name="price" value={adminBooking.price} onChange={handleAdminBookingChange} placeholder="Price" className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white" />

            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="inHome" checked={adminBooking.inHome} onChange={handleAdminBookingChange} />
              <span>Home service</span>
            </label>

            {adminBooking.inHome && (
              <input name="location" value={adminBooking.location} onChange={handleAdminBookingChange} placeholder="Customer address" className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white" />
            )}

            <textarea name="notes" value={adminBooking.notes} onChange={handleAdminBookingChange} placeholder="Notes" className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white" />

            <button onClick={createAdminBooking} className="px-5 py-3 rounded-2xl bg-black text-white text-sm shadow">
              Create Booking
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646] overflow-x-auto">
          <h3 className="font-semibold text-lg">All Bookings</h3>

          <div className="mt-4 min-w-[750px]">
            <div className="grid grid-cols-7 gap-2 text-xs uppercase text-gray-300 border-b border-[#7a6161] pb-2">
              <div>Customer</div>
              <div>Service</div>
              <div>Date</div>
              <div>Time</div>
              <div>Status</div>
              <div>Points</div>
              <div>Actions</div>
            </div>

            {bookings.length === 0 ? (
              <div className="py-6 text-sm text-gray-300">No bookings found.</div>
            ) : (
              bookings.map((booking) => (
                <div key={booking._id} className="grid grid-cols-7 gap-2 text-sm py-3 border-b border-[#7a6161]">
                  <div>
                    <div className="font-semibold">{booking.customerName}</div>
                    <div className="text-xs text-gray-300">{booking.customerEmail}</div>
                  </div>

                  <div>{booking.service}</div>
                  <div>{booking.date}</div>
                  <div>{booking.time}</div>

                  <div>
                    <span className="px-2 py-1 rounded-full bg-[#3b2f2f] text-xs">
                      {booking.status || "pending"}
                    </span>
                  </div>

                  <div>
                    {booking.pointsApproved ? (
                      <span className="text-emerald-300">Approved</span>
                    ) : (
                      <span className="text-gray-300">Pending</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {booking.status !== "approved" && (
                      <button onClick={() => approveBooking(booking._id)} className="px-3 py-1 rounded-xl bg-emerald-700 text-white text-xs">
                        Approve
                      </button>
                    )}

                    <button onClick={() => completeBooking(booking._id)} className="px-3 py-1 rounded-xl bg-black text-white text-xs">
                      Complete
                    </button>

                    <button onClick={() => cancelBooking(booking._id)} className="px-3 py-1 rounded-xl bg-red-700 text-white text-xs">
                      Cancel
                    </button>
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