import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'pink' | 'purple' | 'sky' | 'navy' | 'green' | 'red'
  className?: string
}

export default function Badge({ children, variant = 'pink', className }: BadgeProps) {
  const variants = {
    pink: 'bg-pink/15 text-pink',
    purple: 'bg-purple/15 text-purple',
    sky: 'bg-sky/20 text-sky-700',
    navy: 'bg-navy/10 text-navy',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  }
  return (
    <span className={cn('inline-block px-3 py-0.5 rounded-full text-xs font-bold', variants[variant], className)}>
      {children}
    </span>
  )
}
