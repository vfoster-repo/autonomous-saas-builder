'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function SupportPage() {
  const { data: session } = useSession()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/truckerflow-v7/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, message }) })
    setSent(true)
  }

  const inputCls = 'bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-blue-500'

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Support</h1>
      {sent ? (
        <div className="bg-green-900/30 border border-green-700 text-green-300 rounded-xl p-5 text-sm">
          ✓ Your message has been sent. We&apos;ll get back to you at <strong>{session?.user?.email}</strong>.
        </div>
      ) : (
        <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div><label className="text-xs text-gray-400 block mb-1">Subject</label><input value={subject} onChange={e => setSubject(e.target.value)} required className={inputCls} /></div>
          <div><label className="text-xs text-gray-400 block mb-1">Message</label><textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} required className={inputCls} /></div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">Send Message</button>
        </form>
      )}
    </div>
  )
}
