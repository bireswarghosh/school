"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Save, Loader2 } from "lucide-react";
import { useApi } from "@/lib/use-api";

type ClassItem = { id: number; name: string }
type SectionItem = { id: number; class_id: number; name: string }
type SubjectItem = { id: number; name: string; code: string; type: string }
type GroupSection = { id: number; section_id: number; class_id: number; class_name: string; section_name: string }
type GroupSubject = { id: number; subject_id: number; name: string; code: string; type: string }
type SubjectGroup = {
  id: number
  name: string
  description: string
  sections: GroupSection[]
  subjects: GroupSubject[]
}

const classRank = (name: string): number => {
  const s = name.toLowerCase()
  const roman: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 }
  const digits = s.match(/(\d+)/)
  if (digits) return parseInt(digits[1], 10)
  const word = s.split(" ")[0]?.trim()
  if (word && roman[word]) return roman[word]
  return 0
}

export default function SubjectGroupPage() {
  const { data: groups, loading, add, update, remove, refetch } = useApi<SubjectGroup>("/api/academics/subject-group");
  const { data: classes } = useApi<ClassItem>("/api/academics/class");
  const { data: sections } = useApi<SectionItem>("/api/academics/section");
  const { data: subjects } = useApi<SubjectItem>("/api/academics/subject");

  const [editing, setEditing] = useState<SubjectGroup | null>(null);
  const [form, setForm] = useState({
    name: "",
    classId: "" as string,
    sectionIds: [] as number[],
    subjectIds: [] as number[],
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => classRank(a.name) - classRank(b.name) || a.name.localeCompare(b.name)),
    [classes]
  );

  const classSections = useMemo(
    () =>
      sections
        .filter((s) => Number(form.classId) === s.class_id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [sections, form.classId]
  );

  const toggleId = (list: number[], id: number) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const resetForm = () =>
    setForm({ name: "", classId: "", sectionIds: [], subjectIds: [], description: "" });

  const handleEdit = (item: SubjectGroup) => {
    const firstSection = item.sections[0];
    setEditing(item);
    setForm({
      name: item.name,
      classId: firstSection ? String(firstSection.class_id) : "",
      sectionIds: item.sections.map((s) => s.section_id),
      subjectIds: item.subjects.map((s) => s.subject_id),
      description: item.description,
    });
    setError("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Group name is required";
    if (!form.classId) return "Please select a class";
    if (form.sectionIds.length === 0) return "Select at least one section";
    if (form.subjectIds.length === 0) return "Select at least one subject";
    return "";
  };

  const handleSave = async () => {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      classId: Number(form.classId),
      sectionIds: form.sectionIds,
      subjectIds: form.subjectIds,
    };
    try {
      if (editing) {
        await update(editing.id, payload);
      } else {
        await add(payload);
      }
      await refetch();
      resetForm();
      setEditing(null);
    } catch (e: any) {
      setError(e.message || "Failed to save subject group");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove(id);
    } catch (e: any) {
      setError(e.message || "Failed to delete subject group");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Subject Group</h1>
        <p className="mt-1 text-sm text-white/80">Create groups of subjects and assign them to class sections</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[var(--title-color)]">
            {editing ? "Edit Subject Group" : "Add Subject Group"}
          </h2>
          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); if (error) setError(""); }}
                placeholder="e.g., Main Subjects"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={form.classId}
                onChange={(e) => {
                  setForm({ ...form, classId: e.target.value, sectionIds: [] });
                  if (error) setError("");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">Select</option>
                {sortedClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Sections <span className="text-red-500">*</span>
              </label>
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                {!form.classId ? (
                  <p className="text-xs text-gray-400">Select a class to load its sections.</p>
                ) : classSections.length === 0 ? (
                  <p className="text-xs text-gray-400">No sections found for this class.</p>
                ) : (
                  <div className="space-y-1.5">
                    {classSections.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.sectionIds.includes(s.id)}
                          onChange={() => setForm({ ...form, sectionIds: toggleId(form.sectionIds, s.id) })}
                          className="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Subject <span className="text-red-500">*</span>
              </label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                {subjects.length === 0 ? (
                  <p className="text-xs text-gray-400">No subjects found.</p>
                ) : (
                  <div className="space-y-1.5">
                    {subjects.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.subjectIds.includes(s.id)}
                          onChange={() => setForm({ ...form, subjectIds: toggleId(form.subjectIds, s.id) })}
                          className="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter ..."
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            {editing && (
              <button
                onClick={() => { setEditing(null); resetForm(); setError(""); }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editing ? "Update" : "Save"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <h3 className="text-sm font-semibold text-[var(--title-color)]">Subject Group List</h3>
            <span className="text-xs text-gray-400">{groups.length} groups</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Class-Section</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Subject</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--title-color)]">Action</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group, idx) => (
                  <tr
                    key={group.id}
                    className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--title-color)]">{group.name}</p>
                      {group.description ? (
                        <p className="mt-0.5 text-xs text-gray-400">{group.description}</p>
                      ) : (
                        <p className="mt-0.5 text-xs text-red-400">No description</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {group.sections.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <div className="space-y-0.5">
                          {group.sections.map((s) => (
                            <div key={s.id} className="text-[var(--foreground)]">
                              {s.class_name} - {s.section_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {group.subjects.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <div className="space-y-0.5">
                          {group.subjects.map((s) => (
                            <div key={s.id} className="text-[var(--foreground)]">{s.name}</div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(group)}
                          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(group.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">Loading…</div>
          ) : groups.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">
              No subject groups found. Add a group to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
