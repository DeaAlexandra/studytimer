import { createContext, useContext, useState, useRef } from "react";

const TimerContext = createContext<any>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
    const [timerActive, setTimerActive] = useState(false);
    const [timer, setTimer] = useState(0);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    return (
        <TimerContext.Provider value={{
        timerActive, setTimerActive,
        timer, setTimer,
        startTime, setStartTime,
        endTime, setEndTime,
        intervalRef
        }}>
        {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    return useContext(TimerContext);
}