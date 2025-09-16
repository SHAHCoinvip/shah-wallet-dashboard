'use client'

import { CheckCircle, Clock, XCircle, AlertCircle, DollarSign } from 'lucide-react'

interface StatusBadgeProps {
  status: 'pending' | 'paid' | 'expired' | 'refunded' | 'failed'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export default function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true 
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'paid':
        return {
          label: 'Paid',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-500'
        }
      case 'pending':
        return {
          label: 'Pending',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          icon: Clock,
          iconColor: 'text-yellow-500'
        }
      case 'expired':
        return {
          label: 'Expired',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: XCircle,
          iconColor: 'text-gray-500'
        }
      case 'refunded':
        return {
          label: 'Refunded',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: DollarSign,
          iconColor: 'text-blue-500'
        }
      case 'failed':
        return {
          label: 'Failed',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-500'
        }
      default:
        return {
          label: 'Unknown',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: AlertCircle,
          iconColor: 'text-gray-500'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3'
        }
      case 'md':
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'w-4 h-4'
        }
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'w-5 h-5'
        }
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'w-4 h-4'
        }
    }
  }

  const sizeClasses = getSizeClasses()

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded-full border
      ${config.bgColor} ${config.textColor} ${config.borderColor}
      ${sizeClasses.container}
      font-medium
    `}>
      {showIcon && (
        <Icon className={`${sizeClasses.icon} ${config.iconColor}`} />
      )}
      <span>{config.label}</span>
    </div>
  )
} 