export type FlexibleDetailSection = {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
};

export type FlexibleTableRow = {
  id: string;
  cells: string[];
};

export type FlexibleDataTable = {
  id: string;
  title: string;
  imageUrl: string;
  columns: string[];
  rows: FlexibleTableRow[];
};

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function createFlexibleDetailSection(
  title = ""
): FlexibleDetailSection {
  return {
    id: makeId("detail"),
    title,
    content: "",
    imageUrls: [],
  };
}

export function createFlexibleTableRow(columnCount = 2): FlexibleTableRow {
  return {
    id: makeId("table_row"),
    cells: Array.from({ length: Math.max(1, columnCount) }, () => ""),
  };
}

export function createFlexibleDataTable(title = ""): FlexibleDataTable {
  return {
    id: makeId("table"),
    title,
    imageUrl: "",
    columns: ["Particulars", "Details"],
    rows: [createFlexibleTableRow(2)],
  };
}

export function normalizeFlexibleDetailSections(
  value: unknown
): FlexibleDetailSection[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item: any, index) => ({
      id: cleanText(item?.id) || makeId(`detail_${index}`),
      title: cleanText(item?.title || item?.heading || item?.label),
      content: cleanText(item?.content || item?.description || item?.details),
      imageUrls: Array.isArray(item?.imageUrls)
        ? item.imageUrls.map(cleanText).filter(Boolean)
        : [cleanText(item?.imageUrl)].filter(Boolean),
    }))
    .filter(
      (item) => item.title || item.content || item.imageUrls.length > 0
    );
}

export function cleanFlexibleDetailSections(
  value: FlexibleDetailSection[]
): FlexibleDetailSection[] {
  return normalizeFlexibleDetailSections(value);
}

export function normalizeFlexibleDataTables(
  value: unknown
): FlexibleDataTable[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((table: any, tableIndex) => {
      const columns = Array.isArray(table?.columns)
        ? table.columns.map(cleanText).filter(Boolean).slice(0, 6)
        : [];
      const safeColumns: string[] =
        columns.length > 0 ? columns : ["Particulars", "Details"];

      const rows = Array.isArray(table?.rows)
        ? table.rows
            .map((row: any, rowIndex: number) => {
              const sourceCells = Array.isArray(row?.cells)
                ? row.cells
                : safeColumns.map((column) => row?.[column] || "");

              return {
                id: cleanText(row?.id) || makeId(`table_${tableIndex}_${rowIndex}`),
                cells: safeColumns.map((_, cellIndex) =>
                  cleanText(sourceCells[cellIndex])
                ),
              };
            })
            .filter((row: FlexibleTableRow) =>
              row.cells.some((cell) => cell)
            )
        : [];

      return {
        id: cleanText(table?.id) || makeId(`table_${tableIndex}`),
        title: cleanText(table?.title || table?.heading),
        imageUrl: cleanText(table?.imageUrl || table?.image),
        columns: safeColumns,
        rows,
      };
    })
    .filter(
      (table) =>
        table.title ||
        table.imageUrl ||
        table.rows.length > 0
    );
}

export function cleanFlexibleDataTables(
  value: FlexibleDataTable[]
): FlexibleDataTable[] {
  return normalizeFlexibleDataTables(value);
}
