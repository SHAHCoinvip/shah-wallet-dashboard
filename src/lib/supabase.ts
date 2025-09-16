import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface Order {
  id: string
  wallet: string
  usd_amount: number
  features: string[]
  status: 'pending' | 'paid' | 'failed'
  session_id: string
  payment_intent_id?: string
  token_name?: string
  token_symbol?: string
  token_address?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  wallet: string
  email?: string
  is_premium: boolean
  subscription_id?: string
  created_at: string
  updated_at: string
}

// Order operations
export async function createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getOrderBySessionId(sessionId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('session_id', sessionId)
    .single()
  
  if (error) {
    console.error('Error fetching order:', error)
    return null
  }
  
  return data
}

export async function updateOrderStatus(
  sessionId: string, 
  status: Order['status'], 
  paymentIntentId?: string
) {
  const updateData: any = { 
    status, 
    updated_at: new Date().toISOString() 
  }
  
  if (paymentIntentId) {
    updateData.payment_intent_id = paymentIntentId
  }
  
  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('session_id', sessionId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getOrdersByWallet(wallet: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('wallet', wallet)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }
  
  return data || []
}

// User operations
export async function upsertUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('users')
    .upsert([userData], { onConflict: 'wallet' })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getUserByWallet(wallet: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet', wallet)
    .single()
  
  if (error) {
    console.error('Error fetching user:', error)
    return null
  }
  
  return data
}