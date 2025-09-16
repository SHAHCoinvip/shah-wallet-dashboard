import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend('re_JKfDNd9k_4CxCh85q5uq8q7BjpVEWLkYk')

export async function POST(req: Request) {
  try {
    const { email, tip } = await req.json()

    if (!email || !tip) {
      return NextResponse.json({ error: 'Missing email or tip' }, { status: 400 })
    }

    const data = await resend.emails.send({
      from: 'SHAH Wallet <tips@shah.vip>',
      to: [email],
      subject: '🧠 Your Daily SHAH Wallet AI Tip',
      html: `<div>
        <h1>👑 SHAH Wallet AI Tip</h1>
        <p>${tip}</p>
        <hr />
        <p style="font-size: 12px; color: #666;">You received this because you asked for AI crypto tips from your wallet.</p>
      </div>`,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

