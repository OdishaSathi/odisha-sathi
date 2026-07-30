"use client";

import { useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";
import {
  FlexibleDataTable,
  FlexibleDetailSection,
  createFlexibleDataTable,
  createFlexibleDetailSection,
  createFlexibleTableRow,
} from "@/lib/flexibleDetails";

type Props = {
  detailSections: FlexibleDetailSection[];
  dataTables: FlexibleDataTable[];
  onDetailSectionsChange: (sections: FlexibleDetailSection[]) => void;
  onDataTablesChange: (tables: FlexibleDataTable[]) => void;
  sectionLabel?: string;
};

export default function FlexibleDetailsEditor({
  detailSections,
  dataTables,
  onDetailSectionsChange,
  onDataTablesChange,
  sectionLabel = "Optional Details and Data Tables",
}: Props) {
  const [uploadingKey, setUploadingKey] = useState("");
  const [uploadError, setUploadError] = useState("");

  async function uploadImage(
    file: File | undefined,
    key: string,
    onUploaded: (url: string) => void
  ) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be 5 MB or less.");
      return;
    }

    try {
      setUploadingKey(key);
      setUploadError("");
      const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const imageRef = ref(
        storage,
        `detail-media/${Date.now()}-${safeName || "detail-image"}`
      );
      await uploadBytes(imageRef, file, { contentType: file.type });
      onUploaded(await getDownloadURL(imageRef));
    } catch (error) {
      console.error(error);
      setUploadError(
        "Image upload failed. Check Firebase Storage permission or paste an image URL."
      );
    } finally {
      setUploadingKey("");
    }
  }
  function updateSection(
    id: string,
    field: "title" | "content",
    value: string
  ) {
    onDetailSectionsChange(
      detailSections.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  }

  function updateSectionImage(
    sectionId: string,
    imageIndex: number,
    value: string
  ) {
    onDetailSectionsChange(
      detailSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              imageUrls: section.imageUrls.map((imageUrl, index) =>
                index === imageIndex ? value : imageUrl
              ),
            }
          : section
      )
    );
  }

  function updateTable(
    tableId: string,
    field: "title" | "imageUrl",
    value: string
  ) {
    onDataTablesChange(
      dataTables.map((table) =>
        table.id === tableId ? { ...table, [field]: value } : table
      )
    );
  }

  function updateColumn(tableId: string, columnIndex: number, value: string) {
    onDataTablesChange(
      dataTables.map((table) => {
        if (table.id !== tableId) return table;

        return {
          ...table,
          columns: table.columns.map((column, index) =>
            index === columnIndex ? value : column
          ),
        };
      })
    );
  }

  function updateCell(
    tableId: string,
    rowId: string,
    cellIndex: number,
    value: string
  ) {
    onDataTablesChange(
      dataTables.map((table) => {
        if (table.id !== tableId) return table;

        return {
          ...table,
          rows: table.rows.map((row) =>
            row.id === rowId
              ? {
                  ...row,
                  cells: row.cells.map((cell, index) =>
                    index === cellIndex ? value : cell
                  ),
                }
              : row
          ),
        };
      })
    );
  }

  function addColumn(tableId: string) {
    onDataTablesChange(
      dataTables.map((table) =>
        table.id === tableId && table.columns.length < 6
          ? {
              ...table,
              columns: [...table.columns, `Column ${table.columns.length + 1}`],
              rows: table.rows.map((row) => ({
                ...row,
                cells: [...row.cells, ""],
              })),
            }
          : table
      )
    );
  }

  function removeColumn(tableId: string, columnIndex: number) {
    onDataTablesChange(
      dataTables.map((table) =>
        table.id === tableId && table.columns.length > 1
          ? {
              ...table,
              columns: table.columns.filter((_, index) => index !== columnIndex),
              rows: table.rows.map((row) => ({
                ...row,
                cells: row.cells.filter((_, index) => index !== columnIndex),
              })),
            }
          : table
      )
    );
  }

  return (
    <section className="flex-details-editor">
      <div className="flex-editor-heading">
        <div>
          <h3>{sectionLabel}</h3>
          <p>
            Add only the sections you need. Empty sections stay hidden on the
            public page.
          </p>
        </div>
      </div>

      <details open>
        <summary>Multiple detail boxes</summary>
        <div className="flex-editor-body">
          {detailSections.map((section, sectionIndex) => (
            <div className="flex-editor-card" key={section.id}>
              <div className="flex-editor-card-head">
                <strong>Detail Box {sectionIndex + 1}</strong>
                <button
                  type="button"
                  className="danger"
                  onClick={() =>
                    onDetailSectionsChange(
                      detailSections.filter((item) => item.id !== section.id)
                    )
                  }
                >
                  Remove
                </button>
              </div>

              <input
                value={section.title}
                onChange={(event) =>
                  updateSection(section.id, "title", event.target.value)
                }
                placeholder="Section title, such as How to Apply"
              />
              <textarea
                value={section.content}
                onChange={(event) =>
                  updateSection(section.id, "content", event.target.value)
                }
                placeholder="Enter as much content as required"
                rows={5}
              />

              <div className="flex-image-list">
                {section.imageUrls.map((imageUrl, imageIndex) => (
                  <div className="flex-image-row" key={imageIndex}>
                    <div>
                      <input
                        value={imageUrl}
                        onChange={(event) =>
                          updateSectionImage(
                            section.id,
                            imageIndex,
                            event.target.value
                          )
                        }
                        placeholder="Image URL"
                      />
                      {imageUrl.trim() ? (
                        <img
                          src={imageUrl.trim()}
                          alt={`Detail preview ${imageIndex + 1}`}
                        />
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        onDetailSectionsChange(
                          detailSections.map((item) =>
                            item.id === section.id
                              ? {
                                  ...item,
                                  imageUrls: item.imageUrls.filter(
                                    (_, index) => index !== imageIndex
                                  ),
                                }
                              : item
                          )
                        )
                      }
                    >
                      Remove image
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex-editor-actions">
                <button
                  type="button"
                  onClick={() =>
                    onDetailSectionsChange(
                      detailSections.map((item) =>
                        item.id === section.id
                          ? { ...item, imageUrls: [...item.imageUrls, ""] }
                          : item
                      )
                    )
                  }
                >
                  + Add image link
                </button>
                <label className="upload-label">
                  {uploadingKey === section.id
                    ? "Uploading…"
                    : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={Boolean(uploadingKey)}
                    onChange={(event) =>
                      uploadImage(
                        event.target.files?.[0],
                        section.id,
                        (url) =>
                          onDetailSectionsChange(
                            detailSections.map((item) =>
                              item.id === section.id
                                ? {
                                    ...item,
                                    imageUrls: [...item.imageUrls, url],
                                  }
                                : item
                            )
                          )
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="primary"
            onClick={() =>
              onDetailSectionsChange([
                ...detailSections,
                createFlexibleDetailSection(),
              ])
            }
          >
            + Add detail box
          </button>
        </div>
      </details>

      <details>
        <summary>Multiple custom data tables</summary>
        <div className="flex-editor-body">
          {dataTables.map((table, tableIndex) => (
            <div className="flex-editor-card" key={table.id}>
              <div className="flex-editor-card-head">
                <strong>Data Table {tableIndex + 1}</strong>
                <button
                  type="button"
                  className="danger"
                  onClick={() =>
                    onDataTablesChange(
                      dataTables.filter((item) => item.id !== table.id)
                    )
                  }
                >
                  Remove table
                </button>
              </div>

              <input
                value={table.title}
                onChange={(event) =>
                  updateTable(table.id, "title", event.target.value)
                }
                placeholder="Table title"
              />

              <div>
                <input
                  value={table.imageUrl}
                  onChange={(event) =>
                    updateTable(table.id, "imageUrl", event.target.value)
                  }
                  placeholder="Optional image URL (shown below title and above table)"
                />
                {table.imageUrl.trim() ? (
                  <img
                    className="flex-table-image-preview"
                    src={table.imageUrl.trim()}
                    alt={`${table.title || "Table"} preview`}
                  />
                ) : null}
                <label className="upload-label table-upload">
                  {uploadingKey === table.id
                    ? "Uploading…"
                    : "Upload table image"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={Boolean(uploadingKey)}
                    onChange={(event) =>
                      uploadImage(
                        event.target.files?.[0],
                        table.id,
                        (url) => updateTable(table.id, "imageUrl", url)
                      )
                    }
                  />
                </label>
              </div>

              <div className="flex-table-scroll">
                <table>
                  <thead>
                    <tr>
                      {table.columns.map((column, columnIndex) => (
                        <th key={columnIndex}>
                          <input
                            value={column}
                            onChange={(event) =>
                              updateColumn(
                                table.id,
                                columnIndex,
                                event.target.value
                              )
                            }
                            placeholder={`Column ${columnIndex + 1}`}
                          />
                          {table.columns.length > 1 ? (
                            <button
                              type="button"
                              className="danger compact"
                              onClick={() =>
                                removeColumn(table.id, columnIndex)
                              }
                            >
                              ×
                            </button>
                          ) : null}
                        </th>
                      ))}
                      <th aria-label="Row action" />
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={row.id}>
                        {table.columns.map((_, cellIndex) => (
                          <td key={cellIndex}>
                            <textarea
                              value={row.cells[cellIndex] || ""}
                              onChange={(event) =>
                                updateCell(
                                  table.id,
                                  row.id,
                                  cellIndex,
                                  event.target.value
                                )
                              }
                              rows={2}
                            />
                          </td>
                        ))}
                        <td>
                          <button
                            type="button"
                            className="danger compact"
                            onClick={() =>
                              onDataTablesChange(
                                dataTables.map((item) =>
                                  item.id === table.id
                                    ? {
                                        ...item,
                                        rows: item.rows.filter(
                                          (candidate) =>
                                            candidate.id !== row.id
                                        ),
                                      }
                                    : item
                                )
                              )
                            }
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex-editor-actions">
                <button
                  type="button"
                  onClick={() =>
                    onDataTablesChange(
                      dataTables.map((item) =>
                        item.id === table.id
                          ? {
                              ...item,
                              rows: [
                                ...item.rows,
                                createFlexibleTableRow(item.columns.length),
                              ],
                            }
                          : item
                      )
                    )
                  }
                >
                  + Add row
                </button>
                <button
                  type="button"
                  disabled={table.columns.length >= 6}
                  onClick={() => addColumn(table.id)}
                >
                  + Add column
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="primary"
            onClick={() =>
              onDataTablesChange([...dataTables, createFlexibleDataTable()])
            }
          >
            + Add data table
          </button>
        </div>
      </details>

      {uploadError ? (
        <p className="flex-upload-error">{uploadError}</p>
      ) : null}

      <style jsx>{`
        .flex-details-editor {
          overflow: hidden;
          border: 1px solid #dbe3ee;
          border-radius: 18px;
          background: #ffffff;
        }
        .flex-editor-heading {
          padding: 15px 16px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        h3,
        p {
          margin: 0;
        }
        h3 {
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
        }
        p {
          margin-top: 5px;
          color: #64748b;
          font-size: 13px;
        }
        details {
          border-bottom: 1px solid #e2e8f0;
        }
        details:last-of-type {
          border-bottom: 0;
        }
        summary {
          padding: 14px 16px;
          color: #0f172a;
          font-weight: 900;
          cursor: pointer;
        }
        .flex-editor-body {
          display: grid;
          gap: 14px;
          padding: 0 16px 16px;
        }
        .flex-editor-card {
          display: grid;
          gap: 10px;
          padding: 13px;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          background: #f8fafc;
        }
        .flex-editor-card-head,
        .flex-editor-actions,
        .flex-image-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        input,
        textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 9px 10px;
          background: #ffffff;
          color: #0f172a;
          font: inherit;
          resize: vertical;
        }
        input[type="file"] {
          display: none;
        }
        button {
          width: fit-content;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 8px 11px;
          background: #ffffff;
          color: #1d4ed8;
          font-weight: 800;
          cursor: pointer;
        }
        button.primary {
          border-color: #2563eb;
          background: #2563eb;
          color: #ffffff;
        }
        button.danger {
          border-color: #fecaca;
          background: #fff1f2;
          color: #be123c;
        }
        button.compact {
          padding: 4px 8px;
        }
        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
        .upload-label {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          min-height: 36px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 8px 11px;
          background: #ffffff;
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .table-upload {
          margin-top: 8px;
        }
        .flex-upload-error {
          margin: 0 16px 16px;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 800;
        }
        .flex-image-list {
          display: grid;
          gap: 10px;
        }
        .flex-image-row > div {
          flex: 1 1 280px;
        }
        .flex-image-row img,
        .flex-table-image-preview {
          display: block;
          width: min(100%, 520px);
          max-height: 260px;
          margin-top: 8px;
          object-fit: contain;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
        }
        .flex-table-scroll {
          overflow-x: auto;
        }
        table {
          width: 100%;
          min-width: 560px;
          border-collapse: collapse;
        }
        th,
        td {
          min-width: 150px;
          padding: 7px;
          border: 1px solid #dbe3ee;
          vertical-align: top;
        }
        th:last-child,
        td:last-child {
          width: 46px;
          min-width: 46px;
          text-align: center;
        }
        th {
          background: #eff6ff;
        }
      `}</style>
    </section>
  );
}
