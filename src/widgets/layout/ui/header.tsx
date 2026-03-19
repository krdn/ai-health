'use client'

import { useSession, signOut } from 'next-auth/react'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

export function Header() {
  const { data: session } = useSession()

  const name = session?.user?.name ?? '?'
  const initials = /[가-힣]/.test(name)
    ? name.slice(0, 2)
    : name.split(' ').map(w => w[0]).join('').toUpperCase()

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6">
      <div />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{session?.user?.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
