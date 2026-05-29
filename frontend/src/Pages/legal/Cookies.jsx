import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL } from '../../content/legalSite';

export function Cookies() {
  return (
    <LegalLayout title="Política de cookies">
      <p className="legal-updated">Última actualización: {LEGAL.lastUpdated}</p>

      <p>
        Esta política explica qué son las cookies, cuáles usamos en{' '}
        <strong>{LEGAL.siteName}</strong> ({LEGAL.url}) y cómo puedes gestionarlas.
      </p>

      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos que se almacenan en tu dispositivo cuando visitas un
        sitio web. Sirven para que el sitio funcione, recordar preferencias o, con tu
        consentimiento, mostrar publicidad relevante.
      </p>

      <h2>2. ¿Quién utiliza las cookies?</h2>
      <p>
        Las cookies pueden ser propias (de {LEGAL.siteName}) o de terceros (por ejemplo, Google
        en el marco de AdSense).
      </p>

      <h2>3. Tipos de cookies que utilizamos</h2>

      <h3>3.1. Cookies técnicas o necesarias (siempre activas)</h3>
      <p>
        Son imprescindibles para el funcionamiento del sitio, por ejemplo: mantener tu sesión
        iniciada, recordar preferencias esenciales o el estado de tu elección de cookies.
        No requieren consentimiento.
      </p>
      <ul>
        <li>Token de autenticación (sesión de usuario).</li>
        <li>Preferencia de consentimiento de cookies.</li>
        <li>Identificador de sesión para el contador de visitas por pestaña.</li>
      </ul>

      <h3>3.2. Cookies de publicidad (opcionales)</h3>
      <p>
        Si aceptas las cookies de publicidad, Google AdSense y sus socios pueden instalar
        cookies para:
      </p>
      <ul>
        <li>Mostrar anuncios en función de tus intereses (publicidad personalizada).</li>
        <li>Medir la eficacia de los anuncios.</li>
        <li>Limitar el número de veces que ves un anuncio.</li>
      </ul>
      <p>
        Si rechazas la publicidad personalizada, podremos mostrar anuncios contextuales o no
        personalizados según la configuración de AdSense y tu elección en el banner.
      </p>

      <h3>3.3. Cookies de analítica</h3>
      <p>
        En este momento <strong>no utilizamos Google Analytics</strong> ni herramientas de
        analítica de terceros equivalentes. Si las incorporamos en el futuro, pediremos tu
        consentimiento y actualizaremos esta política.
      </p>

      <h2>4. Cómo gestionar tu consentimiento</h2>
      <p>
        Al entrar por primera vez verás un banner donde puedes:
      </p>
      <ul>
        <li>
          <strong>Aceptar todas:</strong> cookies necesarias + publicidad (incluida
          personalización cuando AdSense lo permita).
        </li>
        <li>
          <strong>Solo necesarias:</strong> rechazamos cookies de publicidad y analítica.
        </li>
        <li>
          <strong>Configurar:</strong> eliges si permites publicidad personalizada.
        </li>
      </ul>
      <p>
        Puedes cambiar tu elección borrando las cookies del navegador o, cuando esté disponible,
        desde el enlace «Configurar cookies» en el pie de página.
      </p>

      <h2>5. Cómo desactivar cookies desde el navegador</h2>
      <p>
        Puedes configurar tu navegador para bloquear o eliminar cookies. Ten en cuenta que
        algunas funciones del sitio podrían dejar de funcionar correctamente.
      </p>

      <h2>6. Más información sobre publicidad de Google</h2>
      <p>
        Consulta cómo Google utiliza los datos en sus productos publicitarios:{' '}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          target="_blank"
          rel="noopener noreferrer"
        >
          Política de Google para partners
        </a>
        . Puedes personalizar los anuncios de Google en{' '}
        <a
          href="https://adssettings.google.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Configuración de anuncios de Google
        </a>
        .
      </p>

      <h2>7. Contacto</h2>
      <p>
        Para dudas sobre cookies:{' '}
        <a href={`mailto:${LEGAL.emails.privacy}`}>{LEGAL.emails.privacy}</a>
      </p>
    </LegalLayout>
  );
}
