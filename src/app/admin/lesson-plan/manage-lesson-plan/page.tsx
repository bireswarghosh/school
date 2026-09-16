"use client";

import { useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useClassesAndSections } from "@/lib/use-classes-sections";

const subjectOptions = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Sanskrit"];
const lessonOptions = ["Algebra", "Geometry", "Motions & Forces", "Grammar Basics", "World History"];
const statusOptions = ["Started", "Completed", "Pending"];

type LessonPlan = {
  id: number;
  lesson: string;
  topic: string;
  startDate: string;
  endDate: string;
  status: string;
};

type LessonForm = {
  lesson: string;
  topic: string;
  startDate: string;
  endDate: string;
  description: string;
  status: string;
};

const emptyForm: LessonForm = {
  lesson: lessonOptions[0],
  topic: "",
  startDate: "",
  endDate: "",
  description: "",
  status: "Pending",
};

export default function ManageLessonPlanPage() {
  const { classes, sectionsOf } = useClassesAndSections();
  const { data: plans, add, update, remove, loading } = useApi<LessonPlan>("/api/lesson-plan/lesson-plan");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("Mathematics");
  const [form, setForm] = useState<LessonForm>(emptyForm);
  const [editing, setEditing] = useState<LessonPlan | null>(null);
  const [showModal, setShowModal] = useState(false);

  const sectionOptions = filterClass ? sectionsOf(parseInt(filterClass)) : [];

  const handleSearch = () => {};

  const handleSaveAdd = async () => {
    if (!form.topic.trim()) return;
    await add({ lesson: form.lesson, topic: form.topic.trim(), startDate: form.startDate, endDate: form.endDate, status: form.status });
    setForm(emptyForm);
  };

  const handleEdit = (item: LessonPlan) => {
    setEditing(item);
    setForm({ lesson: item.lesson, topic: item.topic, startDate: item.startDate, endDate: item.endDate, description: "", status: item.status });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!form.topic.trim()) return;
    await update(editing!.id, { lesson: form.lesson, topic: form.topic.trim(), startDate: form.startDate, endDate: form.endDate, status: form.status });
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: number) => {
    await remove(id);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Started: "bg-blue-100 text-blue-700",
      Completed: "bg-green-100 text-green-700",
      Pending: "bg-yellow-100 text-yellow-700",
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
        <h1 className="text-xl font-semibold text-white">Manage Lesson Plan</h1>
        <p className="mt-1 text-sm text-white/80">Create and manage lesson plans</p>
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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--title-color)]">Lesson Plans</h2>
          <button
            onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Lesson Plan
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">#</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Lesson</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Topic</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Start Date</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">End Date</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Status</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan, idx) => (
              <tr
                key={plan.id}
                className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-[var(--title-color)]">{plan.lesson}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{plan.topic}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{plan.startDate}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{plan.endDate}</td>
                <td className="px-4 py-3">{statusBadge(plan.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {plans.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">No lesson plans found</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--title-color)]">
                {editing ? "Edit Lesson Plan" : "Add Lesson Plan"}
              </h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Lesson</label>
                <select
                  value={form.lesson}
                  onChange={(e) => setForm({ ...form, lesson: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {lessonOptions.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Topic</label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="Enter topic"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
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
                onClick={editing ? handleUpdate : handleSaveAdd}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                <Save className="h-4 w-4" />
                {editing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
