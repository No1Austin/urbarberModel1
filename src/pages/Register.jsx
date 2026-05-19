import { useState } from "react";
import axios from "axios";

export default function Register({ setUser, setShowRegister }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const register = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "https://urbarber-model1.vercel.app/api/auth/register",
        form
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      setUser(res.data.user);
      setShowRegister(false);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Registration failed"
      );
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <form
        onSubmit={register}
        className="bg-[#4a3a3a] p-8 rounded-3xl w-[400px] max-w-[95%]"
      >

        <h2 className="text-2xl font-bold mb-6 text-white">
          Create Account
        </h2>

        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded-xl"
        />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded-xl"
        />

        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded-xl"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-3 mb-4 rounded-xl"
        />

        {error && (
          <p className="text-red-400 mb-4">
            {error}
          </p>
        )}

        <button
          className="w-full bg-black text-white py-3 rounded-xl"
        >
          {loading ? "Creating..." : "Register"}
        </button>

      </form>

    </div>
  );
}