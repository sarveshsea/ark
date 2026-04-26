"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "./Badge"
import { Button } from "./Button"
import { Card } from "./Card"
import { Input } from "./Input"

export type AuthCardMode = "login" | "signup" | "settings"

export interface AuthCardProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title: string
  description?: string
  mode?: AuthCardMode
  primaryCta: string
  secondaryAction?: string
}

/**
 * AuthCard - login/signup/settings organism.
 *
 * @purpose Tokenized auth form for shadcn apps.
 * @variants login, signup, settings
 * @props title, description, mode, primaryCta, secondaryAction
 */
export function AuthCard({
  title,
  description,
  mode = "login",
  primaryCta,
  secondaryAction = mode === "login" ? "Create account" : "Already have an account?",
  className,
  ...props
}: AuthCardProps) {
  const showName = mode === "signup" || mode === "settings"

  return (
    <Card variant="elevated" className="mx-auto max-w-md">
      <form
        aria-label={title}
        className={cn("flex flex-col gap-[var(--spacing-md)]", className)}
        {...props}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{description}</p>
            )}
          </div>
          <Badge label="Secure" variant="accent" />
        </div>
        {showName && <Input label="Full name" placeholder="Ada Lovelace" autoComplete="name" />}
        <Input label="Email" placeholder="you@company.com" type="email" autoComplete="email" />
        {mode !== "settings" && (
          <Input label="Password" placeholder="Enter password" type="password" autoComplete="current-password" />
        )}
        <Button label={primaryCta} variant="primary" />
        <button
          type="button"
          className="min-h-[44px] rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          {secondaryAction}
        </button>
      </form>
    </Card>
  )
}
