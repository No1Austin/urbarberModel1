import { useState } from "react";
import axios from "axios";

export default function ForgotPassword({ setShowForgotPassword }) {
  const [email, setEmail] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetLink("");

    try {
      const res = await axios.post(
        "https://urbarbermodel1.onrender.com/api/auth/forgot-password",
        { email }
      );

      setMessage(res.data.message);
      if (res.data.resetLink) setResetLink(res.data.resetLink);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <form
        onSubmit={submit}
        className="bg-[#4a3a3a] p-8 rounded-3xl w-[420px] max-w-[95%] text-white"
      >
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>

        <input
          type="email"
          placeholder="Enter your account email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-xl text-black"
        />

        {message && <p className="text-emerald-300 mb-3">{message}</p>}
        {error && <p className="text-red-400 mb-3">{error}</p>}

        {resetLink && (
          <a
            href={resetLink}
            className="block mb-4 underline text-yellow-300 break-all"
          >
            Open reset link
          </a>
        )}

        <button className="w-full bg-black text-white py-3 rounded-xl">
          Send reset link
        </button>

        <button
          type="button"
          onClick={() => setShowForgotPassword(false)}
          className="mt-4 w-full underline text-sm"
        >
          Close
        </button>
      </form>
    </div>
  );
}