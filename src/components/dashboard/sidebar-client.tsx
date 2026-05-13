'use client'

export function SidebarClient() {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="text-lg font-bold">Cube Group</div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 flex flex-col">
          <div className="space-y-1">
            <div className="px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground">
              Dashboard
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
