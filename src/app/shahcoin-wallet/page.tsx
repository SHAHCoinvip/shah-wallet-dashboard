'use client'

import { motion } from 'framer-motion'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function ShahcoinPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto mt-10 space-y-8">
        {/* 1) Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl p-10 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-pink-500/10 border border-white/10"
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
              <span className="text-black font-bold text-2xl">S</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">SHAHCOIN CORE</h1>
            <p className="text-lg md:text-xl text-gray-300">Decentralized. Scalable. Community Driven.</p>
          </div>
        </motion.section>

        {/* 2) Qt Wallet Downloads */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="card p-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-gradient">Download Qt Wallet</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              className="btn-primary text-center animate-float"
              href="https://github.com/shahcoin/releases/windows"
              target="_blank" rel="noopener noreferrer"
            >
              <div className="flex items-center justify-center gap-2">
                <span>🪟</span>
                <span>Windows</span>
              </div>
            </a>
            <a
              className="btn-primary text-center animate-float"
              href="https://github.com/shahcoin/releases/macos"
              target="_blank" rel="noopener noreferrer"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="flex items-center justify-center gap-2">
                <span>🍎</span>
                <span>macOS</span>
              </div>
            </a>
            <a
              className="btn-primary text-center animate-float"
              href="https://github.com/shahcoin/releases/linux"
              target="_blank" rel="noopener noreferrer"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="flex items-center justify-center gap-2">
                <span>🐧</span>
                <span>Linux</span>
              </div>
            </a>
          </div>
        </motion.section>

        {/* 3) SDK Showcase */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">⚡</span>
            </div>
            <h2 className="text-3xl font-bold text-gradient-blue">Developer SDK</h2>
          </div>
          <p className="text-gray-300 mb-6 text-lg">Build on Shahcoin with our developer SDK to create apps, integrations, and tools.</p>
          <a
            className="btn-accent inline-flex items-center gap-2"
            href="https://github.com/shahcoin/docs"
            target="_blank" rel="noopener noreferrer"
          >
            <span>📚</span>
            <span>Read Developer Docs</span>
          </a>
        </motion.section>

        {/* 4) Explorer (ShahScan) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="card p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🔍</span>
            </div>
            <h2 className="text-3xl font-bold text-gradient">Explorer</h2>
          </div>
          <a
            className="btn-secondary inline-flex items-center gap-2"
            href="https://scan.shahcoin.net"
            target="_blank" rel="noopener noreferrer"
          >
            <span>🌐</span>
            <span>Open ShahScan Explorer</span>
          </a>
        </motion.section>

        {/* 5) Chain Features Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card p-8"
        >
          <h2 className="text-3xl font-bold mb-8 text-gradient">Chain Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-black text-lg">⏱️</span>
                </div>
                <p className="text-sm text-gray-400 font-medium">Block Time</p>
              </div>
              <p className="text-xl font-bold text-white">150 sec</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">⚡</span>
                </div>
                <p className="text-sm text-gray-400 font-medium">Consensus</p>
              </div>
              <p className="text-lg font-bold text-white">Multi-algo PoW</p>
              <p className="text-sm text-gray-400">(Scrypt + Groestl planned)</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📈</span>
                </div>
                <p className="text-sm text-gray-400 font-medium">Halving</p>
              </div>
              <p className="text-lg font-bold text-white">Standard halving schedule</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🛡️</span>
                </div>
                <p className="text-sm text-gray-400 font-medium">Security</p>
              </div>
              <p className="text-lg font-bold text-white">Advanced Protection</p>
              <p className="text-sm text-gray-400">Max reorg depth, miner whitelist, replay protection</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🚀</span>
                </div>
                <p className="text-sm text-gray-400 font-medium">PoS</p>
              </div>
              <p className="text-lg font-bold text-white">Future roadmap</p>
            </div>
          </div>
        </motion.section>

        {/* 6) Get Started CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="card-glow p-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 text-gradient">Get Started</h2>
            <p className="text-xl text-gray-300">Join the SHAHCOIN ecosystem today</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <a 
              className="btn-primary text-center animate-float" 
              href="https://github.com/shahcoin/releases" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <div className="flex items-center justify-center gap-2">
                <span>💾</span>
                <span>Download Wallet</span>
              </div>
            </a>
            <a 
              className="btn-secondary text-center animate-float" 
              href="https://scan.shahcoin.net" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="flex items-center justify-center gap-2">
                <span>🔍</span>
                <span>View Explorer</span>
              </div>
            </a>
            <a 
              className="btn-accent text-center animate-float" 
              href="https://github.com/shahcoin/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="flex items-center justify-center gap-2">
                <span>📖</span>
                <span>Read Docs</span>
              </div>
            </a>
          </div>
        </motion.section>
      </div>
    </main>
  )
}