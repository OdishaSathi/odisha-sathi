"use client";

import { useEffect, useState } from "react";
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

export default function AdminResultsManager() {
  const [results, setResults] = useState<ResultPost[]>([]);
  const [editingResult, setEditingResult] = useState<ResultPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
    await addResult(data);
    await loadResults();
    setShowCreateForm(false);
    alert("Result saved successfully.");
  };

  const handleUpdate = async (data: ResultPost) => {
    if (!editingResult?.id) return;

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
        <div className="admit-admin-card-title">
          <h2>Saved Results</h2>
          <span>{results.length} posts</span>
        </div>

        {isLoading ? (
          <p className="admit-admin-muted">Loading results...</p>
        ) : results.length === 0 ? (
          <div className="admit-admin-empty">
            <h3>No result posts found</h3>
            <p>Create your first result update using the Create New button.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Exam Name</th>
                  <th>Organization</th>
                  <th>Result Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {results.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <br />
                      <small>{item.slug}</small>
                    </td>
                    <td>{item.examName || "-"}</td>
                    <td>{item.organization || "-"}</td>
                    <td>{item.resultDateDisplay || item.resultDate || "-"}</td>
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
