"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

interface Props extends React.ComponentProps<typeof NextThemesProvider> {
  children: React.ReactNode
}

export function ThemeProvider({
  children,
  ...props
}: Props) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="dark"          
      enableSystem={false}        
      disableTransitionOnChange   
    >
      {children}
    </NextThemesProvider>
  )
}
