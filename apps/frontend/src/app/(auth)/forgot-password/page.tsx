'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api/client'

const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null)
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Cloud Vertice</h1>
          <p className="text-text-secondary">Recupera tu contraseña</p>
        </div>

        <div className="bg-card-dark rounded-lg border border-border-dark p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">Revisa tu email</h2>
              <p className="text-text-secondary text-sm">
                Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <p className="text-text-secondary text-sm mb-6">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  icon={<Mail className="w-5 h-5" />}
                  error={errors.email?.message}
                  {...register('email')}
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-text-secondary">
          © {new Date().getFullYear()} Cloud Vertice. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
