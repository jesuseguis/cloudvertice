import { Metadata } from 'next'
import { Logo } from '@/components/layout/logo'
import { Link } from '@/components/ui/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Cloud Vertice',
  description: 'Política de privacidad y protección de datos de Cloud Vertice',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="border-b border-border-dark bg-card-dark/80 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-sm text-text-secondary hover:text-white transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Política de Privacidad</h1>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Última actualización: Enero 2025</h2>
              <p className="text-text-secondary leading-relaxed">
                En Cloud Vertice nos comprometemos a proteger la privacidad y seguridad de tus datos personales.
                Esta política explica cómo recopilamos, usamos y protegemos tu información.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">1. Información que Recopilamos</h3>
              <div className="space-y-3 text-text-secondary">
                <p><strong className="text-white">Información de cuenta:</strong> Nombre, correo electrónico, dirección IP y datos de autenticación.</p>
                <p><strong className="text-white">Información de pago:</strong> Datos procesados a través de Stripe (no almacenemos tus datos de tarjeta).</p>
                <p><strong className="text-white">Información de servicios:</strong> Configuraciones de VPS, regiones seleccionadas, sistemas operativos.</p>
                <p><strong className="text-white">Datos de uso:</strong> Logs de acceso, métricas de rendimiento, interacciones con soporte.</p>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">2. Uso de la Información</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Utilizamos tu información para:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Proveer y administrar tus servicios VPS</li>
                  <li>Procesar pagos y gestionar facturas</li>
                  <li>Comunicarnos contigo sobre tu servicio</li>
                  <li>Mejorar nuestra plataforma y servicios</li>
                  <li>Cumplir con obligaciones legales</li>
                  <li>Prevenir fraudes y abusos</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">3. Protección de Datos</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Implementamos medidas de seguridad para proteger tu información:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Encriptación AES-256 para contraseñas de VPS</li>
                  <li>Conexiones HTTPS/TLS para todas las comunicaciones</li>
                  <li>Autenticación con JWT de corta duración</li>
                  <li>Base de datos con acceso restringido</li>
                  <li>Auditoría de accesos y logs de seguridad</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">4. Compartir Información</h3>
              <div className="space-y-3 text-text-secondary">
                <p>No vendemos tu información personal. Compartimos datos solo con:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong className="text-white">Contabo API:</strong> Para provisionar y gestionar tus VPS</li>
                  <li><strong className="text-white">Stripe:</strong> Para procesar pagos de forma segura</li>
                  <li><strong className="text-white">SendGrid:</strong> Para enviar notificaciones por email</li>
                  <li><strong className="text-white">Autoridades:</strong> Cuando sea requerido por ley</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">5. Tus Derechos</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Tienes derecho a:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Acceder a tus datos personales</li>
                  <li>Solicitar corrección de datos inexactos</li>
                  <li>Solicitar eliminación de tus datos</li>
                  <li>Oponerte al procesamiento de tus datos</li>
                  <li>Exportar tus datos (portabilidad)</li>
                  <li>Retirar consentimiento cuando aplique</li>
                </ul>
                <p className="mt-3">Para ejercer estos derechos, contacta a <a href="mailto:privacy@cloud.vertice.com.co" className="text-primary hover:underline">privacy@cloud.vertice.com.co</a></p>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">6. Retención de Datos</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Conservamos tu información mientras mantengas una cuenta activa. Después de cerrar tu cuenta:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong className="text-white">30 días:</strong> Datos de cuenta básicos para posible recuperación</li>
                  <li><strong className="text-white">7 años:</strong> Facturas y registros contables (obligación legal)</li>
                  <li><strong className="text-white">Inmediato:</strong> Datos de VPS y contraseñas al cancelar servicios</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">7. Cookies y Tracking</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Utilizamos cookies esenciales para:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Mantener tu sesión activa</li>
                  <li>Recordar tus preferencias</li>
                  <li>Analizar el uso de la plataforma</li>
                </ul>
                <p className="mt-3">Puedes gestionar las cookies desde la configuración de tu navegador.</p>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">8. Menores de Edad</h3>
              <p className="text-text-secondary leading-relaxed">
                Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos intencionalmente
                información de menores. Si detectamos que un menor ha proporcionado datos, los eliminaremos inmediatamente.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">9. Cambios a esta Política</h3>
              <p className="text-text-secondary leading-relaxed">
                Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios importantes
                mediante email o aviso en la plataforma. El uso continuado del servicio después de los cambios
                constituye aceptación de la nueva política.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">10. Contacto</h3>
              <div className="text-text-secondary space-y-2">
                <p>Para preguntas sobre esta política o tus datos personales:</p>
                <p>Email: <a href="mailto:privacy@cloud.vertice.com.co" className="text-primary hover:underline">privacy@cloud.vertice.com.co</a></p>
                <p>Sitio web: <a href="https://cloud.vertice.com.co" className="text-primary hover:underline">https://cloud.vertice.com.co</a></p>
              </div>
            </section>

            <section className="p-6 border border-border-dark rounded-lg bg-card-dark/50 mt-12">
              <p className="text-sm text-text-secondary">
                Esta política se rige por las leyes de protección de datos aplicables.
                Al usar Cloud Vertice, aceptas las prácticas descritas en esta política.
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-dark bg-card-dark/50 mt-12">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-secondary">
              © {new Date().getFullYear()} Cloud Vertice. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/terms" className="text-text-secondary hover:text-white transition-colors">
                Términos de Servicio
              </Link>
              <Link href="/privacy" className="text-text-secondary hover:text-white transition-colors">
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
