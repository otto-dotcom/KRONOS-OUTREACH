"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "../ProjectContext";
import { Calendar, Phone, MapPin, AlertCircle, Plus, X, Save } from "lucide-react";

interface CallRecord {
  id: string;
  leadId: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  purpose: string;
  notes: string;
  outcomeStatus?: "scheduled" | "completed" | "cancelled" | "no-show";
  proximityScore?: number;
  activities?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ScheduleFormData {
  leadId: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  purpose: string;
  notes: string;
}

export default function AgendaPage() {
  const { project } = useProject();
  const router = useRouter();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormData>({
    leadId: "",
    company: "",
    contact: "",
    email: "",
    phone: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    purpose: "Initial qualification",
    notes: "",
  });
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  const loadCalls = useCallback(async () => {
    if (project !== "helios") {
      setError("Call tracking is only available for HELIOS (Italian Solar)");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/helios/calls?project=${project}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load calls");
      setCalls(data.calls || []);
    } catch (err) {
      console.error("Failed to load calls:", err);
      setError(err instanceof Error ? err.message : "Failed to load calls");
    }
    setLoading(false);
  }, [project]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const handleScheduleCall = async () => {
    if (!formData.leadId || !formData.date || !formData.time) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/helios/calls/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          project,
          scheduledDateTime: `${formData.date}T${formData.time}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule call");

      setCalls([...calls, data.call]);
      setShowScheduler(false);
      setFormData({
        leadId: "",
        company: "",
        contact: "",
        email: "",
        phone: "",
        date: new Date().toISOString().split("T")[0],
        time: "10:00",
        purpose: "Initial qualification",
        notes: "",
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule call");
    }
    setLoading(false);
  };

  const handleUpdateCall = async (callId: string, updates: Partial<CallRecord>) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/helios/calls/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...updates, project }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update call");

      setCalls(calls.map((c) => (c.id === callId ? data.call : c)));
      setSelectedCall(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update call");
    }
    setLoading(false);
  };

  const getUpcomingCalls = () =>
    calls.filter((c) => new Date(c.scheduledDate) >= new Date());
  const getCompletedCalls = () =>
    calls.filter((c) => new Date(c.scheduledDate) < new Date());

  if (project !== "helios") {
    return (
      <div style={{
        height: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
      }}>
        <AlertCircle size={32} style={{ color: "var(--warning)" }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>
            HELIOS Required
          </p>
          <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>
            Call tracking is exclusively for HELIOS solar outreach
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            padding: "8px 16px",
            background: "var(--accent)",
            color: "#000",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (loading && calls.length === 0) {
    return (
      <div style={{
        height: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              background: "var(--accent)",
              borderRadius: "50%",
              animation: "pulse 1.5s infinite",
            }}
          />
          <span style={{ fontSize: 13, color: "var(--text-2)" }}>
            Loading call agenda…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>
            Call Agenda
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
            Track and manage outreach calls for HELIOS leads
          </p>
        </div>
        <button
          onClick={() => setShowScheduler(!showScheduler)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "var(--accent)",
            color: "#000",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Plus size={16} />
          Schedule Call
        </button>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px",
          background: "var(--danger-dim)",
          border: "1px solid var(--danger)",
          borderRadius: 8,
          color: "var(--danger)",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Scheduler Modal */}
      {showScheduler && (
        <div style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          gap: 16,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>
              Schedule New Call
            </h2>
            <button
              onClick={() => setShowScheduler(false)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              <X size={20} style={{ color: "var(--text-2)" }} />
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}>
            <input
              type="text"
              placeholder="Lead ID / Company"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value, leadId: e.target.value })
              }
              style={{
                padding: "10px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-1)",
                fontSize: 13,
              }}
            />
            <input
              type="text"
              placeholder="Contact Name"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              style={{
                padding: "10px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-1)",
                fontSize: 13,
              }}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                padding: "10px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-1)",
                fontSize: 13,
              }}
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{
                padding: "10px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-1)",
                fontSize: 13,
              }}
            />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{
                padding: "10px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-1)",
                fontSize: 13,
              }}
            />
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              style={{
                padding: "10px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-1)",
                fontSize: 13,
              }}
            />
          </div>

          <textarea
            placeholder="Purpose / Call notes"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            style={{
              padding: "10px 12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-1)",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              minHeight: 80,
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowScheduler(false)}
              style={{
                padding: "10px 16px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-1)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleCall}
              disabled={loading}
              style={{
                padding: "10px 16px",
                background: "var(--accent)",
                color: "#000",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              Schedule Call
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Calls */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", marginBottom: 12 }}>
          📅 Upcoming Calls
        </h2>
        {getUpcomingCalls().length === 0 ? (
          <div style={{
            padding: 20,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            textAlign: "center",
            color: "var(--text-2)",
            fontSize: 13,
          }}>
            No upcoming calls scheduled
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12,
          }}>
            {getUpcomingCalls().map((call) => (
              <div
                key={call.id}
                onClick={() => setSelectedCall(call)}
                style={{
                  padding: 16,
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "start", gap: 12, marginBottom: 12 }}>
                  <Calendar size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>
                      {call.company}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-2)", margin: "4px 0 0" }}>
                      {call.contact}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={12} style={{ color: "var(--text-3)" }} />
                    <span style={{ fontSize: 11, color: "var(--text-2)" }}>
                      {new Date(call.scheduledDate).toLocaleDateString("en-IT")} @{" "}
                      {call.scheduledTime}
                    </span>
                  </div>
                  {call.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Phone size={12} style={{ color: "var(--text-3)" }} />
                      <span style={{ fontSize: 11, color: "var(--text-2)" }}>{call.phone}</span>
                    </div>
                  )}
                </div>

                {call.proximityScore && (
                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                  }}>
                    <span style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase" }}>
                      Proximity Score: {call.proximityScore}/10
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Calls */}
      {getCompletedCalls().length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", marginBottom: 12 }}>
            ✅ Completed Calls
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12,
          }}>
            {getCompletedCalls().map((call) => (
              <div
                key={call.id}
                onClick={() => setSelectedCall(call)}
                style={{
                  padding: 16,
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  opacity: 0.7,
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>
                  {call.company}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-2)", margin: "4px 0" }}>
                  {new Date(call.scheduledDate).toLocaleDateString("en-IT")}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
                  {call.outcomeStatus || "completed"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCall && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setSelectedCall(null)}
        >
          <div
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>
                {selectedCall.company}
              </h2>
              <button
                onClick={() => setSelectedCall(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "var(--text-2)",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase" }}>
                  Contact
                </span>
                <p style={{ fontSize: 13, color: "var(--text-1)", margin: "4px 0 0" }}>
                  {selectedCall.contact}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase" }}>
                  Scheduled
                </span>
                <p style={{ fontSize: 13, color: "var(--text-1)", margin: "4px 0 0" }}>
                  {new Date(selectedCall.scheduledDate).toLocaleDateString("en-IT")} @{" "}
                  {selectedCall.scheduledTime}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase" }}>
                  Purpose
                </span>
                <p style={{ fontSize: 13, color: "var(--text-1)", margin: "4px 0 0" }}>
                  {selectedCall.purpose}
                </p>
              </div>

              {selectedCall.notes && (
                <div>
                  <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase" }}>
                    Notes
                  </span>
                  <p style={{ fontSize: 13, color: "var(--text-2)", margin: "4px 0 0" }}>
                    {selectedCall.notes}
                  </p>
                </div>
              )}

              {selectedCall.proximityScore && (
                <div>
                  <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase" }}>
                    Proximity Activity Score
                  </span>
                  <p style={{ fontSize: 13, color: "var(--accent)", margin: "4px 0 0", fontWeight: 600 }}>
                    {selectedCall.proximityScore}/10
                  </p>
                </div>
              )}

              {/* Outcome selector */}
              {new Date(selectedCall.scheduledDate) < new Date() && (
                <div>
                  <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase" }}>
                    Outcome
                  </span>
                  <select
                    value={selectedCall.outcomeStatus || "completed"}
                    onChange={(e) =>
                      handleUpdateCall(selectedCall.id, { outcomeStatus: e.target.value as any })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      marginTop: 6,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--text-1)",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <option value="completed">✅ Completed</option>
                    <option value="no-show">❌ No Show</option>
                    <option value="cancelled">⏸ Cancelled</option>
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedCall(null)}
              style={{
                width: "100%",
                padding: "12px 16px",
                marginTop: 20,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-1)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
