'use client'

import { useEffect, useState } from 'react'
import { useAdminSettings } from '@/lib/hooks/use-admin'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Settings,
  Building2,
  Receipt,
  Save,
  Loader2,
} from 'lucide-react'

export default function AdminSettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useAdminSettings()

  const [taxRate, setTaxRate] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyNit, setCompanyNit] = useState('')
  const [invoiceNotes, setInvoiceNotes] = useState('')

  useEffect(() => {
    if (settings) {
      setTaxRate(String(Number(settings.tax_rate || '0.19') * 100))
      setCompanyName(settings.company_name || '')
      setCompanyWebsite(settings.company_website || '')
      setCompanyAddress(settings.company_address || '')
      setCompanyPhone(settings.company_phone || '')
      setCompanyNit(settings.company_nit || '')
      setInvoiceNotes(settings.invoice_notes || '')
    }
  }, [settings])

  const handleSave = () => {
    const taxDecimal = Number(taxRate) / 100
    updateSettings({
      tax_rate: String(taxDecimal),
      company_name: companyName,
      company_website: companyWebsite,
      company_address: companyAddress,
      company_phone: companyPhone,
      company_nit: companyNit,
      invoice_notes: invoiceNotes,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-12 w-12 text-text-secondary animate-pulse mx-auto mb-4" />
          <p className="text-text-secondary">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title="Configuración"
        subtitle="Ajustes generales de la plataforma"
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Impuestos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tasa de impuesto (%)</Label>
                <div className="relative">
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="19"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">%</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Se aplica automáticamente al generar facturas. Ejemplo: 19 para IVA del 19%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Datos de la empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la empresa</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Cloud Vertice"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Sitio web</Label>
                <Input
                  id="companyWebsite"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="cloud.vertice.com.co"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyNit">NIT / Identificación fiscal</Label>
                <Input
                  id="companyNit"
                  value={companyNit}
                  onChange={(e) => setCompanyNit(e.target.value)}
                  placeholder="900.000.000-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Teléfono</Label>
                <Input
                  id="companyPhone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Dirección</Label>
              <Input
                id="companyAddress"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Calle 00 #00-00, Ciudad, Colombia"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Format */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Formato de factura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNotes">Notas adicionales</Label>
              <Textarea
                id="invoiceNotes"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Texto que aparecerá al pie de todas las facturas..."
                rows={3}
              />
              <p className="text-xs text-text-secondary">
                Este texto se incluirá en la parte inferior de todas las facturas PDF generadas.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            size="lg"
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isUpdating ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </div>
    </div>
  )
}
