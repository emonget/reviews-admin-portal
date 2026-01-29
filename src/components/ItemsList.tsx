import { useState, useEffect } from 'react'
import { MoviesList } from './MoviesList'
import { getTableData } from '@/services/database'
import type { Tables } from '@/types/database'
import type { ReviewData } from '@/types/datamodel'

interface ReviewSource {
  domain: string
  publicationName?: string
  count: number
}

// Augment Tables<'reviews'> to include ReviewData type for 'data' property
type ReviewTableRecord = Omit<Tables<'reviews'>, 'data'> & { data: ReviewData }

interface ItemsListProps {
  isLoading: boolean
  error: string | null
  itemsSelector: 'movies' | 'sources'
  movies?: Tables<'movies'>[]
  onMovieSelect?: (movie: Tables<'movies'>) => void
  selectedMovieId?: string
  onSourceSelect?: (source: ReviewSource) => void
  selectedSourceId?: string
}

export function ItemsList({ isLoading, error, itemsSelector, movies, onMovieSelect, selectedMovieId, onSourceSelect, selectedSourceId }: ItemsListProps) {
  const [allSources, setAllSources] = useState<ReviewSource[]>([])
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [sourceStats, setSourceStats] = useState<{ totalDomains: number, eq1: number, r2_4: number, r5_9: number, r10p: number }>({ totalDomains: 0, eq1: 0, r2_4: 0, r5_9: 0, r10p: 0 })
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'eq1' | 'r2_4' | 'r5_9' | 'r10p'>('all')
  

  useEffect(() => {
    const fetchReviewsCount = async () => {
      if (itemsSelector !== 'movies') return

      try {
        const result = await getTableData<ReviewTableRecord>('reviews')
        if (result.data) {
          setTotalReviews(result.data.length)
        }
      } catch (_err) { // err unused
        console.error('Failed to fetch reviews count:', _err)
        setTotalReviews(0)
      }
    }

    const fetchSources = async () => {
      if (itemsSelector !== 'sources') return

      try {
        const result = await getTableData<ReviewTableRecord>('reviews')
        if (result.data) {
          setTotalReviews(result.data.length) // Also update total reviews for sources view

          const domainCount = new Map<string, { count: number, publicationName: string }>()

          result.data.forEach((review) => {
            const reviewData = review.data as ReviewData
            const reviewUrl = reviewData.reviewUrl || reviewData.publicationUrl
            if (reviewUrl) {
              try {
                const urlObj = new URL(reviewUrl)
                const domain = urlObj.hostname.replace(/^www\./, '')
                const existing = domainCount.get(domain)
                if (existing) {
                  existing.count += 1
                  if (reviewData.publicationName && !existing.publicationName) {
                    existing.publicationName = reviewData.publicationName
                  }
                } else {
                  domainCount.set(domain, {
                    count: 1,
                    publicationName: reviewData.publicationName || ''
                  })
                }
              } catch (_err) { // Skip malformed URLs, err unused
                // console.error("Malformed URL:", _err);
              }
            }
          })

          // Set total unique sources count

          // Compute stats across ALL domains (not just displayed slice)
          let eq1 = 0
          let r2_4 = 0
          let r5_9 = 0
          let r10p = 0
          for (const { count } of domainCount.values()) {
            if (count === 1) eq1 += 1
            else if (count >= 2 && count <= 4) r2_4 += 1
            else if (count >= 5 && count <= 9) r5_9 += 1
            else if (count >= 10) r10p += 1
          }
          setSourceStats({ totalDomains: domainCount.size, eq1, r2_4, r5_9, r10p })

          const sourceData = Array.from(domainCount.entries())
            .map(([domain, { count, publicationName }]) => ({
              domain,
              publicationName,
              count
            }))
            .sort((a, b) => b.count - a.count)

          setAllSources(sourceData)
        }
      } catch (_err) { // err unused
        console.error('Failed to fetch sources:', _err)
      }
    }

    fetchReviewsCount()
    fetchSources()
  }, [itemsSelector])



  if (itemsSelector === 'movies') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          <MoviesList
            movies={movies || []}
            isLoading={isLoading}
            error={error}
            onMovieSelect={onMovieSelect}
            selectedMovieId={selectedMovieId}
          />
        </div>

        {/* Footer - Movies Statistics */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
          {!isLoading && !error && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total movies: {movies?.length || 0} • Total reviews: {totalReviews}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (itemsSelector === 'sources') {
    const dataset = (() => {
      let list = allSources
      if (selectedCategory === 'eq1') list = list.filter(s => s.count === 1)
      else if (selectedCategory === 'r2_4') list = list.filter(s => s.count >= 2 && s.count <= 4)
      else if (selectedCategory === 'r5_9') list = list.filter(s => s.count >= 5 && s.count <= 9)
      else if (selectedCategory === 'r10p') list = list.filter(s => s.count >= 10)
      return list.slice(0, 100)
    })()
    const maxCount = dataset.length > 0 ? (dataset[0]?.count || 1) : 1

    return (
      <div className="h-full flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Loading sources...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="px-6 py-4 text-center text-red-600">
              <p>Error loading sources: {error}</p>
            </div>
          )}

          {!isLoading && !error && dataset.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p>No sources found</p>
              </div>
            </div>
          )}

          {!isLoading && !error && dataset.length > 0 && (
            <div className="space-y-3">
              {dataset.map((source: ReviewSource, index: number) => (
                <div
                  key={source.domain}
                  className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                    selectedSourceId === source.domain
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => onSourceSelect && onSourceSelect(source)}
                >
                  <div className="w-8 text-sm font-mono text-gray-500 flex-shrink-0">
                    {index + 1}.
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-medium ${
                        selectedSourceId === source.domain
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {source.domain}
                      </span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {source.count} reviews
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          selectedSourceId === source.domain
                            ? 'bg-blue-700'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${(source.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories (moved to bottom) */}
        <div className="px-4 pt-2 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => setSelectedCategory(prev => prev === 'all' ? 'all' : 'all')}
                className={`text-left rounded p-3 border transition-colors ${selectedCategory === 'all' ? 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-650'}`}
              >
                <div className="text-xs text-gray-500 dark:text-gray-300">Total domains</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sourceStats.totalDomains}</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory(prev => prev === 'eq1' ? 'all' : 'eq1')}
                className={`text-left rounded p-3 border transition-colors ${selectedCategory === 'eq1' ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100/70 dark:hover:bg-amber-900/20'}`}
              >
                <div className="text-xs text-amber-800 dark:text-amber-200">Exactly 1</div>
                <div className="text-lg font-semibold text-amber-900 dark:text-amber-100">{sourceStats.eq1}</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory(prev => prev === 'r2_4' ? 'all' : 'r2_4')}
                className={`text-left rounded p-3 border transition-colors ${selectedCategory === 'r2_4' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 hover:bg-blue-100/70 dark:hover:bg-blue-900/20'}`}
              >
                <div className="text-xs text-blue-800 dark:text-blue-200">2 - 4</div>
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">{sourceStats.r2_4}</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory(prev => prev === 'r5_9' ? 'all' : 'r5_9')}
                className={`text-left rounded p-3 border transition-colors ${selectedCategory === 'r5_9' ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-800' : 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800/50 hover:bg-violet-100/70 dark:hover:bg-violet-900/20'}`}
              >
                <div className="text-xs text-violet-800 dark:text-violet-200">5 - 9</div>
                <div className="text-lg font-semibold text-violet-900 dark:text-violet-100">{sourceStats.r5_9}</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory(prev => prev === 'r10p' ? 'all' : 'r10p')}
                className={`text-left rounded p-3 border transition-colors ${selectedCategory === 'r10p' ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-800' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50 hover:bg-rose-100/70 dark:hover:bg-rose-900/20'}`}
              >
                <div className="text-xs text-rose-800 dark:text-rose-200">10+</div>
                <div className="text-lg font-semibold text-rose-900 dark:text-rose-100">{sourceStats.r10p}</div>
              </button>
          </div>
        </div>

      </div>
    )
  }

  return null
}