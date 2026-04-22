import { useEffect, useReducer, useRef, useState } from 'react'
import { getNodes, registerNode, pingNode } from '../lib/api'
import Card from '../components/Card'

// ── helpers ───────────────────────────────────────────────────────────────────
function isValidUrl(str) {
  try { new URL(str); return true } catch { return false }
}

// ── sub-components ────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-40 bg-gray-100 dark:bg-gray-600 rounded" />
      </div>
      <div className="h-5 w-16 bg-gray-100 dark:bg-gray-700 rounded-full" />
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    active:   'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
    inactive: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
    checking: 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-700/30 dark:text-gray-500 dark:border-gray-600',
  }
  const dot = {
    active:   'bg-emerald-500 animate-pulse',
    inactive: 'bg-red-500',
    checking: 'bg-gray-400 animate-pulse',
  }
  const label = { active: 'Active', inactive: 'Inactive', checking: 'Checking…' }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
      {label[status]}
    </span>
  )
}

function NodeCard({ nodeId, address, status, onRecheck }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors group">
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-500 text-lg shrink-0">
        ◈
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-mono font-semibold text-sm text-gray-800 dark:text-gray-100">{nodeId}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{address}</p>
      </div>

      {/* Status + recheck */}
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={status} />
        <button
          onClick={onRecheck}
          title="Re-check status"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-indigo-500 text-sm p-1 rounded"
        >
          ↺
        </button>
      </div>
    </div>
  )
}

// ── form field ────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, error, ...rest }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
          placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition
          ${error ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
        {...rest}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function Nodes() {
  // node map: { [nodeId]: { address, status: 'checking'|'active'|'inactive' } }
  const [nodes, setNodes]       = useReducer((s, patch) => ({ ...s, ...patch }), {})
  const [loading, setLoading]   = useState(true)
  const [fetchErr, setFetchErr] = useState(null)

  // form
  const [nodeId, setNodeId]     = useState('')
  const [address, setAddress]   = useState('')
  const [errors, setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]       = useState(null)   // { type: 'success'|'error', text }
  const toastTimer              = useRef(null)

  // ── fetch + ping ─────────────────────────────────────────────────────────
  const pingAll = (nodeMap) => {
    Object.entries(nodeMap).forEach(([id, { address: addr }]) => {
      pingNode(addr)
        .then(() => setNodes({ [id]: { address: addr, status: 'active' } }))
        .catch(() => setNodes({ [id]: { address: addr, status: 'inactive' } }))
    })
  }

  const fetchNodes = async () => {
    setLoading(true)
    setFetchErr(null)
    try {
      const { data } = await getNodes()
      // data.nodes = { nodeId: address, … }
      const initial = Object.fromEntries(
        Object.entries(data.nodes).map(([id, addr]) => [id, { address: addr, status: 'checking' }])
      )
      setNodes(initial)
      pingAll(initial)
    } catch {
      setFetchErr('Could not reach master node at localhost:8000.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNodes() }, [])

  // ── toast helper ──────────────────────────────────────────────────────────
  const showToast = (type, text) => {
    clearTimeout(toastTimer.current)
    setToast({ type, text })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // ── form validation ───────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!nodeId.trim())              e.nodeId  = 'Node ID is required.'
    if (!address.trim())             e.address = 'Address is required.'
    else if (!isValidUrl(address))   e.address = 'Enter a valid URL (e.g. http://localhost:8001).'
    return e
  }

  // ── register ──────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    try {
      await registerNode(nodeId.trim(), address.trim())
      // Optimistically add as 'checking', then ping
      const id = nodeId.trim(), addr = address.trim()
      setNodes({ [id]: { address: addr, status: 'checking' } })
      pingNode(addr)
        .then(() => setNodes({ [id]: { address: addr, status: 'active' } }))
        .catch(() => setNodes({ [id]: { address: addr, status: 'inactive' } }))
      showToast('success', `Node "${id}" registered successfully.`)
      setNodeId(''); setAddress('')
    } catch (err) {
      showToast('error', err.response?.data?.detail ?? 'Registration failed. Is the master node running?')
    } finally {
      setSubmitting(false)
    }
  }

  // ── recheck single node ───────────────────────────────────────────────────
  const recheck = (id, addr) => {
    setNodes({ [id]: { address: addr, status: 'checking' } })
    pingNode(addr)
      .then(() => setNodes({ [id]: { address: addr, status: 'active' } }))
      .catch(() => setNodes({ [id]: { address: addr, status: 'inactive' } }))
  }

  const nodeList   = Object.entries(nodes)
  const activeCount   = nodeList.filter(([, v]) => v.status === 'active').length
  const inactiveCount = nodeList.filter(([, v]) => v.status === 'inactive').length

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Nodes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Register and monitor storage nodes</p>
        </div>
        <button
          onClick={fetchNodes}
          className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 mt-1 transition-colors"
        >
          ↺ Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 border
          ${toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
          }`}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.text}
        </div>
      )}

      {/* Register form */}
      <Card title="Register New Node" accent="indigo">
        <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Node ID"
              value={nodeId}
              onChange={e => setNodeId(e.target.value)}
              placeholder="e.g. node1"
              error={errors.nodeId}
            />
            <Field
              label="Address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. http://localhost:8001"
              error={errors.address}
              type="url"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="self-start bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
              text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors flex items-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            )}
            {submitting ? 'Registering…' : 'Register Node'}
          </button>
        </form>
      </Card>

      {/* Node list */}
      <Card
        title={`Registered Nodes${nodeList.length ? ` (${nodeList.length})` : ''}`}
        accent="emerald"
      >
        {/* Summary pills */}
        {nodeList.length > 0 && (
          <div className="flex gap-2 mb-4">
            <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-full px-2.5 py-1">
              {activeCount} active
            </span>
            <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-full px-2.5 py-1">
              {inactiveCount} inactive
            </span>
          </div>
        )}

        {/* Fetch error */}
        {fetchErr && (
          <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
            {fetchErr}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && !fetchErr && (
          <div className="flex flex-col gap-3">
            <Skeleton /><Skeleton /><Skeleton />
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchErr && nodeList.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
            <span className="text-4xl">◈</span>
            <p className="text-sm">No nodes registered yet.</p>
            <p className="text-xs">Use the form above to add your first storage node.</p>
          </div>
        )}

        {/* Node cards */}
        {!loading && nodeList.length > 0 && (
          <div className="flex flex-col gap-3">
            {nodeList.map(([id, { address: addr, status }]) => (
              <NodeCard
                key={id}
                nodeId={id}
                address={addr}
                status={status}
                onRecheck={() => recheck(id, addr)}
              />
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}
