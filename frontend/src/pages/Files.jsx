import { useCallback, useEffect, useState } from 'react'
import { getFiles, downloadFile } from '../lib/api'
import Card from '../components/Card'

// ── helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes == null || bytes === 0) return '—'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function fileIcon(name = '') {
  const ext = name.split('.').pop().toLowerCase()
  if (['jpg','jpeg','png','gif','svg','webp'].includes(ext)) return '🖼'
  if (['mp4','mov','avi','mkv'].includes(ext))               return '🎬'
  if (['mp3','wav','ogg'].includes(ext))                     return '🎵'
  if (['pdf'].includes(ext))                                 return '📄'
  if (['zip','tar','gz','rar'].includes(ext))                return '🗜'
  if (['csv','xlsx','xls'].includes(ext))                    return '📊'
  if (['js','ts','jsx','tsx','py','java','go','rs'].includes(ext)) return '💻'
  return '📁'
}

function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── replica badges ───────────────────────────────────────────────────────────
function ReplicaBadges({ replicas }) {
  if (!replicas?.length) return <span className="text-gray-300 dark:text-gray-600">N/A</span>
  return (
    <div className="flex flex-wrap gap-1">
      {replicas.map((r) => (
        <span
          key={r.node_id}
          className="inline-flex items-center gap-1 text-xs font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 border border-indigo-100 dark:border-indigo-800 rounded-md px-1.5 py-0.5"
        >
          {r.node_id}
        </span>
      ))}
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <tr className="animate-pulse border-b border-gray-50 dark:border-gray-700/50">
      <td className="py-3 px-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700"/><div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"/></div></td>
      <td className="py-3 px-4"><div className="h-3 w-14 bg-gray-100 dark:bg-gray-600 rounded"/></td>
      <td className="py-3 px-4"><div className="h-3 w-8  bg-gray-100 dark:bg-gray-600 rounded"/></td>
      <td className="py-3 px-4"><div className="h-3 w-20 bg-gray-100 dark:bg-gray-600 rounded"/></td>
      <td className="py-3 px-4 text-right"><div className="h-7 w-24 bg-gray-100 dark:bg-gray-600 rounded-lg ml-auto"/></td>
    </tr>
  )
}

function ChunkDrawer({ chunks }) {
  return (
    <tr>
      <td colSpan={5} className="px-4 pb-3 pt-0">
        <div className="rounded-xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 border-b border-indigo-100 dark:border-indigo-800">
                <th className="px-4 py-2 font-medium">Chunk ID</th>
                <th className="px-4 py-2 font-medium">Nodes</th>
                <th className="px-4 py-2 font-medium">Addresses</th>
                <th className="px-4 py-2 font-medium text-right">Size</th>
              </tr>
            </thead>
            <tbody>
              {chunks.map((c) => (
                <tr key={c.chunk_id} className="border-b border-indigo-50 dark:border-indigo-800/50 last:border-0">
                  <td className="px-4 py-2 font-mono text-indigo-500">{c.chunk_id}</td>
                  <td className="px-4 py-2"><ReplicaBadges replicas={c.replicas} /></td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400 font-mono">
                    {c.replicas?.map(r => r.node_address).join(', ') ?? 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">{formatBytes(c.size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  )
}

function FileRow({ filename, meta, downloading, onDownload }) {
  const [expanded, setExpanded] = useState(false)
  const totalSize = meta.chunks.reduce((sum, c) => sum + (c.size ?? 0), 0)

  const handleToggle = useCallback(() => setExpanded(e => !e), [])

  return (
    <>
      <tr className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/80 dark:hover:bg-gray-700/20 transition-colors group">
        {/* Name */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">{fileIcon(filename)}</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate max-w-[200px]" title={filename}>
              {filename}
            </span>
          </div>
        </td>

        {/* Size */}
        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 tabular-nums">
          {formatBytes(totalSize)}
        </td>

        {/* Chunks */}
        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 tabular-nums">
          {meta.total_chunks}
        </td>

        {/* Nodes */}
        <td className="py-3 px-4">
          <ReplicaBadges replicas={meta.chunks[0]?.replicas} />
        </td>

        {/* Actions */}
        <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end gap-2">
            {/* Expand chunks */}
            <button
              onClick={handleToggle}
              title={expanded ? 'Hide chunks' : 'Show chunks'}
              className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {expanded ? '▲ chunks' : '▼ chunks'}
            </button>

            {/* Download */}
            <button
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700
                disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-3 py-1.5 transition-colors"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Downloading…
                </>
              ) : (
                <>↓ Download</>
              )}
            </button>
          </div>
        </td>
      </tr>

      {/* Expandable chunk drawer */}
      {expanded && <ChunkDrawer chunks={meta.chunks} />}
    </>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function Files() {
  const [files, setFiles]           = useState({})
  const [loading, setLoading]       = useState(true)
  const [fetchErr, setFetchErr]     = useState(null)
  const [search, setSearch]         = useState('')
  const [downloading, setDownloading] = useState({})  // { filename: true }

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    setLoading(true)
    setFetchErr(null)
    try {
      const { data } = await getFiles()
      setFiles(data.files)
    } catch {
      setFetchErr('Could not reach master node at localhost:8000.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  // ── download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async (filename) => {
    setDownloading(prev => ({ ...prev, [filename]: true }))
    try {
      const { data } = await downloadFile(filename)
      triggerBrowserDownload(data, filename)
    } catch {
      // surface error inline on the row — no global toast needed
    } finally {
      setDownloading(prev => ({ ...prev, [filename]: false }))
    }
  }, [])

  // ── search filter ─────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((e) => setSearch(e.target.value), [])

  const filtered = Object.entries(files).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  )

  const totalSize = Object.values(files).reduce(
    (sum, meta) => sum + meta.chunks.reduce((s, c) => s + (c.size ?? 0), 0), 0
  )

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Files</h1>
          <p className="text-sm text-gray-400 mt-0.5">All files tracked by the master node</p>
        </div>
        <button
          onClick={fetchFiles}
          className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 mt-1 transition-colors"
        >
          ↺ Refresh
        </button>
      </div>

      {/* Summary pills */}
      {!loading && !fetchErr && (
        <div className="flex gap-3 flex-wrap">
          <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-full px-3 py-1">
            {Object.keys(files).length} file{Object.keys(files).length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800 rounded-full px-3 py-1">
            {formatBytes(totalSize)} total
          </span>
        </div>
      )}

      <Card accent="indigo">
        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500 text-sm">⌕</span>
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search files…"
              className="w-full pl-8 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600
                bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100
                placeholder-gray-300 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
        </div>

        {/* Error */}
        {fetchErr && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3">
            <span>✕</span> {fetchErr}
          </div>
        )}

        {/* Table */}
        {!fetchErr && (
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/40 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">File Name</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Chunks</th>
                  <th className="px-4 py-3 font-medium">Node</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Loading skeletons */}
                {loading && <><Skeleton/><Skeleton/><Skeleton/><Skeleton/></>}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <span className="text-4xl">❑</span>
                        <p className="text-sm font-medium">
                          {search ? `No files matching "${search}"` : 'No files uploaded yet'}
                        </p>
                        <p className="text-xs">
                          {search ? 'Try a different search term' : 'Upload a file to get started'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* File rows */}
                {!loading && filtered.map(([filename, meta]) => (
                  <FileRow
                    key={filename}
                    filename={filename}
                    meta={meta}
                    downloading={!!downloading[filename]}
                    onDownload={() => handleDownload(filename)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
