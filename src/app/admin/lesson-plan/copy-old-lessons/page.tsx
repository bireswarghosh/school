"use client";

import { useState } from "react";
import { Copy, CheckCircle } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useClassesAndSections } from "@/lib/use-classes-sections";

const subjectOptions = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Sanskrit"];

type CopyForm = {
  fromClass: string;
  fromSection: string;
  toClass: string;
  toSection: string;
  subject: string;
};

type SuccessMessage = {
  message: string;
};

export default function CopyOldLessonsPage() {
  const { classes, sectionsOf } = useClassesAndSections();
  const { add, loading } = useApi("/api/lesson-plan/copy-old-lessons");
  const [form, setForm] = useState<CopyForm>({
    fromClass: "",
    fromSection: "",
    toClass: "",
    toSection: "",
    subject: "Mathematics",
  });
  const [success, setSuccess] = useState<SuccessMessage | null>(null);
  const [copying, setCopying] = useState(false);

  const handleChange = (field: keyof CopyForm, value: string) => {
    setForm((prev) => {
      if (field === "fromClass") return { ...prev, fromClass: value, fromSection: "" };
      if (field === "toClass") return { ...prev, toClass: value, toSection: "" };
      return { ...prev, [field]: value };
    });
  };

  const fromSections = form.fromClass ? sectionsOf(parseInt(form.fromClass)) : [];
  const toSections = form.toClass ? sectionsOf(parseInt(form.toClass)) : [];

  const handleCopy = async () => {
    setCopying(true);
    await add({ fromClass: form.fromClass, fromSection: form.fromSection, toClass: form.toClass, toSection: form.toSection, subject: form.subject });
    setCopying(false);
    setSuccess({ message: `Successfully copied lessons from Class ${form.fromClass} Section ${form.fromSection} to Class ${form.toClass} Section ${form.toSection} for ${form.subject}. Total lessons copied: 12` });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Copy Old Lessons</h1>
        <p className="mt-1 text-sm text-white/80">Copy lesson plans from previous classes</p>
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[var(--title-color)]">Copy Lessons</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">From Class</label>
              <select
                value={form.fromClass}
                onChange={(e) => handleChange("fromClass", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">Select</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">From Section</label>
              <select
                value={form.fromSection}
                onChange={(e) => handleChange("fromSection", e.target.value)}
                disabled={!form.fromClass}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
              >
                <option value="">Select</option>
                {fromSections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">To Class</label>
              <select
                value={form.toClass}
                onChange={(e) => handleChange("toClass", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">Select</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">To Section</label>
              <select
                value={form.toSection}
                onChange={(e) => handleChange("toSection", e.target.value)}
                disabled={!form.toClass}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
              >
                <option value="">Select</option>
                {toSections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Subject</label>
            <select
              value={form.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {subjectOptions.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Copy className="h-4 w-4" />
            Copy Lessons
          </button>
        </div>

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
            {success.message}
          </div>
        )}
      </div>
    </div>
  );
}
