"use client"

import { useMemo, useState } from "react"
import {
  LogOut, Plus, Search, Link2, Archive, ArchiveRestore, Pencil, Eye,
  BarChart3, LayoutList, Settings, ArrowUp, ArrowDown, ArrowUpDown,
} from "lucide-react"
import type { Project, ProjectStatus, Role, Responsable } from "@/lib/types"
import { PROJECT_STATUSES } from "@/lib/types"
import { logout } from "@/app/actions/auth"
import { setArchived } from "@/app/actions/projects"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProjectDetail } from "@/components/project-detail"
import { ProjectFormModal } from "@/components/project-form-modal"
import { ResponsablesManager } from "@/components/responsables-manager"
import { MetricsDashboard } from "@/components/metrics-dashboard"
import { DeadlineBadge } from "@/components/deadline-badge"

type View = "projects" | "metrics"
type SortKey = "name" | "status" | "responsables" | "updatedAt" | "notas" | "enlaces"
type SortDir = "asc" | "desc"

export function Dashboard({
  projects,
  role,
  responsables,
}: {
  projects: Project[]
  role: Role
  responsables: Responsable[]
}) {
  const isAdmin = role === "admin"

  const [view, setView] = useState<View>("projects")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "todos">("todos")
  const [responsableFilter, setResponsableFilter] = useState<string>("todos")
  const [showArchived, setShowArchived] = useState(false)

  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [respManagerOpen, setRespManagerOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const allResponsables = useMemo(() => {
    return responsables.map((r) => r.name).sort()
  }, [responsables])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = projects.filter((p) => {
      if (p.archived !== showArchived) return false
      if (statusFilter !== "todos" && p.status !== statusFilter) return false
      if (responsableFilter !== "todos" && !p.responsables.includes(responsableFilter)) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.notas.toLowerCase().includes(q)) return false
      return true
    })

    if (!sortKey) return list

    const dir = sortDir === "asc" ? 1 : -1
    return [...list].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name, "es")
          break
        case "status":
          cmp = a.status.localeCompare(b.status, "es")
          break
        case "responsables":
          cmp = (a.responsables[0] ?? "").localeCompare(b.responsables[0] ?? "", "es")
          break
        case "updatedAt":
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case "notas":
          cmp = (a.notas || "").localeCompare(b.notas || "", "es")
          break
        case "enlaces":
          cmp = a.attachments.length - b.attachments.length
          break
      }
      return cmp * dir
    })
  }, [projects, search, statusFilter, responsableFilter, showArchived, sortKey, sortDir])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    })

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden="true"
              >
                <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                <path d="m2 17 10 5 10-5" />
                <path d="m2 12 10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-foreground sm:text-base">
                Gestión de Proyectos
              </h1>
              <p className="text-xs text-muted-foreground">Dirección de Innovación y Tecnología</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border bg-muted p-0.5">
              <button
                onClick={() => setView("projects")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:py-1 ${
                  view === "projects" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutList className="size-3.5" />
                Proyectos
              </button>
              <button
                onClick={() => setView("metrics")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:py-1 ${
                  view === "metrics" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="size-3.5" />
                Métricas
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {isAdmin ? "Administrador" : "Visitante"}
              </span>

              <div className="flex items-center gap-1">
                {isAdmin ? (
                  <Button variant="outline" size="icon" onClick={() => setRespManagerOpen(true)} aria-label="Gestionar responsables">
                    <Settings />
                  </Button>
                ) : null}

                <ThemeToggle />
                <form action={logout}>
                  <Button variant="outline" size="icon" type="submit" aria-label="Cerrar sesión">
                    <LogOut />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {view === "metrics" ? (
          <MetricsDashboard projects={projects} />
        ) : (
          <>
            {/* Toolbar */}
            <div className="mb-5 flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o notas..."
                    className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "todos")}
                    aria-label="Filtrar por estado"
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                  >
                    <option value="todos">Todos los estados</option>
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <select
                    value={responsableFilter}
                    onChange={(e) => setResponsableFilter(e.target.value)}
                    aria-label="Filtrar por responsable"
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                  >
                    <option value="todos">Todos los responsables</option>
                    {allResponsables.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <Button
                    variant={showArchived ? "secondary" : "outline"}
                    onClick={() => setShowArchived((v) => !v)}
                  >
                    <Archive />
                    {showArchived ? "Viendo archivados" : "Ver archivados"}
                  </Button>

                  {isAdmin ? (
                    <Button
                      onClick={() => {
                        setEditProject(null)
                        setFormOpen(true)
                      }}
                    >
                      <Plus />
                      Nuevo proyecto
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "proyecto" : "proyectos"}
                {showArchived ? " archivados" : " activos"}
              </p>
            </div>

            {/* Sort bar (mobile) */}
            <div className="mb-3 flex items-center gap-2 lg:hidden">
              <span className="text-xs text-muted-foreground">Ordenar:</span>
              <select
                value={sortKey ?? ""}
                onChange={(e) => {
                  const v = e.target.value as SortKey | ""
                  if (v) { setSortKey(v); if (!sortKey) setSortDir("asc") } else { setSortKey(null) }
                }}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
              >
                <option value="">Sin orden</option>
                <option value="name">Proyecto</option>
                <option value="status">Estado</option>
                <option value="responsables">Responsables</option>
                <option value="updatedAt">Fecha</option>
                <option value="notas">Notas</option>
                <option value="enlaces">Enlaces</option>
              </select>
              {sortKey ? (
                <button
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="flex size-8 items-center justify-center rounded-lg border border-input bg-background text-foreground"
                >
                  {sortDir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
                </button>
              ) : null}
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 lg:hidden">
              {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No se encontraron proyectos con los filtros aplicados.
                </p>
              ) : (
                filtered.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <button
                        onClick={() => setDetailProject(p)}
                        className="text-left text-sm font-semibold text-foreground hover:text-primary hover:underline"
                      >
                        {p.name}
                      </button>
                      <StatusBadge status={p.status} />
                    </div>
                    {p.deadline ? (
                      <div className="mb-2">
                        <DeadlineBadge deadline={p.deadline} status={p.status} />
                      </div>
                    ) : null}
                    <div className="mb-2 flex flex-wrap gap-1">
                      {p.responsables.map((r) => (
                        <span key={r} className="rounded-md bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                          {r}
                        </span>
                      ))}
                    </div>
                    {p.notas ? (
                      <p className="mb-2 text-xs text-muted-foreground line-clamp-2">{p.notas}</p>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(p.updatedAt)}</span>
                        {p.attachments.length > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Link2 className="size-3" />
                            {p.attachments.length}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setDetailProject(p)} aria-label={`Ver ${p.name}`}>
                          <Eye />
                        </Button>
                        {isAdmin ? (
                          <>
                            <Button variant="ghost" size="icon-sm" onClick={() => { setEditProject(p); setFormOpen(true) }} aria-label={`Editar ${p.name}`}>
                              <Pencil />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => setArchived(p.id, !p.archived)} aria-label={p.archived ? `Restaurar ${p.name}` : `Archivar ${p.name}`}>
                              {p.archived ? <ArchiveRestore /> : <Archive />}
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-hidden rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      {([
                        ["name", "Proyecto", ""],
                        ["status", "Estado", ""],
                        ["responsables", "Responsables", ""],
                        ["updatedAt", "Última actualización", ""],
                        ["notas", "Notas", ""],
                        ["enlaces", "Enlaces", "text-center"],
                      ] as [SortKey, string, string][]).map(([key, label, extra]) => {
                        const active = sortKey === key
                        const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown
                        return (
                          <th key={key} className={`px-4 py-3 font-medium text-muted-foreground ${extra}`}>
                            <button
                              onClick={() => toggleSort(key)}
                              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              {label}
                              <Icon className={`size-3 ${active ? "text-foreground" : "text-muted-foreground/50"}`} />
                            </button>
                          </th>
                        )
                      })}
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                          No se encontraron proyectos con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setDetailProject(p)}
                              className="text-left font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {p.name}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={p.status} />
                              <DeadlineBadge deadline={p.deadline} status={p.status} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {p.responsables.length === 0 ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                p.responsables.map((r) => (
                                  <span
                                    key={r}
                                    className="rounded-md bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                                  >
                                    {r}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                            {formatDate(p.updatedAt)}
                          </td>
                          <td className="max-w-[220px] px-4 py-3">
                            <p className="truncate text-muted-foreground" title={p.notas}>
                              {p.notas || "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Link2 className="size-3.5" />
                              {p.attachments.length}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDetailProject(p)}
                                aria-label={`Ver detalle de ${p.name}`}
                              >
                                <Eye />
                              </Button>
                              {isAdmin ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => {
                                      setEditProject(p)
                                      setFormOpen(true)
                                    }}
                                    aria-label={`Editar ${p.name}`}
                                  >
                                    <Pencil />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setArchived(p.id, !p.archived)}
                                    aria-label={p.archived ? `Restaurar ${p.name}` : `Archivar ${p.name}`}
                                  >
                                    {p.archived ? <ArchiveRestore /> : <Archive />}
                                  </Button>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {detailProject ? (
        <ProjectDetail
          project={detailProject}
          isAdmin={isAdmin}
          onClose={() => setDetailProject(null)}
        />
      ) : null}

      {formOpen ? (
        <ProjectFormModal
          project={editProject}
          responsables={responsables}
          onClose={() => setFormOpen(false)}
        />
      ) : null}

      {respManagerOpen ? (
        <ResponsablesManager
          responsables={responsables}
          onClose={() => setRespManagerOpen(false)}
        />
      ) : null}
    </div>
  )
}
