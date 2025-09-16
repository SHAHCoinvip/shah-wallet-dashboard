'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useBalance, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { 
  CurrencyDollarIcon, 
  ClockIcon, 
  TagIcon, 
  HeartIcon, 
  EyeIcon,
  FireIcon,
  StarIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface NFTListing {
  id: string
  tokenId: string
  name: string
  description: string
  image: string
  price: string
  seller: string
  sellerName: string
  isAuction: boolean
  auctionEndTime?: number
  currentBid?: string
  totalBids?: number
  likes: number
  views: number
  isLiked: boolean
  isOwned: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  attributes: {
    trait_type: string
    value: string
  }[]
  createdAt: number
}

interface AuctionBid {
  id: string
  bidder: string
  bidderName: string
  amount: string
  timestamp: number
}

export default function NFTMarketplace() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-nfts' | 'create'>('marketplace')
  const [nftListings, setNftListings] = useState<NFTListing[]>([])
  const [myNFTs, setMyNFTs] = useState<NFTListing[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTListing | null>(null)
  const [showNFTModal, setShowNFTModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'price' | 'recent' | 'popular'>('recent')
  const [filterRarity, setFilterRarity] = useState<string>('all')

  // Form states for creating listing
  const [createForm, setCreateForm] = useState({
    tokenId: '',
    price: '',
    isAuction: false,
    auctionDuration: '7', // days
    description: ''
  })

  // Form states for bidding
  const [bidAmount, setBidAmount] = useState('')

  useEffect(() => {
    if (isConnected && address) {
      loadNFTData()
    }
  }, [address, isConnected])

  const loadNFTData = async () => {
    try {
      setLoading(true)
      
      // Mock data - in production, this would fetch from your backend/API
      const mockNFTListings: NFTListing[] = [
        {
          id: '1',
          tokenId: '1',
          name: 'SHAH GOLD #001',
          description: 'The first SHAH GOLD NFT ever minted. This legendary piece represents the beginning of the SHAH ecosystem.',
          image: 'https://via.placeholder.com/300x300/FFD700/000000?text=SHAH+GOLD+%23001',
          price: '0.5',
          seller: '0x1234...5678',
          sellerName: 'CryptoWhale',
          isAuction: false,
          likes: 45,
          views: 234,
          isLiked: false,
          isOwned: false,
          rarity: 'legendary',
          attributes: [
            { trait_type: 'Background', value: 'Golden' },
            { trait_type: 'Eyes', value: 'Diamond' },
            { trait_type: 'Mouth', value: 'Smile' },
            { trait_type: 'Accessory', value: 'Crown' }
          ],
          createdAt: Date.now() - 86400000 // 1 day ago
        },
        {
          id: '2',
          tokenId: '15',
          name: 'SHAH GOLD #015',
          description: 'A rare SHAH GOLD NFT with unique cosmic background and diamond eyes.',
          image: 'https://via.placeholder.com/300x300/4169E1/FFFFFF?text=SHAH+GOLD+%23015',
          price: '0.3',
          seller: '0x8765...4321',
          sellerName: 'NFTCollector',
          isAuction: true,
          auctionEndTime: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days from now
          currentBid: '0.25',
          totalBids: 8,
          likes: 32,
          views: 156,
          isLiked: true,
          isOwned: false,
          rarity: 'epic',
          attributes: [
            { trait_type: 'Background', value: 'Cosmic' },
            { trait_type: 'Eyes', value: 'Diamond' },
            { trait_type: 'Mouth', value: 'Serious' },
            { trait_type: 'Accessory', value: 'Necklace' }
          ],
          createdAt: Date.now() - 172800000 // 2 days ago
        },
        {
          id: '3',
          tokenId: '42',
          name: 'SHAH GOLD #042',
          description: 'A beautiful SHAH GOLD NFT with emerald eyes and royal crown.',
          image: 'https://via.placeholder.com/300x300/228B22/FFFFFF?text=SHAH+GOLD+%23042',
          price: '0.2',
          seller: '0xabcd...efgh',
          sellerName: 'ArtLover',
          isAuction: false,
          likes: 28,
          views: 98,
          isLiked: false,
          isOwned: false,
          rarity: 'rare',
          attributes: [
            { trait_type: 'Background', value: 'Royal' },
            { trait_type: 'Eyes', value: 'Emerald' },
            { trait_type: 'Mouth', value: 'Smile' },
            { trait_type: 'Accessory', value: 'Crown' }
          ],
          createdAt: Date.now() - 259200000 // 3 days ago
        }
      ]

      const mockMyNFTs: NFTListing[] = [
        {
          id: '4',
          tokenId: '7',
          name: 'SHAH GOLD #007',
          description: 'My personal SHAH GOLD NFT with unique traits.',
          image: 'https://via.placeholder.com/300x300/FF6347/FFFFFF?text=SHAH+GOLD+%23007',
          price: '0.4',
          seller: address!,
          sellerName: 'You',
          isAuction: false,
          likes: 15,
          views: 67,
          isLiked: false,
          isOwned: true,
          rarity: 'epic',
          attributes: [
            { trait_type: 'Background', value: 'Fire' },
            { trait_type: 'Eyes', value: 'Ruby' },
            { trait_type: 'Mouth', value: 'Grin' },
            { trait_type: 'Accessory', value: 'Sword' }
          ],
          createdAt: Date.now() - 604800000 // 1 week ago
        }
      ]

      setNftListings(mockNFTListings)
      setMyNFTs(mockMyNFTs)
      
    } catch (error) {
      console.error('Error loading NFT data:', error)
      toast.error('Failed to load NFT data')
    } finally {
      setLoading(false)
    }
  }

  const handleLikeNFT = async (nftId: string) => {
    if (!isConnected) {
      toast.error('Please connect your wallet to like NFTs')
      return
    }

    try {
      setNftListings(prev => prev.map(nft => 
        nft.id === nftId 
          ? { 
              ...nft, 
              likes: nft.isLiked ? nft.likes - 1 : nft.likes + 1,
              isLiked: !nft.isLiked 
            }
          : nft
      ))

      toast.success('NFT liked!')
    } catch (error) {
      console.error('Error liking NFT:', error)
      toast.error('Failed to like NFT')
    }
  }

  const handleBuyNFT = async (nft: NFTListing) => {
    if (!isConnected) {
      toast.error('Please connect your wallet to buy NFTs')
      return
    }

    try {
      // In production, this would make a contract call
      toast.success(`Successfully purchased ${nft.name} for ${nft.price} ETH!`)
      
      // Remove from listings and add to my NFTs
      setNftListings(prev => prev.filter(listing => listing.id !== nft.id))
      setMyNFTs(prev => [{ ...nft, isOwned: true, seller: address!, sellerName: 'You' }, ...prev])
      
      setShowNFTModal(false)
    } catch (error) {
      console.error('Error buying NFT:', error)
      toast.error('Failed to purchase NFT')
    }
  }

  const handlePlaceBid = async (nft: NFTListing) => {
    if (!isConnected) {
      toast.error('Please connect your wallet to place bids')
      return
    }

    if (!bidAmount || parseFloat(bidAmount) <= parseFloat(nft.currentBid || '0')) {
      toast.error('Bid must be higher than current bid')
      return
    }

    try {
      // In production, this would make a contract call
      toast.success(`Bid placed successfully! ${bidAmount} ETH`)
      
      setNftListings(prev => prev.map(listing => 
        listing.id === nft.id 
          ? { 
              ...listing, 
              currentBid: bidAmount,
              totalBids: (listing.totalBids || 0) + 1
            }
          : listing
      ))
      
      setBidAmount('')
      setShowNFTModal(false)
    } catch (error) {
      console.error('Error placing bid:', error)
      toast.error('Failed to place bid')
    }
  }

  const handleCreateListing = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to create listings')
      return
    }

    if (!createForm.tokenId || !createForm.price) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const newListing: NFTListing = {
        id: Date.now().toString(),
        tokenId: createForm.tokenId,
        name: `SHAH GOLD #${createForm.tokenId.padStart(3, '0')}`,
        description: createForm.description || 'A beautiful SHAH GOLD NFT',
        image: `https://via.placeholder.com/300x300/FFD700/000000?text=SHAH+GOLD+%23${createForm.tokenId.padStart(3, '0')}`,
        price: createForm.price,
        seller: address!,
        sellerName: 'You',
        isAuction: createForm.isAuction,
        auctionEndTime: createForm.isAuction 
          ? Date.now() + parseInt(createForm.auctionDuration) * 24 * 60 * 60 * 1000
          : undefined,
        currentBid: createForm.isAuction ? createForm.price : undefined,
        totalBids: createForm.isAuction ? 0 : undefined,
        likes: 0,
        views: 0,
        isLiked: false,
        isOwned: false,
        rarity: 'common',
        attributes: [
          { trait_type: 'Background', value: 'Gold' },
          { trait_type: 'Eyes', value: 'Standard' },
          { trait_type: 'Mouth', value: 'Neutral' }
        ],
        createdAt: Date.now()
      }

      setNftListings(prev => [newListing, ...prev])
      setShowCreateModal(false)
      setCreateForm({
        tokenId: '',
        price: '',
        isAuction: false,
        auctionDuration: '7',
        description: ''
      })

      toast.success('NFT listing created successfully!')
    } catch (error) {
      console.error('Error creating listing:', error)
      toast.error('Failed to create listing')
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400'
      case 'epic': return 'text-purple-400'
      case 'rare': return 'text-blue-400'
      case 'common': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-900/20 border-yellow-500/30'
      case 'epic': return 'bg-purple-900/20 border-purple-500/30'
      case 'rare': return 'bg-blue-900/20 border-blue-500/30'
      case 'common': return 'bg-gray-900/20 border-gray-500/30'
      default: return 'bg-gray-900/20 border-gray-500/30'
    }
  }

  const formatTimeUntil = (timestamp: number) => {
    const now = Date.now()
    const diff = timestamp - now
    
    if (diff < 0) return 'Ended'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const filteredListings = nftListings
    .filter(nft => filterRarity === 'all' || nft.rarity === filterRarity)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return parseFloat(a.price) - parseFloat(b.price)
        case 'popular':
          return b.likes - a.likes
        case 'recent':
        default:
          return b.createdAt - a.createdAt
      }
    })

  if (!isConnected) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold mb-4">🎨 NFT Marketplace</h3>
        <p className="text-gray-400 mb-6">Connect your wallet to trade SHAH GOLD NFTs</p>
        <ConnectButton />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
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
        <h2 className="text-2xl font-bold">🎨 SHAH GOLD NFT Marketplace</h2>
        <div className="flex items-center space-x-2">
          {(['marketplace', 'my-nfts', 'create'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab === 'marketplace' ? 'Marketplace' : 
               tab === 'my-nfts' ? 'My NFTs' : 'Create Listing'}
            </button>
          ))}
        </div>
      </div>

      {/* Filters and Sort */}
      {activeTab === 'marketplace' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Rarities</option>
              <option value="legendary">Legendary</option>
              <option value="epic">Epic</option>
              <option value="rare">Rare</option>
              <option value="common">Common</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price' | 'recent' | 'popular')}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="recent">Recent</option>
              <option value="price">Price</option>
              <option value="popular">Popular</option>
            </select>
          </div>
        </div>
      )}

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((nft) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform ${getRarityBg(nft.rarity)}`}
              onClick={() => {
                setSelectedNFT(nft)
                setShowNFTModal(true)
              }}
            >
              <div className="relative">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-48 object-cover"
                />
                
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(nft.rarity)} bg-black/50`}>
                    {nft.rarity.charAt(0).toUpperCase() + nft.rarity.slice(1)}
                  </span>
                </div>
                
                {nft.isAuction && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                      🔥 Auction
                    </span>
                  </div>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLikeNFT(nft.id)
                  }}
                  className="absolute bottom-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  {nft.isLiked ? (
                    <HeartIconSolid className="w-4 h-4 text-red-400" />
                  ) : (
                    <HeartIcon className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{nft.name}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{nft.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{nft.sellerName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{nft.views}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-purple-400">
                      {nft.isAuction ? `${nft.currentBid} ETH` : `${nft.price} ETH`}
                    </div>
                    {nft.isAuction && (
                      <div className="text-xs text-gray-400">
                        {nft.totalBids} bids • {formatTimeUntil(nft.auctionEndTime!)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{nft.likes}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* My NFTs Tab */}
      {activeTab === 'my-nfts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">My SHAH GOLD NFTs</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              + List NFT
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myNFTs.map((nft) => (
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden ${getRarityBg(nft.rarity)}`}
              >
                <div className="relative">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-48 object-cover"
                  />
                  
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(nft.rarity)} bg-black/50`}>
                      {nft.rarity.charAt(0).toUpperCase() + nft.rarity.slice(1)}
                    </span>
                  </div>
                  
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                      Owned
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{nft.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">{nft.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-green-400">
                      Listed: {nft.price} ETH
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <HeartIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">{nft.likes}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {myNFTs.length === 0 && (
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center">
              <StarIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">You don't own any SHAH GOLD NFTs yet</p>
              <p className="text-sm text-gray-500 mt-2">Mint or buy your first NFT to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Create Listing Tab */}
      {activeTab === 'create' && (
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Create NFT Listing</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Token ID</label>
              <input
                type="number"
                value={createForm.tokenId}
                onChange={(e) => setCreateForm(prev => ({ ...prev, tokenId: e.target.value }))}
                placeholder="1"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Price (ETH)</label>
              <input
                type="number"
                step="0.01"
                value={createForm.price}
                onChange={(e) => setCreateForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.1"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAuction"
                checked={createForm.isAuction}
                onChange={(e) => setCreateForm(prev => ({ ...prev, isAuction: e.target.checked }))}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="isAuction" className="text-sm font-medium">Create as Auction</label>
            </div>
            
            {createForm.isAuction && (
              <div>
                <label className="block text-sm font-medium mb-2">Auction Duration (Days)</label>
                <select
                  value={createForm.auctionDuration}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, auctionDuration: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your NFT..."
                className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <button
              onClick={handleCreateListing}
              className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              Create Listing
            </button>
          </div>
        </div>
      )}

      {/* NFT Detail Modal */}
      {showNFTModal && selectedNFT && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold">{selectedNFT.name}</h3>
                <button
                  onClick={() => setShowNFTModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    className="w-full rounded-lg"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold mb-2">Description</h4>
                    <p className="text-gray-400 text-sm">{selectedNFT.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-2">Attributes</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedNFT.attributes.map((attr, index) => (
                        <div key={index} className="bg-gray-700/50 rounded p-2">
                          <div className="text-xs text-gray-400">{attr.trait_type}</div>
                          <div className="text-sm font-medium">{attr.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-2">Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rarity:</span>
                        <span className={getRarityColor(selectedNFT.rarity)}>
                          {selectedNFT.rarity.charAt(0).toUpperCase() + selectedNFT.rarity.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Seller:</span>
                        <span>{selectedNFT.sellerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Views:</span>
                        <span>{selectedNFT.views}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Likes:</span>
                        <span>{selectedNFT.likes}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    {selectedNFT.isAuction ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {selectedNFT.currentBid} ETH
                          </div>
                          <div className="text-sm text-gray-400">
                            Current Bid • {selectedNFT.totalBids} bids
                          </div>
                          <div className="text-sm text-red-400 mt-1">
                            Ends in {formatTimeUntil(selectedNFT.auctionEndTime!)}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <input
                            type="number"
                            step="0.01"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder={`Min bid: ${(parseFloat(selectedNFT.currentBid || '0') + 0.01).toFixed(2)} ETH`}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                          />
                          <button
                            onClick={() => handlePlaceBid(selectedNFT)}
                            className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                          >
                            Place Bid
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {selectedNFT.price} ETH
                          </div>
                          <div className="text-sm text-gray-400">Fixed Price</div>
                        </div>
                        
                        <button
                          onClick={() => handleBuyNFT(selectedNFT)}
                          className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                        >
                          Buy Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
} 