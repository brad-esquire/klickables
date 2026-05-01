'use client'

import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'

export default function OrderNotes({ orderId, initialNotes }: { orderId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  function startEdit() {
    setDraft(notes)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: draft }),
    })
    setNotes(draft)
    setEditing(false)
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-black text-navy">Notes</h2>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 text-xs font-bold text-navy/50 hover:text-navy transition-colors cursor-pointer"
          >
            <Pencil size={12} />
            {notes ? 'Edit' : 'Add note'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Kirra has the products and will hand deliver."
            rows={3}
            autoFocus
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple text-sm text-navy resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white text-xs font-bold rounded-full hover:bg-navy/85 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Check size={12} />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-gray-200 text-navy/60 text-xs font-bold rounded-full hover:border-gray-300 cursor-pointer transition-colors"
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        </div>
      ) : notes ? (
        <p className="text-sm text-navy/70 leading-relaxed whitespace-pre-wrap">{notes}</p>
      ) : (
        <p className="text-sm text-navy/30 italic">No notes yet.</p>
      )}
    </div>
  )
}
