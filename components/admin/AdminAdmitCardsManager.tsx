"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdmitCardForm from "@/components/admin/AdmitCardForm";
import {
  addAdmitCard,
  deleteAdmitCard,
  getAllAdmitCards,
  updateAdmitCard,
} from "@/lib/admitCards";
import { AdmitCard } from "@/types/admitCard";
import AdminPostShareButtons from "@/components/admin/AdminPostShareButtons";

export default function AdminAdmitCardsManager() {
  const [admitCards, setAdmitCards] = useState<AdmitCard[]>([]);
  const [editingAdmitCard, setEditingAdmitCard] = useState<AdmitCard | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeView, setActiveView] = useState<"all" | "admit-card" | "exam">("all");

  const loadAdmitCards = async () => {
    setIsLoading(true);

    try {
      const data = await getAllAdmitCards();
      setAdmitCards(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load admit cards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmitCards();
  }, []);

  const handleCreate = async (data: AdmitCard) => {
    await addAdmitCard(data);
    await loadAdmitCards();
    setShowCreateForm(false);
    alert("Admit card or exam update saved successfully.");
  };

  const handleUpdate = async (data: AdmitCard) => {
    if (!editingAdmitCard?.id) return;

    await updateAdmitCard(editingAdmitCard.id, data);
    setEditingAdmitCard(null);
    await loadAdmitCards();
  };

  const handleDelete = async (item: AdmitCard) => {
    if (!item.id) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${item.title}"?`
    );

    if (!confirmDelete) return;

    try {
      await deleteAdmitCard(item.id);
      await loadAdmitCards();
    } catch (error) {
      console.error(error);
      alert("Failed to delete admit card.");
    }
  };

  const admitCardCount = admitCards.filter((item) => item.updateType !== "exam").length;
  const examCount = admitCards.filter((item) => item.updateType === "exam").length;
  const visibleAdmitCards = admitCards.filter((item) => {
    if (activeView === "all") return true;
    if (activeView === "exam") return item.updateType === "exam";
    return item.updateType !== "exam";
  });

  return (
    <div className="admit-admin-page">
      <div className="admit-admin-header">
        <div>
          <h1>Admit Cards & Exams</h1>
          <p>
            Saved admit card and exam updates first. Use Create New only when
            needed.
          </p>
        </div>

        <button
          type="button"
          className="admin-small-btn"
          onClick={() => setShowCreateForm((oldValue) => !oldValue)}
        >
          {showCreateForm ? "Hide Form" : "+ Create New Admit Card / Exam"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveView(activeView === "admit-card" ? "all" : "admit-card")}
          style={{
            textAlign: "left",
            border: activeView === "admit-card" ? "1px solid #2563eb" : "1px solid #e5e7eb",
            borderRadius: "14px",
            background: activeView === "admit-card" ? "#eff6ff" : "#ffffff",
            padding: "16px",
            cursor: "pointer",
          }}
        >
          <strong style={{ display: "block", color: "#0f172a", fontSize: "17px" }}>Admit Cards</strong>
          <span style={{ display: "block", marginTop: "6px", color: "#64748b", fontWeight: 800 }}>
            {admitCardCount} saved posts
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView(activeView === "exam" ? "all" : "exam")}
          style={{
            textAlign: "left",
            border: activeView === "exam" ? "1px solid #2563eb" : "1px solid #e5e7eb",
            borderRadius: "14px",
            background: activeView === "exam" ? "#eff6ff" : "#ffffff",
            padding: "16px",
            cursor: "pointer",
          }}
        >
          <strong style={{ display: "block", color: "#0f172a", fontSize: "17px" }}>Exams</strong>
          <span style={{ display: "block", marginTop: "6px", color: "#64748b", fontWeight: 800 }}>
            {examCount} saved posts
          </span>
        </button>
      </div>

      {activeView !== "all" ? (
        <button
          type="button"
          className="admin-small-btn"
          onClick={() => setActiveView("all")}
          style={{ width: "fit-content" }}
        >
          Show All Admit Cards & Exams
        </button>
      ) : null}

      {showCreateForm || editingAdmitCard ? (
        <div className="admit-admin-card">
          <div className="admit-admin-card-title">
            <h2>
              {editingAdmitCard
                ? "Edit Admit Card / Exam"
                : "Create Admit Card / Exam"}
            </h2>

            <button
              type="button"
              className="admin-cancel-btn"
              onClick={() => {
                setEditingAdmitCard(null);
                setShowCreateForm(false);
              }}
            >
              Close Form
            </button>
          </div>

          <AdmitCardForm
            initialData={editingAdmitCard}
            onSubmit={editingAdmitCard ? handleUpdate : handleCreate}
            onCancel={
              editingAdmitCard ? () => setEditingAdmitCard(null) : undefined
            }
            submitLabel={
              editingAdmitCard
                ? "Update Admit Card / Exam"
                : "Save Admit Card / Exam"
            }
          />
        </div>
      ) : null}

      <div className="admit-admin-card">
        <div className="admit-admin-card-title">
          <h2>Saved Admit Cards & Exams</h2>
          <span>{visibleAdmitCards.length} posts</span>
        </div>

        {isLoading ? (
          <p className="admit-admin-muted">Loading admit cards and exams...</p>
        ) : visibleAdmitCards.length === 0 ? (
          <div className="admit-admin-empty">
            <h3>No admit card or exam posts found</h3>
            <p>Create your first update using the Create New button.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Exam Name</th>
                  <th>Admit Card Date</th>
                  <th>Exam Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleAdmitCards.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <br />
                      <small>{item.slug}</small>
                    </td>
                    <td>{item.updateType === "exam" ? "Exam" : "Admit Card"}</td>
                    <td>{item.examName || "-"}</td>
                    <td>{item.admitCardDateDisplay || item.admitCardDate || "-"}</td>
                    <td>{item.examDateDisplay || item.examDate || "-"}</td>
                    <td>
                      <span className="admin-status-pill">{item.status}</span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <Link
                          href={`/post/${item.slug || item.id}`}
                          target="_blank"
                          className="admin-small-btn"
                          style={{ textDecoration: "none" }}
                        >
                          View
                        </Link>

                        <button
                          type="button"
                          className="admin-small-btn"
                          onClick={() => {
                            setEditingAdmitCard(item);
                            setShowCreateForm(false);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="admin-danger-btn"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </button>

                        <AdminPostShareButtons
                          title={item.title || "Odisha Sathi Admit Card & Exam Update"}
                          publicPath={`/post/${item.slug || item.id}`}
                          description={item.examName || item.organization || ""}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
