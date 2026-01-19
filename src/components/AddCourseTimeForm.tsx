"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import { useTimer } from "../context/TimerContext";

export default function AddCourseTimeForm() {
        const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
        const [selectedCourse, setSelectedCourse] = useState(() => {
            if (typeof window !== "undefined") {
                return localStorage.getItem("selectedCourse") || "";
            }
            return "";
            });
        const [user, setUser] = useState<any>(null);
        const [saving, setSaving] = useState(false);
        const [showConfirm, setShowConfirm] = useState(false);
        const [pendingCourse, setPendingCourse] = useState<string | null>(null);
        // Lisää tilojen tilalle contextista:
        const {
            timerActive, setTimerActive,
            timer, setTimer,
            startTime, setStartTime,
            endTime, setEndTime,
            intervalRef
        } = useTimer();

        // Hae käyttäjä ja kurssit
        useEffect(() => {
            supabase.auth.getUser().then(({ data }) => {
                setUser(data.user);
            });
            async function fetchCourses() {
                const { data, error } = await supabase
                    .from("courses")
                    .select("id, name")
                    .order("name", { ascending: true });
                if (!error && data) {
                    setCourses(data);
                }
            }
            fetchCourses();
        }, []);
        
        useEffect(() => {
            if (selectedCourse) {
                localStorage.setItem("selectedCourse", selectedCourse);
            }
            }, [selectedCourse]);

        // Muokkaa kurssin vaihtoa:
        const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const newCourse = e.target.value;
            if (timerActive) {
                setPendingCourse(newCourse);
                setShowConfirm(true);
            } else {
                setSelectedCourse(newCourse);
            }
        };

        // Tallennusfunktio ajastimelle (voit käyttää samaa kuin ajastimen pysäytyksessä)
        const saveSession = async () => {
            if (!user || !selectedCourse || !startTime) return;
            const now = new Date();
            setEndTime(now);
            setTimerActive(false);
            setSaving(true);
            const durationMinutes = Math.round((now.getTime() - (startTime?.getTime() || now.getTime())) / 60000);
            const { error } = await supabase.from("study_sessions").insert([
                {
                    user_id: user.id,
                    course_id: selectedCourse,
                    start_time: startTime?.toISOString(),
                    end_time: now.toISOString(),
                    duration_minutes: durationMinutes,
                    study_date: startTime?.toISOString().split("T")[0],
                },
            ]);
            setSaving(false);
            if (error) {
                alert("Tallennus epäonnistui: " + error.message);
            }
        };

        // Vahvista kurssin vaihto
        const confirmCourseChange = async (save: boolean) => {
        setShowConfirm(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (save) {
            await saveSession();
        }
        setTimerActive(false);
        setTimer(0);
        setStartTime(null);
        setEndTime(null);
        setSelectedCourse(pendingCourse || "");
        setPendingCourse(null);
        };

        // Ajastimen käynnistys ja pysäytys
        const handleTimerClick = async () => {
            if (!selectedCourse || !user) return;
            if (!timerActive) {
                // Käynnistä ajastin
                const now = new Date();
                setStartTime(now);
                setEndTime(null);
                setTimer(0);
                setTimerActive(true);
                intervalRef.current = setInterval(() => {
                    setTimer((t: number) => t + 1);
                }, 1000);
            } else {
                // Pysäytä ajastin
                if (intervalRef.current) clearInterval(intervalRef.current);
                const now = new Date();
                setEndTime(now);
                setTimerActive(false);
                // Laske käytetty aika minuutteina
                const durationMinutes = Math.round((now.getTime() - (startTime?.getTime() || now.getTime())) / 60000);
                // Tallenna study_sessions-tauluun
                setSaving(true);
                const { error } = await supabase.from("study_sessions").insert([
                    {
                        user_id: user.id,
                        course_id: selectedCourse,
                        start_time: startTime?.toISOString(),
                        end_time: now.toISOString(),
                        duration_minutes: durationMinutes,
                        study_date: startTime?.toISOString().split("T")[0],
                    },
                ]);
                setSaving(false);
                if (error) {
                    alert("Tallennus epäonnistui: " + error.message);
                } else {
                    alert("Opiskelusessio tallennettu!");
                }
            }
        };

        // Ajastimen näyttö muodossa hh:mm:ss
        const formatTime = (seconds: number) => {
            const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
            const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
            const s = (seconds % 60).toString().padStart(2, "0");
            return `${h}:${m}:${s}`;
        };

        if (!user) {
            return <p className="text-center text-cement-100">Kirjaudu sisään lisätäksesi opiskeluaikaa.</p>;
        }

        return (
            <form className="p-4 max-w-3xl mx-auto">
                {/* Modal-varmistus */}
                {showConfirm && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <div className="bg-asphalt-900 p-8 rounded shadow-lg max-w-sm w-full text-center">
                            <h3 className="text-xl mb-4 font-bold">Ajastin on käynnissä</h3>
                            <p className="mb-6">Haluatko varmasti vaihtaa kurssia? Voit tallentaa käynnissä olevan ajastimen ennen vaihtoa.</p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    className="px-4 py-2 rounded bg-cement-500 text-white font-medium"
                                    onClick={() => confirmCourseChange(true)}
                                    type="button"
                                >
                                    Tallenna ja vaihda
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-cement-400 text-white font-medium"
                                    onClick={() => confirmCourseChange(false)}
                                    type="button"
                                >
                                    Vaihda tallentamatta
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-gray-300 text-black font-medium"
                                    onClick={() => setShowConfirm(false)}
                                    type="button"
                                >
                                    Peruuta
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <h2 className="text-5xl font-whisper mb-10 mt-4 text-center">Opiskeluajastin</h2>
                <div className="flex flex-col md:flex-row gap-16">
                {/* Vasen osio: kurssin valinta ja ajat */}
                <div className="flex-1 bg-transparent rounded-lg p-6 shadow space-y-6 min-w-[300px]">
                    {/* Kurssin valinta */}
                    <div>
                    <label htmlFor="course" className="block font-light mb-1">
                        Kurssin nimi
                    </label>
                    <select
                        id="course"
                        name="course"
                        value={selectedCourse}
                        onChange={handleCourseChange}
                        className="form-field w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-powder-ash-600 bg-asphalt-950 text-cement-100"
                        required
                    >
                        <option value="" disabled>
                        Valitse kurssi
                        </option>
                        {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                            {course.name}
                        </option>
                        ))}
                    </select>
                    </div>
                    {/* Aikojen tiedot lomakemaisesti */}
                    <div className="space-y-4">
                    {/* Aloitusaika */}
                    <div className="form-field block appearance-none w-full py-3 px-4 text-cement-100 bg-asphalt-950/80 rounded placeholder-cement-400 font-light leading-5">
                        <span className="font-light">Aloitusaika:</span>{" "}
                        {startTime
                        ? `${startTime.getHours().toString().padStart(2, "0")}:${startTime
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}`
                        : <span className="text-cement-400">--:--</span>}
                    </div>
                    {/* Lopetusaika */}
                    <div className="form-field block appearance-none w-full py-3 px-4 text-cement-100 bg-asphalt-950/80 rounded placeholder-cement-400 font-light leading-5">
                        <span className="font-light">Lopetusaika:</span>{" "}
                        {endTime
                        ? `${endTime.getHours().toString().padStart(2, "0")}:${endTime
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}`
                        : <span className="text-cement-400">--:--</span>}
                    </div>
                    {/* Käytetty aika */}
                    <div className="form-field block appearance-none w-full py-3 px-4 text-cement-100 bg-asphalt-950/80 rounded placeholder-cement-400 font-light leading-5">
                        <span className="font-light">Käytetty aika:</span>{" "}
                        {endTime && startTime
                        ? (() => {
                            const diff = Math.floor(
                                (endTime.getTime() - startTime.getTime()) / 1000
                            );
                            const h = Math.floor(diff / 3600)
                                .toString()
                                .padStart(2, "0");
                            const m = Math.floor((diff % 3600) / 60)
                                .toString()
                                .padStart(2, "0");
                            return `${h}:${m}`;
                            })()
                        : <span className="text-cement-400">--:--</span>}
                    </div>
                    </div>
                </div>

                {/* Ympyrä + nappi oikealle */}
                <div className="relative w-63 h-63 flex items-center justify-center mt-8">
                    {/* Taustaympyrä */}
                    <span
                    className="absolute inset-0 rounded-full"
                    style={{
                        zIndex: 0,
                        background: "linear-gradient(145deg, #262626, #606060)",
                        borderRadius: "50%",
                        boxShadow:
                        "12px 12px 24px #0E0C0C, -12px -12px 24px var(--color-asphalt-900)",
                    }}
                    aria-hidden="true"
                    />

                    {/* Itse nappi */}
                    <button
                    type="button"
                    onClick={handleTimerClick}
                    disabled={!selectedCourse || saving}
                    className={`
                        relative z-10
                        w-60 h-60 rounded-full flex items-center justify-center
                        text-4xl font-light
                        bg-gradient-to-br from-asphalt-950 to-asphalt-900
                        text-[wheat]
                        shadow-[inset_2px_2px_0px_#7d7c7e,0_8px_30px_rgba(0,0,0,0.5)]
                        border-8 border-black
                        ring-4 ring-asphalt-950
                        outline-none focus:outline-none
                        ${saving ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                    >
                    {formatTime(timer)}
                    </button>
                </div>
                </div>
            </form>
            );
}