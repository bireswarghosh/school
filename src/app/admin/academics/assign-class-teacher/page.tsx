"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useClassesAndSections } from "@/lib/use-classes-sections";

type StaffLite = { id: number; name: string; surname?: string; role: string }

type Assignment = { id: number; class: number; section: string; teacher: string }

export default function AssignClassTeacherPage() {
  const { data: assignments, add, update, remove } = useApi<Assignment>("/api/academics/class-teacher");
  const { data: staffData } = useApi<StaffLite>("/api/human-resource/staff");
  const { classes, sectionsOf } = useClassesAndSections();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  // teachers from staff-directory (role Teacher)
  const teachers = ((): string[] => {
    const all = (staffData || []) as any[];
    const filtered = all.filter((s: any) => String(s.role || "").trim().toLowerCase() === "teacher");
    const names = filtered.map((s: any) => `${s.name || ""}${s.surname ? " " + s.surname : ""}`.trim()).filter(Boolean);
    return Array.from(new Set(names)).sort((a,b)=>a.localeCompare(b));
  })();
  const [form, setForm] = useState({ class: 0, section: "", teacher: "" });

  const className = (id: number) => classes.find((c) => c.id === id)?.name ?? `Class ${id}`;
  const defaultForm = () => {
    const first = classes[0];
    const t = teachers[0] || "";
    return first
      ? { class: first.id, section: sectionsOf(first.id)[0]?.name ?? "", teacher: t }
      : { class: 0, section: "", teacher: t };
  };

  const handleSave = async () => {
    if (editing) {
      await update(editing.id, form);
    } else {
      await add(form);
    }
    setShowModal(false);
    setEditing(null);
    setForm(defaultForm());
  };

  const handleEdit = (item: Assignment) => {
    setEditing(item);
    setForm({ class: item.class, section: item.section, teacher: item.teacher });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    await remove(id);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(defaultForm());
    setShowModal(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Assign Class Teacher</h1>
        <p className="mt-1 text-sm text-white/80">Manage class teacher assignments</p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Assignment
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">#</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Class</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Section</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Teacher</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((item, idx) => (
              <tr
                key={item.id}
                className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{className(item.class)}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.section}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.teacher}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
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
        {assignments.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">
            No assignments found
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--title-color)]">
                {editing ? "Edit Assignment" : "Add Assignment"}
              </h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Class</label>
                <select
                  value={form.class}
                  onChange={(e) => {
                    const classId = Number(e.target.value);
                    setForm({ ...form, class: classId, section: sectionsOf(classId)[0]?.name ?? "" });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Section</label>
                <select
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {sectionsOf(form.class).map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Teacher</label>
                <select
                  value={form.teacher}
                  onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {teachers.length === 0 && <p className="text-xs text-amber-600 mt-1">No teachers in staff directory — add staff with role Teacher first</p>}
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
                onClick={handleSave}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {editing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
