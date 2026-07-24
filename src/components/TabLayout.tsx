import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function TabLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex-1 pb-4">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
