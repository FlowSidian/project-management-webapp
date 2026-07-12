"use client"

import { useMemo } from "react"
import { BarChart3, CheckCircle2, Clock, FolderOpen, TrendingUp } from "lucide-react"
import type { Project } from "@/lib/types"
import { StatusBadge } from "@/components/status-badge"

const STATUS_COLORS: Record<string, string> = {
  Completado: "oklch(0.55 0.12 150)",
  "En curso": "oklch(0.55 0.12 240)",
  "No iniciado": "oklch(0.6 0.02 250)",
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  )
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos</p>

  const radius = 70
  const stroke = 20
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
      <svg viewBox="0 0 200 200" className="size-44 shrink-0">
        {data.map((d) => {
          const pct = d.value / total
          const dashArray = `${pct * circumference} ${circumference}`
          const dashOffset = -offset * circumference
          offset += pct
          return (
            <circle
              key={d.label}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              transform="rotate(-90 100 100)"
            />
          )
        })}
        <text x="100" y="95" textAnchor="middle" className="fill-foreground text-3xl font-bold">
          {total}
        </text>
        <text x="100" y="115" textAnchor="middle" className="fill-muted-foreground text-xs">
          proyectos
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-foreground">
              {d.label}: <span className="font-semibold">{d.value}</span>
              <span className="text-muted-foreground"> ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  if (data.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos</p>

  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{d.label}</span>
            <span className="text-xs font-semibold text-foreground">{d.value}</span>
          </div>
          <div className="h-5 overflow-hidden rounded-md bg-muted">
            <div
              className="h-full rounded-md bg-primary/20"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function MonthlyTrendChart({ data }: { data: { month: string; count: number }[] }) {
  if (data.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos</p>

  const max = Math.max(...data.map((d) => d.count), 1)
  const chartW = 600
  const chartH = 180
  const padL = 30
  const padB = 30
  const padT = 10
  const padR = 10
  const w = chartW - padL - padR
  const h = chartH - padT - padB
  const stepX = data.length > 1 ? w / (data.length - 1) : w / 2

  const points = data.map((d, i) => ({
    x: padL + i * stepX,
    y: padT + h - (d.count / max) * h,
    ...d,
  }))
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
  const area = `${line} L${points[points.length - 1].x},${padT + h} L${points[0].x},${padT + h} Z`

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = padT + h - pct * h
        return (
          <g key={pct}>
            <line x1={padL} y1={y} x2={chartW - padR} y2={y} className="stroke-border" strokeWidth={0.5} />
            <text x={padL - 4} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[9px]">
              {Math.round(max * pct)}
            </text>
          </g>
        )
      })}
      <path d={area} className="fill-primary/10" />
      <path d={line} className="fill-none stroke-primary" strokeWidth={2} strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.month}>
          <circle cx={p.x} cy={p.y} r={3.5} className="fill-primary stroke-card" strokeWidth={2} />
          <text x={p.x} y={chartH - 6} textAnchor="middle" className="fill-muted-foreground text-[9px]">
            {p.month}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function MetricsDashboard({ projects }: { projects: Project[] }) {
  const active = projects.filter((p) => !p.archived)

  const statusData = useMemo(() => {
    const counts: Record<string, number> = { "No iniciado": 0, "En curso": 0, Completado: 0 }
    active.forEach((p) => counts[p.status]++)
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      color: STATUS_COLORS[label] ?? "gray",
    }))
  }, [active])

  const responsableData = useMemo(() => {
    const counts: Record<string, number> = {}
    active.forEach((p) => p.responsables.forEach((r) => {
      counts[r] = (counts[r] ?? 0) + 1
    }))
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }))
  }, [active])

  const trendData = useMemo(() => {
    const months: Record<string, number> = {}
    projects.forEach((p) => {
      const d = new Date(p.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      months[key] = (months[key] ?? 0) + 1
    })
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => {
        const [y, m] = month.split("-")
        const label = new Date(Number(y), Number(m) - 1).toLocaleDateString("es-AR", { month: "short", year: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })
        return { month: label, count }
      })
  }, [projects])

  const recentlyUpdated = useMemo(() => {
    return [...active]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [active])

  const completedCount = active.filter((p) => p.status === "Completado").length
  const inProgressCount = active.filter((p) => p.status === "En curso").length
  const completionRate = active.length > 0 ? Math.round((completedCount / active.length) * 100) : 0

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" })

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={FolderOpen} label="Proyectos activos" value={active.length} />
        <KpiCard icon={Clock} label="En curso" value={inProgressCount} />
        <KpiCard icon={CheckCircle2} label="Completados" value={completedCount} />
        <KpiCard icon={TrendingUp} label="Tasa de finalización" value={`${completionRate}%`} sub={`${completedCount} de ${active.length}`} />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart3 className="size-4 text-muted-foreground" />
            Distribución por estado
          </h3>
          <DonutChart data={statusData} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart3 className="size-4 text-muted-foreground" />
            Carga por responsable
          </h3>
          <HorizontalBarChart data={responsableData} />
        </div>
      </div>

      {/* Trend */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <TrendingUp className="size-4 text-muted-foreground" />
          Proyectos creados por mes
        </h3>
        <MonthlyTrendChart data={trendData} />
      </div>

      {/* Recently updated */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Últimos proyectos actualizados</h3>
        {recentlyUpdated.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin proyectos activos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Proyecto</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Estado</th>
                  <th className="pb-2 font-medium text-muted-foreground">Última actualización</th>
                </tr>
              </thead>
              <tbody>
                {recentlyUpdated.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 font-medium text-foreground">{p.name}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-2 whitespace-nowrap text-muted-foreground">{formatDate(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
