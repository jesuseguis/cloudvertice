'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/lib/api'

interface CreatePaymentIntentParams {
  orderId: string
}

interface PaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}

interface Transaction {
  id: string
  orderId: string
  stripePaymentIntentId: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (params: CreatePaymentIntentParams) =>
      paymentsApi.createIntent(params.orderId),
  })
}

export function useGetPaymentIntent(intentId: string) {
  return useQuery({
    queryKey: ['payments', 'intent', intentId],
    queryFn: () => paymentsApi.getIntent(intentId),
    enabled: !!intentId,
  })
}

export function useGetTransactionByOrder(orderId: string) {
  return useQuery({
    queryKey: ['payments', 'order', orderId],
    queryFn: () => paymentsApi.getTransactionByOrder(orderId),
    enabled: !!orderId,
  })
}

export function useGetTransactions() {
  return useQuery({
    queryKey: ['payments', 'transactions'],
    queryFn: () => paymentsApi.getTransactions(),
  })
}
