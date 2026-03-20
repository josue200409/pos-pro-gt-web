import { useTema } from '../context/TemaContext'

export function Skeleton({ className = '' }) {
  const { modoOscuro } = useTema()
  return (
    <div className={`animate-pulse rounded-xl ${modoOscuro ? 'bg-gray-700' : 'bg-gray-200'} ${className}`}></div>
  )
}

export function SkeletonCard({ modoOscuro }) {
  return (
    <div className={`rounded-2xl border p-5 ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

export function SkeletonTable({ filas = 5, modoOscuro }) {
  return (
    <div className={`rounded-2xl border overflow-hidden ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className={`p-4 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: filas }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonDashboard({ modoOscuro }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 bg-gray-200 animate-pulse h-28"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={`rounded-2xl border p-5 ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
)export function SkeletonCards({ cantidad = 4, modoOscuro }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className={`rounded-2xl p-5 h-28 animate-pulse ${modoOscuro ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
      ))}
    </div>
  )
}

export function SkeletonList({ filas = 5, modoOscuro }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className={`rounded-2xl p-4 flex items-center gap-4 animate-pulse ${modoOscuro ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div className={`w-12 h-12 rounded-xl flex-shrink-0 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <div className="flex-1 space-y-2">
            <div className={`h-4 rounded-lg w-48 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <div className={`h-3 rounded-lg w-32 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          </div>
          <div className={`h-6 w-16 rounded-full ${modoOscuro ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
        </div>
      ))}
    </div>
  )
}

}
