'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ChartEmbedProps {
  pair?: string
  height?: number
  className?: string
  showHeader?: boolean
  theme?: 'dark' | 'light'
}

type ChartProvider = 'dextools' | 'geckoterminal' | 'tradingview'

export default function ChartEmbed({ 
  pair = 'ETH-SHAH', 
  height = 400, 
  className = '',
  showHeader = true,
  theme = 'dark'
}: ChartEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [currentProvider, setCurrentProvider] = useState<ChartProvider>('dextools')

  // SHAH token address for chart widgets
  const SHAH_TOKEN_ADDRESS = '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8'
  
  const getChartUrl = (provider: ChartProvider): string => {
    switch (provider) {
      case 'dextools':
        return `https://www.dextools.io/widget-chart/en/ether/pe-light/${SHAH_TOKEN_ADDRESS}?theme=${theme}&chartType=2&chartResolution=30&drawingToolbars=false&headerColor=${theme === 'dark' ? '1f2937' : 'ffffff'}&backgroundColor=${theme === 'dark' ? '111827' : 'ffffff'}`
      
      case 'geckoterminal':
        return `https://www.geckoterminal.com/eth/pools/${SHAH_TOKEN_ADDRESS}?embed=1&info=0&swaps=0&grapher=1&theme=${theme === 'dark' ? 'dark' : 'light'}&header=false`
      
      case 'tradingview':
        // TradingView widget for SHAH/ETH
        return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=UNISWAP3ETH%3ASHAHETH&interval=15&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=${theme === 'dark' ? '1f2937' : 'ffffff'}&studies=[]&theme=${theme}&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&hidevolume=1&overrides=%7B%22paneProperties.background%22%3A%22${theme === 'dark' ? '%23111827' : '%23ffffff'}%22%2C%22paneProperties.backgroundType%22%3A%22solid%22%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=shah-wallet`
      
      default:
        return ''
    }
  }

  const handleIframeLoad = () => {
    setIsLoaded(true)
    setError(false)
  }

  const handleIframeError = () => {
    setError(true)
    setIsLoaded(false)
  }

  const switchProvider = (provider: ChartProvider) => {
    setCurrentProvider(provider)
    setIsLoaded(false)
    setError(false)
  }

  const chartUrl = getChartUrl(currentProvider)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900 rounded-xl overflow-hidden border border-gray-700 ${className}`}
    >
      {showHeader && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">📈 SHAH Trading Chart</h3>
              <p className="text-sm text-gray-400">Live price and volume data</p>
            </div>
            
            {/* Provider Selector */}
            <div className="flex items-center space-x-2">
              <select
                value={currentProvider}
                onChange={(e) => switchProvider(e.target.value as ChartProvider)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="dextools">DexTools</option>
                <option value="geckoterminal">GeckoTerminal</option>
                <option value="tradingview">TradingView</option>
              </select>
              
              <a
                href={getChartUrl(currentProvider).replace('?embed=1', '').replace('widgetembed', 'chart')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
              >
                Open Full
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="relative" style={{ height: `${height}px` }}>
        {/* Loading State */}
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Loading chart from {currentProvider}...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center space-y-3">
              <div className="text-4xl">📊</div>
              <p className="text-white font-medium">Chart temporarily unavailable</p>
              <p className="text-sm text-gray-400">Try switching providers or refreshing</p>
              <div className="flex space-x-2 justify-center">
                {(['dextools', 'geckoterminal', 'tradingview'] as ChartProvider[]).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => switchProvider(provider)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      currentProvider === provider
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chart Iframe */}
        {chartUrl && (
          <iframe
            src={chartUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowTransparency
            scrolling="no"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            title={`${pair} Trading Chart via ${currentProvider}`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        )}
      </div>

      {/* Chart Footer */}
      <div className="p-3 bg-gray-800/50 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Pair: {pair}</span>
            <span>•</span>
            <span>Provider: {currentProvider}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>Live</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}