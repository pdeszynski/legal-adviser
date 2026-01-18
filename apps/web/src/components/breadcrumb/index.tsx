'use client';

import { useBreadcrumb } from '@refinedev/core';
import Link from 'next/link';

export const Breadcrumb = () => {
  const { breadcrumbs } = useBreadcrumb();

  // If no breadcrumbs (e.g. dashboard), return null or empty
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((breadcrumb, index) => {
          return (
            <li key={`breadcrumb-${index}`} className="inline-flex items-center">
              {breadcrumb.href ? (
                <Link
                  href={breadcrumb.href}
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
                >
                  {breadcrumb.icon}
                  {breadcrumb.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {breadcrumb.icon}
                  {breadcrumb.label}
                </span>
              )}
              {index !== breadcrumbs.length - 1 && (
                <svg
                  className="w-3 h-3 text-gray-400 mx-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
