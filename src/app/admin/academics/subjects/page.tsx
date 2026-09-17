"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Save, Check } from "lucide-react";
import { useApi } from "@/lib/use-api";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const swal = Swal.mixin({
  customClass: {
    popup: "rounded-2xl shadow-2xl border border-gray-100 p-6",
    title: "text-[18px] font-bold text-gray-800 tracking-tight",
    htmlContainer: "text-sm text-gray-600 mt-1",
    confirmButton: "bg-[var(--primary)] hover:opacity-90 text-white rounded-xl px-6 py-2.5 text-sm font-semibold shadow-md transition-all",
    cancelButton: "bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-6 py-2.5 text-sm font-medium border border-gray-200 shadow-sm transition-all",
    input: "rounded-xl border-gray-300 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent shadow-sm",
    actions: "gap-3 mt-6",
  },
  buttonsStyling: false,
  confirmButtonColor: "#ff7732",
  cancelButtonColor: "#6b7280",
  background: "#fff",
  backdrop: "rgba(15,23,42,0.45)",
});

const fallbackGroups = [
  { id: 1, name: "Core Subjects" },
  { id: 2, name: "Languages" },
  { id: 3, name: "Electives" },
];

type SubjectItem = { id: number; name: string; code: string; type: string; groupId: number | null }
type GroupItem = { id: number; name: string }
type SubjectTypeItem = { id: number; name: string }

function parseTypes(typeStr: string): string[] {
  if (!typeStr) return [];
  return typeStr.split(",").map((s) => s.trim()).filter(Boolean);
}
function stringifyTypes(types: string[]): string {
  return types.join(", ");
}

