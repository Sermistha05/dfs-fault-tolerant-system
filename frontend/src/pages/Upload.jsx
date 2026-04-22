import { useCallback, useRef, useState } from 'react'
import { uploadFile } from '../lib/api'
import Card from '../components/Card'

// ── helpers ───────────────────────────────────────────────────────────────────
const ACCEPTED = '*'   // accept any file type

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase()
  if (['jpg','jpeg','png','gif','svg','webp'].includes(ext)) return '🖼'
  if (['mp4','mov','avi','mkv'].includes(ext))               return '🎬'
  if (['mp3','wav','ogg'].includes(ext))                     return '🎵'
  if (['pdf'].includes(ext))                                 return '📄'
  if (['zip','tar','gz','rar'].includes(ext))                return '🗜'
  if (['csv','xlsx','xls'].includes(ext))                    return '📊'
  if (['js','ts','py','java','go','rs'].includes(ext))       return '💻'
  return '📁'
}

// ── sub-components ────────────────────────────────────────────────────────────
function ProgressBar({ pct }) {
  const color = pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-200 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function FilePreview({ file, onRemove }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
      <span className="text-2xl">{fileIcon(file.name)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{file.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
      </div>
      <button
        onClick={onRemove}
        className="text-gray-300 hover:text-red-400 dark:text-gray-500 dark:hover:text-red-400 transition-colors text-lg leading-none"
        title="Remove file"
      >
        ✕
      </button>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function Upload() {
  const [file, setFile]         = useState(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)       // 0-100
  const [phase, setPhase]       = useState('idle')  // idle | uploading | success | error
  const [result, setResult]     = useState(null)
  const inputRef                = useRef()

  // ── file selection ────────────────────────────────────────────────────────
  const pickFile = useCallback((picked) => {
    if (!picked) return
    setFile(picked)
    setPhase('idle')
    setProgress(0)
    setResult(null)
  }, [])

  const handleInputChange = useCallback((e) => {
    pickFile(e.target.files[0])
  }, [pickFile])

  const handleRemove = useCallback(() => {
    setFile(null)
    setPhase('idle')
    setProgress(0)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const handleZoneClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  // ── drag events ───────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragging(false), [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    pickFile(e.dataTransfer.files[0])
  }, [pickFile])

  // ── upload ────────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    if (!file) return
    setPhase('uploading')
    setProgress(0)
    setResult(null)

    const fd = new FormData()
    fd.append('file', file)

    const onUploadProgress = (evt) => {
      if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100))
    }

    try {
      const { data } = await uploadFile(fd, onUploadProgress)
      setProgress(100)
      setPhase('success')
      setResult(data)
    } catch (err) {
      setPhase('error')
      setResult(err.response?.data?.detail ?? 'Upload failed. Is the master node running?')
    }
  }, [file])

  // ── derived ───────────────────────────────────────────────────────────────
  const isUploading = phase === 'uploading'
  const dropZoneCls = [
    'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors',
    dragging
      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
      : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700/20',
  ].join(' ')

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Upload File</h1>
        <p className="text-sm text-gray-400 mt-0.5">Send a file to the distributed storage cluster</p>
      </div>

      <Card accent="indigo">
        <div className="flex flex-col gap-5">

          {/* Drop zone — hidden when file is selected */}
          {!file && (
            <div
              className={dropZoneCls}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleZoneClick}
            >
              <span className="text-4xl select-none">☁</span>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Drag &amp; drop a file here
                </p>
                <p className="text-xs text-gray-400 mt-1">or click to browse from your computer</p>
              </div>
              <span className="text-xs text-gray-300 dark:text-gray-500">Any file type · No size limit</span>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleInputChange}
          />

          {/* File preview */}
          {file && <FilePreview file={file} onRemove={handleRemove} />}

          {/* Progress */}
          {isUploading && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar pct={progress} />
            </div>
          )}

          {/* Progress — complete */}
          {phase === 'success' && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Complete</span>
                <span>100%</span>
              </div>
              <ProgressBar pct={100} />
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
              disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold
              rounded-xl py-3 transition-colors"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Uploading {progress}%
              </>
            ) : (
              <>↑ Upload</>
            )}
          </button>

        </div>
      </Card>

      {/* Success result */}
      {phase === 'success' && result && (
        <Card accent="emerald">
          <div className="flex items-start gap-3">
            <span className="text-emerald-500 text-xl mt-0.5">✓</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
                File uploaded successfully
              </p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
                {[
                  ['File',    result.chunk_id],
                  ['Node',    result.node],
                  ['Status',  result.storage?.status],
                  ['Size',    result.storage?.size != null ? formatBytes(result.storage.size) : undefined],
                ].filter(([, v]) => v != null).map(([label, value]) => (
                  <>
                    <dt key={`dt-${label}`} className="text-gray-400 font-medium">{label}</dt>
                    <dd key={`dd-${label}`} className="font-mono text-gray-700 dark:text-gray-200 truncate">{value}</dd>
                  </>
                ))}
              </dl>
            </div>
          </div>
        </Card>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-4 py-3">
          <span className="text-red-500 text-lg mt-0.5">✕</span>
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Upload failed</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
              {typeof result === 'string' ? result : JSON.stringify(result)}
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
