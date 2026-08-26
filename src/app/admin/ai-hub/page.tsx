"use client"

import {
  Sparkles,
  MessageSquare,
  FileText,
  GraduationCap,
  BookOpen,
  FileBarChart,
  PenTool,
  Settings,
  CircleUserRound,
} from "lucide-react"

const features = [
  {
    icon: MessageSquare,
    title: "AI Assistant",
    description: "Ask questions about students, fees, attendance and get instant answers from your school data.",
    color: "bg-blue-500",
  },
  {
    icon: BookOpen,
    title: "Lesson Planner",
    description: "Generate detailed, curriculum-aligned lesson plans for any class and subject in seconds.",
    color: "bg-green-500",
  },
  {
    icon: PenTool,
    title: "Question Generator",
    description: "Create chapter-wise question papers, worksheets and MCQ quizzes with answer keys.",
    color: "bg-purple-500",
  },
  {
    icon: GraduationCap,
    title: "Student Insights",
    description: "Get behaviour and performance summaries that help teachers personalize learning.",
    color: "bg-orange-500",
  },
  {
    icon: FileText,
    title: "Homework Assistant",
    description: "Draft homework assignments and revision notes tailored to the syllabus.",
    color: "bg-pink-500",
  },
  {
    icon: FileBarChart,
    title: "Report Card Comments",
    description: "Write professional, personalized progress report comments for every student.",
    color: "bg-indigo-500",
  },
]

export default function AiHubPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">AI Hub</h1>
            <p className="mt-0.5 text-sm text-white/80">
              AI-powered tools to simplify everyday school management tasks
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-[var(--primary)]/40 hover:shadow-md"
          >
            <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg ${f.color}`}>
              <f.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-[var(--title-color)]">{f.title}</h3>
            <p className="text-sm text-[var(--subtitle-color)]">{f.description}</p>
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-light)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
                <Sparkles className="h-3 w-3" />
                Coming Soon
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--title-color)]">Configuration</h3>
            <p className="mt-0.5 text-sm text-[var(--subtitle-color)]">
              Connect your AI provider and control which features are available.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-light)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
            <Settings className="h-3 w-3" />
            Coming Soon
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "API Provider", value: "Not configured" },
            { label: "Model", value: "Default" },
            { label: "School Data Access", value: "Enabled" },
          ].map((row) => (
            <div key={row.label} className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3">
              <p className="text-xs text-gray-400">{row.label}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-[var(--title-color)]">
                <CircleUserRound className="h-3.5 w-3.5 text-[var(--primary)]" />
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
