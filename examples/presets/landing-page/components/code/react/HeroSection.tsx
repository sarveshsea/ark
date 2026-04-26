"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "./Badge"
import { Button } from "./Button"
import { Card } from "./Card"
import { Input } from "./Input"

export interface HeroSectionProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow: string
  headline: string
  description: string
  primaryCta: string
  secondaryCta?: string
  emailPlaceholder?: string
  proofPoints?: string[]
}

/**
 * HeroSection - conversion-first landing page organism.
 *
 * @purpose Above-the-fold launch section with CTA, capture input, and proof.
 * @variants default, split
 * @props eyebrow, headline, description, primaryCta, secondaryCta, emailPlaceholder, proofPoints
 */
export function HeroSection({
  eyebrow,
  headline,
  description,
  primaryCta,
  secondaryCta = "View demo",
  emailPlaceholder = "you@company.com",
  proofPoints = ["Installable shadcn registry", "Tokenized Tailwind theme", "Copy-paste launch section"],
  className,
  ...props
}: HeroSectionProps) {
  return (
    <section
      aria-label={headline}
      className={cn(
        "relative overflow-hidden rounded-[calc(var(--radius-lg)*2)] border border-[var(--color-border)]",
        "bg-[var(--color-background)] px-[var(--spacing-lg)] py-[calc(var(--spacing-xl)*2)]",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-x-10 top-8 h-40 rounded-full bg-[var(--color-accent)] opacity-30 blur-3xl" aria-hidden="true" />
      <div className="relative grid gap-[var(--spacing-xl)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="max-w-2xl">
          <Badge label={eyebrow} variant="accent" />
          <h1 className="mt-[var(--spacing-md)] text-4xl font-semibold tracking-tight text-[var(--color-foreground)] md:text-6xl">
            {headline}
          </h1>
          <p className="mt-[var(--spacing-md)] text-lg leading-8 text-[var(--color-muted-foreground)]">
            {description}
          </p>
          <div className="mt-[var(--spacing-lg)] flex flex-col gap-[var(--spacing-sm)] sm:flex-row">
            <Button label={primaryCta} variant="primary" />
            <Button label={secondaryCta} variant="ghost" />
          </div>
          <div className="mt-[var(--spacing-lg)] max-w-md">
            <Input label="Join the launch list" placeholder={emailPlaceholder} type="email" />
          </div>
        </div>
        <Card variant="elevated" title="Launch proof" description="Everything above the fold is tokenized.">
          <ul className="space-y-3">
            {proofPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-[var(--color-muted-foreground)]">
                <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  )
}
