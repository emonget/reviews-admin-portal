import { useMemo, useState } from 'react'
import { useReviewSelection } from '@/hooks/useReviewSelection'
import { SearchComponent } from './SearchComponent'
import type { Tables } from '@/types/database'
import type { ReviewData } from '@/types/datamodel'

// Define ReviewSource type for clarity if not globally available
interface ReviewSource {
  domain: string
  publicationName?: string
  count: number
}

// Augment Tables<'reviews'> to include ReviewData type for 'data' property
type ReviewItem = Omit<Tables<'reviews'>, 'data'> & { data: ReviewData }

export function CapturePage() {
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'analysis'>('content')

  const {
    movies,
    sources,
    allReviews,
    selectedMovie,
    selectedSource,
    handleMovieSelect,
    handleSourceSelect,
  } = useReviewSelection()

  const onReviewSelect = (review: ReviewItem) => {
    setSelectedReview(review)
  }

  const handleMovieSelectAndClear = (movie: Tables<'movies'>) => {
    handleMovieSelect(movie)
    setSelectedReview(null)
  }

  const handleSourceSelectAndClear = (source: ReviewSource) => {
    handleSourceSelect(source)
    setSelectedReview(null)
  }

  const reviewsForSelectedItem = useMemo(() => {
    if (selectedMovie) {
      return allReviews.filter(
        (review) => review.movie_id === selectedMovie.ems_id
      )
    }
    if (selectedSource) {
      return allReviews.filter((review) => {
        try {
          const reviewData = review.data as ReviewData
          const reviewUrl = reviewData?.reviewUrl || reviewData?.publicationUrl
          if (reviewUrl && typeof reviewUrl === 'string') {
            const urlObj = new URL(reviewUrl)
            const domain = urlObj.hostname.replace(/^www\./, '')
            return domain === selectedSource.domain
          }
          return false
        } catch { // urlError is unused
          return false
        }
      })
    }
    return []
  }, [allReviews, selectedMovie, selectedSource])

  const reviewsCountForAllMovies = useMemo(() => {
    const countMap: { [key: string]: number } = {}
    allReviews.forEach((review) => {
      const movieId = review.movie_id as string
      if (movieId) {
        countMap[movieId] = (countMap[movieId] || 0) + 1
      }
    })
    return countMap
  }, [allReviews])

  return (
    <div className="h-full flex flex-row">
      <div className="w-1/3 flex flex-col border-r border-gray-200 dark:border-gray-800">
        <div className="p-4">
          <div className="max-w-4xl w-full">
            <SearchComponent
              movies={movies}
              sources={sources}
              onMovieSelect={handleMovieSelectAndClear}
              onSourceSelect={handleSourceSelectAndClear}
              reviewsCount={reviewsCountForAllMovies}
            />
          </div>
        </div>
        
        { (selectedMovie || selectedSource) && (
          <div className="flex-1 flex flex-col px-4 pb-4 overflow-hidden">
            <div className="max-w-4xl w-full h-full flex flex-col border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex-1 overflow-y-auto">
                {reviewsForSelectedItem.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {reviewsForSelectedItem.map((review) => (
                      <div
                          key={review.review_id}
                          onClick={() => onReviewSelect(review)}
                          className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${selectedReview?.review_id === review.review_id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                      >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {(review.data as ReviewData)?.criticName || 'Unknown Critic'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {review.review_id}
                          </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                      <p>No reviews found for the selected item.</p>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {reviewsForSelectedItem.length} review{reviewsForSelectedItem.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="w-2/3 flex flex-col">
        {selectedReview ? (
          <div className="flex flex-col h-full">
            <div className="flex border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'content'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Content
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'analysis'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Analysis
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'content' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">{(selectedReview.data as ReviewData)?.title || 'Review Content'}</h2>
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                    {JSON.stringify(selectedReview.data, null, 2)}
                  </pre>
                </div>
              )}
              {activeTab === 'analysis' && (
                <div>
                  <p>Analysis of the review will be displayed here.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Select a review to see its content and analysis.</p>
          </div>
        )}
      </div>
    </div>
  )
}
