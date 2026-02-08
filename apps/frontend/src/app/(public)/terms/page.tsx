import { Metadata } from 'next'
import { Logo } from '@/components/layout/logo'
import { Link } from '@/components/ui/link'

export const metadata: Metadata = {
  title: 'Términos de Servicio | Cloud Vertice',
  description: 'Términos y condiciones de servicio de Cloud Vertice',
}

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-white mb-8">Términos de Servicio</h1>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Última actualización: Enero 2025</h2>
              <p className="text-text-secondary leading-relaxed">
                Bienvenido a Cloud Vertice. Estos términos rigen el uso de nuestra plataforma de reventa de VPS.
                Al acceder o usar nuestros servicios, aceptas estos términos en su totalidad.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">1. Aceptación de los Términos</h3>
              <p className="text-text-secondary leading-relaxed">
                Al crear una cuenta o usar nuestros servicios, confirmas que tienes al menos 18 años de edad
                y la capacidad legal para contratar estos términos. Si no estás de acuerdo con alguno de estos
                términos, no debes usar nuestros servicios.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">2. Descripción del Servicio</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Cloud Vertice es una plataforma de venta de servidores VPS con infraestructura de terceros.
                Nuestros servicios incluyen:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Venta de planes VPS con diferentes configuraciones</li>
                  <li>Panel de gestión para clientes</li>
                  <li>Soporte técnico</li>
                  <li>Facturación y gestión de pagos</li>
                  <li>Gestión de snapshots y backups</li>
                </ul>
                <p className="mt-3">Nos reservamos el derecho de modificar o suspender cualquier servicio con previo aviso.</p>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">3. Responsabilidades del Cliente</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Como cliente, eres responsable de:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Mantener la confidencialidad de tus credenciales de acceso</li>
                  <li>Todas las actividades que ocurran en tu cuenta</li>
                  <li>El contenido que alojes en tu VPS</li>
                  <li>Cumplir con todas las leyes aplicables</li>
                  <li>No revender o sub-licitar los servicios sin autorización</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">4. Contenidos y Actividades Prohibidas</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Está estrictamente prohibido usar nuestros servicios para:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Distribución de malware, virus o código dañino</li>
                  <li>Actividades de hacking, phishing o ataques DDoS</li>
                  <li>Violación de derechos de autor o propiedad intelectual</li>
                  <li>Contenido ilegal, pornografía infantil o extremismo</li>
                  <li>Spam, envío masivo de correos no solicitados</li>
                  <li>Minería de criptomonedas sin plan autorizado</li>
                  <li>Infracciones de red, escaneo de puertos no autorizado</li>
                  <li>Cualquier actividad que viole las leyes locales o internacionales</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">5. Suspensión y Terminación</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Podemos suspender o terminar tu servicio inmediatamente si:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Violas cualquiera de estos términos</li>
                  <li>Realizas actividades prohibidas en tu VPS</li>
                  <li>No pagas los servicios contratados</li>
                  <li>Proporcionas información falsa o fraudulenta</li>
                  <li>Pones en riesgo la seguridad de nuestra plataforma</li>
                </ul>
                <p className="mt-3">En caso de suspensión por violación de términos, no se realizarán reembolsos.</p>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">6. Precios y Pagos</h3>
              <div className="space-y-3 text-text-secondary">
                <p><strong className="text-white">Facturación:</strong> Los servicios se facturan por adelantado según el plan seleccionado (mensual o anual).</p>
                <p><strong className="text-white">Descuentos anuales:</strong> Los planes anuales tienen un descuento del 17% aplicado automáticamente.</p>
                <p><strong className="text-white">Métodos de pago:</strong> Aceptamos tarjetas de crédito/débito a través de Stripe.</p>
                <p><strong className="text-white">Renovación automática:</strong> Los servicios se renuevan automáticamente al final del período.</p>
                <p><strong className="text-white">Cancelación:</strong> Puedes cancelar en cualquier momento desde tu panel. No hay reembolsos por meses parciales usados.</p>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">7. Disponibilidad del Servicio</h3>
              <div className="space-y-3 text-text-secondary">
                <p> Nos esforzamos por mantener una disponibilidad del 99.9%, pero no garantizamos:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Interrupciones por mantenimiento programado (con aviso previo)</li>
                  <li>Fallos causados por proveedores de infraestructura</li>
                  <li>Eventos fuera de nuestro control (desastres naturales, guerras, etc.)</li>
                  <li>Disponibilidad de recursos en regiones específicas</li>
                </ul>
                <p className="mt-3">No somos responsables por pérdidas de datos o interrupciones del servicio.</p>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">8. Backups y Datos</h3>
              <div className="space-y-3 text-text-secondary">
                <p><strong className="text-white">Responsabilidad del cliente:</strong> Eres el único responsable de respaldar tus datos importantes.</p>
                <p><strong className="text-white">Snapshots:</strong> Ofrecemos funcionalidad de snapshots como característica adicional, no como reemplazo de backups.</p>
                <p><strong className="text-white">Pérdida de datos:</strong> No nos hacemos responsables por pérdida de datos debido a eliminación accidental, fallo de hardware o acciones del cliente.</p>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">9. Soporte Técnico</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Ofrecemos soporte técnico a través de:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Sistema de tickets en el panel de cliente</li>
                  <li>Email: <a href="mailto:soporte@cloud.vertice.com.co" className="text-primary hover:underline">soporte@cloud.vertice.com.co</a></li>
                </ul>
                <p className="mt-3"><strong className="text-white">Tiempos de respuesta:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Crítico: 4 horas</li>
                  <li>Alta: 8 horas</li>
                  <li>Normal: 24 horas</li>
                  <li>Baja: 48 horas</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">10. Limitación de Responsabilidad</h3>
              <p className="text-text-secondary leading-relaxed">
                En la máxima medida permitida por la ley, Cloud Vertice no será responsable por:
                daños indirectos, incidentales, especiales o consecuentes incluyendo pérdida de beneficios,
                datos, uso o cualquier otra pérdida intangible resultante del uso o incapacidad de usar
                nuestros servicios. Nuestra responsabilidad total no excederá el monto pagado por el servicio
                en los últimos 12 meses.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">11. Propiedad Intelectual</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Todo el contenido de Cloud Vertice incluyendo:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Diseño, logotipos y gráficos</li>
                  <li>Código, software y tecnología</li>
                  <li>Textos, documentación y guías</li>
                  <li>Base de datos y estructura del sitio</li>
                </ul>
                <p className="mt-3">es propiedad exclusiva de Cloud Vertice o sus licenciantes y está protegido por
                las leyes de propiedad intelectual.</p>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">12. Modificaciones del Servicio</h3>
              <p className="text-text-secondary leading-relaxed">
                Nos reservamos el derecho de modificar, actualizar o discontinuar cualquier aspecto del servicio
                en cualquier momento. Te notificaremos sobre cambios significativos con al menos 30 días de
                antelación mediante email o aviso en la plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">13. Resolución de Controversias</h3>
              <div className="space-y-3 text-text-secondary">
                <p>Cualquier disputa relacionada con estos términos se regirá por:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Leyes de la República de Colombia</li>
                  <li>Competencia de los tribunales colombianos</li>
                </ul>
                <p className="mt-3">Antes de tomar acciones legales, ambas partes acuerdan intentar resolver
                las controversias de buena fe mediante negociación directa.</p>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">14. Renuncia</h3>
              <p className="text-text-secondary leading-relaxed">
                El hecho de no ejercer cualquier derecho o disposición de estos términos no constituirá una
                renuncia a tal derecho o disposición.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">15. Separabilidad</h3>
              <p className="text-text-secondary leading-relaxed">
                Si cualquier disposición de estos términos es declarada inválida o inaplicable por un tribunal
                competente, las disposiciones restantes mantendrán su plena validez y efecto.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">16. Contacto</h3>
              <div className="text-text-secondary space-y-2">
                <p>Para preguntas sobre estos términos:</p>
                <p>Email: <a href="mailto:legal@cloud.vertice.com.co" className="text-primary hover:underline">legal@cloud.vertice.com.co</a></p>
                <p>Sitio web: <a href="https://cloud.vertice.com.co" className="text-primary hover:underline">https://cloud.vertice.com.co</a></p>
              </div>
            </section>

            <section className="p-6 border border-border-dark rounded-lg bg-card-dark/50 mt-12">
              <p className="text-sm text-text-secondary">
                Estos términos constituyen un acuerdo legal vinculante entre tú y Cloud Vertice.
                Al usar nuestros servicios, aceptas estar sujeto a estos términos y nuestra Política de Privacidad.
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
