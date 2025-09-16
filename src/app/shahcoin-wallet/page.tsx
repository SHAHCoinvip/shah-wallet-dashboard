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
          className="bg-gray-900/60 rounded-2xl border border-white/10 p-6"
        >
          <h2 className="text-2xl font-bold mb-4">Download Qt Wallet</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              className="mini-button text-center"
              href="https://github.com/shahcoin/releases/windows"
              target="_blank" rel="noopener noreferrer"
            >Windows</a>
            <a
              className="mini-button text-center"
              href="https://github.com/shahcoin/releases/macos"
              target="_blank" rel="noopener noreferrer"
            >macOS</a>
            <a
              className="mini-button text-center"
              href="https://github.com/shahcoin/releases/linux"
              target="_blank" rel="noopener noreferrer"
            >Linux</a>
          </div>
        </motion.section>

        {/* 3) SDK Showcase */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-gray-900/60 rounded-2xl border border-white/10 p-6"
        >
          <h2 className="text-2xl font-bold mb-2">Developer SDK</h2>
          <p className="text-gray-300 mb-4">Build on Shahcoin with our developer SDK to create apps, integrations, and tools.</p>
          <a
            className="mini-button inline-block"
            href="https://github.com/shahcoin/docs"
            target="_blank" rel="noopener noreferrer"
          >Read Developer Docs</a>
        </motion.section>

        {/* 4) Explorer (ShahScan) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-gray-900/60 rounded-2xl border border-white/10 p-6"
        >
          <h2 className="text-2xl font-bold mb-2">Explorer</h2>
          <a
            className="mini-button inline-block"
            href="https://scan.shahcoin.net"
            target="_blank" rel="noopener noreferrer"
          >Open ShahScan Explorer</a>
        </motion.section>

        {/* 5) Chain Features Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-900/60 rounded-2xl border border-white/10 p-6"
        >
          <h2 className="text-2xl font-bold mb-4">Chain Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="mini-card">
              <p className="text-sm text-gray-400">Block Time</p>
              <p className="text-lg font-semibold">150 sec</p>
            </div>
            <div className="mini-card">
              <p className="text-sm text-gray-400">Consensus</p>
              <p className="text-lg font-semibold">Multi-algo PoW (Scrypt + Groestl planned)</p>
            </div>
            <div className="mini-card">
              <p className="text-sm text-gray-400">Halving</p>
              <p className="text-lg font-semibold">Standard halving schedule</p>
            </div>
            <div className="mini-card">
              <p className="text-sm text-gray-400">Security</p>
              <p className="text-lg font-semibold">Max reorg depth, miner whitelist, replay protection</p>
            </div>
            <div className="mini-card">
              <p className="text-sm text-gray-400">PoS</p>
              <p className="text-lg font-semibold">Future roadmap</p>
            </div>
          </div>
        </motion.section>

        {/* 6) Get Started CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="rounded-2xl p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10"
        >
          <h2 className="text-2xl font-bold mb-4">Get Started</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a className="mini-button text-center" href="https://github.com/shahcoin/releases" target="_blank" rel="noopener noreferrer">Download Wallet</a>
            <a className="mini-button text-center" href="https://scan.shahcoin.net" target="_blank" rel="noopener noreferrer">View Explorer</a>
            <a className="mini-button text-center" href="https://github.com/shahcoin/docs" target="_blank" rel="noopener noreferrer">Read Docs</a>
          </div>
        </motion.section>
      </div>
    </main>
  )
}