export default function SubjectsPage() {
  const { data: subjects, add, update, remove } = useApi<SubjectItem>("/api/academics/subject");
  const { data: subjectTypes, refetch: refetchTypes } = useApi<SubjectTypeItem>("/api/academics/subject-type");
  const { data: groupsData } = useApi<GroupItem>("/api/academics/subject-group");
  const groups = groupsData.length > 0 ? groupsData : fallbackGroups;
  const [form, setForm] = useState<{ name: string; code: string; type: string[]; groupId: number | null }>({ name: "", code: "", type: ["Theory"], groupId: null });
  useEffect(() => {
    if (groups.length > 0 && form.groupId === null) {
      setForm((prev) => ({ ...prev, groupId: groups[0].id }));
    }
  }, [groups]);
  const [editing, setEditing] = useState<SubjectItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  const availableTypes = useMemo(() => {
    const names = subjectTypes.map((t) => t.name);
    // ensure default types even if DB empty
    const defaults = ["Theory", "Practical", "Both"];
    for (const d of defaults) if (!names.includes(d)) names.push(d);
    return names.sort();
  }, [subjectTypes]);

  const toggleType = (typeName: string, isEdit: boolean = false) => {
    if (isEdit) {
      setForm((prev) => {
        const cur = prev.type;
        const next = cur.includes(typeName) ? cur.filter((t) => t !== typeName) : [...cur, typeName];
        return { ...prev, type: next.length ? next : [typeName] };
      });
    } else {
      setForm((prev) => {
        const cur = prev.type;
        const next = cur.includes(typeName) ? cur.filter((t) => t !== typeName) : [...cur, typeName];
        return { ...prev, type: next };
      });
    }
  };

  const handleAddType = async () => {
    const { value: name, isConfirmed } = await swal.fire({
      title: "Add New Subject Type",
      input: "text",
      inputLabel: "Subject Type Name",
      inputPlaceholder: "e.g. Viva, Project, Oral",
      showCancelButton: true,
      confirmButtonText: "Add",
      inputValidator: (v) => (!v || !v.trim() ? "Name is required" : undefined),
    });
    if (!isConfirmed || !name || !name.trim()) return;
    const trimmed = name.trim();
    if (availableTypes.includes(trimmed)) {
      swal.fire({ icon: "warning", title: "Already exists", text: `${trimmed} already exists`, confirmButtonColor: "#ff7732" });
      return;
    }
    try {
      const res = await fetch("/api/academics/subject-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to add");
      await refetchTypes();
      // auto-select the new type
      setForm((prev) => ({ ...prev, type: [...prev.type, trimmed] }));
      swal.fire({ icon: "success", title: "Added", text: `${trimmed} added and selected`, confirmButtonColor: "#ff7732", timer: 1500, showConfirmButton: false });
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Failed", text: e.message, confirmButtonColor: "#ff7732" });
    }
  };

  const handleSaveAdd = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      swal.fire({ icon: "warning", title: "Missing fields", text: "Subject Name and Code are required", confirmButtonColor: "#ff7732" });
      return;
    }
    if (form.type.length === 0) {
      swal.fire({ icon: "warning", title: "Select Type", text: "Please select at least one Subject Type", confirmButtonColor: "#ff7732" });
      return;
    }
    await add({ name: form.name.trim(), code: form.code.trim(), type: stringifyTypes(form.type), groupId: form.groupId });
    setForm({ name: "", code: "", type: ["Theory"], groupId: groups[0]?.id ?? null });
    swal.fire({ icon: "success", title: "Saved", text: "Subject added successfully", confirmButtonColor: "#ff7732", timer: 1500, showConfirmButton: false });
  };

  const handleEdit = (item: SubjectItem) => {
    setEditing(item);
    setForm({ name: item.name, code: item.code, type: parseTypes(item.type).length ? parseTypes(item.type) : ["Theory"], groupId: item.groupId ?? null });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      swal.fire({ icon: "warning", title: "Missing fields", text: "Subject Name and Code are required", confirmButtonColor: "#ff7732" });
      return;
    }
    if (form.type.length === 0) {
      swal.fire({ icon: "warning", title: "Select Type", text: "Please select at least one Subject Type", confirmButtonColor: "#ff7732" });
      return;
    }
    await update(editing!.id, { name: form.name.trim(), code: form.code.trim(), type: stringifyTypes(form.type), groupId: form.groupId });
    setShowModal(false);
    setEditing(null);
    setForm({ name: "", code: "", type: ["Theory"], groupId: groups[0]?.id ?? null });
    swal.fire({ icon: "success", title: "Updated", text: "Subject updated", confirmButtonColor: "#ff7732", timer: 1500, showConfirmButton: false });
  };

  const handleDelete = async (id: number) => {
    const result = await swal.fire({
      title: "Delete subject?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    await remove(id);
    swal.fire({ icon: "success", title: "Deleted", confirmButtonColor: "#ff7732", timer: 1200, showConfirmButton: false });
  };

  const getGroupName = (groupId: number | null) => {
    if (groupId == null) return "-";
    const group = groups.find((g) => g.id === groupId);
    return group ? group.name : "-";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Subjects</h1>
        <p className="mt-1 text-sm text-white/80">Manage academic subjects — Subject Type now supports multiple selection</p>
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
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-[var(--foreground)]">Subject Type <span className="text-xs font-normal text-gray-500">(multiple)</span></label>
                <button onClick={handleAddType} type="button" className="inline-flex items-center gap-1 rounded-lg border border-[var(--primary)] px-2 py-1 text-xs font-medium text-[var(--primary)] hover:bg-orange-50">
                  <Plus className="h-3.5 w-3.5" /> Add Type
                </button>
              </div>
              <div className="rounded-lg border border-gray-300 p-3 max-h-32 overflow-auto bg-gray-50/30">
                {availableTypes.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">No types yet — add one</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTypes.map((t) => {
                      const checked = form.type.includes(t);
                      return (
                        <label key={t} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer border transition-colors ${checked ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleType(t, false)} className="sr-only" />
                          {checked && <Check className="h-3 w-3" />}
                          {t}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              {form.type.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">Selected: <span className="font-medium text-gray-700">{form.type.join(", ")}</span></p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Group</label>
              <select
                value={form.groupId ?? ""}
                onChange={(e) => setForm({ ...form, groupId: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">No Group</option>
                {groups.map((g) => (
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
                  <td className="px-4 py-3 text-[var(--foreground)]">
                    <div className="flex flex-wrap gap-1">
                      {parseTypes(subject.type).map((t) => (
                        <span key={t} className="inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-[var(--primary)] border border-orange-200">{t}</span>
                      ))}
                    </div>
                  </td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg max-h-[90vh] overflow-auto">
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
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-[var(--foreground)]">Subject Type <span className="text-xs font-normal text-gray-500">(multiple)</span></label>
                  <button onClick={handleAddType} type="button" className="inline-flex items-center gap-1 rounded-lg border border-[var(--primary)] px-2 py-1 text-xs font-medium text-[var(--primary)] hover:bg-orange-50">
                    <Plus className="h-3.5 w-3.5" /> Add Type
                  </button>
                </div>
                <div className="rounded-lg border border-gray-300 p-3 max-h-32 overflow-auto bg-gray-50/30">
                  <div className="flex flex-wrap gap-2">
                    {availableTypes.map((t) => {
                      const checked = form.type.includes(t);
                      return (
                        <label key={t} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer border transition-colors ${checked ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleType(t, true)} className="sr-only" />
                          {checked && <Check className="h-3 w-3" />}
                          {t}
                        </label>
                      );
                    })}
                  </div>
                </div>
                {form.type.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">Selected: <span className="font-medium text-gray-700">{form.type.join(", ")}</span></p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject Group</label>
                <select
                  value={form.groupId ?? ""}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">No Group</option>
                  {groups.map((g) => (
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
