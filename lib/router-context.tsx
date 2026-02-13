"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface RouterContextType {
  route: string
  params: Record<string, string>
  navigate: (path: string) => void
}

const RouterContext = createContext<RouterContextType>({
  route: "/",
  params: {},
  navigate: () => {},
})

function parseRoute(path: string): { route: string; params: Record<string, string> } {
  // Match /bets/:id
  const betDetailMatch = path.match(/^\/bets\/(.+)$/)
  if (betDetailMatch) {
    return { route: "/bets/:id", params: { id: betDetailMatch[1] } }
  }
  return { route: path, params: {} }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState("/dashboard")

  const navigate = useCallback((path: string) => {
    setCurrentPath(path)
  }, [])

  const { route, params } = parseRoute(currentPath)

  return (
    <RouterContext.Provider value={{ route, params, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  return useContext(RouterContext)
}
