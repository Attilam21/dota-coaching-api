import React from 'react'
import DashboardLayout from '@/components/DashboardLayout'

// Force dynamic rendering to prevent SSR issues with ThemeProvider
export const dynamic = 'force-dynamic'

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}

