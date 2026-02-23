"use client";

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { format } from "date-fns";
import { fi } from "date-fns/locale";

interface Course {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  planned_hours: number | null;
}

export default function CourseList() {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (!data.user) {
        setLoading(false);
        return;
      }

      try {
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("id, name, start_date, end_date, planned_hours")
          .eq("user_id", data.user.id)
          .order("name", { ascending: true });

        if (courseError) {
          setError("Kurssien haku epäonnistui: " + courseError.message);
        } else {
          setCourses(courseData || []);
        }
      } catch (err: any) {
        setError(err?.message || "Tuntematon virhe");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const formatDate = (value: string | null) => {
    if (!value) return "-";
    try {
      return format(new Date(value), "d.M.yyyy", { locale: fi });
    } catch {
      return "-";
    }
  };

  if (loading) {
    return <p className="text-cement-200">Ladataan kursseja…</p>;
  }

  if (!user) {
    return (
      <p className="text-cement-200">
        Kirjaudu sisään nähdäksesi lisätyt kurssit.
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-red-400">
        {error}
      </p>
    );
  }

  if (courses.length === 0) {
    return (
      <p className="text-cement-300">
        Et ole vielä lisännyt yhtään kurssia.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <div
          key={course.id}
          className="p-4 rounded-lg bg-asphalt-900/60 border border-asphalt-800 hover:border-asphalt-600 transition-colors"
        >
          <p className="font-medium text-cement-100 mb-1">
            {course.name}
          </p>
          <p className="text-sm text-cement-400">
            {formatDate(course.start_date)} – {formatDate(course.end_date)}
          </p>
          {course.planned_hours !== null && (
            <p className="text-sm text-cement-300 mt-1">
              Suunniteltu aika: {course.planned_hours} h
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

