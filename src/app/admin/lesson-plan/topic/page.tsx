"use client";

import { useState } from "react";
import { Save, Pencil, Trash2, X } from "lucide-react";
import { useApi } from "@/lib/use-api";

const lessonOptions = ["Algebra", "Geometry", "Motions & Forces", "Grammar Basics", "World History", "Chemistry Basics"];
const subjectOptions = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Sanskrit"];

type Topic = {
  id: number;
  name: string;
  lesson: string;
  subject: string;
  priority: number;
};

type TopicForm = {
  name: string;
  lesson: string;
  subject: string;
  priority: number;
};

const emptyForm: TopicForm = { name: "", lesson: lessonOptions[0], subject: subjectOptions[0], priority: 1 };

export default function TopicPage() {
  const { data: topics, add, update, remove, loading } = useApi<Topic>("/api/lesson-plan/topic");
  const [form, setForm] = useState<TopicForm>(emptyForm);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSaveAdd = async () => {
    if (!form.name.trim()) return;
    await add({ name: form.name.trim(), lesson: form.lesson, subject: form.subject, priority: form.priority });
    setForm(emptyForm);
  };

  const handleEdit = (item: Topic) => {
    setEditing(item);
    setForm({ name: item.name, lesson: item.lesson, subject: item.subject, priority: item.priority });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!form.name.trim()) return;
    await update(editing!.id, { name: form.name.trim(), lesson: form.lesson, subject: form.subject, priority: form.priority });
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
        <h1 className="text-xl font-semibold text-white">Topics</h1>
        <p className="mt-1 text-sm text-white/80">Manage lesson topics</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[var(--title-color)]">Add Topic</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Topic Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter topic name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
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
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Priority</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                min={1}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
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
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Topic Name</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Lesson</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Action</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic, idx) => (
                <tr
                  key={topic.id}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--title-color)]">{topic.name}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{topic.lesson}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{topic.subject}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{topic.priority}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(topic)}
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(topic.id)}
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
          {topics.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">No topics found</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--title-color)]">Edit Topic</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Topic Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
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
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Priority</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                  min={1}
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
