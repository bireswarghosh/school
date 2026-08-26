"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { useApi } from "@/lib/use-api";

const subjectTypes = ["Theory", "Practical", "Both"];

const initialGroups = [
  { id: 1, name: "Core Subjects" },
  { id: 2, name: "Languages" },
  { id: 3, name: "Electives" },
];

type SubjectItem = { id: number; name: string; code: string; type: string; groupId: number }

export default function SubjectsPage() {
  const { data: subjects, add, update, remove } = useApi<SubjectItem>("/api/academics/subject");
  const [form, setForm] = useState({ name: "", code: "", type: "Theory", groupId: initialGroups[0].id });
  const [editing, setEditing] = useState<SubjectItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSaveAdd = async () => {
    if (!form.name.trim() || !form.code.trim()) return;
    await add({ name: form.name.trim(), code: form.code.trim(), type: form.type, groupId: form.groupId });
    setForm({ name: "", code: "", type: "Theory", groupId: initialGroups[0].id });
  };

  const handleEdit = (item: SubjectItem) => {
    setEditing(item);
    setForm({ name: item.name, code: item.code, type: item.type, groupId: item.groupId });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!form.name.trim() || !form.code.trim()) return;
    await update(editing!.id, { name: form.name.trim(), code: form.code.trim(), type: form.type, groupId: form.groupId });
    setShowModal(false);
    setEditing(null);
    setForm({ name: "", code: "", type: "Theory", groupId: initialGroups[0].id });
  };

  const handleDelete = async (id: number) => {
    await remove(id);
  };

  const getGroupName = (groupId: number) => {
    const group = initialGroups.find((g) => g.id === groupId);
    return group ? group.name : "-";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Subjects</h1>
        <p className="mt-1 text-sm text-white/80">Manage academic subjects</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[var(--title-color)]">Add Subject</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter subject name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Enter subject code"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                {subjectTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Group</label>
              <select
                value={form.groupId}
                onChange={(e) => setForm({ ...form, groupId: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                {initialGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
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
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Name</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Code</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Type</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Group</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Action</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, idx) => (
                <tr
                  key={subject.id}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--title-color)]">{subject.name}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{subject.code}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{subject.type}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{getGroupName(subject.groupId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
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
          {subjects.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">
              No subjects found
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--title-color)]">Edit Subject</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {subjectTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Group</label>
                <select
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {initialGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
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
