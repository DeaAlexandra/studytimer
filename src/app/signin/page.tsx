"use client";
import { useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-camelot-950">
      <form onSubmit={handleSignIn} className="space-y-4 p-8 bg-camelot-800 rounded shadow max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-cement-100 mb-4">Kirjaudu sisään</h1>
        <div>
          <label htmlFor="email" className="block font-medium mb-1 text-cement-100">Sähköposti</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-camelot-600 bg-camelot-900 text-cement-100 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block font-medium mb-1 text-cement-100">Salasana</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-camelot-600 bg-camelot-900 text-cement-100 rounded px-3 py-2"
            required
          />
        </div>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button
          type="submit"
          className="bg-camelot-500 text-white px-6 py-2 rounded shadow hover:bg-camelot-600 transition-colors w-full"
          disabled={loading}
        >
          {loading ? "Kirjaudutaan..." : "Kirjaudu sisään"}
        </button>
      </form>
    </div>
  );
}
