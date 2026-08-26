"use client";

import { useState } from "react";
import { Search, Eye, Download, X } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useClassesAndSections } from "@/lib/use-classes-sections";

const contentTypeOptions = ["All", "Assignment", "Study Material", "Syllabus", "Other"];
const subjectOptions = ["All", "Mathematics", "Science", "English", "Hindi", "Social Studies", "Sanskrit"];

type SharedContent = {
  id: number;
  title: string;
  contentType: string;
  className: string;
  subject: string;
  date: string;
  file: string;
  sharedBy: string;
  description: string;
};

export default function ContentShareListPage() {
  const { classNames } = useClassesAndSections();
  const classOptions = ["All", ...classNames];
  const { data: items, loading } = useApi<SharedContent>("/api/download-center/content");
  const [filterType, setFilterType] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [viewItem, setViewItem] = useState<SharedContent | null>(null);

  const handleSearch = () => {};

  const filteredItems = items.filter((item) => {
    if (filterType !== "All" && item.contentType !== filterType) return false;
    if (filterClass !== "All" && item.className !== filterClass) return false;
    if (filterSubject !== "All" && item.subject !== filterSubject) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Content Share List</h1>
        <p className="mt-1 text-sm text-white/80">View shared educational content</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Content Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {contentTypeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {classOptions.map((c) => (
                <option key={c} value={c}>{c === "All" ? "All" : `Class ${c}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {subjectOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">#</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Title</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Type</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Class</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Subject</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Date</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">File</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Shared By</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, idx) => (
              <tr
                key={item.id}
                className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-[var(--title-color)]">{item.title}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.contentType}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.className}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.subject}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.date}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.file}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.sharedBy}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewItem(item)}
                      className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">No content found</div>
        )}
      </div>

      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--title-color)]">{viewItem.title}</h2>
              <button onClick={() => setViewItem(null)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-[var(--title-color)]">Content Type:</span>
                  <p className="text-[var(--foreground)]">{viewItem.contentType}</p>
                </div>
                <div>
                  <span className="font-medium text-[var(--title-color)]">Class:</span>
                  <p className="text-[var(--foreground)]">{viewItem.className}</p>
                </div>
                <div>
                  <span className="font-medium text-[var(--title-color)]">Subject:</span>
                  <p className="text-[var(--foreground)]">{viewItem.subject}</p>
                </div>
                <div>
                  <span className="font-medium text-[var(--title-color)]">Date:</span>
                  <p className="text-[var(--foreground)]">{viewItem.date}</p>
                </div>
                <div>
                  <span className="font-medium text-[var(--title-color)]">File:</span>
                  <p className="text-[var(--foreground)]">{viewItem.file}</p>
                </div>
                <div>
                  <span className="font-medium text-[var(--title-color)]">Shared By:</span>
                  <p className="text-[var(--foreground)]">{viewItem.sharedBy}</p>
                </div>
              </div>
              <div>
                <span className="font-medium text-[var(--title-color)]">Description:</span>
                <p className="mt-1 text-[var(--foreground)]">{viewItem.description}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewItem(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
