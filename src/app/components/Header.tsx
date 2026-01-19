"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function Header() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <header className="w-full py-4 px-8 flex justify-between items-center bg-black/30 backdrop-blur-md fixed top-0 left-0 z-50">
      <span className="text-cement-100 font-bold text-lg">StudyTimer</span>
      {!user ? (
        <Link href="/signin" className="text-cement-100 hover:underline">Kirjaudu sisään</Link>
      ) : (
        <span className="text-cement-100">Hei, {user.email}</span>
      )}
    </header>
  );
}
