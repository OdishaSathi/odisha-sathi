"use client";

import { useEffect, useState } from "react";
import AdmitCardForm from "@/components/admin/AdmitCardForm";
import {
  addAdmitCard,
  deleteAdmitCard,
  getAllAdmitCards,
  updateAdmitCard,
} from "@/lib/admitCards";
import { AdmitCard } from "@/types/admitCard";

export default function AdminAdmitCardsManager() {
  const [admitCards, setAdmitCards] = useState<AdmitCard[]>([]);
  const [editingAdmitCard, setEditingAdmitCard] = useState<AdmitCard | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="admit-admin-page">
      <div className="admit-admin-header">
        <div>
          <h1>Admit Cards</h1>
          <p>Create and manage admit card updates for public users.</p>
        </div>
      </div>

      <div className="admit-admin-card">
        <div className="admit-admin-card-title">
          <h2>{editingAdmitCard ? "Edit Admit Card" : "Create Admit Card"}</h2>
          {editingAdmitCard && (
            <button
              type="button"
              className="admin-cancel-btn"
              onClick={() => setEditingAdmitCard(null)}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <AdmitCardForm
          initialData={editingAdmitCard}
          onSubmit={editingAdmitCard ? handleUpdate : handleCreate}
          onCancel={
            editingAdmitCard ? () => setEditingAdmitCard(null) : undefined
          }
          submitLabel={editingAdmitCard ? "Update Admit Card" : "Save Admit Card"}
        />
      </div>

      <div className="admit-admin-card">
        <div className="admit-admin-card-title">
          <h2>Existing Admit Cards</h2>
          <span>{admitCards.length} posts</span>
        </div>

        {isLoading ? (
          <p className="admit-admin-muted">Loading admit cards...</p>
        ) : admitCards.length === 0 ? (
          <div className="admit-admin-empty">
            <h3>No admit card posts found</h3>
            <p>Create your first admit card update using the form above.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Exam Name</th>
                  <th>Admit Card Date</th>
                  <th>Exam Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {admitCards.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <br />
                      <small>{item.slug}</small>
                    </td>
                    <td>{item.examName || "-"}</td>
                    <td>{item.admitCardDate || "-"}</td>
                    <td>{item.examDate || "-"}</td>
                    <td>
                      <span className="admin-status-pill">{item.status}</span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-small-btn"
                          onClick={() => setEditingAdmitCard(item)}
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