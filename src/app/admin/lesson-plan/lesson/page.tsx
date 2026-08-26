"use client";

import { useState } from "react";
import { Save, Pencil, Trash2, X } from "lucide-react";
import { useApi } from "@/lib/use-api";

const subjectGroupOptions = ["Core Subjects", "Languages", "Electives"];

type Lesson = {
  id: number;
  name: string;
  code: string;
  subjectGroup: string;
};

type LessonForm = {
  name: string;
  code: string;
  subjectGroup: string;
};

const emptyForm: LessonForm = { name: "", code: "", subjectGroup: subjectGroupOptions[0] };

export default function LessonPage() {
  const { data: lessons, add, update, remove, loading } = useApi<Lesson>("/api/lesson-plan/lesson");
  const [form, setForm] = useState<LessonForm>(emptyForm);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSaveAdd = async () => {
    if (!form.name.trim() || !form.code.trim()) return;
    await add({ name: form.name.trim(), code: form.code.trim(), subjectGroup: form.subjectGroup });
    setForm(emptyForm);
  };

  const handleEdit = (item: Lesson) => {
    setEditing(item);
    setForm({ name: item.name, code: item.code, subjectGroup: item.subjectGroup });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!form.name.trim() || !form.code.trim()) return;
    await update(editing!.id, { name: form.name.trim(), code: form.code.trim(), subjectGroup: form.subjectGroup });
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: number) => {
    await remove(id);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Lessons</h1>
        <p className="mt-1 text-sm text-white/80">Manage lesson definitions</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[var(--title-color)]">Add Lesson</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Lesson Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter lesson name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Lesson Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Enter lesson code"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Group</label>
              <select
                value={form.subjectGroup}
                onChange={(e) => setForm({ ...form, subjectGroup: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                {subjectGroupOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSaveAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">#</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Lesson Name</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Code</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Subject Group</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Action</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson, idx) => (
                <tr
                  key={lesson.id}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--title-color)]">{lesson.name}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{lesson.code}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{lesson.subjectGroup}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(lesson)}
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
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
          {lessons.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">No lessons found</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--title-color)]">Edit Lesson</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Lesson Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Lesson Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Group</label>
                <select
                  value={form.subjectGroup}
                  onChange={(e) => setForm({ ...form, subjectGroup: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {subjectGroupOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
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
                onClick={handleUpdate}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
