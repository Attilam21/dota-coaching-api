export default function AnalysisPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Analysis</h1>
      <p className="text-gray-600 mb-8">Choose an analysis type:</p>
      <div className="grid md:grid-cols-2 gap-6">
        <a
          href="/"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2">Match Analysis</h2>
          <p className="text-gray-600">Analyze a specific match by Match ID</p>
        </a>
        <a
          href="/"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2">Player Analysis</h2>
          <p className="text-gray-600">View player statistics and performance</p>
        </a>
      </div>
    </div>
  )
}

