"use client";

import { useState } from "react";
import { Search, ArrowUpDown, X, Save } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useClassesAndSections } from "@/lib/use-classes-sections";

const subjectOptions = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Sanskrit"];

type SyllabusEntry = {
  id: number;
  subject: string;
  lesson: string;
  topic: string;
  status: string;
};

const statusOptions = ["Not Started", "In Progress", "Completed"];

const statusPercent: Record<string, number> = {
  "Not Started": 0,
  "In Progress": 50,
  "Completed": 100,
};

export default function ManageSyllabusStatusPage() {
  const { classes, sectionsOf } = useClassesAndSections();
  const { data: entries, update, loading } = useApi<SyllabusEntry>("/api/lesson-plan/syllabus-status");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("Mathematics");
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<SyllabusEntry | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const sectionOptions = filterClass ? sectionsOf(parseInt(filterClass)) : [];

  const handleSearch = () => {};

  const handleOpenUpdate = (entry: SyllabusEntry) => {
    setSelectedEntry(entry);
    setNewStatus(entry.status);
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedEntry) return;
    await update(selectedEntry.id, { status: newStatus });
    setShowModal(false);
    setSelectedEntry(null);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "Not Started": "bg-gray-100 text-gray-700",
      "In Progress": "bg-blue-100 text-blue-700",
      "Completed": "bg-green-100 text-green-700",
    };
    return (
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Manage Syllabus Status</h1>
        <p className="mt-1 text-sm text-white/80">Track and update syllabus completion status</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Class</label>
            <select
              value={filterClass}
              onChange={(e) => { setFilterClass(e.target.value); setFilterSection(""); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">Select</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              disabled={!filterClass}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
            >
              <option value="">Select</option>
              {sectionOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
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
              {subjectOptions.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
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
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Subject</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Lesson</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Topic</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Status</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Progress</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const pct = statusPercent[entry.status] || 0;
              return (
                <tr
                  key={entry.id}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--title-color)]">{entry.subject}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{entry.lesson}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{entry.topic}</td>
                  <td className="px-4 py-3">{statusBadge(entry.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct === 100 ? "bg-green-500" : pct === 50 ? "bg-blue-500" : "bg-gray-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--foreground)]">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleOpenUpdate(entry)}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      Update Status
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">No syllabus entries found</div>
        )}
      </div>

      {showModal && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--title-color)]">Update Status</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <p><span className="font-medium text-[var(--title-color)]">Subject:</span> {selectedEntry.subject}</p>
                <p><span className="font-medium text-[var(--title-color)]">Lesson:</span> {selectedEntry.lesson}</p>
                <p><span className="font-medium text-[var(--title-color)]">Topic:</span> {selectedEntry.topic}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                <Save className="h-4 w-4" />
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
