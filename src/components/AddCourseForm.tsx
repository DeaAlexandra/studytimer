"use client";
import { useState, useEffect, forwardRef } from "react";
import { supabase } from "../utils/supabaseClient";
import ReactDatePicker from "react-datepicker";
import { FaRegCalendarAlt } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker-custom.css";
import { fi } from "date-fns/locale"; // tuo suomi-locale

// Yhtenäinen tyyli kaikille inputeille
const baseInputClasses =
  "form-field w-full text-cement-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-asphalt-400 bg-asphalt-950";

// Yhtenäinen kalenteri-input
const CalendarInput = forwardRef<HTMLInputElement, any>(
  ({ value, onChange, placeholder, onIconClick }, ref) => (
    <div className="relative flex items-center w-full">
      <input
        className={`${baseInputClasses} pr-10`}
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <span
        className="absolute right-3 top-1/2 -translate-y-1/2 text-asphalt-400 cursor-pointer"
        onClick={onIconClick}
        role="button"
        aria-label="Avaa kalenteri"
      >
        <FaRegCalendarAlt />
      </span>
    </div>
  )
);

function parseDate(value: string) {
  const [day, month, year] = value.split(".");
  if (
    day &&
    month &&
    year &&
    !isNaN(Number(day)) &&
    !isNaN(Number(month)) &&
    !isNaN(Number(year))
  ) {
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return null;
}

export default function AddCourseForm() {
  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState("");
  const [plannedHours, setPlannedHours] = useState("");

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Kirjaudu sisään.");
      return;
    }

    const { error } = await supabase.from("courses").insert([
      {
        user_id: user.id,
        name,
        start_date: startDate,
        end_date: endDate,
        planned_hours: plannedHours ? Number(plannedHours) : null,
      },
    ]);

    if (error) {
      alert("Virhe: " + error.message);
    } else {
      setName("");
      setStartDate(null);
      setEndDate(null);
      setPlannedHours("");
      setStartDateInput("");
      setEndDateInput("");
      alert("Kurssi lisätty!");
    }
  };

  if (!user) {
    return <p className="text-center text-cement-100">Kirjaudu sisään lisätäksesi kursseja.</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-transparent rounded shadow max-w-md mx-auto"
    >
      {/* Kurssin nimi */}
      <div>
        <label htmlFor="name" className="block font-medium mb-1">
          Kurssin nimi
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={baseInputClasses}
          required
        />
      </div>

      {/* Alkamispäivä */}
      <div>
        <label htmlFor="startDate" className="block font-medium mb-1">
          Alkamispäivä
        </label>
        <ReactDatePicker
          selected={startDate}
          wrapperClassName="w-full"
          onChange={(date) => {
            setStartDate(date);
            setStartDateInput(
              date
                ? `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}.${date.getFullYear()}`
                : ""
            );
            setOpenStart(false);
          }}
          dateFormat="dd.MM.yyyy"
          customInput={
            <CalendarInput
              value={startDateInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setStartDateInput(e.target.value);
                setStartDate(parseDate(e.target.value));
              }}
              placeholder="pp.kk.vvvv"
              onIconClick={() => setOpenStart(true)}
            />
          }
          id="startDate"
          open={openStart}
          onClickOutside={() => setOpenStart(false)}
          locale={fi} // lisää tämä
          showWeekNumbers
        />
      </div>

      {/* Loppumispäivä */}
      <div>
        <label htmlFor="endDate" className="block font-medium mb-1">
          Loppumispäivä
        </label>
        <ReactDatePicker
          wrapperClassName="w-full"
          selected={endDate}
          onChange={(date) => {
            setEndDate(date);
            setEndDateInput(
              date
                ? `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}.${date.getFullYear()}`
                : ""
            );
            setOpenEnd(false);
          }}
          dateFormat="dd.MM.yyyy"
          customInput={
            <CalendarInput
              value={endDateInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEndDateInput(e.target.value);
                setEndDate(parseDate(e.target.value));
              }}
              placeholder="pp.kk.vvvv"
              onIconClick={() => setOpenEnd(true)}
            />
          }
          id="endDate"
          open={openEnd}
          onClickOutside={() => setOpenEnd(false)}
          locale={fi} // lisää tämä
          showWeekNumbers
        />
      </div>

      {/* Suunniteltu aika */}
      <div>
        <label htmlFor="plannedHours" className="block font-medium mb-1">
          Suunniteltu aika (tuntia)
        </label>
        <input
          id="plannedHours"
          type="number"
          value={plannedHours}
          onChange={(e) => setPlannedHours(e.target.value)}
          className={baseInputClasses}
          placeholder="Esim. 120"
        />
      </div>

      {/* Lähetä */}
      <button
        type="submit"
        className="btn-normal bg-asphalt-500 text-white px-6 py-2 rounded shadow hover:bg-asphalt-800 transition-colors w-full"
      >
        Lisää kurssi
      </button>
    </form>
  );
}
