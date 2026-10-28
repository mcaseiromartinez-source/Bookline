import type { CallSummary } from "@/lib/agents/summary";
import type { QualityReview } from "@/lib/agents/quality";

export interface Clinic {
  id: string;
  name: string;
  vapiAssistantId: string | null;
  notifyEmails: string[];
  monthlyPriceEur: number;
  googleCalendarId: string | null;
}

export interface CallRecord {
  id: string;
  clinicId: string;
  vapiCallId: string;
  callerNumber: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  endedReason: string | null;
  costUsd: number | null;
  transcript: string;
  recordingUrl: string | null;
  summary: CallSummary | null;
  quality: QualityReview | null;
  handledAt: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  vapiCallId: string | null;
  patientName: string;
  patientPhone: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  isNewPatient: boolean | null;
  urgent: boolean;
  status: "confirmada" | "cancelada" | "completada" | "no_presentado";
  calendarEventId: string | null;
  remindersEnabled: boolean;
  reminderSentAt: string | null;
}

export interface Lead {
  placeId: string;
  searchQuery: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  emails: string[];
  instagram: string | null;
  facebook: string | null;
  rating: number | null;
  reviews: number | null;
  mapsUrl: string | null;
  pitch: string | null;
}
