'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle,
  Loader2, X,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImportResult {
  success: boolean
  total:   number
  created: number
  skipped: number
  failed:  number
  errors:  { row: number; error: string }[]
  error?:  string   // top-level parse error
}

interface Props {
  entity:    'companies' | 'workers'
  buttonVariant?: 'default' | 'outline' | 'secondary'
  buttonSize?:    'default' | 'sm'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImportDialog({ entity, buttonVariant = 'outline', buttonSize = 'sm' }: Props) {
  const label = entity === 'companies' ? 'Companies' : 'Workers'
  const apiPath = `/api/import/${entity}`

  const router                    = useRouter()
  const fileInputRef              = useRef<HTMLInputElement>(null)
  const [open, setOpen]           = useState(false)
  const [selectedFile, setFile]   = useState<File | null>(null)
  const [result, setResult]       = useState<ImportResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFile(file)
    setResult(null)
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setFile(file)
      setResult(null)
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    setOpen(false)
    if (result?.created && result.created > 0) {
      router.refresh()
    }
    setTimeout(reset, 300) // wait for dialog close animation
  }

  function handleImport() {
    if (!selectedFile) return

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('file', selectedFile)

        const res  = await fetch(apiPath, { method: 'POST', body: fd })
        const data = await res.json() as ImportResult
        setResult(data)

        // Auto-refresh list if all rows succeeded
        if (data.success && data.created > 0 && data.failed === 0) {
          router.refresh()
        }
      } catch (err) {
        setResult({
          success: false,
          total:   0,
          created: 0,
          skipped: 0,
          failed:  0,
          errors:  [],
          error:   err instanceof Error ? err.message : 'Network error',
        })
      }
    })
  }

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Import {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {label}</DialogTitle>
          <DialogDescription>
            Upload a CSV or XLSX file. Download the template below to see the required column format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Template download */}
          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Import Template</span>
            </div>
            <a href={apiPath} download>
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download Template
              </Button>
            </a>
          </div>

          {/* File upload area */}
          {!result && (
            <label
              htmlFor="import-file"
              className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors relative"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <input
                id="import-file"
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="sr-only"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="text-center px-4">
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium truncate max-w-xs">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB — ready to import
                  </p>
                </div>
              ) : (
                <div className="text-center px-4">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop file here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx, .xls</p>
                </div>
              )}
            </label>
          )}

          {/* Results panel */}
          {result && (
            <div className="space-y-3">
              {result.error ? (
                <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-800">{result.error}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border bg-green-50 p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{result.created}</p>
                      <p className="text-xs text-green-600 mt-0.5">Created</p>
                    </div>
                    <div className="rounded-md border bg-yellow-50 p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-700">{result.skipped}</p>
                      <p className="text-xs text-yellow-600 mt-0.5">Skipped</p>
                    </div>
                    <div className="rounded-md border bg-red-50 p-3 text-center">
                      <p className="text-2xl font-bold text-red-700">{result.failed}</p>
                      <p className="text-xs text-red-600 mt-0.5">Failed</p>
                    </div>
                  </div>

                  {result.created > 0 && result.failed === 0 && (
                    <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      <p className="text-sm text-green-800 font-medium">
                        Import complete — {result.created} {label.toLowerCase()} added
                      </p>
                    </div>
                  )}

                  {result.errors.length > 0 && (
                    <div className="rounded-md border">
                      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/40">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">{result.errors.length} issue(s)</span>
                      </div>
                      <div className="max-h-40 overflow-y-auto divide-y">
                        {result.errors.map((e, i) => (
                          <div key={i} className="flex items-start gap-3 px-3 py-2">
                            <Badge variant="outline" className="text-xs shrink-0 mt-0.5">Row {e.row}</Badge>
                            <p className="text-xs text-muted-foreground">{e.error}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            {result ? (
              <>
                <Button variant="outline" size="sm" onClick={reset}>
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Import Another File
                </Button>
                <Button size="sm" onClick={handleClose}>
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedFile || isPending}
                  onClick={handleImport}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Import
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
