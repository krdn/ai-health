import { redirect } from 'next/navigation'
import { auth } from '@/shared/lib/auth'
import { Sidebar } from '@/widgets/layout'
import { Header } from '@/widgets/layout'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
