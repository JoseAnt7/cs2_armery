import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL } from '../../content/legalSite';

export function Terms() {
  return (
    <LegalLayout title="Términos y condiciones de uso">
      <p className="legal-updated">Última actualización: {LEGAL.lastUpdated}</p>

      <p>
        Los presentes Términos regulan el acceso y uso del sitio web{' '}
        <strong>{LEGAL.siteName}</strong> ({LEGAL.url}). Al utilizar el sitio, aceptas estos
        Términos. Si no estás de acuerdo, no uses el servicio.
      </p>

      <h2>1. Titular del servicio</h2>
      <p>
        Identificación en el <a href="/aviso-legal">Aviso legal</a>. Contacto:{' '}
        <a href={`mailto:${LEGAL.emails.public}`}>{LEGAL.emails.public}</a>.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        {LEGAL.siteName} ofrece un {LEGAL.description}, con información obtenida de mercados
        públicos. No somos tienda ni intermediario de compraventa: las transacciones se realizan
        en sitios de terceros.
      </p>

      <h2>3. Registro de usuario</h2>
      <p>
        Para ciertas funciones debes crear una cuenta con datos veraces. Eres responsable de la
        confidencialidad de tu contraseña y de la actividad en tu cuenta. Puedes eliminar tu
        cuenta desde el perfil cuando esa opción esté disponible.
      </p>

      <h2>4. Uso permitido</h2>
      <p>Te comprometes a:</p>
      <ul>
        <li>Usar el sitio de forma lícita y respetuosa.</li>
        <li>No intentar acceder sin autorización a sistemas, cuentas ajenas o el panel de administración.</li>
        <li>No automatizar el acceso de forma abusiva (scraping masivo, ataques, etc.).</li>
        <li>No manipular precios, anuncios o estadísticas.</li>
        <li>No utilizar el sitio para actividades fraudulentas o contrarias a la ley.</li>
      </ul>

      <h2>5. Precios e información</h2>
      <p>
        Los precios y disponibilidad mostrados son orientativos y pueden contener errores o
        retrasos. Verifica siempre en el mercado correspondiente antes de comprar. No garantizamos
        que un precio en {LEGAL.siteName} coincida con el precio final en el marketplace.
      </p>

      <h2>6. CSBot y herramientas premium</h2>
      <p>
        CSBot y otras funciones pueden estar sujetas a límites técnicos, disponibilidad de APIs
        externas o planes de suscripción. El uso de APIs de terceros (Steam, etc.) puede estar
        limitado por sus propias condiciones.
      </p>

      <h2>7. Suscripciones y pagos</h2>
      <p>
        La oferta de suscripciones puede mostrarse u ocultarse según la fase del proyecto. Cuando
        exista pasarela de pago, se informará de precios, renovación, cancelación y derecho de
        desistimiento conforme a la normativa de consumo aplicable.
      </p>

      <h2>8. Propiedad intelectual</h2>
      <p>
        El contenido propio del sitio está protegido. No está permitida su reproducción masiva sin
        autorización. Las marcas de terceros pertenecen a sus titulares. Ver Aviso legal sobre{' '}
        {LEGAL.imageSources}.
      </p>

      <h2>9. Enlaces a terceros</h2>
      <p>
        Enlaces a {LEGAL.externalMarkets} no implican responsabilidad sobre sus contenidos,
        precios finales ni políticas.
      </p>

      <h2>10. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, los titulares no serán responsables de daños
        indirectos, lucro cesante o pérdidas derivadas del uso de la información del sitio o de
        enlaces externos.
      </p>

      <h2>11. Modificaciones</h2>
      <p>
        Podemos modificar el sitio, estos Términos o interrumpir el servicio. Los cambios
        relevantes se publicarán en esta página.
      </p>

      <h2>12. Ley aplicable</h2>
      <p>
        Legislación española. Jurisdicción según normativa de consumidores y usuarios y demás
        normas imperativas.
      </p>
    </LegalLayout>
  );
}
