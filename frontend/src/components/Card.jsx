export default function Card({ title, children, className = '', accent }) {
  const border = {
    indigo:  'border-l-4 border-l-indigo-500',
    emerald: 'border-l-4 border-l-emerald-500',
    violet:  'border-l-4 border-l-violet-500',
    amber:   'border-l-4 border-l-amber-500',
    red:     'border-l-4 border-l-red-500',
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5
        ${accent ? border[accent] : ''} ${className}`}
    >
      {title && (
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}
