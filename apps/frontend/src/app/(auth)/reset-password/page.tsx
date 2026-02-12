'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api/client'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return
    setError(null)
    try {
      await authApi.resetPassword(token, data.password)
      setSuccess(true)
    } catch {
      setError('El enlace es inválido o ha expirado. Solicita uno nuevo.')
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-semibold text-white">Enlace inválido</h2>
        <p className="text-text-secondary text-sm">
          El enlace de recuperación no es válido. Solicita uno nuevo.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-lg font-semibold text-white">Contraseña actualizada</h2>
        <p className="text-text-secondary text-sm">
          Tu contraseña ha sido restablecida exitosamente.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Ir al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <p className="text-text-secondary text-sm mb-6">
        Ingresa tu nueva contraseña.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Nueva contraseña"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5" />}
          error={errors.password?.message}
          {...register('password')}
          autoComplete="new-password"
        />

        <Input
          label="Confirmar contraseña"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Restableciendo...' : 'Restablecer contraseña'}
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
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Cloud Vertice</h1>
          <p className="text-text-secondary">Restablecer contraseña</p>
        </div>

        <div className="bg-card-dark rounded-lg border border-border-dark p-8">
          <Suspense fallback={<div className="text-center text-text-secondary">Cargando...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="mt-8 text-center text-xs text-text-secondary">
          © {new Date().getFullYear()} Cloud Vertice. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
