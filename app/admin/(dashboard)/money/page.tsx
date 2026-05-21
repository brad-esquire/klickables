export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import { getAccountBalances } from '@/lib/moneyLedger'
import AccountBalanceCard from '@/components/admin/AccountBalanceCard'
import LedgerTable from '@/components/admin/LedgerTable'
import MoneyMovementModal from '@/components/admin/MoneyMovementModal'
import MoneyAccountsManager from '@/components/admin/MoneyAccountsManager'
import BackfillButton from '@/components/admin/BackfillButton'
import type { MoneyAccount, MoneyTransaction } from '@/types'

async function load() {
  const db = createAdminClient()
  const [balances, { data: allAccounts }, { data: txns }, { count: unassignedCashCount }] = await Promise.all([
    getAccountBalances(),
    db.from('money_accounts').select('*').order('sort_order').order('name'),
    db.from('money_transactions').select('*').order('occurred_at', { ascending: false }).order('created_at', { ascending: false }),
    db.from('orders').select('id', { count: 'exact', head: true })
      .eq('payment_method', 'cash')
      .is('cash_holder', null),
  ])
  return {
    balances,
    accounts: (allAccounts ?? []) as MoneyAccount[],
    activeAccounts: (allAccounts ?? []).filter((a) => !a.archived) as MoneyAccount[],
    transactions: (txns ?? []) as MoneyTransaction[],
    unassignedCashCount: unassignedCashCount ?? 0,
  }
}

export default async function MoneyPage() {
  const { balances, accounts, activeAccounts, transactions, unassignedCashCount } = await load()

  const totalCompanyAssets = balances
    .filter((b) => b.account.kind === 'digital' || b.account.kind === 'cash')
    .reduce((s, b) => s + b.balance, 0)

  const totalOwed = balances
    .filter((b) => b.account.kind === 'external' && b.balance < 0)
    .reduce((s, b) => s + Math.abs(b.balance), 0)

  const digital  = balances.filter((b) => b.account.kind === 'digital')
  const cash     = balances.filter((b) => b.account.kind === 'cash')
  const external = balances.filter((b) => b.account.kind === 'external')

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-black text-navy">Money</h1>
          <p className="text-navy/50 text-sm mt-1">Where the money is and how it&apos;s moving</p>
        </div>
        <MoneyMovementModal accounts={activeAccounts} />
      </div>

      <div className="mb-6">
        <BackfillButton />
      </div>

      {/* Headline figures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-bold uppercase tracking-wide text-navy/40">Total company assets</p>
          <p className="text-3xl font-black text-navy mt-1">${totalCompanyAssets.toFixed(2)}</p>
          <p className="text-xs text-navy/50 mt-1">Digital + cash combined</p>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm border ${totalOwed > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
          <p className="text-xs font-bold uppercase tracking-wide text-navy/40">Reimbursements owed</p>
          <p className={`text-3xl font-black mt-1 ${totalOwed > 0 ? 'text-red-600' : 'text-navy'}`}>${totalOwed.toFixed(2)}</p>
          <p className="text-xs text-navy/50 mt-1">Personal accounts the company owes back</p>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm border ${unassignedCashCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
          <p className="text-xs font-bold uppercase tracking-wide text-navy/40">Unassigned cash orders</p>
          <p className={`text-3xl font-black mt-1 ${unassignedCashCount > 0 ? 'text-yellow-700' : 'text-navy'}`}>{unassignedCashCount}</p>
          <p className="text-xs text-navy/50 mt-1">Cash orders missing a holder</p>
        </div>
      </div>

      {/* Account balance cards */}
      <div className="space-y-5 mb-8">
        {digital.length > 0 && (
          <section>
            <h2 className="font-black text-navy text-sm uppercase tracking-wide mb-2">Digital accounts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {digital.map((b) => <AccountBalanceCard key={b.account.id} balance={b} />)}
            </div>
          </section>
        )}
        {cash.length > 0 && (
          <section>
            <h2 className="font-black text-navy text-sm uppercase tracking-wide mb-2">Cash by holder</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {cash.map((b) => <AccountBalanceCard key={b.account.id} balance={b} />)}
            </div>
          </section>
        )}
        {external.length > 0 && (
          <section>
            <h2 className="font-black text-navy text-sm uppercase tracking-wide mb-2">External / personal accounts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {external.map((b) => <AccountBalanceCard key={b.account.id} balance={b} />)}
            </div>
          </section>
        )}
      </div>

      <div className="mb-8">
        <LedgerTable transactions={transactions} accounts={accounts} />
      </div>

      <MoneyAccountsManager accounts={accounts} />
    </div>
  )
}
