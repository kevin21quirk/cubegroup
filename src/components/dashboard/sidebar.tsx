import { SidebarClient } from './sidebar-client'
import type { UserRole } from '@/lib/auth'

export function Sidebar({ role }: { role: UserRole }) {
  return <SidebarClient role={role} />
}
