"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import AdminLayout from "@/components/admin/AdminLayout";
import FlexibleDetailsEditor from "@/components/admin/FlexibleDetailsEditor";
import ImageUploadField from "@/components/admin/ImageUploadField";
import PostDynamicTables from "@/components/admin/PostDynamicTables";
import AdminPostShareButtons from "@/components/admin/AdminPostShareButtons";
import { db } from "@/lib/firebase";
import { getActiveAdminSubCategories } from "@/lib/adminSubCategories";
import {
  CitizenServicePost,
  SUGGESTED_SERVICE_DOCUMENTS,
  ServiceDocumentRow,
  ServiceOverviewRow,
  createOverviewRow,
  createServiceDocument,
  makeCitizenServiceSlug,
  normalizeOverviewRows,
  normalizeServiceDocuments,
} from "@/lib/citizenServices";
import {
  FlexibleDataTable,
  FlexibleDetailSection,
  cleanFlexibleDataTables,
  cleanFlexibleDetailSections,
  normalizeFlexibleDataTables,
  normalizeFlexibleDetailSections,
} from "@/lib/flexibleDetails";
import {
  ImportantDateRow,
  ImportantLinkRow,
  cleanImportantDates,
  cleanImportantLinks,
  createEmptyDateRow,
  createEmptyLinkRow,
} from "@/lib/postOptions";

type ServiceForm = {
  title: string;
  slug: string;
  subCategory: string;
  subCategories: string[];
  shortDescription: string;
  description: string;
  notificationNumber: string;
  previewImageUrl: string;
  overviewRows: ServiceOverviewRow[];
  contentSections: FlexibleDetailSection[];
  dataTables: FlexibleDataTable[];
  documentsRequired: ServiceDocumentRow[];
  eligibility: string;
  fees: string;
  howToApply: string;
  youtubeUrl: string;
  youtubeUrl2: string;
  importantDates: ImportantDateRow[];
  importantLinks: ImportantLinkRow[];
  shareTitle: string;
  shareDescription: string;
};

function createEmptyForm(): ServiceForm {
  return {
    title: "",
    slug: "",
    subCategory: "",
    subCategories: [],
    shortDescription: "",
    description: "",
    notificationNumber: "",
    previewImageUrl: "",
    overviewRows: [
      createOverviewRow("Service Name"),
      createOverviewRow("Application Mode"),
      createOverviewRow("Processing Time"),
      createOverviewRow("Service Available At"),
    ],
    contentSections: [],
    dataTables: [],
    documentsRequired: [],
    eligibility: "",
    fees: "",
    howToApply: "",
    youtubeUrl: "",
    youtubeUrl2: "",
    importantDates: [createEmptyDateRow()],
    importantLinks: [createEmptyLinkRow()],
    shareTitle: "",
    shareDescription: "",
  };
}

function getTimeValue(value: any) {
  return value?.seconds || 0;
}

