'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Calendar,
  Shield,
  Key,
  Bell,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfileSchema, changePasswordSchema, type UpdateProfileFormData, type ChangePasswordFormData } from '@/lib/validators'
import { useToast } from '@/lib/hooks/use-toast'

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth()
  const { success, error: toastError } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const profileForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  })

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const handleUpdateProfile = async (data: UpdateProfileFormData) => {
    const success = await updateProfile(data)
    if (success) {
      setEditOpen(false)
    }
  }

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    const success = await changePassword(data)
    if (success) {
      setPasswordOpen(false)
      passwordForm.reset()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header title="Mi Perfil" subtitle="Gestiona tu cuenta" />

      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Información Personal</CardTitle>
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                        <div>
                          <Label>Nombre</Label>
                          <Input
                            {...profileForm.register('name')}
                            error={profileForm.formState.errors.name?.message}
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            {...profileForm.register('email')}
                            error={profileForm.formState.errors.email?.message}
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditOpen(false)
                              profileForm.reset()
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                            {profileForm.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {user?.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{user?.name}</h3>
                    <p className="text-text-secondary">{user?.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background-dark flex items-center justify-center">
                      <Mail className="h-5 w-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Email</p>
                      <p className="text-sm text-white">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background-dark flex items-center justify-center">
                      <Shield className="h-5 w-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Rol</p>
                      <p className="text-sm text-white capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background-dark flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Miembro desde</p>
                      <p className="text-sm text-white">
                        {user?.createdAt ? formatDate(user.createdAt) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Preferencias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background-dark flex items-center justify-center">
                      <Bell className="h-5 w-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Notificaciones por email</p>
                      <p className="text-xs text-text-secondary">
                        Recibir actualizaciones sobre mis servidores
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seguridad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Key className="mr-2 h-4 w-4" />
                      Cambiar contraseña
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cambiar Contraseña</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                      <div>
                        <Label>Contraseña actual</Label>
                        <Input
                          type="password"
                          {...passwordForm.register('currentPassword')}
                          error={passwordForm.formState.errors.currentPassword?.message}
                        />
                      </div>
                      <div>
                        <Label>Nueva contraseña</Label>
                        <Input
                          type="password"
                          {...passwordForm.register('newPassword')}
                          error={passwordForm.formState.errors.newPassword?.message}
                        />
                      </div>
                      <div>
                        <Label>Confirmar nueva contraseña</Label>
                        <Input
                          type="password"
                          {...passwordForm.register('confirmPassword')}
                          error={passwordForm.formState.errors.confirmPassword?.message}
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setPasswordOpen(false)
                            passwordForm.reset()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                          {passwordForm.formState.isSubmitting ? 'Cambiando...' : 'Cambiar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-500/30">
              <CardHeader>
                <CardTitle className="text-lg text-red-400">Zona de Peligro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-text-secondary">
                  Estas acciones son irreversibles. Por favor, ten cuidado.
                </p>
                <Button variant="danger" className="w-full">
                  Eliminar mi cuenta
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
