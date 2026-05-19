import { useState } from "react";
import axios from "axios";

export default function Login({
  setUser,
  setShowLogin,
  setShowRegister,
  setShowForgotPassword,
}) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

const login = async (e) => {
  e.preventDefault();

  setLoading(true);
  setError("");

  try {
    const API_URL = import.meta.env.VITE_API_URL;

    const res = await axios.post(
      `${API_URL}/api/auth/login`,
      form
    );

    localStorage.setItem(
      "token",
      res.data.token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(res.data.user)
    );

    setUser(res.data.user);

    setShowLogin(false);

  } catch (err) {

    setError(
      err.response?.data?.message ||
      "Login failed"
    );

  } finally {

    setLoading(false);

  }
};

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <form
        onSubmit={login}
        className="bg-[#4a3a3a] p-8 rounded-3xl w-[400px] max-w-full text-white border border-[#7a6161] shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded-xl text-black"
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded-xl text-black"
          required
        />

        <button
          type="button"
          onClick={() => {
            setShowLogin(false);
            setShowForgotPassword(true);
          }}
          className="mb-4 w-full text-sm underline text-gray-200 hover:text-white"
        >
          Forgot password?
        </button>

        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          type="button"
          onClick={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
          className="mt-4 w-full underline text-sm text-gray-200 hover:text-white"
        >
          Need an account? Register
        </button>

        <button
          type="button"
          onClick={() => setShowLogin(false)}
          className="mt-4 w-full text-sm text-gray-300 hover:text-white"
        >
          Close
        </button>
      </form>
    </div>
  );
}