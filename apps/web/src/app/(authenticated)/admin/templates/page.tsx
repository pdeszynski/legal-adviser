'use client';

import { useState } from 'react';
import { useList, useTranslate } from '@refinedev/core';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TemplateCategory } from '@/components/template-editor';

interface DocumentTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  content: string;
  variables: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
  }>;
  conditionalSections?: Array<{
    id: string;
    condition: string;
    description?: string;
  }>;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const categoryColors: Record<string, string> = {
  LAWSUIT: 'bg-red-100 text-red-800',
  COMPLAINT: 'bg-orange-100 text-orange-800',
  CONTRACT: 'bg-blue-100 text-blue-800',
  MOTION: 'bg-purple-100 text-purple-800',
  LETTER: 'bg-green-100 text-green-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export default function AdminTemplatesPage() {
  const translate = useTranslate();
  const router = useRouter();
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { query, result } = useList<DocumentTemplate>({
    resource: 'documentTemplates',
    pagination: {
      pageSize: 100,
    },
    sorters: [
      {
        field: 'updatedAt',
        order: 'desc',
      },
    ],
  });

  const { data, isLoading, error } = query;

  const filteredTemplates =
    result?.data?.filter((template) => {
      const matchesSearch =
        !searchFilter ||
        template.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesCategory = !categoryFilter || template.category === categoryFilter;

      return matchesSearch && matchesCategory;
    }) || [];

  const categories = Array.from(new Set(result?.data?.map((t) => t.category) || []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Management</h1>
          <p className="text-gray-600 mt-1">Create and manage document templates</p>
        </div>
        <Link
          href="/admin/templates/new"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Template
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {Object.values(TemplateCategory).map((category) => (
                <option key={category} value={category}>
                  {translate(`templates.categories.${category}`) || category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load templates</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchFilter || categoryFilter
              ? 'No templates match your filters'
              : 'No templates yet. Create your first template!'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variables
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    {template.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {template.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        categoryColors[template.category] || categoryColors.OTHER
                      }`}
                    >
                      {translate(`templates.categories.${template.category}`) || template.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {template.variables.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {template.usageCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        template.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      href={`/admin/templates/${template.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/templates/${template.id}/preview`}
                      className="text-green-600 hover:text-green-900"
                    >
                      Preview
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
