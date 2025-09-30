"use client";

import { useEffect, useState } from 'react';

export default function TelegramPage() {
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    // Check if we're in Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setIsTelegram(true);
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400">📱 SHAH Telegram Mini App</h1>
        
        {isTelegram ? (
          <div className="bg-green-900 border border-green-700 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-300 mb-2">✅ Running in Telegram</h2>
            <p className="text-green-200">You're accessing the SHAH Wallet through Telegram WebApp!</p>
          </div>
        ) : (
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-300 mb-2">🌐 Web Browser</h2>
            <p className="text-blue-200">Open this link in Telegram to access the Mini App features.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-yellow-400">🚀 Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-4 rounded-lg transition-colors">
                Connect Wallet
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                View Portfolio
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Start Farming
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-yellow-400">📊 SHAH Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Price:</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">24h Change:</span>
                <span className="font-semibold text-green-400">+0.00%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Market Cap:</span>
                <span className="font-semibold">$0.00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-yellow-400">🔗 Mini App Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">💼</div>
              <h4 className="font-semibold mb-2">Portfolio</h4>
              <p className="text-sm text-gray-400">Track your SHAH holdings</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌾</div>
              <h4 className="font-semibold mb-2">Farming</h4>
              <p className="text-sm text-gray-400">Earn rewards by staking</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h4 className="font-semibold mb-2">Swap</h4>
              <p className="text-sm text-gray-400">Trade tokens easily</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
