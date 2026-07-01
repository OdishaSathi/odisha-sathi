"use client";

import { useEffect, useState } from "react";
import ResultForm from "@/components/admin/ResultForm";
import {
  addResult,
  deleteResult,
  getAllResults,
  updateResult,
} from "@/lib/results";
import { ResultPost } from "@/types/result";

export default function AdminResultsManager() {
  const [results, setResults] = useState<ResultPost[]>([]);
  const [editingResult, setEditingResult] = useState<ResultPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          <p>Create and manage result updates for public users.</p>
        </div>
      </div>

      <div className="admit-admin-card">
        <div className="admit-admin-card-title">
          <h2>{editingResult ? "Edit Result" : "Create Result"}</h2>

          {editingResult && (
            <button
              type="button"
              className="admin-cancel-btn"
              onClick={() => setEditingResult(null)}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <ResultForm
          initialData={editingResult}
          onSubmit={editingResult ? handleUpdate : handleCreate}
          onCancel={editingResult ? () => setEditingResult(null) : undefined}
          submitLabel={editingResult ? "Update Result" : "Save Result"}
        />
      </div>

      <div className="admit-admin-card">
        <div className="admit-admin-card-title">
          <h2>Existing Results</h2>
          <span>{results.length} posts</span>
        </div>

        {isLoading ? (
          <p className="admit-admin-muted">Loading results...</p>
        ) : results.length === 0 ? (
          <div className="admit-admin-empty">
            <h3>No result posts found</h3>
            <p>Create your first result update using the form above.</p>
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
                    <td>{item.resultDate || "-"}</td>
                    <td>
                      <span className="admin-status-pill">{item.status}</span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-small-btn"
                          onClick={() => setEditingResult(item)}
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