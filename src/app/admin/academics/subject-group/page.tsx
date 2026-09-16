"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Save, Loader2, Copy, ClipboardPaste, Search, CheckCheck, Eraser } from "lucide-react";
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
  const { data: subjects, add: addSubject, refetch: refetchSubjects } = useApi<SubjectItem>("/api/academics/subject");

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
  const [subjectSearch, setSubjectSearch] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [pasteMsg, setPasteMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [missingSubjects, setMissingSubjects] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) => s.name.toLowerCase().includes(q) || (s.code || "").toLowerCase().includes(q));
  }, [subjects, subjectSearch]);

  const selectedSubjectNames = useMemo(() => {
    const map = new Map(subjects.map((s) => [s.id, s.name] as const));
    return form.subjectIds.map((id) => map.get(id) || String(id));
  }, [subjects, form.subjectIds]);

  const handleCopySubjects = async () => {
    const text = selectedSubjectNames.join(", ");
    if (!text) { setPasteMsg("No subjects selected to copy"); return; }
    try { await navigator.clipboard.writeText(text); setCopied(true); setPasteMsg(`Copied ${form.subjectIds.length} subjects`); setTimeout(() => setCopied(false), 1500); } catch { setPasteMsg("Copy failed — select and copy manually"); }
  };

  const handlePasteApply = () => {
    const raw = pasteText.trim();
    if (!raw) { setPasteMsg("Paste subject names first (comma or new line separated)"); return; }
    const parts = raw.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) { setPasteMsg("No valid names found"); return; }
    const byName = new Map(subjects.map((s) => [s.name.trim().toLowerCase(), s.id] as const));
    const byCode = new Map(subjects.map((s) => [(s.code || "").trim().toLowerCase(), s.id] as const));
    const found: number[] = [];
    const missing: string[] = [];
    for (const p of parts) {
      const key = p.toLowerCase();
      if (byName.has(key)) found.push(byName.get(key)!);
      else if (byCode.has(key) && byCode.get(key)) found.push(byCode.get(key)!);
      else {
        // fuzzy contains match — if subject already exists, just select it
        const hit = subjects.find((s) => s.name.toLowerCase() === key || s.name.toLowerCase().includes(key) || key.includes(s.name.toLowerCase()));
        if (hit) found.push(hit.id);
        else missing.push(p);
      }
    }
    const uniq = Array.from(new Set(found));
    setMissingSubjects(missing);
    if (uniq.length === 0 && missing.length === 0) { setPasteMsg(`No matches`); return; }
    if (uniq.length > 0) {
      setForm((prev) => ({ ...prev, subjectIds: Array.from(new Set([...prev.subjectIds, ...uniq])) }));
    }
    if (uniq.length > 0 && missing.length === 0) {
      setPasteMsg(`Added ${uniq.length} existing subjects — already selected if existed, now ${new Set([...form.subjectIds, ...uniq]).size} total`);
    } else if (uniq.length > 0 && missing.length > 0) {
      setPasteMsg(`Added ${uniq.length} existing subjects, ${missing.length} not found: ${missing.join(", ")} — you can create them below`);
    } else {
      setPasteMsg(`No existing matches — ${missing.length} not found: ${missing.join(", ")}`);
    }
  };

  const handleCreateMissing = async () => {
    if (missingSubjects.length === 0) return;
    setCreating(true);
    try {
      const createdIds: number[] = [];
      for (const name of missingSubjects) {
        const res: any = await addSubject({ name, code: name.slice(0, 10).toUpperCase().replace(/\s+/g, ""), type: "Theory" } as any);
        if (res?.id) createdIds.push(Number(res.id));
      }
      await refetchSubjects();
      // after refetch, map new subjects by name to ids (fallback to createdIds)
      setTimeout(() => {
        // try to select newly created by name
        const byNameNew = new Map(subjects.map((s) => [s.name.trim().toLowerCase(), s.id] as const));
        // also include freshly created ids directly
        const toAdd = missingSubjects.map((n) => byNameNew.get(n.toLowerCase())).filter(Boolean) as number[];
        const allNew = Array.from(new Set([...createdIds, ...toAdd]));
        if (allNew.length) setForm((prev) => ({ ...prev, subjectIds: Array.from(new Set([...prev.subjectIds, ...allNew])) }));
      }, 400);
      setPasteMsg(`Created ${missingSubjects.length} new subjects and added to group`);
      setMissingSubjects([]);
      setPasteText("");
    } catch (e: any) {
      setPasteMsg(e.message || "Failed to create subjects");
    } finally {
      setCreating(false);
    }
  };

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

  const handleDuplicate = (item: SubjectGroup) => {
    const firstSection = item.sections[0];
    setEditing(null);
    setForm({
      name: `${item.name} Copy`,
      classId: firstSection ? String(firstSection.class_id) : "",
      sectionIds: [],
      subjectIds: item.subjects.map((s) => s.subject_id),
      description: item.description,
    });
    // also prefill paste text so user can see what was copied
    setPasteText(item.subjects.map((s) => s.name).join(", "));
    setPasteMsg(`Duplicated ${item.subjects.length} subjects from "${item.name}" — pick a new Class/Sections and Save`);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Subject <span className="text-red-500">*</span> <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{form.subjectIds.length} selected</span>
                </label>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setForm({ ...form, subjectIds: subjects.map((s) => s.id) })} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50" title="Select all filtered">
                    <CheckCheck className="h-3 w-3" /> All
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, subjectIds: [] })} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Eraser className="h-3 w-3" /> Clear
                  </button>
                  <button type="button" onClick={handleCopySubjects} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${copied ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"}`}>
                    <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="mb-2 rounded-xl border border-dashed border-orange-200 bg-orange-50/40 p-3 dark:border-orange-500/20 dark:bg-orange-500/5">
                <label className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-widest text-orange-700 dark:text-orange-300 uppercase">
                  <ClipboardPaste className="h-3.5 w-3.5" /> Paste subjects — easy copy/paste
                </label>
                <p className="mb-2 text-xs text-slate-500">Paste comma or new-line separated names/codes e.g. <span className="font-mono bg-white px-1 rounded border">English, Mathematics, Hindi</span> — we&apos;ll match automatically</p>
                <textarea
                  value={pasteText}
                  onChange={(e) => { setPasteText(e.target.value); if (pasteMsg) setPasteMsg(""); }}
                  placeholder={"English\nMathematics\nHindi\n... or English, Mathematics, Hindi"}
                  rows={3}
                  className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-200 outline-none"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={handlePasteApply} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 px-4 py-1.5 text-xs font-black text-white shadow hover:shadow-md">
                    <ClipboardPaste className="h-3.5 w-3.5" /> Add pasted (select existing)
                  </button>
                  {missingSubjects.length > 0 && (
                    <button type="button" onClick={handleCreateMissing} disabled={creating} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-emerald-200 px-4 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                      {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Create {missingSubjects.length} missing & add
                    </button>
                  )}
                  {pasteMsg && <span className="text-xs font-medium text-slate-600 line-clamp-2 flex-1 text-right min-w-[180px]">{pasteMsg}</span>}
                </div>
                {selectedSubjectNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedSubjectNames.map((n) => (
                      <span key={n} className="inline-flex items-center gap-1 rounded-full bg-white border border-orange-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {n} <button type="button" onClick={() => { const id = subjects.find((s) => s.name === n)?.id; if (id) setForm({ ...form, subjectIds: form.subjectIds.filter((x) => x !== id) }); }} className="ml-1 text-slate-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Filter subjects…"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 outline-none"
                />
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                {filteredSubjects.length === 0 ? (
                  <p className="text-xs text-gray-400">No subjects match “{subjectSearch}”.</p>
                ) : (
                  <div className="space-y-1.5">
                    {filteredSubjects.map((s) => (
                      <label key={s.id} className={`flex items-center gap-2 text-sm cursor-pointer rounded px-1 py-0.5 ${form.subjectIds.includes(s.id) ? "bg-orange-50 text-orange-800" : "text-[var(--foreground)]"}`}>
                        <input
                          type="checkbox"
                          checked={form.subjectIds.includes(s.id)}
                          onChange={() => setForm({ ...form, subjectIds: toggleId(form.subjectIds, s.id) })}
                          className="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        <span className="flex-1">{s.name}</span>
                        {s.code && <span className="text-xs text-slate-400 font-mono">{s.code}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">Tip: paste a list, then edit with checkboxes — then duplicate this group for other classes by changing Class/Sections.</p>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDuplicate(group)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          title="Duplicate — copy subjects to new group"
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </button>
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
