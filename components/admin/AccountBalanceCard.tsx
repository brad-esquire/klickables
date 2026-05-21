import type { AccountBalance } from '@/types'

interface Props {
  balance: AccountBalance
}

export default function AccountBalanceCard({ balance }: Props) {
  const { account, balance: amt, transaction_count } = balance
  const isExternal = account.kind === 'external'
  const isOwed = isExternal && amt < 0
  const tintByKind: Record<string, string> = {
    digital: 'bg-blue-50 border-blue-100',
    cash:    'bg-pink/5 border-pink/20',
    external: isOwed ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100',
  }
  const labelByKind: Record<string, string> = {
    digital:  'Digital',
    cash:     'Cash',
    external: 'External',
  }

  // External accounts: a negative balance means the company owes this person.
  // Display the absolute value and flip the sign meaning for clarity.
  const displayAmt = isExternal ? Math.abs(amt) : amt
  const sign = !isExternal && amt < 0 ? '-' : ''
  const amtClass = isOwed
    ? 'text-red-600'
    : amt < 0
      ? 'text-red-500'
      : 'text-navy'

  return (
    <div className={`rounded-2xl p-4 border ${tintByKind[account.kind]}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-navy/40">{labelByKind[account.kind]}</p>
          <p className="text-sm font-bold text-navy">{account.name}</p>
          {account.holder && <p className="text-xs text-navy/50">{account.holder}</p>}
        </div>
      </div>
      <p className={`text-2xl font-black ${amtClass}`}>
        {sign}${displayAmt.toFixed(2)}
      </p>
      {isOwed && (
        <p className="text-xs font-bold text-red-600 mt-1">Company owes</p>
      )}
      <p className="text-xs text-navy/40 mt-2">
        {transaction_count} {transaction_count === 1 ? 'transaction' : 'transactions'}
      </p>
    </div>
  )
}
