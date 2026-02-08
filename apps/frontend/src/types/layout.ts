// Layout-related types

export interface SidebarNavItem {
  href: string
  icon: string
  label: string
  badge?: number | string
  disabled?: boolean
}

export interface BreadcrumbItem {
  label: string
  href?: string
}
