"use client";
import { useState } from "react";
import AddCourseTimeForm from "../components/AddCourseTimeForm";
import AddCourseForm from "../components/AddCourseForm";
import OverviewView from "../components/OverviewView";
import CourseList from "../components/CourseList";
import { TimerProvider } from "@/context/TimerContext";

export default function App() {
  const [active, setActive] = useState("overview");

  const tabs = [
    { id: "overview", label: "Ajankäyttö" },
    { id: "stats", label: "Opiskeluajastin" },
    { id: "courses", label: "Kurssit" },
    { id: "settings", label: "Asetukset" },
  ];

  return (
    <TimerProvider>
      {/* Kansikuva yläreunaan */}
      <div className="relative w-screen h-32 sm:h-48 md:h-60 overflow-hidden z-0">
        <img
          src="/beautiful-forest-spring-season-banner.JPG"
          alt="Sovelluksen kansikuva"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="w-full max-w-7xl mx-auto -mt-10 relative z-10 shadow-xl rounded-b-xl bg-transparent">
        {/* Välilehtien otsikot */}
        <div className="flex border-b border-gray-300 bg-transparent">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`tab-custom px-4 py-2 -mb-px font-medium transition-colors rounded-t-md
                ${active === tab.id ? "active" : ""}`
              }
              style={{ minWidth: 120 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Välilehtien sisältö */}
        <div className="p-4 bg-radial from-asphalt-950 to-asphalt-975 text-cement-100 rounded-b shadow min-h-[600px]">
          {active === "overview" && <OverviewView />}
          {active === "stats" && <AddCourseTimeForm />}
          {active === "courses" && (
            <div>
              <p className="mb-4">
                Tässä näet käynnissä olevat kurssit ja voit lisätä uusia kursseja.
              </p>
              <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
                <div className="w-full md:w-[360px] lg:w-[420px]">
                  <CourseList />
                </div>
                <div className="w-full md:w-[360px] lg:w-[420px]">
                  <AddCourseForm />
                </div>
              </div>
            </div>
          )}
          {active === "settings" && <p>Tässä asetukset ⚙️</p>}
        </div>
      </div>
    </TimerProvider>
  );
}