export default function AdminCitizenServicesPage() {
  const [posts, setPosts] = useState<CitizenServicePost[]>([]);
  const [categories, setCategories] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [form, setForm] = useState<ServiceForm>(createEmptyForm);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.value === form.subCategory),
    [categories, form.subCategory]
  );
  const selectedCategories = useMemo(
    () =>
      categories.filter((item) =>
        form.subCategories.includes(item.value)
      ),
    [categories, form.subCategories]
  );

  async function loadData() {
    try {
      setLoading(true);
      const [postSnapshot, managedCategories] = await Promise.all([
        getDocs(collection(db, "posts")),
        getActiveAdminSubCategories("citizen-services"),
      ]);

      const nextCategories = managedCategories.map((item) => ({
        label: item.label,
        value: item.value,
      }));
      setCategories(nextCategories);
      setForm((previous) => ({
        ...previous,
        subCategory:
          previous.subCategory || nextCategories[0]?.value || "",
        subCategories:
          previous.subCategories.length > 0
            ? previous.subCategories
            : nextCategories[0]?.value
            ? [nextCategories[0].value]
            : [],
      }));

      setPosts(
        postSnapshot.docs
          .map((item) => ({
            id: item.id,
            ...(item.data() as Omit<CitizenServicePost, "id">),
          }))
          .filter((item) => item.category === "citizen-services")
          .sort(
            (a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt)
          )
      );
    } catch (error) {
      console.error(error);
      alert("Failed to load Citizen Services.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField<K extends keyof ServiceForm>(
    field: K,
    value: ServiceForm[K]
  ) {
    setForm((previous) => {
      if (field === "title") {
        const title = String(value);
        const shouldAutoSlug =
          !previous.slug ||
          previous.slug === makeCitizenServiceSlug(previous.title);
        return {
          ...previous,
          title,
          slug: shouldAutoSlug
            ? makeCitizenServiceSlug(title)
            : previous.slug,
        };
      }
      return { ...previous, [field]: value };
    });
  }

  function updateOverviewRow(
    id: string,
    field: "label" | "value",
    value: string
  ) {
    updateField(
      "overviewRows",
      form.overviewRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  }

  function resetForm() {
    setEditingId("");
    setShowForm(false);
    const next = createEmptyForm();
    next.subCategory = categories[0]?.value || "";
    next.subCategories = categories[0]?.value ? [categories[0].value] : [];
    setForm(next);
  }

  function startEdit(post: CitizenServicePost) {
    setEditingId(post.id || "");
    setShowForm(true);
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      subCategory: post.subCategory || "",
      subCategories: categories
        .filter((option) =>
          (post.subCategories || []).some(
            (item) => item === option.value || item === option.label
          )
        )
        .map((option) => option.value)
        .concat(
          post.subCategory &&
            !categories.some(
              (option) =>
                option.value === post.subCategory &&
                (post.subCategories || []).some(
                  (item) => item === option.value || item === option.label
                )
            )
            ? [post.subCategory]
            : []
        ),
      shortDescription: post.shortDescription || "",
      description: post.description || "",
      notificationNumber: post.notificationNumber || "",
      previewImageUrl: post.previewImageUrl || "",
      overviewRows: normalizeOverviewRows(post.overviewRows),
      contentSections: normalizeFlexibleDetailSections(post.contentSections),
      dataTables: normalizeFlexibleDataTables(post.dataTables),
      documentsRequired: normalizeServiceDocuments(post.documentsRequired),
      eligibility: post.eligibility || "",
      fees: post.fees || "",
      howToApply: post.howToApply || "",
      youtubeUrl: post.youtubeUrl || "",
      youtubeUrl2: post.youtubeUrl2 || "",
      importantDates:
        post.importantDates?.length
          ? post.importantDates
          : [createEmptyDateRow()],
      importantLinks:
        post.importantLinks?.length
          ? post.importantLinks
          : [createEmptyLinkRow()],
      shareTitle: post.shareTitle || "",
      shareDescription: post.shareDescription || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter service title.");
      return;
    }
    if (selectedCategories.length === 0 || !selectedCategory) {
      alert("Please create and select at least one Citizen Services subcategory.");
      return;
    }

    const slug = makeCitizenServiceSlug(form.slug || form.title);
    if (
      posts.some(
        (post) => post.slug === slug && post.id !== editingId
      )
    ) {
      alert("This slug is already used. Please change the title or slug.");
      return;
    }

    const payload: Omit<CitizenServicePost, "id"> = {
      title: form.title.trim(),
      slug,
      category: "citizen-services",
      subCategory: selectedCategory.value,
      subCategoryLabel: selectedCategory.label,
      subCategories: selectedCategories.flatMap((item) => [
        item.label,
        item.value,
      ]),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      notificationNumber: form.notificationNumber.trim(),
      previewImageUrl: form.previewImageUrl.trim(),
      overviewRows: normalizeOverviewRows(form.overviewRows),
      contentSections: cleanFlexibleDetailSections(form.contentSections),
      dataTables: cleanFlexibleDataTables(form.dataTables),
      documentsRequired: normalizeServiceDocuments(form.documentsRequired),
      eligibility: form.eligibility.trim(),
      fees: form.fees.trim(),
      howToApply: form.howToApply.trim(),
      youtubeUrl: form.youtubeUrl.trim(),
      youtubeUrl2: form.youtubeUrl2.trim(),
      importantDates: cleanImportantDates(form.importantDates),
      importantLinks: cleanImportantLinks(form.importantLinks),
      shareTitle: form.shareTitle.trim(),
      shareDescription: form.shareDescription.trim(),
      status: "published",
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateDoc(doc(db, "posts", editingId), {
          ...payload,
          content: payload.description,
          imageUrl: payload.previewImageUrl,
          detailSections: payload.contentSections,
          customTables: payload.dataTables,
          links: payload.importantLinks,
          updatedAt: serverTimestamp(),
        });
        alert("Citizen Service updated successfully.");
      } else {
        await addDoc(collection(db, "posts"), {
          ...payload,
          content: payload.description,
          imageUrl: payload.previewImageUrl,
          detailSections: payload.contentSections,
          customTables: payload.dataTables,
          links: payload.importantLinks,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        alert("Citizen Service saved successfully.");
      }
      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to save Citizen Service.");
    } finally {
      setSaving(false);
    }
  }

  async function removePost(post: CitizenServicePost) {
    if (!post.id) return;
    if (!window.confirm(`Delete this Citizen Service?\n\n${post.title}`)) return;
    await deleteDoc(doc(db, "posts", post.id));
    await loadData();
  }

  return (
    <AdminLayout>
      <div className="citizen-admin-page">
        <div className="citizen-admin-header">
          <div>
            <h1>Citizen Services</h1>
            <p>Saved services first. Open the form only when needed.</p>
          </div>
          <div className="citizen-admin-actions">
            <Link href="/admin/categories">Manage Subcategories</Link>
            <button
              type="button"
              onClick={() => {
                if (showForm) resetForm();
                else setShowForm(true);
              }}
            >
              {showForm ? "Hide Form" : "+ Create Citizen Service"}
            </button>
          </div>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="citizen-admin-form">
            <div className="citizen-form-title">
              <h2>{editingId ? "Edit Citizen Service" : "Create Citizen Service"}</h2>
              <button type="button" onClick={resetForm}>Close</button>
            </div>

            {categories.length === 0 ? (
              <div className="citizen-warning">
                Create at least one Citizen Services subcategory in the
                Subcategories page before saving a service.
              </div>
            ) : null}

            <section>
              <h3>Basic Information</h3>
              <div className="citizen-grid">
                <label>
                  Service Title *
                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                  />
                </label>
                <label>
                  Slug
                  <input
                    value={form.slug}
                    onChange={(event) =>
                      updateField(
                        "slug",
                        makeCitizenServiceSlug(event.target.value)
                      )
                    }
                  />
                </label>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label>Subcategories * (select one or more)</label>
                  <div className="admin-checkbox-grid">
                    {categories.map((item) => (
                      <label className="admin-checkbox-card" key={item.value}>
                        <input
                          type="checkbox"
                          checked={form.subCategories.includes(item.value)}
                          onChange={() => {
                            const nextValues = form.subCategories.includes(
                              item.value
                            )
                              ? form.subCategories.filter(
                                  (value) => value !== item.value
                                )
                              : [...form.subCategories, item.value];
                            const primary =
                              categories.find(
                                (option) => option.value === nextValues[0]
                              ) || categories[0];
                            setForm((previous) => ({
                              ...previous,
                              subCategories: nextValues,
                              subCategory: primary?.value || "",
                            }));
                          }}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
                <label>
                  Notification / Reference Number
                  <input
                    value={form.notificationNumber}
                    onChange={(event) =>
                      updateField("notificationNumber", event.target.value)
                    }
                  />
                </label>
              </div>
              <label>
                Short Description
                <textarea
                  rows={3}
                  value={form.shortDescription}
                  onChange={(event) =>
                    updateField("shortDescription", event.target.value)
                  }
                />
              </label>
              <label>
                Main Description
                <textarea
                  rows={6}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </label>
            </section>

            <ImageUploadField
              label="Preview Image / Default Banner"
              value={form.previewImageUrl}
              onChange={(value) => updateField("previewImageUrl", value)}
              helpText="Leave blank for YouTube thumbnail or the Citizen Services default banner."
              folder="citizen-services"
            />

            <section>
              <div className="citizen-section-head">
                <h3>Service Overview</h3>
                <button
                  type="button"
                  onClick={() =>
                    updateField("overviewRows", [
                      ...form.overviewRows,
                      createOverviewRow(),
                    ])
                  }
                >
                  + Add Row
                </button>
              </div>
              <div className="citizen-row-list">
                {form.overviewRows.map((row) => (
                  <div className="citizen-entry-row" key={row.id}>
                    <input
                      value={row.label}
                      onChange={(event) =>
                        updateOverviewRow(row.id, "label", event.target.value)
                      }
                      placeholder="Label"
                    />
                    <input
                      value={row.value}
                      onChange={(event) =>
                        updateOverviewRow(row.id, "value", event.target.value)
                      }
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        updateField(
                          "overviewRows",
                          form.overviewRows.filter((item) => item.id !== row.id)
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <label>
              YouTube Thumbnail 1 (shown below Service Overview)
              <input
                type="url"
                value={form.youtubeUrl}
                onChange={(event) =>
                  updateField("youtubeUrl", event.target.value)
                }
                placeholder="https://youtube.com/..."
              />
            </label>

            <FlexibleDetailsEditor
              detailSections={form.contentSections}
              dataTables={form.dataTables}
              onDetailSectionsChange={(value) =>
                updateField("contentSections", value)
              }
              onDataTablesChange={(value) =>
                updateField("dataTables", value)
              }
              sectionLabel="Optional Details, Images and Extra Data Tables"
            />

            <section>
              <div className="citizen-section-head">
                <h3>Documents Required</h3>
                <button
                  type="button"
                  onClick={() =>
                    updateField("documentsRequired", [
                      ...form.documentsRequired,
                      createServiceDocument(),
                    ])
                  }
                >
                  + Add Document
                </button>
              </div>
              <datalist id="citizen-document-suggestions">
                {SUGGESTED_SERVICE_DOCUMENTS.map((name) => (
                  <option value={name} key={name} />
                ))}
              </datalist>
              <div className="citizen-row-list">
                {form.documentsRequired.map((document) => (
                  <div className="citizen-document-row" key={document.id}>
                    <input
                      list="citizen-document-suggestions"
                      value={document.name}
                      onChange={(event) =>
                        updateField(
                          "documentsRequired",
                          form.documentsRequired.map((item) =>
                            item.id === document.id
                              ? { ...item, name: event.target.value }
                              : item
                          )
                        )
                      }
                      placeholder="Document name"
                    />
                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        updateField(
                          "documentsRequired",
                          form.documentsRequired.filter(
                            (item) => item.id !== document.id
                          )
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div className="citizen-grid">
              <label>
                Eligibility / Who Can Apply
                <textarea
                  rows={5}
                  value={form.eligibility}
                  onChange={(event) =>
                    updateField("eligibility", event.target.value)
                  }
                />
              </label>
              <label>
                Fees / Charges
                <textarea
                  rows={5}
                  value={form.fees}
                  onChange={(event) =>
                    updateField("fees", event.target.value)
                  }
                />
              </label>
            </div>

            <label>
              How to Apply
              <textarea
                rows={7}
                value={form.howToApply}
                onChange={(event) =>
                  updateField("howToApply", event.target.value)
                }
                placeholder="Enter the application process step by step."
              />
            </label>

            <label>
              YouTube Thumbnail 2 (shown below How to Apply)
              <input
                type="url"
                value={form.youtubeUrl2}
                onChange={(event) =>
                  updateField("youtubeUrl2", event.target.value)
                }
                placeholder="https://youtube.com/..."
              />
            </label>

            <PostDynamicTables
              importantDates={form.importantDates}
              importantLinks={form.importantLinks}
              onDatesChange={(value) => updateField("importantDates", value)}
              onLinksChange={(value) => updateField("importantLinks", value)}
            />

            <section>
              <h3>Social Sharing Preview</h3>
              <div className="citizen-grid">
                <label>
                  Share Title
                  <input
                    value={form.shareTitle}
                    onChange={(event) =>
                      updateField("shareTitle", event.target.value)
                    }
                    placeholder="Uses service title when blank"
                  />
                </label>
                <label>
                  Share Description
                  <textarea
                    rows={3}
                    value={form.shareDescription}
                    onChange={(event) =>
                      updateField("shareDescription", event.target.value)
                    }
                  />
                </label>
              </div>
            </section>

            <button
              type="submit"
              className="citizen-submit"
              disabled={saving || categories.length === 0}
            >
              {saving
                ? "Saving…"
                : editingId
                ? "Update Citizen Service"
                : "Save Citizen Service"}
            </button>
          </form>
        ) : null}

        <section className="citizen-saved">
          <div className="citizen-section-head">
            <div>
              <h2>Saved Citizen Services</h2>
              <p>{posts.length} posts saved</p>
            </div>
            <button type="button" onClick={loadData}>Refresh</button>
          </div>

          {loading ? (
            <p>Loading services…</p>
          ) : posts.length === 0 ? (
            <p>No Citizen Services saved yet.</p>
          ) : (
            <div className="citizen-post-list">
              {posts.map((post) => (
                <article key={post.id}>
                  <div>
                    <span>{post.subCategoryLabel || post.subCategory}</span>
                    <h3>{post.title}</h3>
                  </div>
                  <div className="citizen-post-actions">
                    <Link
                      href={`/citizen-services/${post.slug || post.id}`}
                      target="_blank"
                    >
                      View
                    </Link>
                    <button type="button" onClick={() => startEdit(post)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => removePost(post)}
                    >
                      Delete
                    </button>
                    <AdminPostShareButtons
                      title={post.title}
                      description={post.shortDescription}
                      publicPath={`/citizen-services/${post.slug || post.id}`}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        .citizen-admin-page {
          display: grid;
          gap: 22px;
        }
        .citizen-admin-header,
        .citizen-section-head,
        .citizen-form-title,
        .citizen-admin-actions,
        .citizen-post-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .citizen-admin-header h1,
        .citizen-admin-header p,
        .citizen-section-head h2,
        .citizen-section-head h3,
        .citizen-section-head p,
        .citizen-form-title h2 {
          margin: 0;
        }
        .citizen-admin-header p,
        .citizen-section-head p {
          margin-top: 5px;
          color: #64748b;
        }
        .citizen-admin-actions a,
        .citizen-admin-actions button,
        .citizen-admin-page button,
        .citizen-post-actions a {
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 8px 11px;
          background: #ffffff;
          color: #1d4ed8;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
        }
        .citizen-admin-form,
        .citizen-saved {
          display: grid;
          gap: 18px;
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
        }
        .citizen-admin-form section {
          display: grid;
          gap: 13px;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 13px;
        }
        .citizen-admin-form section h3 {
          margin: 0;
        }
        .citizen-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 13px;
        }
        .citizen-admin-form label {
          display: grid;
          gap: 6px;
          color: #334155;
          font-size: 13px;
          font-weight: 800;
        }
        .citizen-admin-form input,
        .citizen-admin-form select,
        .citizen-admin-form textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 9px 10px;
          background: #ffffff;
          color: #0f172a;
          font: inherit;
          resize: vertical;
        }
        .citizen-row-list,
        .citizen-post-list {
          display: grid;
          gap: 10px;
        }
        .citizen-entry-row {
          display: grid;
          grid-template-columns: minmax(140px, 0.65fr) minmax(220px, 1.35fr) auto;
          gap: 9px;
        }
        .citizen-document-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 9px;
        }
        .citizen-warning {
          padding: 12px;
          border: 1px solid #fed7aa;
          border-radius: 10px;
          background: #fff7ed;
          color: #9a3412;
          font-weight: 800;
        }
        .citizen-admin-page button.danger {
          border-color: #fecaca;
          background: #fff1f2;
          color: #be123c;
        }
        .citizen-admin-page button.citizen-submit {
          min-height: 46px;
          border-color: #2563eb;
          background: #2563eb;
          color: #ffffff;
          font-size: 15px;
        }
        .citizen-post-list article {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding: 13px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        .citizen-post-list article span {
          color: #0f766e;
          font-size: 12px;
          font-weight: 900;
        }
        .citizen-post-list article h3 {
          margin: 4px 0 0;
        }
        @media (max-width: 680px) {
          .citizen-entry-row,
          .citizen-document-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
