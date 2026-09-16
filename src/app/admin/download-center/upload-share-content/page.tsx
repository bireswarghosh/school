"use client";

import { useState } from "react";
import { Save, Pencil, Trash2, X } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useClassesAndSections } from "@/lib/use-classes-sections";

const contentTypeOptions = ["Assignment", "Study Material", "Syllabus", "Other"];
const subjectOptions = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Sanskrit"];

type ContentItem = {
  id: number;
  title: string;
  contentType: string;
  className: string;
  section: string;
  subject: string;
  uploadDate: string;
  file: string;
  description: string;
};

type ContentForm = {
  title: string;
  contentType: string;
  className: string;
  section: string;
  subject: string;
  uploadDate: string;
  file: string;
  description: string;
};

const emptyForm: ContentForm = {
  title: "",
  contentType: contentTypeOptions[0],
  className: "1",
  section: "A",
  subject: subjectOptions[0],
  uploadDate: "",
  file: "",
  description: "",
};

export default function UploadShareContentPage() {
  const { classes, sectionsOf, sectionNames } = useClassesAndSections();
  const { data: items, add, update, remove, loading } = useApi<ContentItem>("/api/download-center/content");
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSaveAdd = async () => {
    if (!form.title.trim() || !form.file.trim()) return;
    await add({
      title: form.title.trim(),
      contentType: form.contentType,
      className: form.className,
      section: form.section,
      subject: form.subject,
      uploadDate: form.uploadDate,
      file: form.file.trim(),
      description: form.description.trim(),
    });
    setForm(emptyForm);
  };

  const handleEdit = (item: ContentItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      contentType: item.contentType,
      className: item.className,
      section: item.section,
      subject: item.subject,
      uploadDate: item.uploadDate,
      file: item.file,
      description: item.description,
    });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!form.title.trim() || !form.file.trim()) return;
    await update(editing!.id, {
      title: form.title.trim(),
      contentType: form.contentType,
      className: form.className,
      section: form.section,
      subject: form.subject,
      uploadDate: form.uploadDate,
      file: form.file.trim(),
      description: form.description.trim(),
    });
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: number) => {
    await remove(id);
  };

  const resolveClassId = (value: string): number | null => {
    const n = parseInt(value);
    if (Number.isFinite(n)) {
      if (classes.some((c) => c.id === n)) return n;
    }
    return classes.find((c) => c.name === value)?.id ?? null;
  };
  const formClassId = resolveClassId(form.className);
  const formSectionNames = formClassId ? sectionsOf(formClassId).map((s) => s.name) : sectionNames;

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Upload / Share Content</h1>
        <p className="mt-1 text-sm text-white/80">Upload and share educational content</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[var(--title-color)]">Add Content</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Content Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter content title"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Content Type</label>
              <select
                value={form.contentType}
                onChange={(e) => setForm({ ...form, contentType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                {contentTypeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Class</label>
                <select
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value, section: "" })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
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
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  disabled={!formClassId}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
                >
                  <option value="">Select</option>
                  {formSectionNames.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                {subjectOptions.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Upload Date</label>
              <input
                type="date"
                value={form.uploadDate}
                onChange={(e) => setForm({ ...form, uploadDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">File</label>
              <input
                type="text"
                value={form.file}
                onChange={(e) => setForm({ ...form, file: e.target.value })}
                placeholder="Enter filename"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
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
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Title</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Type</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Class</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Date</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">File</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--title-color)]">{item.title}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{item.contentType}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{item.className}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{item.subject}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{item.uploadDate}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{item.file}</td>
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
          {items.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">No content found</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--title-color)]">Edit Content</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Content Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Content Type</label>
                <select
                  value={form.contentType}
                  onChange={(e) => setForm({ ...form, contentType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {contentTypeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Class</label>
                  <select
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value, section: "" })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
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
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    disabled={!formClassId}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
                  >
                    <option value="">Select</option>
                    {formSectionNames.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {subjectOptions.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Upload Date</label>
                <input
                  type="date"
                  value={form.uploadDate}
                  onChange={(e) => setForm({ ...form, uploadDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">File</label>
                <input
                  type="text"
                  value={form.file}
                  onChange={(e) => setForm({ ...form, file: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] resize-none"
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
