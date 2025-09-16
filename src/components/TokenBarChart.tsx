'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type TokenData = {
  symbol: string
  usdValue: number
}

export default function TokenBarChart({ data }: { data: TokenData[] }) {
  return (
    <div className="w-full h-64 bg-gray-900 rounded-lg p-4 mt-6">
      <h2 className="text-lg font-semibold mb-2 text-white">Token USD Values</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="symbol" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
          <Bar dataKey="usdValue">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#10B981" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

