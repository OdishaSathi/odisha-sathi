"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import ResultForm from "@/components/admin/ResultForm";
import {
  addResult,
  deleteResult,
  getAllResults,
  updateResult,
} from "@/lib/results";
import { ResultPost } from "@/types/result";
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
  width: "min(260px, 100%)",
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

export default function AdminResultsManager() {
  const [results, setResults] = useState<ResultPost[]>([]);
  const [editingResult, setEditingResult] = useState<ResultPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResults = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    if (!queryText) return results;

    return results.filter((item) =>
      [
        item.title,
        item.slug,
        item.examName,
        item.organization,
        item.resultDateDisplay,
        item.resultDate,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(queryText)
    );
  }, [results, searchQuery]);

  const loadResults = async () => {
    setIsLoading(true);

    try {
      const data = await getAllResults();
      setResults(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load results.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const handleCreate = async (data: ResultPost) => {
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

    await addResult(data);
    await loadResults();
    setShowCreateForm(false);
    alert("Result saved successfully.");
  };

  const handleUpdate = async (data: ResultPost) => {
    if (!editingResult?.id) return;

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
      collectionName: "results",
      documentId: editingResult.id,
    });
    if (slugConflict) {
      alert(formatPublicSlugConflict(slugConflict));
      return;
    }

    await updateResult(editingResult.id, data);
    setEditingResult(null);
    await loadResults();
    alert("Result updated successfully.");
  };

  const handleDelete = async (item: ResultPost) => {
    if (!item.id) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${item.title}"?`
    );

    if (!confirmDelete) return;

    try {
      await deleteResult(item.id);
      await loadResults();
      alert("Result deleted successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to delete result.");
    }
  };

  return (
    <div className="admit-admin-page">
      <div className="admit-admin-header">
        <div>
          <h1>Results</h1>
          <p>Saved results first. Use Create New Result only when needed.</p>
        </div>

        <button
          type="button"
          className="admin-small-btn"
          onClick={() => setShowCreateForm((oldValue) => !oldValue)}
        >
          {showCreateForm ? "Hide Form" : "+ Create New Result"}
        </button>
      </div>

      {showCreateForm || editingResult ? (
        <div className="admit-admin-card">
          <div className="admit-admin-card-title">
            <h2>{editingResult ? "Edit Result" : "Create Result"}</h2>

            <button
              type="button"
              className="admin-cancel-btn"
              onClick={() => {
                setEditingResult(null);
                setShowCreateForm(false);
              }}
            >
              Close Form
            </button>
          </div>

          <ResultForm
            initialData={editingResult}
            onSubmit={editingResult ? handleUpdate : handleCreate}
            onCancel={editingResult ? () => setEditingResult(null) : undefined}
            submitLabel={editingResult ? "Update Result" : "Save Result"}
          />
        </div>
      ) : null}

      <div className="admit-admin-card">
        <div style={listHeaderStyle}>
          <div>
            <h2 style={{ margin: 0 }}>Saved Results</h2>
            <p className="admit-admin-muted" style={{ margin: "4px 0 0" }}>
              {results.length} posts saved
            </p>
          </div>

          <div style={actionRowStyle}>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search saved results"
              aria-label="Search saved results"
              style={searchInputStyle}
            />

            <button
              type="button"
              className="admin-small-btn"
              onClick={loadResults}
            >
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="admit-admin-muted">Loading results...</p>
        ) : results.length === 0 ? (
          <div className="admit-admin-empty">
            <h3>No result posts found</h3>
            <p>Create your first result update using the Create New button.</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <p className="admit-admin-muted">No matching results found.</p>
        ) : (
          <div style={savedListStyle}>
            {filteredResults.map((item) => (
              <div key={item.id} style={savedItemStyle}>
                <div style={{ minWidth: 0, flex: "1 1 360px" }}>
                  <h3 style={savedTitleStyle}>{item.title}</h3>
                  <p style={savedMetaStyle}>
                    {item.examName || "Exam name not added"} |{" "}
                    {item.organization || "Organization not added"} |{" "}
                    {item.resultDateDisplay || item.resultDate || "Result date not added"} |{" "}
                    {item.status || "published"}
                  </p>
                </div>

                <div style={actionRowStyle}>
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
                      setEditingResult(item);
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
                    title={item.title || "Odisha Sathi Result Update"}
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
