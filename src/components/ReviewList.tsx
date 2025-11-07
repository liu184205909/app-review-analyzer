'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  date: Date | string;
  appVersion?: string;
}

interface ReviewListProps {
  reviews: Review[];
  appName: string;
}

type FilterType = 'all' | 'positive' | 'neutral' | 'negative';

export default function ReviewList({ reviews, appName }: ReviewListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;

  // Filter reviews based on sentiment and quality
  const filteredReviews = reviews.filter(review => {
    // Quality filter: remove very short/low-quality comments
    const isHighQuality = review.content.trim().length > 15 &&
                         review.content.split(' ').length > 3 &&
                         !/^(good|bad|nice|ok|okay|fine|great|excellent|terrible|awful|love|hate|yes|no)$/.test(review.content.trim().toLowerCase());

    if (!isHighQuality) return false;

    // Sentiment filter
    if (filter === 'all') return true;
    if (filter === 'positive') return review.rating >= 4;
    if (filter === 'neutral') return review.rating === 3;
    if (filter === 'negative') return review.rating <= 2;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + reviewsPerPage);

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // Get color classes based on rating
  const getReviewColor = (rating: number) => {
    if (rating >= 4) return 'border-l-green-500 bg-green-50';
    if (rating === 3) return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-red-500 bg-red-50';
  };

  // Render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Return both specific date and relative time like competitors
    const specificDate = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    if (diffDays === 0) return `Today (${specificDate})`;
    if (diffDays === 1) return `Yesterday (${specificDate})`;
    if (diffDays < 7) return `${diffDays} days ago (${specificDate})`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago (${specificDate})`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago (${specificDate})`;
    return specificDate;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">📝 Typical User Comments</h2>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 font-medium transition ${
            filter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Reviews
        </button>
        <button
          onClick={() => handleFilterChange('positive')}
          className={`px-4 py-2 font-medium transition ${
            filter === 'positive'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Positive (4-5★)
        </button>
        <button
          onClick={() => handleFilterChange('neutral')}
          className={`px-4 py-2 font-medium transition ${
            filter === 'neutral'
              ? 'text-yellow-600 border-b-2 border-yellow-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Neutral (3★)
        </button>
        <button
          onClick={() => handleFilterChange('negative')}
          className={`px-4 py-2 font-medium transition ${
            filter === 'negative'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Negative (1-2★)
        </button>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {paginatedReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No reviews found for this filter
          </div>
        ) : (
          paginatedReviews.map((review) => (
            <div
              key={review.id}
              className={`border-l-4 p-5 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${getReviewColor(review.rating)} bg-gradient-to-br from-white to-gray-50/30`}
            >
              {/* Header with enhanced background */}
              <div className="flex items-start justify-between mb-3 bg-white/60 backdrop-blur-sm p-3 rounded-lg -mx-5 -mt-5 border border-gray-200/50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(review.rating)}
                    <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded-md">
                      {formatDate(review.date)}
                    </span>
                  </div>
                  {/* Title removed from here - moved to content section for better separation */}
                  <p className="text-sm text-gray-600 font-medium">
                    <span className="inline-block px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 rounded-full">
                      {review.author || 'Anonymous'}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-sm">
                    {appName}
                  </span>
                </div>
              </div>

              {/* Content with enhanced readability - title bold, content normal */}
              {review.title && (
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {review.title}
                  </h3>
                </div>
              )}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-50/20 to-transparent pointer-events-none rounded-lg"></div>
                <p className="relative text-gray-700 leading-relaxed mb-4 text-base bg-white/80 backdrop-blur-sm p-4 rounded-lg">
                  {review.content}
                </p>
              </div>

              {/* Footer with enhanced styling */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {review.appVersion && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-sm">
                      📱 v{review.appVersion}
                    </span>
                  )}
                  <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-sm">
                    🌍 United States
                  </span>
                </div>
                <span className="text-gray-500">
                  #{filteredReviews.indexOf(review) + 1}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ‹
          </button>

          {[...Array(Math.min(7, totalPages))].map((_, i) => {
            let pageNum;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (currentPage <= 4) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = currentPage - 3 + i;
            }

            return (
              <button
                key={i}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 border rounded ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPages > 7 && currentPage < totalPages - 3 && (
            <>
              <span className="px-2">...</span>
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(startIndex + reviewsPerPage, filteredReviews.length)} of {filteredReviews.length} reviews
      </div>
    </div>
  );
}

