import { createContext, useContext, useState, ReactNode } from "react";

export type FlowStep = "auth" | "reservation" | "payment" | null;

interface ReservationFlowContextType {
  flowStep: FlowStep;
  startFlow: () => void;
  setFlowStep: (step: FlowStep) => void;
  closeFlow: () => void;
  pendingDate: Date | null;
  setPendingDate: (d: Date | null) => void;
  pendingNotes: string;
  setPendingNotes: (n: string) => void;
}

const ReservationFlowContext = createContext<ReservationFlowContextType | null>(null);

export function ReservationFlowProvider({ children }: { children: ReactNode }) {
  const [flowStep, setFlowStep] = useState<FlowStep>(null);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [pendingNotes, setPendingNotes] = useState("");

  const startFlow = () => setFlowStep("reservation");

  const closeFlow = () => {
    setFlowStep(null);
    setPendingDate(null);
    setPendingNotes("");
  };

  return (
    <ReservationFlowContext.Provider value={{
      flowStep, startFlow, setFlowStep, closeFlow,
      pendingDate, setPendingDate,
      pendingNotes, setPendingNotes,
    }}>
      {children}
    </ReservationFlowContext.Provider>
  );
}

export function useReservationFlow() {
  const ctx = useContext(ReservationFlowContext);
  if (!ctx) throw new Error("useReservationFlow must be used within ReservationFlowProvider");
  return ctx;
}
