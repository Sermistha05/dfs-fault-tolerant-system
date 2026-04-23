import { useEffect, useState } from 'react'
import Card from '../components/Card'
import { getNodes, getFiles, getStats } from '../lib/api'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, color, icon }) {
  return (
    <div className={`${color} rounded-2xl p-5 text-white flex flex-col gap-3 shadow-md`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{label}</span>
        <span className="text-2xl opacity-70">{icon}</span>
      </div>
      <span className="text-3xl font-bold leading-none">{value}</span>
      <span className="text-xs opacity-70">{sub}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  return status === 'online'
    ? (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Online
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 dark:text-red-400">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Offline
      </span>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [nodes, setNodes]   = useState({})
  const [files, setFiles]   = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getNodes(), getFiles()])
      .then(([s, n, f]) => {
        setStats(s.data)
        setNodes(n.data.nodes ?? {})
        setFiles(f.data.files ?? {})
      })
      .finally(() => setLoading(false))
  }, [])

  const nodeList  = Object.entries(nodes).map(([id, address]) => ({ id, address }))
  const fileList  = Object.entries(files)
  const totalStorage = stats?.total_storage_used ?? 0

  const statTiles = [
    { label: 'Total Nodes',   value: loading ? '…' : stats?.total_nodes ?? 0,   sub: loading ? '' : `${stats?.active_nodes ?? 0} online`,  color: 'bg-indigo-500',  icon: '◈' },
    { label: 'Files Stored',  value: loading ? '…' : stats?.total_files ?? 0,   sub: 'total uploaded',                                      color: 'bg-violet-500',  icon: '❑' },
    { label: 'System Status', value: loading ? '…' : (stats?.active_nodes > 0 ? 'Online' : 'Degraded'), sub: 'master node healthy',         color: 'bg-emerald-500', icon: '⬡' },
    { label: 'Storage Used',  value: loading ? '…' : formatBytes(totalStorage), sub: 'across all nodes',                                    color: 'bg-amber-500',   icon: '◉' },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Distributed File System — overview</p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System Healthy
        </span>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statTiles.map(s => <StatTile key={s.label} {...s} />)}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Node table */}
        <Card title="Storage Nodes" accent="indigo" className="lg:col-span-2">
          {nodeList.length === 0 ? (
            <p className="text-sm text-gray-400">No nodes registered.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-2 font-medium">Node ID</th>
                  <th className="pb-2 font-medium">Address</th>
                  <th className="pb-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {nodeList.map(n => (
                  <tr key={n.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-2.5 font-mono text-indigo-500 font-medium">{n.id}</td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">{n.address}</td>
                    <td className="py-2.5 text-right"><StatusBadge status="online" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Quick stats */}
        <Card title="Quick Stats" accent="amber">
          <ul className="flex flex-col gap-4 text-sm">
            {[
              { label: 'Total nodes',    value: stats?.total_nodes ?? '…' },
              { label: 'Active nodes',   value: stats?.active_nodes ?? '…' },
              { label: 'Total files',    value: stats?.total_files ?? '…' },
              { label: 'Storage used',   value: formatBytes(totalStorage) },
              { label: 'Replication',    value: '1×' },
            ].map(({ label, value }) => (
              <li key={label} className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700/50 pb-3 last:border-0 last:pb-0">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Files table */}
      <Card title="Stored Files" accent="violet">
        {fileList.length === 0 ? (
          <p className="text-sm text-gray-400">No files uploaded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="pb-2 font-medium">Filename</th>
                <th className="pb-2 font-medium">Node</th>
                <th className="pb-2 font-medium text-right">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {fileList.map(([name, meta]) => {
                const chunk = meta.chunks?.[0]
                const size  = meta.chunks?.reduce((s, c) => s + (c.size ?? 0), 0) ?? 0
                return (
                  <tr key={name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-2.5 font-mono text-violet-500 font-medium truncate max-w-xs">{name}</td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">{chunk?.node_id ?? '—'}</td>
                    <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">{formatBytes(size)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

    </div>
  )
}
