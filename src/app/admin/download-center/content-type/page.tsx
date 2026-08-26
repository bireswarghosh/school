"use client";

import { useState } from "react";
import { Save, Pencil, Trash2, X } from "lucide-react";
import { useApi } from "@/lib/use-api";

type ContentTypeItem = {
  id: number;
  name: string;
};

export default function ContentTypePage() {
  const { data: types, add, update, remove, loading } = useApi<ContentTypeItem>("/api/download-center/content-type");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<ContentTypeItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editName, setEditName] = useState("");

  const handleSaveAdd = async () => {
    if (!name.trim()) return;
    await add({ name: name.trim() });
    setName("");
  };

  const handleEdit = (item: ContentTypeItem) => {
    setEditing(item);
    setEditName(item.name);
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!editName.trim()) return;
    await update(editing!.id, { name: editName.trim() });
    setShowModal(false);
    setEditing(null);
    setEditName("");
  };

  const handleDelete = async (id: number) => {
    await remove(id);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Content Type</h1>
        <p className="mt-1 text-sm text-white/80">Manage content type categories</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[var(--title-color)]">Add Content Type</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Content Type Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter content type name"
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
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Content Type</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Action</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type, idx) => (
                <tr
                  key={type.id}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--title-color)]">{type.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
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
          {types.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">No content types found</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--title-color)]">Edit Content Type</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Content Type Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
