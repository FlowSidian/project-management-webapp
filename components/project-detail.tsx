"use client"

import { useEffect, useState, useTransition } from "react"
import { ExternalLink, Plus, Trash2, History, Link2 } from "lucide-react"
import type { Project, ChangeHistoryEntry } from "@/lib/types"
import { getHistory, addAttachment, removeAttachment } from "@/app/actions/projects"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { DeadlineBadge } from "@/components/deadline-badge"

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"

export function ProjectDetail({
  project,
  isAdmin,
  onClose,
}: {
  project: Project
  isAdmin: boolean
  onClose: () => void
}) {
  const [tab, setTab] = useState<"info" | "history">("info")
  const [history, setHistory] = useState<ChangeHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (tab !== "history") return
    setLoadingHistory(true)
    getHistory(project.id)
      .then(setHistory)
      .finally(() => setLoadingHistory(false))
  }, [tab, project.id])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    })

  const handleAddAttachment = (formData: FormData) => {
    startTransition(async () => {
      await addAttachment(formData)
      onClose()
    })
  }

  const handleRemoveAttachment = (id: number) => {
    startTransition(async () => {
      await removeAttachment(id, project.id)
      onClose()
    })
  }

  return (
    <Modal open onClose={onClose} title={project.name}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={project.status} />
        <DeadlineBadge deadline={project.deadline} status={project.status} />
        <span className="text-xs text-muted-foreground">
          Actualizado {formatDate(project.updatedAt)}
        </span>
        {project.archived ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Archivado
          </span>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab("info")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "info"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2 className="size-4" />
          Información
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "history"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="size-4" />
          Historial de cambios
        </button>
      </div>

      {tab === "info" ? (
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Responsables
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {project.responsables.length === 0 ? (
                <span className="text-sm text-muted-foreground">Sin responsables asignados</span>
              ) : (
                project.responsables.map((r) => (
                  <span
                    key={r}
                    className="rounded-md bg-secondary px-2 py-0.5 text-sm text-secondary-foreground"
                  >
                    {r}
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notas
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {project.notas || "Sin notas."}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Archivos y enlaces adjuntos
            </h3>
            <ul className="flex flex-col gap-2">
              {project.attachments.length === 0 ? (
                <li className="text-sm text-muted-foreground">No hay enlaces adjuntos.</li>
              ) : (
                project.attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="size-4 shrink-0" />
                      <span className="truncate">{a.descripcion || a.url}</span>
                    </a>
                    {isAdmin ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveAttachment(a.id)}
                        disabled={isPending}
                        aria-label="Quitar enlace"
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </li>
                ))
              )}
            </ul>

            {isAdmin ? (
              <form
                action={handleAddAttachment}
                className="mt-3 flex flex-col gap-2 rounded-lg border border-dashed border-border p-3 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="projectId" value={project.id} />
                <div className="flex-1">
                  <label htmlFor="att-url" className="mb-1 block text-xs text-muted-foreground">
                    URL
                  </label>
                  <input
                    id="att-url"
                    name="url"
                    type="url"
                    required
                    placeholder="https://..."
                    className={fieldClass}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="att-desc" className="mb-1 block text-xs text-muted-foreground">
                    Descripción
                  </label>
                  <input
                    id="att-desc"
                    name="descripcion"
                    placeholder="Ej. Documento de requisitos"
                    className={fieldClass}
                  />
                </div>
                <Button type="submit" disabled={isPending}>
                  <Plus />
                  Agregar
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      ) : (
        <div>
          {loadingHistory ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Cargando historial...</p>
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay cambios registrados para este proyecto.
            </p>
          ) : (
            <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[1.4rem] top-1 size-2.5 rounded-full border-2 border-card bg-primary" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{h.field}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(h.changedAt)}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                      {h.changedBy}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    {h.oldValue ? (
                      <span className="text-muted-foreground line-through">{h.oldValue}</span>
                    ) : null}
                    {h.oldValue && h.newValue ? (
                      <span className="mx-1.5 text-muted-foreground">→</span>
                    ) : null}
                    {h.newValue ? <span className="text-foreground">{h.newValue}</span> : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </Modal>
  )
}
