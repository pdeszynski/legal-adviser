"use client";

import { useTranslate, CrudFilter } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef, flexRender, HeaderGroup, Row, Cell, Header } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * Document Metadata type matching GraphQL DocumentMetadata
 */
interface DocumentMetadata {
  plaintiffName?: string;
  defendantName?: string;
  claimAmount?: number;
  claimCurrency?: string;
}

/**
 * Legal Document type matching GraphQL LegalDocument
 */
interface LegalDocument {
  id: string;
  title: string;
  type: string;
  status: string;
  sessionId: string;
  contentRaw?: string | null;
  metadata?: DocumentMetadata | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Document types for filtering
 */
const DOCUMENT_TYPES = ["LAWSUIT", "COMPLAINT", "CONTRACT", "OTHER"] as const;

/**
 * Document statuses for filtering
 */
const DOCUMENT_STATUSES = ["DRAFT", "GENERATING", "COMPLETED", "FAILED"] as const;

/**
 * Status color mapping for badges
 */
const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  GENERATING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function DocumentList() {
  const translate = useTranslate();

  // Filter state
  const [titleFilter, setTitleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPageSize, setCurrentPageSize] = useState(10);

  const columns = useMemo<ColumnDef<LegalDocument>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: () => translate("documents.fields.title"),
        cell: ({ getValue, row }) => (
          <Link
            href={`/documents/show/${row.original.id}`}
            className="text-blue-600 hover:underline font-medium"
          >
            {getValue() as string}
          </Link>
        ),
        enableSorting: true,
      },
      {
        id: "type",
        accessorKey: "type",
        header: () => translate("documents.fields.type"),
        cell: ({ getValue }) => (
          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
            {translate(`documents.types.${getValue()}`)}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: "status",
        accessorKey: "status",
        header: () => translate("documents.fields.status"),
        cell: ({ getValue }) => {
          const status = getValue() as string;
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100"}`}
            >
              {translate(`documents.statuses.${status}`)}
            </span>
          );
        },
        enableSorting: true,
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: () => translate("documents.fields.createdAt"),
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-gray-600">
              {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          );
        },
        enableSorting: true,
      },
      {
        id: "actions",
        header: () => translate("table.actions"),
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Link
              href={`/documents/show/${row.original.id}`}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              {translate("buttons.show")}
            </Link>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [translate]
  );

  // Build filters array for Refine
  const refineCoreFilters = useMemo<CrudFilter[]>(() => {
    const filters: CrudFilter[] = [];

    if (titleFilter) {
      filters.push({ field: "title", operator: "contains", value: titleFilter });
    }
    if (typeFilter) {
      filters.push({ field: "type", operator: "eq", value: typeFilter });
    }
    if (statusFilter) {
      filters.push({ field: "status", operator: "eq", value: statusFilter });
    }

    return filters;
  }, [titleFilter, typeFilter, statusFilter]);

  const { reactTable, refineCore } = useTable<LegalDocument>({
    columns,
    refineCoreProps: {
      resource: "documents",
      pagination: {
        pageSize: currentPageSize,
      },
      filters: {
        permanent: refineCoreFilters,
      },
      sorters: {
        initial: [{ field: "createdAt", order: "desc" }],
      },
    },
  });

  const { setCurrentPage, pageCount, currentPage, setFilters, setSorters, setPageSize } = refineCore;

  const sorting = reactTable.getState().sorting;

  // Handle sorting click on column headers
  const handleSort = (columnId: string) => {
    const currentSort = sorting.find((s) => s.id === columnId);

    if (!currentSort) {
      setSorters([{ field: columnId, order: "desc" }]);
    } else if (currentSort.desc) {
      setSorters([{ field: columnId, order: "asc" }]);
    } else {
      setSorters([]);
    }
  };

  // Get sort indicator for column
  const getSortIndicator = (columnId: string) => {
    const sort = sorting.find((s) => s.id === columnId);
    if (!sort) return null;
    return sort.desc ? " ↓" : " ↑";
  };

  // Handle filter clear
  const handleClearFilters = () => {
    setTitleFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setFilters([]);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setCurrentPageSize(newSize);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const hasActiveFilters = titleFilter || typeFilter || statusFilter;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {translate("documents.titles.list")}
          </h1>
        </div>
        <Link href="/documents/create">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            {translate("buttons.create")}
          </button>
        </Link>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Title Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translate("documents.fields.title")}
            </label>
            <input
              type="text"
              placeholder={translate("common.search")}
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translate("documents.fields.type")}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{translate("common.all")}</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {translate(`documents.types.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translate("documents.fields.status")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{translate("common.all")}</option>
              {DOCUMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {translate(`documents.statuses.${status}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              {translate("buttons.clear")}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {reactTable.getHeaderGroups().map((headerGroup: HeaderGroup<LegalDocument>) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header: Header<LegalDocument, unknown>) => {
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          canSort ? "cursor-pointer hover:bg-gray-100 select-none" : ""
                        }`}
                        onClick={() => canSort && handleSort(header.id)}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <span className="text-blue-600">
                              {getSortIndicator(header.id) || " ↕"}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reactTable.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {translate("table.noData")}
                  </td>
                </tr>
              ) : (
                reactTable.getRowModel().rows.map((row: Row<LegalDocument>) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map((cell: Cell<LegalDocument, unknown>) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            {translate("table.page", { current: currentPage || 1, total: pageCount || 1 })}
          </span>
          <select
            value={currentPageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((currentPage || 1) - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            {translate("buttons.previous")}
          </button>

          {/* Page numbers */}
          <div className="hidden sm:flex gap-1">
            {Array.from({ length: Math.min(pageCount || 1, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 border rounded-md transition-colors ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white border-blue-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((currentPage || 1) + 1)}
            disabled={currentPage === pageCount || pageCount === 0}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            {translate("buttons.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
