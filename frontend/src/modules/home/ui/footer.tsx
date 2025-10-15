"use client"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export const Footer = () => {
  const { theme, setTheme } = useTheme()
  const themes: ("light" | "dark")[] = ["light", "dark"]

  const icons = {
    light: <Sun className="size-3 text-black dark:text-white" />,
    dark: <Moon className="size-3 text-black dark:text-white" />,
  }

  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    if (theme === "light" || theme === "dark") {
      setActiveTheme(theme)
    } else {
      setTheme("light")
      setActiveTheme("light")
    }
  }, [theme, setTheme])

  return (
      <div className="flex items-center p-0.5 gap-1 border text-muted-foreground rounded-full">
        {themes.map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`p-1 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
              activeTheme === t ? "bg-gray-200 dark:bg-gray-600" : ""
            }`}
            title={t}
          >
            {icons[t]}
          </button>
        ))}
      </div>
  )
}
