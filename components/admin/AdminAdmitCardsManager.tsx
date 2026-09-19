"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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
import {
  findPublicSlugConflict,
  formatPublicSlugConflict,
} from "@/lib/adminSlugGuard";
import {
  confirmAdminValidation,
  validateAdminContent,
} from "@/lib/adminContentValidation";

const listHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "16px",
  flexWrap: "wrap",
};

const searchInputStyle: CSSProperties = {
  width: "min(280px, 100%)",
  minHeight: "38px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "8px 10px",
  color: "#111827",
  background: "#ffffff",
};

const savedListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const savedItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
};

const savedTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "16px",
  lineHeight: 1.4,
  fontWeight: 700,
  color: "#111827",
};

const savedMetaStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "14px",
  color: "#6b7280",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  alignItems: "center",
};

export default function AdminAdmitCardsManager() {
  const [admitCards, setAdmitCards] = useState<AdmitCard[]>([]);
  const [editingAdmitCard, setEditingAdmitCard] = useState<AdmitCard | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeView, setActiveView] = useState<"all" | "admit-card" | "exam">("all");
  const [searchQuery, setSearchQuery] = useState("");

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
    const validationReport = validateAdminContent(
      {
        title: data.title,
        slug: data.slug,
        description: data.description,
        importantDates: data.importantDates,
        importantLinks: data.importantLinks || data.links,
      },
      { expectDescription: true, expectOfficialLink: true }
    );
    if (!confirmAdminValidation(validationReport)) return;

    const slugConflict = await findPublicSlugConflict(data.slug);
    if (slugConflict) {
      alert(formatPublicSlugConflict(slugConflict));
      return;
    }

    await addAdmitCard(data);
    await loadAdmitCards();
    setShowCreateForm(false);
    alert("Admit card or exam update saved successfully.");
  };

  const handleUpdate = async (data: AdmitCard) => {
    if (!editingAdmitCard?.id) return;

    const validationReport = validateAdminContent(
      {
        title: data.title,
        slug: data.slug,
        description: data.description,
        importantDates: data.importantDates,
        importantLinks: data.importantLinks || data.links,
      },
      { expectDescription: true, expectOfficialLink: true }
    );
    if (!confirmAdminValidation(validationReport)) return;

    const slugConflict = await findPublicSlugConflict(data.slug, {
      collectionName: "admitCards",
      documentId: editingAdmitCard.id,
    });
    if (slugConflict) {
      alert(formatPublicSlugConflict(slugConflict));
      return;
    }

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
  const visibleAdmitCards = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();

    return admitCards
      .filter((item) => {
        if (activeView === "all") return true;
        if (activeView === "exam") return item.updateType === "exam";
        return item.updateType !== "exam";
      })
      .filter((item) => {
        if (!queryText) return true;

        return [
          item.title,
          item.slug,
          item.updateType,
          item.examName,
          item.organization,
          item.admitCardDateDisplay,
          item.admitCardDate,
          item.examDateDisplay,
          item.examDate,
          item.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(queryText);
      });
  }, [activeView, admitCards, searchQuery]);

  return (
    <div className="admit-admin-page admin-manager-page">
      <div className="admit-admin-header admin-manager-header">
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

      <div className="admit-admin-card admin-saved-panel">
        <div className="admin-saved-header" style={listHeaderStyle}>
          <div>
            <h2 style={{ margin: 0 }}>Saved Admit Cards & Exams</h2>
            <p className="admit-admin-muted" style={{ margin: "4px 0 0" }}>
              {visibleAdmitCards.length} posts shown
            </p>
          </div>

          <div className="admin-saved-tools" style={actionRowStyle}>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search saved admit cards or exams"
              aria-label="Search saved admit cards or exams"
              style={searchInputStyle}
            />

            <button
              type="button"
              className="admin-small-btn"
              onClick={loadAdmitCards}
            >
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="admit-admin-muted">Loading admit cards and exams...</p>
        ) : admitCards.length === 0 ? (
          <div className="admit-admin-empty">
            <h3>No admit card or exam posts found</h3>
            <p>Create your first update using the Create New button.</p>
          </div>
        ) : visibleAdmitCards.length === 0 ? (
          <p className="admit-admin-muted">No matching admit card or exam posts found.</p>
        ) : (
          <div className="admin-saved-list" style={savedListStyle}>
            {visibleAdmitCards.map((item) => (
              <div className="admin-saved-item" key={item.id} style={savedItemStyle}>
                <div className="admin-saved-copy" style={{ minWidth: 0, flex: "1 1 360px" }}>
                  <h3 style={savedTitleStyle}>{item.title}</h3>
                  <p style={savedMetaStyle}>
                    {item.updateType === "exam" ? "Exam" : "Admit Card"} |{" "}
                    {item.examName || "Exam name not added"} |{" "}
                    Admit Card: {item.admitCardDateDisplay || item.admitCardDate || "Not added"} |{" "}
                    Exam: {item.examDateDisplay || item.examDate || "Not added"} |{" "}
                    {item.status || "published"}
                  </p>
                </div>

                <div className="admin-saved-actions" style={actionRowStyle}>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
