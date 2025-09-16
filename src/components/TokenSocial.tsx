'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { StarIcon, ShareIcon, HeartIcon, ChatBubbleLeftIcon, EyeIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'

interface TokenSocialData {
  tokenAddress: string
  name: string
  symbol: string
  rating: number
  totalRatings: number
  likes: number
  isLiked: boolean
  comments: number
  views: number
  shares: number
  communityScore: number
  trending: boolean
  tags: string[]
  description: string
  socialLinks: {
    telegram?: string
    twitter?: string
    website?: string
    discord?: string
  }
}

interface Comment {
  id: string
  userAddress: string
  username: string
  avatar: string
  content: string
  rating: number
  timestamp: number
  likes: number
  isLiked: boolean
}

interface TokenSocialProps {
  tokenAddress: string
  tokenName: string
  tokenSymbol: string
}

export default function TokenSocial({ tokenAddress, tokenName, tokenSymbol }: TokenSocialProps) {
  const { address, isConnected } = useAccount()
  const [socialData, setSocialData] = useState<TokenSocialData | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [userRating, setUserRating] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'analytics'>('overview')
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    loadSocialData()
  }, [tokenAddress])

  const loadSocialData = async () => {
    try {
      setLoading(true)
      
      // Mock data - in production, this would fetch from your backend/API
      const mockSocialData: TokenSocialData = {
        tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        rating: 4.2,
        totalRatings: 156,
        likes: 89,
        isLiked: false,
        comments: 23,
        views: 1247,
        shares: 45,
        communityScore: 8.5,
        trending: true,
        tags: ['DeFi', 'Yield Farming', 'Gaming', 'NFT'],
        description: 'A revolutionary DeFi token focused on yield farming and gaming integration. Built on Ethereum with advanced staking mechanisms and community governance.',
        socialLinks: {
          telegram: 'https://t.me/shahcoin',
          twitter: 'https://twitter.com/shahcoin',
          website: 'https://shah.vip',
          discord: 'https://discord.gg/shahcoin'
        }
      }

      const mockComments: Comment[] = [
        {
          id: '1',
          userAddress: '0x1234...5678',
          username: 'CryptoWhale',
          avatar: '🐋',
          content: 'Great project! The staking rewards are amazing. Been holding since day 1!',
          rating: 5,
          timestamp: Date.now() - 3600000, // 1 hour ago
          likes: 12,
          isLiked: false
        },
        {
          id: '2',
          userAddress: '0x8765...4321',
          username: 'DeFiTrader',
          avatar: '📈',
          content: 'Solid fundamentals and strong community. The tokenomics look sustainable.',
          rating: 4,
          timestamp: Date.now() - 7200000, // 2 hours ago
          likes: 8,
          isLiked: true
        },
        {
          id: '3',
          userAddress: '0xabcd...efgh',
          username: 'NFTCollector',
          avatar: '🎨',
          content: 'Love the NFT integration! Can\'t wait for the marketplace launch.',
          rating: 5,
          timestamp: Date.now() - 10800000, // 3 hours ago
          likes: 15,
          isLiked: false
        }
      ]

      setSocialData(mockSocialData)
      setComments(mockComments)
      
    } catch (error) {
      console.error('Error loading social data:', error)
      toast.error('Failed to load social data')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to like tokens')
      return
    }

    if (!socialData) return

    try {
      // In production, this would make an API call
      setSocialData(prev => prev ? {
        ...prev,
        likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
        isLiked: !prev.isLiked
      } : null)

      toast.success(socialData.isLiked ? 'Removed from likes' : 'Added to likes')
    } catch (error) {
      console.error('Error liking token:', error)
      toast.error('Failed to update like')
    }
  }

  const handleRate = async (rating: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet to rate tokens')
      return
    }

    if (!socialData) return

    try {
      setUserRating(rating)
      
      // In production, this would make an API call
      const newTotalRatings = socialData.totalRatings + 1
      const newRating = ((socialData.rating * socialData.totalRatings) + rating) / newTotalRatings
      
      setSocialData(prev => prev ? {
        ...prev,
        rating: newRating,
        totalRatings: newTotalRatings
      } : null)

      toast.success(`Rated ${rating} stars!`)
    } catch (error) {
      console.error('Error rating token:', error)
      toast.error('Failed to submit rating')
    }
  }

  const handleComment = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to comment')
      return
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    if (!socialData) return

    try {
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        userAddress: address!,
        username: `${address?.slice(0, 6)}...${address?.slice(-4)}`,
        avatar: '👤',
        content: newComment,
        rating: userRating,
        timestamp: Date.now(),
        likes: 0,
        isLiked: false
      }

      setComments(prev => [newCommentObj, ...prev])
      setSocialData(prev => prev ? {
        ...prev,
        comments: prev.comments + 1
      } : null)
      setNewComment('')
      setUserRating(0)

      toast.success('Comment posted!')
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Failed to post comment')
    }
  }

  const handleShare = async (platform: string) => {
    const shareData = {
      title: `${tokenSymbol} - ${tokenName}`,
      text: `Check out ${tokenSymbol}! A revolutionary DeFi token with amazing features.`,
      url: `https://wallet.shah.vip/token/${tokenAddress}`
    }

    try {
      switch (platform) {
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`)
          break
        case 'telegram':
          window.open(`https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`)
          break
        case 'copy':
          await navigator.clipboard.writeText(shareData.url)
          toast.success('Link copied to clipboard!')
          break
        default:
          if (navigator.share) {
            await navigator.share(shareData)
          } else {
            await navigator.clipboard.writeText(shareData.url)
            toast.success('Link copied to clipboard!')
          }
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast.error('Failed to share')
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  if (loading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!socialData) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center">
        <p className="text-gray-400">No social data available for this token</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">💬 Community & Social</h2>
        <div className="flex items-center space-x-2">
          {(['overview', 'comments', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Token Info Card */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{socialData.name} ({socialData.symbol})</h3>
                <p className="text-gray-400 text-sm mb-3">{socialData.description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {socialData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                  {socialData.trending && (
                    <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full">
                      🔥 Trending
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>

            {/* Social Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(socialData.rating) ? 'text-yellow-400 fill-current' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-lg font-bold">{socialData.rating.toFixed(1)}</div>
                <div className="text-sm text-gray-400">{socialData.totalRatings} ratings</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold">{socialData.likes}</div>
                <div className="text-sm text-gray-400">Likes</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold">{socialData.comments}</div>
                <div className="text-sm text-gray-400">Comments</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold">{socialData.views}</div>
                <div className="text-sm text-gray-400">Views</div>
              </div>
            </div>
          </div>

          {/* Community Score */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Community Score</h3>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-green-400">{socialData.communityScore}/10</div>
              <div className="flex-1">
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(socialData.communityScore / 10) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  Based on community engagement, ratings, and activity
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Social Links</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {socialData.socialLinks.telegram && (
                <a
                  href={socialData.socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <span>📱</span>
                  <span>Telegram</span>
                </a>
              )}
              
              {socialData.socialLinks.twitter && (
                <a
                  href={socialData.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-blue-400 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors"
                >
                  <span>🐦</span>
                  <span>Twitter</span>
                </a>
              )}
              
              {socialData.socialLinks.website && (
                <a
                  href={socialData.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <span>🌐</span>
                  <span>Website</span>
                </a>
              )}
              
              {socialData.socialLinks.discord && (
                <a
                  href={socialData.socialLinks.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <span>🎮</span>
                  <span>Discord</span>
                </a>
              )}
            </div>
          </div>

          {/* Rate & Like Section */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Rate & Review</h3>
            
            {isConnected ? (
              <div className="space-y-4">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium mb-2">Your Rating</label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
                        className="text-2xl hover:scale-110 transition-transform"
                      >
                        {star <= userRating ? (
                          <StarIconSolid className="text-yellow-400" />
                        ) : (
                          <StarIcon className="text-gray-600 hover:text-yellow-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Like Button */}
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    socialData.isLiked
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {socialData.isLiked ? (
                    <HeartIconSolid className="w-5 h-5" />
                  ) : (
                    <HeartIcon className="w-5 h-5" />
                  )}
                  <span>{socialData.isLiked ? 'Liked' : 'Like'}</span>
                </button>
              </div>
            ) : (
              <p className="text-gray-400">Connect your wallet to rate and like this token</p>
            )}
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-6">
          {/* Add Comment */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Add a Comment</h3>
            
            {isConnected ? (
              <div className="space-y-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this token..."
                  className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-purple-500"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        className="text-lg hover:scale-110 transition-transform"
                      >
                        {star <= userRating ? (
                          <StarIconSolid className="text-yellow-400" />
                        ) : (
                          <StarIcon className="text-gray-600 hover:text-yellow-400" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleComment}
                    disabled={!newComment.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Connect your wallet to comment</p>
            )}
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{comment.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-white">{comment.username}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400 text-sm">{formatTimeAgo(comment.timestamp)}</span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-3 h-3 ${
                              i < comment.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300 mb-3">{comment.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <button className="flex items-center space-x-1 hover:text-white transition-colors">
                        <HeartIcon className="w-4 h-4" />
                        <span>{comment.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-white transition-colors">
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Engagement Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Views</span>
                  <span className="font-bold">{socialData.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Shares</span>
                  <span className="font-bold">{socialData.shares}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Engagement Rate</span>
                  <span className="font-bold text-green-400">
                    {((socialData.likes + socialData.comments) / socialData.views * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Community Growth</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">New Ratings (24h)</span>
                  <span className="font-bold text-green-400">+12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">New Comments (24h)</span>
                  <span className="font-bold text-green-400">+5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Growth Rate</span>
                  <span className="font-bold text-blue-400">+8.5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-bold mb-4">Share {tokenSymbol}</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center space-x-2 bg-blue-400 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors"
              >
                <span>🐦</span>
                <span>Twitter</span>
              </button>
              <button
                onClick={() => handleShare('telegram')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                <span>📱</span>
                <span>Telegram</span>
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
              >
                <span>📋</span>
                <span>Copy Link</span>
              </button>
              <button
                onClick={() => handleShare('native')}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                <span>📤</span>
                <span>Share</span>
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
} 