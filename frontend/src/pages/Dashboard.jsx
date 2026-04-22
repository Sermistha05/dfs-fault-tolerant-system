import Card from '../components/Card'

// ── Dummy data ────────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Total Nodes',    value: '4',    sub: '3 online · 1 offline', color: 'bg-indigo-500',  icon: '◈' },
  { label: 'Files Stored',   value: '128',  sub: '+12 this week',         color: 'bg-violet-500',  icon: '❑' },
  { label: 'System Status',  value: 'Online', sub: 'All services healthy', color: 'bg-emerald-500', icon: '⬡' },
  { label: 'Storage Used',   value: '4.2 GB', sub: 'of 20 GB total',      color: 'bg-amber-500',   icon: '◉' },
]

const NODES = [
  { id: 'node1', address: 'http://localhost:8001', chunks: 54, status: 'online' },
  { id: 'node2', address: 'http://localhost:8002', chunks: 41, status: 'online' },
  { id: 'node3', address: 'http://localhost:8003', chunks: 33, status: 'online' },
  { id: 'node4', address: 'http://localhost:8004', chunks: 0,  status: 'offline' },
]

const ACTIVITY = [
  { time: '2 min ago',  event: 'File uploaded',       detail: 'report_q2.pdf → node1',      type: 'upload' },
  { time: '15 min ago', event: 'Node registered',     detail: 'node4 at :8004',              type: 'node' },
  { time: '1 hr ago',   event: 'File uploaded',       detail: 'dataset_v3.csv → node2',      type: 'upload' },
  { time: '3 hr ago',   event: 'Node went offline',   detail: 'node4 unreachable',           type: 'error' },
  { time: '5 hr ago',   event: 'File uploaded',       detail: 'backup_2024.zip → node3',     type: 'upload' },
]

const STORAGE_NODES = [
  { id: 'node1', used: 1.8, total: 5 },
  { id: 'node2', used: 1.4, total: 5 },
  { id: 'node3', used: 1.0, total: 5 },
  { id: 'node4', used: 0,   total: 5 },
]

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

const activityIcon = { upload: '↑', node: '◈', error: '⚠' }
const activityColor = {
  upload: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
  node:   'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  error:  'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
}

function StorageBar({ id, used, total }) {
  const pct = Math.round((used / total) * 100)
  const color = pct === 0 ? 'bg-gray-300 dark:bg-gray-600' : pct > 80 ? 'bg-red-500' : 'bg-indigo-500'
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-12 font-mono text-gray-500 dark:text-gray-400 text-xs">{id}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 text-right text-xs text-gray-400">{used} / {total} GB</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
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
        {STATS.map(s => <StatTile key={s.label} {...s} />)}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Node table — spans 2 cols */}
        <Card title="Storage Nodes" accent="indigo" className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="pb-2 font-medium">Node ID</th>
                <th className="pb-2 font-medium">Address</th>
                <th className="pb-2 font-medium text-right">Chunks</th>
                <th className="pb-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {NODES.map(n => (
                <tr key={n.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="py-2.5 font-mono text-indigo-500 font-medium">{n.id}</td>
                  <td className="py-2.5 text-gray-500 dark:text-gray-400">{n.address}</td>
                  <td className="py-2.5 text-right text-gray-700 dark:text-gray-300 font-medium">{n.chunks}</td>
                  <td className="py-2.5 text-right"><StatusBadge status={n.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Storage usage */}
        <Card title="Storage Usage" accent="violet">
          <div className="flex flex-col gap-4">
            {STORAGE_NODES.map(n => <StorageBar key={n.id} {...n} />)}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between text-xs text-gray-400">
            <span>Total capacity</span>
            <span className="font-semibold text-gray-600 dark:text-gray-300">20 GB</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Used</span>
            <span className="font-semibold text-gray-600 dark:text-gray-300">4.2 GB (21%)</span>
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent activity */}
        <Card title="Recent Activity" accent="emerald" className="lg:col-span-2">
          <ul className="flex flex-col gap-3">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${activityColor[a.type]}`}>
                  {activityIcon[a.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{a.event}</p>
                  <p className="text-xs text-gray-400 truncate">{a.detail}</p>
                </div>
                <span className="text-xs text-gray-300 dark:text-gray-500 shrink-0">{a.time}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Quick stats */}
        <Card title="Quick Stats" accent="amber">
          <ul className="flex flex-col gap-4 text-sm">
            {[
              { label: 'Avg chunks / node', value: '32' },
              { label: 'Largest file',      value: 'backup_2024.zip' },
              { label: 'Last upload',       value: '2 min ago' },
              { label: 'Replication factor',value: '1×' },
              { label: 'Master uptime',     value: '14 h 32 m' },
            ].map(({ label, value }) => (
              <li key={label} className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700/50 pb-3 last:border-0 last:pb-0">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{value}</span>
              </li>
            ))}
          </ul>
        </Card>

      </div>
    </div>
  )
}
