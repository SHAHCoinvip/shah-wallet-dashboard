import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Subscription {
  subscription_id: string
  customer_id: string
  wallet_address: string
  email: string
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid'
  current_period_end: string
  price_id: string
  created_at: string
  updated_at: string
}

export const useSubscription = () => {
  const { address } = useAccount()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    if (address) {
      fetchSubscription()
    } else {
      setSubscription(null)
      setIsPremium(false)
      setLoading(false)
    }
  }, [address])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('wallet_address', address?.toLowerCase())
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching subscription:', error)
      }

      setSubscription(data)
      setIsPremium(!!data && data.status === 'active')
    } catch (error) {
      console.error('Error in fetchSubscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCheckoutSession = async (priceId: string, email: string) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          email,
          walletAddress: address,
        }),
      })

      const { id } = await response.json()
      
      // Redirect to Stripe checkout
      const stripe = await import('@stripe/stripe-js').then(({ loadStripe }) => 
        loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      )
      
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: id })
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  const cancelSubscription = async () => {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription?.subscription_id,
        }),
      })

      if (response.ok) {
        await fetchSubscription() // Refresh subscription data
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw error
    }
  }

  return {
    subscription,
    loading,
    isPremium,
    createCheckoutSession,
    cancelSubscription,
    refreshSubscription: fetchSubscription,
  }
} 