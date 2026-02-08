'use client'

import { useClientInvoices } from '@/lib/hooks/use-orders'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Download,
  Calendar,
  CreditCard,
  DollarSign,
} from 'lucide-react'
import type { Invoice } from '@/types'

export default function BillingPage() {
  const { data: invoicesData, isLoading } = useClientInvoices()
  const invoices = invoicesData?.data ?? []

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Normalize status to lowercase for consistent handling
  const normalizeStatus = (status: Invoice['status']) => {
    if (!status) return 'pending'
    return status.toLowerCase() as 'paid' | 'pending' | 'cancelled'
  }

  const getStatusLabel = (status: Invoice['status']) => {
    const normalized = normalizeStatus(status)
    const labels = {
      paid: 'Pagada',
      pending: 'Pendiente',
      cancelled: 'Cancelada',
    }
    return labels[normalized]
  }

  const getStatusVariant = (status: Invoice['status']) => {
    const normalized = normalizeStatus(status)
    const variants = {
      paid: 'success' as const,
      pending: 'warning' as const,
      cancelled: 'secondary' as const,
    }
    return variants[normalized]
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header title="Facturación" subtitle="Tus facturas y pagos" />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Total este mes</p>
                  <p className="text-2xl font-bold text-white">$0.00</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Facturas pagadas</p>
                  <p className="text-2xl font-bold text-white">
                    {invoices.filter((i) => normalizeStatus(i.status) === 'paid').length}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Pendientes</p>
                  <p className="text-2xl font-bold text-white">
                    {invoices.filter((i) => normalizeStatus(i.status) === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <div className="p-6 border-b border-border-dark">
            <h3 className="text-lg font-semibold text-white">Historial de Facturas</h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-card-dark/50 rounded w-1/4 mx-auto mb-4" />
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-card-dark/50 rounded" />
                  ))}
                </div>
              </div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No hay facturas
              </h3>
              <p className="text-sm text-text-secondary text-center">
                Tus facturas aparecerán aquí cuando tengas servicios activos
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">
                      #{invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-text-secondary" />
                        {formatDate(invoice.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-text-secondary" />
                        {formatDate(invoice.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                        ${normalizeStatus(invoice.status) === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : ''}
                        ${normalizeStatus(invoice.status) === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''}
                        ${normalizeStatus(invoice.status) === 'cancelled' ? 'bg-card-dark border border-border-dark text-text-secondary' : ''}
                      `}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.total || invoice.amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
