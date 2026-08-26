"use client"

import ApiDocsPage from "@/components/api-docs-page"

export default function RestApiPage() {
  // School edition — role docs for Student / Parent / Teacher / School Admin.
  // Super Admin APIs are intentionally NOT documented here; they live in the SaaS console (/saas/rest-api).
  return <ApiDocsPage showSuperAdmin={false} />
}
