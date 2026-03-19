'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/cn'
import {
  LayoutDashboard, ClipboardList, Pill, FileText, Brain, Compass,
  Target, Activity, Utensils, Heart, Clock, Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/records', label: '건강 기록', icon: ClipboardList },
  { href: '/nutrition', label: '식단 관리', icon: Utensils },
  { href: '/medications', label: '복용약/보조제', icon: Pill },
  { href: '/symptoms', label: '증상 기록', icon: Heart },
  { href: '/mental', label: '정신 건강', icon: Brain },
  { href: '/checkup', label: '건강검진', icon: FileText },
  { href: '/exercise', label: '운동', icon: Activity },
  { href: '/goals', label: '건강 목표', icon: Target },
  { href: '/risk', label: '위험도 분석', icon: Compass },
  { href: '/timeline', label: '타임라인', icon: Clock },
  { href: '/insight', label: 'AI 분석', icon: Brain },
  { href: '/saju', label: '사주 건강', icon: Compass },
  { href: '/settings', label: '설정', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white h-screen sticky top-0 overflow-y-auto">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">AI Health</h1>
        <p className="text-sm text-gray-500">가족 건강 분석</p>
      </div>
      <nav className="p-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
