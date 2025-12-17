'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { pageGuides, PageGuide } from '@/lib/pageGuides'

export default function HelpButton() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  // Get guide for current page, fallback to parent path if exact match not found
  const getGuide = (): PageGuide | null => {
    // Try exact match first
    if (pageGuides[pathname || '']) {
      return pageGuides[pathname || '']
    }
    
    // Try parent paths (for nested routes)
    const pathParts = pathname?.split('/').filter(Boolean) || []
    for (let i = pathParts.length; i > 0; i--) {
      const testPath = '/' + pathParts.slice(0, i).join('/')
      if (pageGuides[testPath]) {
        return pageGuides[testPath]
      }
    }
    
    return null
  }

  const guide = getGuide()

  if (!guide) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-white transition-colors shadow-lg"
        title="Guida"
        aria-label="Mostra guida"
      >
        <span className="text-lg">ℹ️</span>
        <span className="text-sm font-semibold">Help</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-900/50 to-purple-900/50 border-b border-gray-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <h2 className="text-xl font-bold text-white">{guide.title}</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
                  aria-label="Chiudi"
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-6 space-y-4">
                <p className="text-gray-300 text-base leading-relaxed">
                  {guide.description}
                </p>

                {guide.sections && guide.sections.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-gray-700">
                    {guide.sections.map((section, index) => (
                      <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {section.title}
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-900/50 border-t border-gray-700 p-4 flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

