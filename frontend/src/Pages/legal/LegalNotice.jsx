import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL } from '../../content/legalSite';

export function LegalNotice() {
  const titularesText = LEGAL.titulares
    .map((t) => (t.nif ? `${t.name} (NIF ${t.nif})` : `${t.name} (NIF pendiente de publicación)`))
    .join(' y ');

  return (
    <LegalLayout title="Aviso legal">
      <p className="legal-updated">Última actualización: {LEGAL.lastUpdated}</p>

      <p>
        En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
        Información y de Comercio Electrónico (LSSI-CE), se informa a los usuarios de los datos
        identificativos del titular del sitio web <strong>{LEGAL.domain}</strong>.
      </p>

      <h2>1. Titulares del sitio</h2>
      <p>
        El sitio web <strong>{LEGAL.url}</strong> ({LEGAL.siteName}) es operado por{' '}
        <strong>{titularesText}</strong>, con domicilio en <strong>{LEGAL.address}</strong>.
      </p>

      <h2>2. Contacto</h2>
      <ul>
        <li>
          Contacto general:{' '}
          <a href={`mailto:${LEGAL.emails.public}`}>{LEGAL.emails.public}</a>
        </li>
        <li>
          Soporte: <a href={`mailto:${LEGAL.emails.support}`}>{LEGAL.emails.support}</a>
        </li>
        <li>
          Patrocinios y colaboraciones:{' '}
          <a href={`mailto:${LEGAL.emails.sponsorships}`}>{LEGAL.emails.sponsorships}</a>
        </li>
      </ul>

      <h2>3. Objeto del sitio</h2>
      <p>
        {LEGAL.siteName} es un {LEGAL.description}. La información de precios se obtiene de
        mercados públicos y puede variar en tiempo real. El sitio no está afiliado a Valve
        Corporation ni a Counter-Strike.
      </p>

      <h2>4. Condiciones de uso</h2>
      <p>
        El acceso y uso del sitio implica la aceptación de los{' '}
        <a href="/terminos">Términos y condiciones de uso</a>, la{' '}
        <a href="/privacidad">Política de privacidad</a> y la{' '}
        <a href="/cookies">Política de cookies</a>.
      </p>

      <h2>5. Propiedad intelectual e industrial</h2>
      <p>
        Los contenidos propios del sitio (diseño, textos y código) pertenecen a los titulares
        salvo indicación contraria. Las marcas, nombres comerciales y signos distintivos de
        terceros (incluidos Valve, Steam y Counter-Strike) son propiedad de sus respectivos
        titulares. Las {LEGAL.imageSources}. {LEGAL.siteName} no reclama propiedad sobre dichos
        materiales de terceros.
      </p>

      <h2>6. Enlaces externos</h2>
      <p>
        El sitio puede enlazar a {LEGAL.externalMarkets}. No somos responsables del contenido ni
        de las políticas de privacidad de sitios de terceros. Las compras se realizan en los
        mercados externos; {LEGAL.siteName} no vende ítems directamente.
      </p>

      <h2>7. Responsabilidad</h2>
      <p>
        Los titulares no garantizan la ausencia de errores en los precios o disponibilidad
        mostrados, ni la continuidad ininterrumpida del servicio. El usuario utiliza la
        información bajo su propia responsabilidad.
      </p>

      <h2>8. Legislación aplicable</h2>
      <p>
        Este aviso legal se rige por la legislación española. Para cualquier controversia, las
        partes se someten a los juzgados y tribunales que correspondan según la normativa
        aplicable.
      </p>
    </LegalLayout>
  );
}
