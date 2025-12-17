import dynamic from 'next/dynamic'

const HomeContent = dynamic(() => import('./HomeContent'), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-2/3 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    </div>
  ),
})

export default function Home() {
  return <HomeContent />
}
