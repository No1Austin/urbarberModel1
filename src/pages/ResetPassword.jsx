import { useState } from "react";
import axios from "axios";

export default function ResetPassword({ token }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        `https://urbarber-model1.vercel.app/api/auth/reset-password/${token}`,
        { password }
      );

      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#3b2f2f] flex items-center justify-center text-white">
      <form
        onSubmit={submit}
        className="bg-[#4a3a3a] p-8 rounded-3xl w-[420px] max-w-[95%]"
      >
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>

        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded-xl text-black"
        />

        {message && <p className="text-emerald-300 mb-3">{message}</p>}
        {error && <p className="text-red-400 mb-3">{error}</p>}

        <button className="w-full bg-black text-white py-3 rounded-xl">
          Reset Password
        </button>
      </form>
    </div>
  );
}