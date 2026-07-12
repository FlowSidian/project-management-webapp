import type { ProjectStatus } from "@/lib/types"

function getDaysRemaining(deadline: string): number {
  const nowInBue = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }),
  )
  nowInBue.setHours(0, 0, 0, 0)
  const target = new Date(deadline + "T00:00:00")
  return Math.ceil((target.getTime() - nowInBue.getTime()) / (1000 * 60 * 60 * 24))
}

export function DeadlineBadge({
  deadline,
  status,
}: {
  deadline: string | null
  status: ProjectStatus
}) {
  if (!deadline) return null
  if (status === "Completado") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground line-through">
        {new Date(deadline + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", timeZone: "America/Argentina/Buenos_Aires" })}
      </span>
    )
  }

  const days = getDaysRemaining(deadline)

  let colorClass: string
  let label: string

  if (days < 0) {
    colorClass = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
    label = `Vencido hace ${Math.abs(days)}d`
  } else if (days === 0) {
    colorClass = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
    label = "Vence hoy"
  } else if (days <= 3) {
    colorClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
    label = `${days}d restante${days !== 1 ? "s" : ""}`
  } else if (days <= 7) {
    colorClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
    label = `${days}d restantes`
  } else {
    colorClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
    label = `${days}d restantes`
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${colorClass}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}
