"use client";

import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { format, parseISO } from "date-fns";
import { fi } from "date-fns/locale";

interface StudySession {
  id: string;
  course_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  study_date: string;
}

interface CourseWithSessions {
  id: string;
  name: string;
  totalMinutes: number;
  sessions: StudySession[];
}

export default function OverviewView() {
  const [user, setUser] = useState<any>(null);
  const [coursesWithSessions, setCoursesWithSessions] = useState<CourseWithSessions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (!u) {
        setLoading(false);
        return;
      }

      try {
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("id, name")
          .eq("user_id", u.id)
          .order("name", { ascending: true });

        if (coursesError) {
          setError("Kurssien haku epäonnistui: " + coursesError.message);
          setLoading(false);
          return;
        }

        const { data: sessionsData, error: sessionsError } = await supabase
          .from("study_sessions")
          .select("id, course_id, start_time, end_time, duration_minutes, study_date")
          .eq("user_id", u.id)
          .order("study_date", { ascending: false });

        if (sessionsError) {
          setError("Opiskelusessioiden haku epäonnistui: " + sessionsError.message);
          setLoading(false);
          return;
        }

        const sessionsByCourse = new Map<string, StudySession[]>();
        const totalsByCourse = new Map<string, number>();
        for (const s of sessionsData || []) {
          const list = sessionsByCourse.get(s.course_id) || [];
          list.push(s as StudySession);
          sessionsByCourse.set(s.course_id, list);
          totalsByCourse.set(s.course_id, (totalsByCourse.get(s.course_id) || 0) + (s.duration_minutes || 0));
        }

        const combined: CourseWithSessions[] = (coursesData || []).map((c) => ({
          id: c.id,
          name: c.name,
          totalMinutes: totalsByCourse.get(c.id) ?? 0,
          sessions: (sessionsByCourse.get(c.id) || []).sort((a, b) =>
            (b.study_date || "").localeCompare(a.study_date || "")
          ),
        }));

        setCoursesWithSessions(combined);
      } catch (err: any) {
        setError(err?.message || "Tuntematon virhe");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadData();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllInCourse = (courseId: string, checked: boolean) => {
    const course = coursesWithSessions.find((c) => c.id === courseId);
    if (!course) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const s of course.sessions) {
        if (checked) next.add(s.id);
        else next.delete(s.id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const { error: delError } = await supabase
        .from("study_sessions")
        .delete()
        .in("id", Array.from(selectedIds));

      if (delError) {
        alert("Poisto epäonnistui: " + delError.message);
      } else {
        setSelectedIds(new Set());
        setIsEditing(false);
        await loadData();
      }
    } catch (err: any) {
      alert("Poisto epäonnistui: " + (err?.message || "Tuntematon virhe"));
    } finally {
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedIds(new Set());
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "--:--";
    try {
      return format(parseISO(iso), "HH:mm", { locale: fi });
    } catch {
      return "--:--";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(parseISO(dateStr), "d.M.yyyy", { locale: fi });
    } catch {
      return "-";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-cement-200">Ladataan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-asphalt-900 rounded text-red-300">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-center text-cement-200 py-8">
        Kirjaudu sisään nähdäksesi ajankäyttönäkymän.
      </p>
    );
  }

  const totalMinutes = coursesWithSessions.reduce((sum, c) => sum + c.totalMinutes, 0);

  const hasSessions = coursesWithSessions.some((c) => c.sessions.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-cement-100">Ajankäyttö</h2>
          <p className="text-cement-200 mt-1">
            Kurssien ja niihin käytettyjen aikojen yhteenveto. Avaa kurssi nähdäksesi päiväkohtaiset sessiot.
          </p>
        </div>
        {hasSessions && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0 || deleting}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  {deleting ? "Poistetaan…" : `Poista valitut (${selectedIds.size})`}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded bg-asphalt-600 hover:bg-asphalt-700 text-cement-100 font-medium transition-colors"
                >
                  Peruuta
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded bg-asphalt-600 hover:bg-asphalt-700 text-cement-100 font-medium transition-colors"
              >
                Muokkaa
              </button>
            )}
          </div>
        )}
      </div>

      {totalMinutes > 0 && (
        <div className="p-4 rounded-lg bg-asphalt-900/50 border border-asphalt-700">
          <p className="text-sm text-cement-400">Kokonaisaika kaikissa kursseissa</p>
          <p className="text-xl font-semibold text-cement-100">{formatMinutes(totalMinutes)}</p>
        </div>
      )}

      {coursesWithSessions.length === 0 ? (
        <p className="text-cement-300">Et ole vielä lisännyt kursseja tai tallentanut opiskeluaikaa.</p>
      ) : (
        <div className="space-y-2">
          {coursesWithSessions.map((c) => (
            <details
              key={c.id}
              className="group rounded-lg bg-asphalt-900/50 border border-asphalt-800 overflow-hidden"
            >
              <summary className="flex flex-wrap items-center justify-between gap-4 p-4 cursor-pointer list-none hover:bg-asphalt-800/50 transition-colors [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-cement-400 transition-transform group-open:rotate-90" aria-hidden>▶</span>
                  <div>
                    <p className="font-medium text-cement-100">{c.name}</p>
                    <p className="text-sm text-cement-400">
                      {c.sessions.length} {c.sessions.length === 1 ? "sessio" : "sessiota"} – {formatMinutes(c.totalMinutes)}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-cement-100">{formatMinutes(c.totalMinutes)}</p>
              </summary>
              <div className="border-t border-asphalt-800 p-4 bg-asphalt-950/50">
                {c.sessions.length === 0 ? (
                  <p className="text-sm text-cement-400">Ei sessioita</p>
                ) : (
                  <div className="space-y-3 overflow-x-auto">
                    <div
                      className={`grid gap-3 sm:gap-4 text-sm text-cement-400 mb-2 pb-2 border-b border-asphalt-700 min-w-[280px] ${
                        isEditing ? "grid-cols-[auto_1fr_1fr_1fr_1fr]" : "grid-cols-2 sm:grid-cols-4"
                      }`}
                    >
                      {isEditing && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={c.sessions.length > 0 && c.sessions.every((s) => selectedIds.has(s.id))}
                            onChange={(e) => selectAllInCourse(c.id, e.target.checked)}
                            className="w-4 h-4 rounded border-asphalt-600 bg-asphalt-950 text-asphalt-500 focus:ring-asphalt-500"
                          />
                          <span className="sr-only">Valitse kaikki</span>
                        </label>
                      )}
                      <span>Päivämäärä</span>
                      <span>Aloitusaika</span>
                      <span>Lopetusaika</span>
                      <span>Käytetty aika</span>
                    </div>
                    {c.sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`grid gap-3 sm:gap-4 text-cement-200 py-2 border-b border-asphalt-800 last:border-0 min-w-[280px] ${
                          isEditing ? "grid-cols-[auto_1fr_1fr_1fr_1fr]" : "grid-cols-2 sm:grid-cols-4"
                        }`}
                      >
                        {isEditing && (
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(s.id)}
                              onChange={() => toggleSelect(s.id)}
                              className="w-4 h-4 rounded border-asphalt-600 bg-asphalt-950 text-asphalt-500 focus:ring-asphalt-500"
                            />
                            <span className="sr-only">Valitse</span>
                          </label>
                        )}
                        <span>{formatDate(s.study_date)}</span>
                        <span>{formatTime(s.start_time)}</span>
                        <span>{formatTime(s.end_time)}</span>
                        <span>{formatMinutes(s.duration_minutes)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
