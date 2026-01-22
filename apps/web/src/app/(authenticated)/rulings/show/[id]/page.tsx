"use client";

import { useOne, useTranslate } from "@refinedev/core";
import { useParams } from "next/navigation";
import Link from "next/link";

interface RulingMetadata {
  legalArea?: string;
  relatedCases?: string[];
  keywords?: string[];
  sourceReference?: string;
  [key: string]: unknown;
}

interface LegalRuling {
  id: string;
  signature: string;
  courtName: string;
  courtType: string;
  rulingDate: string;
  summary: string | null;
  fullText: string | null;
  metadata: RulingMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export default function RulingShow() {
  const translate = useTranslate();
  const params = useParams();
  const id = params?.id as string;

  const { query, result } = useOne<LegalRuling>({
    resource: "legalRulings",
    id,
  });

  const isLoading = query.isLoading;
  const ruling = result;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">{translate("loading")}</div>
      </div>
    );
  }

  if (!ruling) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-red-600">Ruling not found</div>
      </div>
    );
  }

  const courtTypeLabels: Record<string, string> = {
    SUPREME_COURT: "Supreme Court",
    APPELLATE_COURT: "Appellate Court",
    REGIONAL_COURT: "Regional Court",
    DISTRICT_COURT: "District Court",
    ADMINISTRATIVE_COURT: "Administrative Court",
    CONSTITUTIONAL_TRIBUNAL: "Constitutional Tribunal",
    OTHER: "Other",
  };

  const handleExportPdf = async () => {
    try {
      const response = await fetch("/api/export/ruling/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: ruling.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ruling-${ruling.signature}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export ruling as PDF");
    }
  };

  const handleExportTxt = () => {
    const content = `
${ruling.signature}
${ruling.courtName}
${new Date(ruling.rulingDate).toLocaleDateString()}

${ruling.summary ? "SUMMARY\n" + ruling.summary + "\n\n" : ""}${ruling.fullText ? "FULL TEXT\n" + ruling.fullText : ""}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ruling-${ruling.signature}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/rulings"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to rulings
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{ruling.signature}</h1>
            <div className="flex gap-3 items-center">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {courtTypeLabels[ruling.courtType] || ruling.courtType}
              </span>
              <span className="text-gray-600">{ruling.courtName}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPdf}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
              title="Export as PDF"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              PDF
            </button>
            <button
              onClick={handleExportTxt}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
              title="Export as Text"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              TXT
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Ruling Details */}
        <div className="grid grid-cols-2 gap-4 border-b pb-4">
          <div>
            <label className="text-sm font-medium text-gray-500">
              Signature
            </label>
            <p className="text-sm text-gray-900 font-semibold">
              {ruling.signature}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Court
            </label>
            <p className="text-sm text-gray-900">{ruling.courtName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Court Type
            </label>
            <p className="text-sm text-gray-900">
              {courtTypeLabels[ruling.courtType] || ruling.courtType}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Ruling Date
            </label>
            <p className="text-sm text-gray-900">
              {new Date(ruling.rulingDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">ID</label>
            <p className="text-sm text-gray-900 break-all">{ruling.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Last Updated
            </label>
            <p className="text-sm text-gray-900">
              {new Date(ruling.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Metadata */}
        {ruling.metadata && Object.keys(ruling.metadata).length > 0 && (
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">Metadata</h2>
            <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-md">
              {ruling.metadata.legalArea && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Legal Area
                  </label>
                  <p className="text-sm text-gray-900">
                    {ruling.metadata.legalArea}
                  </p>
                </div>
              )}
              {ruling.metadata.keywords &&
                ruling.metadata.keywords.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Keywords
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {ruling.metadata.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              {ruling.metadata.relatedCases &&
                ruling.metadata.relatedCases.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Related Cases
                    </label>
                    <ul className="list-disc list-inside text-sm text-gray-900 mt-1">
                      {ruling.metadata.relatedCases.map(
                        (relatedCase, index) => (
                          <li key={index}>{relatedCase}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              {ruling.metadata.sourceReference && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Source
                  </label>
                  <p className="text-sm text-gray-900 break-all">
                    {ruling.metadata.sourceReference}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {ruling.summary && (
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">Summary</h2>
            <div className="prose max-w-none bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {ruling.summary}
              </p>
            </div>
          </div>
        )}

        {/* Full Text */}
        {ruling.fullText && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Full Text</h2>
            <div className="prose max-w-none bg-gray-50 p-4 rounded-md max-h-screen overflow-y-auto">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {ruling.fullText}
              </p>
            </div>
          </div>
        )}

        {/* No content warning */}
        {!ruling.summary && !ruling.fullText && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800 text-sm">
              No content available for this ruling.
            </p>
          </div>
        )}
      </div>

      {/* Related Rulings Section */}
      {ruling.metadata?.relatedCases && ruling.metadata.relatedCases.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Related Rulings</h2>
          <div className="space-y-2">
            {ruling.metadata.relatedCases.map((relatedCase, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <span className="text-sm text-gray-900">{relatedCase}</span>
                <Link
                  href={`/rulings?q=${encodeURIComponent(relatedCase)}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View similar →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
