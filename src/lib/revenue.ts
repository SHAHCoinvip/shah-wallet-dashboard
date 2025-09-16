export type RevenueParams = {
  monthlyVolumeUSD: number      // e.g., 1_000_000
  totalFeePct: number           // e.g., 0.30
  lpSharePct: number            // e.g., 0.25
  protocolSharePct: number      // e.g., 0.05
}

export type RevenueRow = {
  scenario: string
  monthlyVolumeUSD: number
  protocolFeePct: number
  dailyUSD: number
  monthlyUSD: number
  annualUSD: number
}

export type RevenueBreakdown = {
  daily: {
    totalUSD: number
    lpUSD: number
    protocolUSD: number
    otherUSD: number
  }
  monthly: {
    totalUSD: number
    lpUSD: number
    protocolUSD: number
    otherUSD: number
  }
  annual: {
    totalUSD: number
    lpUSD: number
    protocolUSD: number
    otherUSD: number
  }
}

export function calcBreakdown(p: RevenueParams): RevenueBreakdown {
  const fee = p.totalFeePct / 100
  const lp = p.lpSharePct / 100
  const proto = p.protocolSharePct / 100
  const other = Math.max(fee - (lp + proto), 0)
  
  const feeUSD = (vol: number) => vol * fee
  const lpUSD = (vol: number) => vol * lp
  const protocolUSD = (vol: number) => vol * proto
  const otherUSD = (vol: number) => vol * other
  
  const mk = (vol: number) => ({
    daily: {
      totalUSD: feeUSD(vol) / 30,
      lpUSD: lpUSD(vol) / 30,
      protocolUSD: protocolUSD(vol) / 30,
      otherUSD: otherUSD(vol) / 30
    },
    monthly: {
      totalUSD: feeUSD(vol),
      lpUSD: lpUSD(vol),
      protocolUSD: protocolUSD(vol),
      otherUSD: otherUSD(vol)
    },
    annual: {
      totalUSD: feeUSD(vol) * 12,
      lpUSD: lpUSD(vol) * 12,
      protocolUSD: protocolUSD(vol) * 12,
      otherUSD: otherUSD(vol) * 12
    }
  })
  
  return mk(p.monthlyVolumeUSD)
}

export function buildScenarios(
  volumesUSD: number[],
  protocolCutPct: number
): RevenueRow[] {
  return volumesUSD.map(v => ({
    scenario: `$${v.toLocaleString()}/mo`,
    monthlyVolumeUSD: v,
    protocolFeePct: protocolCutPct,
    dailyUSD: +(v * (protocolCutPct / 100) / 30).toFixed(2),
    monthlyUSD: +(v * (protocolCutPct / 100)).toFixed(2),
    annualUSD: +((v * (protocolCutPct / 100)) * 12).toFixed(2)
  }))
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  } else if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`
  } else {
    return `$${amount.toFixed(2)}`
  }
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function calculateAPY(
  monthlyRevenue: number,
  totalValueLocked: number
): number {
  if (totalValueLocked === 0) return 0
  const annualRevenue = monthlyRevenue * 12
  return (annualRevenue / totalValueLocked) * 100
}

export function calculateROI(
  initialInvestment: number,
  currentValue: number
): number {
  if (initialInvestment === 0) return 0
  return ((currentValue - initialInvestment) / initialInvestment) * 100
}

// Preset scenarios for quick selection
export const PRESET_VOLUMES = [
  500_000,    // $500K
  1_000_000,  // $1M
  5_000_000,  // $5M
  10_000_000, // $10M
  25_000_000, // $25M
  50_000_000, // $50M
  100_000_000 // $100M
]

export const PRESET_FEES = [
  { label: 'Low (0.20%)', value: 0.20 },
  { label: 'Standard (0.30%)', value: 0.30 },
  { label: 'High (0.50%)', value: 0.50 },
  { label: 'Premium (1.00%)', value: 1.00 }
]

export const PRESET_LP_SHARES = [
  { label: 'Conservative (20%)', value: 20 },
  { label: 'Standard (25%)', value: 25 },
  { label: 'Generous (30%)', value: 30 },
  { label: 'Very Generous (40%)', value: 40 }
]

export const PRESET_PROTOCOL_SHARES = [
  { label: 'Minimal (2%)', value: 2 },
  { label: 'Standard (5%)', value: 5 },
  { label: 'High (10%)', value: 10 },
  { label: 'Premium (15%)', value: 15 }
]

// CSV Export functionality
export function generateCSV(scenarios: RevenueRow[]): string {
  const headers = ['Scenario', 'Monthly Volume', 'Protocol Fee %', 'Daily Revenue', 'Monthly Revenue', 'Annual Revenue']
  const rows = scenarios.map(s => [
    s.scenario,
    `$${s.monthlyVolumeUSD.toLocaleString()}`,
    `${s.protocolFeePct}%`,
    `$${s.dailyUSD.toFixed(2)}`,
    `$${s.monthlyUSD.toFixed(2)}`,
    `$${s.annualUSD.toFixed(2)}`
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  return csvContent
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Chart data generation for visualizations
export function generateChartData(
  scenarios: RevenueRow[],
  breakdown: RevenueBreakdown
) {
  return {
    scenarios: scenarios.map(s => ({
      name: s.scenario,
      monthly: s.monthlyUSD,
      annual: s.annualUSD
    })),
    breakdown: {
      labels: ['LP Rewards', 'Protocol Revenue', 'Other Fees'],
      data: [
        breakdown.monthly.lpUSD,
        breakdown.monthly.protocolUSD,
        breakdown.monthly.otherUSD
      ],
      colors: ['#10B981', '#3B82F6', '#F59E0B']
    }
  }
} 