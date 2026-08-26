"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, X, Loader2, Layers, GraduationCap } from "lucide-react";
import { useApi } from "@/lib/use-api";

type ClassItem = { id: number; name: string }
type SectionItem = { id: number; name: string; class_id?: number | null }

type TabKey = "class" | "sections"

export default function ClassPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <ClassPageInner />
    </Suspense>
  )
}

const ROMAN: Record<string, number> = { x: 10, ix: 9, viii: 8, vii: 7, vi: 6, v: 5, iv: 4, iii: 3, ii: 2, i: 1 }
const KNOWN_GRADES: [string, number][] = [
  ["u.k.g", 0.55], ["ukg", 0.55], ["k.g", 0.5], ["kg", 0.5], ["kindergarten", 0.5],
  ["l.k.g", 0.45], ["lkg", 0.45], ["nursery", 0.4], ["pre-nursery", 0.35],
  ["montessori", 0.3], ["play group", 0.25], ["playgroup", 0.25],
]

function classRank(name: string): number {
  const s = name.toLowerCase().trim()
  const m = s.match(/\b(x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/)
  if (m && ROMAN[m[1]]) return ROMAN[m[1]]
  const n = s.match(/(\d+)/)
  if (n) return parseInt(n[0], 10)
  for (const [k, v] of KNOWN_GRADES) if (s.includes(k)) return v
  return 0
}

function ClassPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab: TabKey = searchParams.get("tab") === "sections" ? "sections" : "class"
  const [tab, setTab] = useState<TabKey>(initialTab)

  const { data: classes, add: addClass, update: updateClass, remove: removeClass } = useApi<ClassItem>("/api/academics/class");
  const { data: sections, add: addSection, update: updateSection, remove: removeSection, refetch: refetchSections } = useApi<SectionItem>("/api/academics/section");

  const switchTab = (t: TabKey) => {
    setTab(t)
    router.replace(t === "class" ? "/admin/academics/class" : "/admin/academics/class?tab=sections", { scroll: false })
  }

  const sectionsOf = (classId: number) =>
    sections.filter((s) => s.class_id === classId).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Class &amp; Section</h1>
        <p className="mt-1 text-sm text-white/80">Manage class levels and assign sections to each class</p>
      </div>

      <div className="flex gap-2">
        {([
          { key: "class" as TabKey, label: "Class", icon: GraduationCap },
          { key: "sections" as TabKey, label: "Section", icon: Layers },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "border border-gray-200 bg-white text-[var(--foreground)] hover:bg-gray-50"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "class" ? (
        <ClassTab
          classes={classes}
          sections={sections}
          sectionsOf={sectionsOf}
          addClass={addClass}
          updateClass={updateClass}
          removeClass={removeClass}
          refetchSections={refetchSections}
        />
      ) : (
        <SectionTab
          sections={sections}
          addSection={addSection}
          updateSection={updateSection}
          removeSection={removeSection}
        />
      )}
    </div>
  );
}

function ClassTab({
  classes,
  sections,
  sectionsOf,
  addClass,
  updateClass,
  removeClass,
  refetchSections,
}: {
  classes: ClassItem[]
  sections: SectionItem[]
  sectionsOf: (classId: number) => SectionItem[]
  addClass: (item: any) => Promise<any>
  updateClass: (id: number, item: any) => Promise<any>
  removeClass: (id: number) => Promise<any>
  refetchSections: () => Promise<void>
}) {
  const [newClassName, setNewClassName] = useState("");
  const [newSectionNames, setNewSectionNames] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editSectionNames, setEditSectionNames] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const sortedClasses = [...classes].sort((a, b) => classRank(b.name) - classRank(a.name) || a.id - b.id);

  const seen = new Set<string>();
  const sectionOptions: string[] = [];
  for (const s of sections) {
    const n = s.name.trim();
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    sectionOptions.push(n);
  }
  sectionOptions.sort((a, b) => a.localeCompare(b));

  const toggleSectionName = (names: string[], name: string) =>
    names.includes(name) ? names.filter((x) => x !== name) : [...names, name];

  const handleAdd = async () => {
    const name = newClassName.trim();
    if (!name) { setError("Class name is required"); return; }
    setSaving(true);
    setError("");
    try {
      await addClass({ name, sections: newSectionNames });
      setNewClassName("");
      setNewSectionNames([]);
      refetchSections();
    } catch (e: any) {
      setError(e.message || "Failed to add class");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cls: ClassItem) => {
    setEditing(cls);
    setEditValue(cls.name);
    setEditSectionNames(sectionsOf(cls.id).map((s) => s.name));
    setError("");
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!editValue.trim() || !editing) { setError("Class name is required"); return; }
    setSaving(true);
    setError("");
    try {
      await updateClass(editing.id, { name: editValue.trim(), sections: editSectionNames });
      setShowModal(false);
      setEditing(null);
      setEditValue("");
      setEditSectionNames([]);
      refetchSections();
    } catch (e: any) {
      setError(e.message || "Failed to update class");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeClass(id);
    } catch (e: any) {
      setError(e.message || "Failed to delete class");
    }
  };

  const renderSections = (classId: number) => {
    const mapped = sectionsOf(classId);
    if (mapped.length === 0) return <span className="text-gray-400">—</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {mapped.map((s) => (
          <span
            key={s.id}
            className="inline-flex rounded-full bg-[var(--primary-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]"
          >
            {s.name}
          </span>
        ))}
      </div>
    );
  };

  const SectionCheckboxes = ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
      {sectionOptions.length === 0 ? (
        <p className="text-xs text-gray-400">No sections available. Add sections on the Section tab first.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sectionOptions.map((name) => (
            <label key={name} className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer">
              <input
                type="checkbox"
                checked={value.includes(name)}
                onChange={() => onChange(toggleSectionName(value, name))}
                className="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              {name}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[var(--title-color)]">Add Class</h2>
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Class <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => { setNewClassName(e.target.value); if (error) setError(""); }}
              placeholder="e.g., Class I, Class II, Nursery"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Sections
            </label>
            <SectionCheckboxes value={newSectionNames} onChange={setNewSectionNames} />
            <p className="mt-1 text-xs text-gray-400">Same section can be selected for multiple classes.</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={saving}
          className="mt-4 inline-flex w-full h-[38px] items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-[var(--title-color)]">Class List</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">#</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Class</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Sections</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--title-color)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedClasses.map((cls, idx) => (
              <tr
                key={cls.id}
                className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-[var(--title-color)]">{cls.name}</td>
                <td className="px-4 py-3">{renderSections(cls.id)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(cls)}
                      className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id)}
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
        {sortedClasses.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">
            No classes found. Add a class to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--title-color)]">Edit Class</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Class</label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => { setEditValue(e.target.value); if (error) setError(""); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Sections</label>
                <SectionCheckboxes value={editSectionNames} onChange={setEditSectionNames} />
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
                disabled={saving}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTab({
  sections,
  addSection,
  updateSection,
  removeSection,
}: {
  sections: SectionItem[]
  addSection: (item: any) => Promise<any>
  updateSection: (id: number, item: any) => Promise<any>
  removeSection: (id: number) => Promise<any>
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SectionItem | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const masterFirst = [...sections].sort((a, b) => {
    if ((a.class_id == null) !== (b.class_id == null)) return a.class_id == null ? -1 : 1
    return a.id - b.id
  })
  const seenNames = new Set<string>()
  const uniqueSections: SectionItem[] = []
  for (const s of masterFirst) {
    const key = s.name.trim().toLowerCase()
    if (!key || seenNames.has(key)) continue
    seenNames.add(key)
    uniqueSections.push(s)
  }
  const nameExists = (value: string, excludeId?: number) =>
    uniqueSections.some(
      (s) => s.id !== excludeId && s.name.trim().toLowerCase() === value.trim().toLowerCase()
    );

  const handleAdd = async () => {
    const value = name.trim();
    if (!value) { setError("Section name is required"); return; }
    if (nameExists(value)) { setError(`Section "${value}" already exists`); return; }
    setSaving(true);
    setError("");
    try {
      await addSection({ name: value });
      setName("");
    } catch (e: any) {
      setError(e.message || "Failed to add section");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: SectionItem) => {
    setEditing(item);
    setEditValue(item.name);
    setError("");
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!editValue.trim() || !editing) { setError("Section name is required"); return; }
    if (nameExists(editValue, editing.id)) { setError(`Section "${editValue.trim()}" already exists`); return; }
    setSaving(true);
    setError("");
    try {
      await updateSection(editing.id, { name: editValue.trim() });
      setShowModal(false);
      setEditing(null);
      setEditValue("");
    } catch (e: any) {
      setError(e.message || "Failed to update section");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeSection(id);
    } catch (e: any) {
      setError(e.message || "Failed to delete section");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[var(--title-color)]">Add Section</h2>
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Section <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
              placeholder="e.g., A, B, C"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={saving}
          className="mt-4 inline-flex w-full h-[38px] items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-[var(--title-color)]">Section List</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">#</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Section</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--title-color)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {uniqueSections.map((item, idx) => (
              <tr
                key={item.id}
                className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-[var(--title-color)]">{item.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
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
        {uniqueSections.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">
            No sections found. Add a section to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--title-color)]">Edit Section</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Section</label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => { setEditValue(e.target.value); if (error) setError(""); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
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
                disabled={saving}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
