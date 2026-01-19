"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/signin");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return <div className="text-cement-100 text-center mt-20">Tarkistetaan kirjautumista...</div>;
  }
  return <>{children}</>;
}
