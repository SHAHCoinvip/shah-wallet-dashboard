interface BadgeProps {
  children: React.ReactNode
  variant?: 'verified' | 'new' | 'trending' | 'default'
  size?: 'sm' | 'md'
  className?: string
}

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'sm',
  className = '' 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  }
  
  const variantClasses = {
    verified: 'bg-green-900/30 text-green-400 border border-green-500/30',
    new: 'bg-blue-900/30 text-blue-400 border border-blue-500/30',
    trending: 'bg-purple-900/30 text-purple-400 border border-purple-500/30',
    default: 'bg-gray-700 text-gray-300 border border-gray-600'
  }
  
  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
} 