"use client";

import { useTranslate } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef, flexRender } from "@tanstack/react-table";
import Link from "next/link";

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

export default function DocumentList() {
  const translate = useTranslate();

  const columns: ColumnDef<LegalDocument>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: translate("documents.fields.title"),
      cell: ({ getValue, row }) => (
        <Link
          href={`/documents/show/${row.original.id}`}
          className="text-blue-600 hover:underline"
        >
          {getValue() as string}
        </Link>
      ),
    },
    {
      id: "type",
      accessorKey: "type",
      header: translate("documents.fields.type"),
      cell: ({ getValue }) => translate(`documents.types.${getValue()}`),
    },
    {
      id: "status",
      accessorKey: "status",
      header: translate("documents.fields.status"),
      cell: ({ getValue }) => {
        const status = getValue() as string;
        const statusColors = {
          DRAFT: "bg-gray-100 text-gray-800",
          GENERATING: "bg-blue-100 text-blue-800",
          COMPLETED: "bg-green-100 text-green-800",
          FAILED: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || "bg-gray-100"}`}
          >
            {translate(`documents.statuses.${status}`)}
          </span>
        );
      },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: translate("documents.fields.createdAt"),
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
      id: "actions",
      header: translate("table.actions"),
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Link
            href={`/documents/show/${row.original.id}`}
            className="text-blue-600 hover:underline text-sm"
          >
            {translate("buttons.show")}
          </Link>
        </div>
      ),
    },
  ];

  const {
    getHeaderGroups,
    getRowModel,
    refineCore: { setCurrent, pageCount, current },
  } = useTable<LegalDocument>({
    columns,
    refineCoreProps: {
      resource: "documents",
    },
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {translate("documents.titles.list")}
          </h1>
        </div>
        <Link href="/documents/create">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {translate("buttons.create")}
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setCurrent((current || 1) - 1)}
          disabled={current === 1}
          className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          {translate("buttons.previous", "Previous")}
        </button>
        <span className="text-sm text-gray-700">
          Page {current} of {pageCount}
        </span>
        <button
          onClick={() => setCurrent((current || 1) + 1)}
          disabled={current === pageCount}
          className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          {translate("buttons.next", "Next")}
        </button>
      </div>
    </div>
  );
}
