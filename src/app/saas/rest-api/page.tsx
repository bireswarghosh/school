"use client"

import ApiDocsPage from "@/components/api-docs-page"

export default function SaasRestApiPage() {
  // Full edition — same documentation as the school panel plus the Super Admin (SaaS) APIs.
  return <ApiDocsPage showSuperAdmin />
}
