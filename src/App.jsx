import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function UrbarberLogo({ className = "w-10 h-10" }) {
  return (
    <img
      src="/logo.jpg"
      alt="Urbarber logo"
      className={`rounded-full object-cover ${className}`}
    />
  );
}

export default function App() {
  const resetToken = window.location.pathname.startsWith("/reset-password/")
    ? window.location.pathname.split("/reset-password/")[1]
    : null;

  const AUTH_API_URL = "https://urbarbermodel1.onrender.com/api/auth";
  const BOOKINGS_API_URL = "https://urbarbermodel1.onrender.com/api/bookings";

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const [bookingHistory, setBookingHistory] = useState([]);

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [form, setForm] = useState({
    fullName: "",
    gender: "Male",
    email: "",
    phone: "",
    service: "Standard Cut",
    date: "",
    time: "",
    inHome: false,
    location: "123 Main St, Your City",
    notes: "",
    depositOption: "skip",
  });

  const basePrice = 25;
  const homeExtra = 10;

  const price = useMemo(
    () => basePrice + (form.inHome ? homeExtra : 0),
    [form.inHome]
  );

  const depositAmount = useMemo(() => Math.round(price * 0.1), [price]);

  const points = user?.points || 0;
  const pointsNeeded = Math.max(30 - points, 0);
  const lastBooking = bookingHistory[0];

  const valid = useMemo(() => {
    return Boolean(
      form.fullName.trim() &&
        form.email.trim() &&
        form.phone.trim() &&
        form.date &&
        form.time &&
        form.service
    );
  }, [form]);

  const SERVICES = [
    {
      name: "Standard Cut",
      img: "/services/standard.jpg",
      desc: "Clean, sharp, and tailored to you.",
      price: "$25",
    },
    {
      name: "Beard Trim",
      img: "/services/beard.jpg",
      desc: "Crisp edges and shape for your beard.",
      price: "$25",
    },
    {
      name: "Line Up",
      img: "/services/line.jpg",
      desc: "Sharp line work to keep you fresh.",
      price: "$25",
    },
  ];

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${BOOKINGS_API_URL}/my-bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setBookingHistory(res.data);
      } catch (err) {
        console.log("Could not fetch bookings:", err);
      }
    };

    fetchBookings();
  }, [user]);

  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthForm((f) => ({ ...f, [name]: value }));
  };

  const handleAuthSubmit = async () => {
    setNotice(null);
    setAuthLoading(true);

    try {
      const endpoint = authMode === "login" ? "/login" : "/register";

      const payload =
        authMode === "login"
          ? {
              email: authForm.email,
              password: authForm.password,
            }
          : authForm;

      const res = await axios.post(`${AUTH_API_URL}${endpoint}`, payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setUser(res.data.user);

      setForm((f) => ({
        ...f,
        fullName: res.data.user.name || "",
        email: res.data.user.email || "",
        phone: res.data.user.phone || "",
      }));

      setNotice({
        type: "success",
        message: `Welcome ${res.data.user.name}! You can now book your appointment.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.message || "Authentication failed.",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowWallet(false);
    setNotice({ type: "info", message: "You have been logged out." });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBook = async () => {
    setNotice(null);

    if (!user) {
      setNotice({ type: "error", message: "Please login before booking." });
      return;
    }

    if (!valid) {
      setNotice({
        type: "error",
        message: "Please complete all required fields.",
      });
      return;
    }

    const startLocal = new Date(`${form.date}T${form.time}`);
    const endLocal = new Date(startLocal.getTime() + 45 * 60 * 1000);

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(BOOKINGS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: form.fullName,
          gender: form.gender,
          email: form.email,
          phone: form.phone,
          service: form.service,
          date: form.date,
          time: form.time,
          start: startLocal.toISOString(),
          end: endLocal.toISOString(),
          inHome: form.inHome,
          location: form.inHome ? form.location : "Urbarber Barbershop",
          notes: form.notes,
          price,
          depositOption: form.depositOption,
          depositAmount: form.depositOption === "pay" ? depositAmount : 0,
          status: "pending",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Booking failed");
      }

      setBookingHistory((prev) => [data.booking || data, ...prev]);

      setNotice({
        type: "success",
        message: "Booking request submitted. Waiting for admin approval.",
      });

      setForm((f) => ({ ...f, notes: "" }));
    } catch (err) {
      console.error("Booking failed:", err);

      setNotice({
        type: "error",
        message: err.message || "Could not submit booking.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const NoticeBanner = ({ notice }) => {
    if (!notice) return null;

    const styles = {
      success: "bg-emerald-600/20 border-emerald-500 text-emerald-100",
      error: "bg-red-600/20 border-red-500 text-red-100",
      info: "bg-sky-600/20 border-sky-500 text-sky-100",
    };

    return (
      <div
        className={`mt-4 p-3 rounded-xl border ${
          styles[notice.type] || styles.info
        }`}
      >
        {notice.message}
      </div>
    );
  };

  if (resetToken) {
    return <ResetPassword token={resetToken} />;
  }

  return (
    <div className="w-full min-h-screen bg-[#3b2f2f] text-white flex flex-col overflow-x-hidden">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/90 border-b border-neutral-200">
        <div className="w-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UrbarberLogo className="w-9 h-9" />
            <span className="font-bold text-xl tracking-tight text-neutral-900">
              Urbarber
            </span>
          </div>

          <nav className="hidden md:flex gap-6 text-sm text-neutral-800">
            <a href="#services">Services</a>
            <a href="#pricing">Pricing</a>
            <a href="#booking">Book</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={() => setShowWallet(!showWallet)}
                className="px-4 py-2 rounded-2xl bg-[#5c4646] text-white text-sm shadow"
              >
                💼 Wallet
              </button>
            )}

            {user?.role === "admin" && (
              <a
                href="#admin"
                className="px-5 py-2 rounded-xl bg-yellow-600 text-white font-medium shadow-md hover:bg-yellow-700 transition"
              >
                Admin
              </a>
            )}

            <button
              onClick={() => {
                if (user) {
                  document
                    .getElementById("booking")
                    ?.scrollIntoView({ behavior: "smooth" });
                } else {
                  setShowLogin(true);
                }
              }}
              className="px-5 py-2 rounded-xl bg-black text-white font-medium shadow-md hover:opacity-90 transition"
            >
              {user ? "Book now" : "Login to book"}
            </button>
          </div>
        </div>
      </header>

      {showWallet && user && (
        <div className="fixed top-20 right-4 z-50 w-[360px] max-w-[92vw] rounded-3xl bg-[#5c4646] border border-[#7a6161] shadow-xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">My Wallet</h3>
            <button onClick={() => setShowWallet(false)}>✕</button>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-[#3b2f2f] border border-[#7a6161]">
            <div className="text-sm text-gray-300">Loyalty Points</div>
            <div className="text-4xl font-extrabold mt-1">{points}</div>
            <div className="text-xs text-gray-300 mt-1">
              {points >= 30
                ? "You can redeem a free haircut."
                : `${pointsNeeded} more points until a free haircut.`}
            </div>

            <button
              disabled={points < 30}
              className={`mt-3 w-full px-4 py-2 rounded-2xl text-sm ${
                points >= 30
                  ? "bg-black text-white"
                  : "bg-[#7a6161] text-gray-300"
              }`}
            >
              Redeem Free Haircut
            </button>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-[#3b2f2f] border border-[#7a6161]">
  <div className="text-sm text-gray-300">Last Booking</div>

  {lastBooking ? (
    <div className="text-sm mt-2">

      {/* Service */}
      <div className="font-medium">
        {lastBooking.service}
      </div>

      {/* Date + Time */}
      <div className="text-gray-300">
        {lastBooking.date} at {lastBooking.time}
      </div>

      {/* Status */}
      <div className="mt-3">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium
          ${
            lastBooking.status === "approved"
              ? "bg-emerald-700 text-white"
              : lastBooking.status === "cancelled"
              ? "bg-red-700 text-white"
              : lastBooking.status === "completed"
              ? "bg-blue-700 text-white"
              : lastBooking.status === "rebooked"
              ? "bg-yellow-600 text-black"
              : "bg-orange-600 text-white"
          }`}
        >
          {lastBooking.status === "approved"
            ? "✅ Booking Approved"
            : lastBooking.status === "cancelled"
            ? "❌ Booking Cancelled"
            : lastBooking.status === "completed"
            ? "🏁 Completed"
            : lastBooking.status === "rebooked"
            ? "🔄 Rebooked"
            : "⏳ Waiting for Admin Approval"}
        </span>
      </div>

    </div>
  ) : (
    <div className="text-sm mt-1">
      No booking yet
    </div>
  )}
</div>

<button
  onClick={handleLogout}
  className="mt-4 w-full px-4 py-2 rounded-2xl border border-[#7a6161] text-sm"
>
  Logout
</button>
  </div>
      )}

      <main className="w-full">
        <section className="w-full px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Fresh fades, clean lines.{" "}
              <span className="text-gray-300">On your schedule.</span>
            </h1>

            <p className="mt-4 text-gray-200">
              Modern cuts in-shop or right at your doorstep. Simple pricing,
              easy booking, loyalty rewards, and customer wallet access.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  if (user) {
                    document
                      .getElementById("booking")
                      ?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    setShowLogin(true);
                  }
                }}
                className="px-5 py-3 rounded-2xl bg-black text-white text-sm shadow"
              >
                Book an appointment
              </button>

              <a
                href="#services"
                className="px-5 py-3 rounded-2xl border border-[#7a6161] text-sm"
              >
                See services
              </a>
            </div>

            <div className="mt-6 text-xs text-gray-300">
              From $25 • +$10 home service • 30 points = free haircut
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-lg border border-[#7a6161] min-h-[420px]">
            <img
              src="/barbing.jpg"
              alt="Barber at work"
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        <section
          id="services"
          className="w-full bg-[#4a3a3a] border-y border-[#6b5555]"
        >
          <div className="w-full px-6 py-20">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-300">
                Our Services
              </p>
              <h2 className="mt-3 text-3xl md:text-5xl font-extrabold">
                Choose Your Look
              </h2>
              <p className="mt-4 text-gray-200">
                Clean cuts, sharp details, and professional grooming tailored to
                your style.
              </p>
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-8">
              {SERVICES.map((s) => (
                <div
                  key={s.name}
                  className="group rounded-3xl overflow-hidden border border-[#7a6161] bg-[#5c4646] shadow-xl hover:-translate-y-2 transition duration-300"
                >
                  <div className="relative h-72 overflow-hidden">
                    <img
                      src={s.img}
                      alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white text-black text-sm font-bold shadow">
                      {s.price}
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                      <h3 className="text-2xl font-bold">{s.name}</h3>
                      <p className="mt-2 text-sm text-gray-200">{s.desc}</p>
                    </div>
                  </div>

                  <div className="p-5 flex items-center justify-between">
                    <span className="text-sm text-gray-300">
                      Approx. 45 mins
                    </span>

                    <button
                      onClick={() => {
                        setForm((f) => ({ ...f, service: s.name }));
                        document
                          .getElementById("booking")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:bg-neutral-800 transition"
                    >
                      Book this
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="w-full px-6 py-14">
          <h2 className="text-2xl font-bold">Pricing</h2>

          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646]">
              <div className="text-sm uppercase text-gray-300">Base</div>
              <div className="text-3xl font-extrabold mt-2">${basePrice}</div>
              <div className="text-sm text-gray-200 mt-1">
                In-shop appointment
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646]">
              <div className="text-sm uppercase text-gray-300">
                Home Service
              </div>
              <div className="text-3xl font-extrabold mt-2">
                ${basePrice + homeExtra}
              </div>
              <div className="text-sm text-gray-200 mt-1">
                We come to you (+$10)
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646]">
              <div className="text-sm uppercase text-gray-300">
                Loyalty Reward
              </div>
              <div className="text-3xl font-extrabold mt-2">30 pts</div>
              <div className="text-sm text-gray-200 mt-1">
                Redeem for one free haircut
              </div>
            </div>
          </div>
        </section>

        <section
          id="booking"
          className="w-full bg-[#4a3a3a] border-y border-[#6b5555]"
        >
          <div className="w-full px-6 py-14">
            <h2 className="text-2xl font-bold">Book an appointment</h2>

            <p className="mt-2 text-gray-200 text-sm">
              Login or create an account before booking. Your booking will wait
              for admin approval.
            </p>

            {!user ? (
              <div className="mt-6 p-6 rounded-3xl border border-[#7a6161] shadow-lg bg-[#5c4646] max-w-xl">
                <h3 className="text-xl font-bold">
                  {authMode === "login" ? "Login to book" : "Create an account"}
                </h3>

                <div className="mt-4 grid gap-4">
                  {authMode === "register" && (
                    <>
                      <input
                        name="name"
                        value={authForm.name}
                        onChange={handleAuthChange}
                        placeholder="Full name"
                        className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white placeholder-gray-300"
                      />

                      <input
                        name="phone"
                        value={authForm.phone}
                        onChange={handleAuthChange}
                        placeholder="Phone"
                        className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white placeholder-gray-300"
                      />
                    </>
                  )}

                  <input
                    name="email"
                    type="email"
                    value={authForm.email}
                    onChange={handleAuthChange}
                    placeholder="Email"
                    className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white placeholder-gray-300"
                  />

                  <input
                    name="password"
                    type="password"
                    value={authForm.password}
                    onChange={handleAuthChange}
                    placeholder="Password"
                    className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white placeholder-gray-300"
                  />

                  {authMode === "login" && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-gray-200 underline hover:text-white text-left"
                    >
                      Forgot password?
                    </button>
                  )}

                  <button
                    onClick={handleAuthSubmit}
                    disabled={authLoading}
                    className="px-5 py-3 rounded-2xl bg-black text-white text-sm shadow disabled:opacity-60"
                  >
                    {authLoading
                      ? "Please wait..."
                      : authMode === "login"
                      ? "Login"
                      : "Create account"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAuthMode(authMode === "login" ? "register" : "login")
                    }
                    className="text-sm text-gray-200 underline hover:text-white"
                  >
                    {authMode === "login"
                      ? "Need an account? Register"
                      : "Already have an account? Login"}
                  </button>

                  <NoticeBanner notice={notice} />
                </div>
              </div>
            ) : (
              <>
                <p className="mt-4 text-sm text-emerald-200">
                  Logged in as {user.name}
                  <button onClick={handleLogout} className="ml-3 underline">
                    Logout
                  </button>
                </p>

                <div className="mt-6 grid lg:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646]">
                    <div className="grid gap-4">
                      <label className="grid gap-1 text-sm">
                        <span>Service</span>
                        <select
                          name="service"
                          value={form.service}
                          onChange={handleChange}
                          className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
                        >
                          {SERVICES.map((s) => (
                            <option key={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-1 text-sm">
                        <span>Full name</span>
                        <input
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                          className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
                        />
                      </label>

                      <label className="grid gap-1 text-sm">
                        <span>Gender</span>
                        <select
                          name="gender"
                          value={form.gender}
                          onChange={handleChange}
                          className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
                        >
                          <option>Male</option>
                          <option>Female</option>
                          <option>Non-binary</option>
                          <option>Prefer not to say</option>
                        </select>
                      </label>

                      <div className="grid grid-cols-2 gap-4">
                        <label className="grid gap-1 text-sm">
                          <span>Date</span>
                          <input
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
                          />
                        </label>

                        <label className="grid gap-1 text-sm">
                          <span>Time</span>
                          <input
                            type="time"
                            name="time"
                            value={form.time}
                            onChange={handleChange}
                            className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
                          />
                        </label>
                      </div>

                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Phone"
                        className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
                      />

                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
                      />

                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="inHome"
                          checked={form.inHome}
                          onChange={handleChange}
                        />
                        <span>Home service (+$10)</span>
                      </label>

                      {form.inHome && (
                        <input
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          placeholder="Home address"
                          className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
                        />
                      )}

                      <label className="grid gap-1 text-sm">
                        <span>Deposit option</span>
                        <select
                          name="depositOption"
                          value={form.depositOption}
                          onChange={handleChange}
                          className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
                        >
                          <option value="skip">Skip deposit</option>
                          <option value="pay">
                            Pay 10% deposit (${depositAmount})
                          </option>
                        </select>
                      </label>

                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Notes or haircut preferences"
                        className="px-3 py-2 rounded-xl border border-[#7a6161] bg-[#3b2f2f] text-white"
                      />

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-200">Total</div>
                        <div className="font-bold text-lg">${price}</div>
                      </div>

                      <button
                        disabled={!valid || submitting}
                        onClick={handleBook}
                        className={`px-5 py-3 rounded-2xl text-sm shadow ${
                          valid && !submitting
                            ? "bg-black text-white"
                            : "bg-[#7a6161] text-gray-300"
                        }`}
                      >
                        {submitting ? "Booking..." : "Book now"}
                      </button>

                      <NoticeBanner notice={notice} />
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646]">
                    <h3 className="font-semibold">
                      Customer Dashboard Preview
                    </h3>

                    <div className="mt-4 grid gap-4">
                      <div className="p-4 rounded-2xl bg-[#3b2f2f] border border-[#7a6161]">
                        <div className="text-sm text-gray-300">
                          Current Points
                        </div>
                        <div className="text-3xl font-bold">{points}</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#3b2f2f] border border-[#7a6161]">
                        <div className="text-sm text-gray-300">
                          Last Booking
                        </div>
                        <div className="text-sm mt-2">
  <div className="font-medium">
    {lastBooking.service}
  </div>

  <div className="text-gray-300">
    {lastBooking.date} at {lastBooking.time}
  </div>

  <div className="mt-3">
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        lastBooking.status === "approved"
          ? "bg-emerald-700 text-white"
          : lastBooking.status === "cancelled"
          ? "bg-red-700 text-white"
          : lastBooking.status === "completed"
          ? "bg-blue-700 text-white"
          : lastBooking.status === "rebooked"
          ? "bg-yellow-600 text-black"
          : "bg-orange-600 text-white"
      }`}
    >
      {lastBooking.status === "approved"
        ? "✅ Booking Approved"
        : lastBooking.status === "cancelled"
        ? "❌ Booking Cancelled"
        : lastBooking.status === "completed"
        ? "🏁 Completed"
        : lastBooking.status === "rebooked"
        ? "🔄 Rebooked"
        : "⏳ Waiting for Admin Approval"}
    </span>
  </div>
</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#3b2f2f] border border-[#7a6161] text-sm text-gray-200">
                        Customer bookings now wait for admin approval.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {user?.role === "admin" && <AdminDashboard onUserUpdate={setUser} />}

        <section id="contact" className="w-full px-6 py-14">
          <h2 className="text-2xl font-bold">Contact</h2>

          <div className="mt-4 grid md:grid-cols-3 gap-6 text-sm">
            <div className="p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646]">
              <div className="font-semibold">Shop</div>
              <div className="mt-1 text-gray-200">Urbarber Barbershop</div>
              <div className="text-gray-200">218 River Road E Kitchener</div>
            </div>

            <div className="p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646]">
              <div className="font-semibold">Hours</div>
              <div className="mt-1 text-gray-200">Mon – Sun:</div>
              <div className="mt-1 text-gray-200">10:00AM – 10:00PM</div>
            </div>

            <div className="p-6 rounded-3xl border border-[#7a6161] bg-[#5c4646]">
              <div className="font-semibold">Reach us</div>
              <div className="mt-1 text-gray-200">Phone: (437) 566 1645</div>
              <div className="text-gray-200">
                Email: austinamadi.e@gmail.com
              </div>
            </div>
          </div>
        </section>
      </main>

      <a
        href="https://wa.me/14375661645"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 px-5 py-3 rounded-full bg-green-600 text-white shadow-lg text-sm"
      >
        WhatsApp Support
      </a>

      {showLogin && (
        <Login
          setUser={setUser}
          setShowLogin={setShowLogin}
          setShowRegister={setShowRegister}
          setShowForgotPassword={setShowForgotPassword}
        />
      )}

      {showRegister && (
        <Register setUser={setUser} setShowRegister={setShowRegister} />
      )}

      {showForgotPassword && (
        <ForgotPassword setShowForgotPassword={setShowForgotPassword} />
      )}

      <footer className="w-full border-t border-[#6b5555] bg-[#4a3a3a] m-0 p-0">
        <div className="w-full px-6 py-3 text-sm text-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UrbarberLogo className="w-6 h-6" />
            <span>© {new Date().getFullYear()} Urbarber</span>
          </div>

          <a href="#booking" className="hover:text-white transition">
            Book now
          </a>
        </div>
      </footer>
    </div>
  );
}