import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL } from '../../content/legalSite';

export function Privacy() {
  return (
    <LegalLayout title="Política de privacidad">
      <p className="legal-updated">Última actualización: {LEGAL.lastUpdated}</p>

      <p>
        Esta Política de privacidad describe cómo <strong>{LEGAL.siteName}</strong> (
        {LEGAL.url}) trata los datos personales conforme al Reglamento (UE) 2016/679 (RGPD) y la
        Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        <strong>{LEGAL.dataController}</strong>
        <br />
        Domicilio: {LEGAL.address}
        <br />
        Email para ejercer derechos:{' '}
        <a href={`mailto:${LEGAL.emails.privacy}`}>{LEGAL.emails.privacy}</a>
      </p>
      <p>
        El sitio es operado conjuntamente por los titulares indicados en el{' '}
        <a href="/aviso-legal">Aviso legal</a>. Para cuestiones de privacidad, el responsable del
        tratamiento designado es la persona indicada arriba.
      </p>

      <h2>2. Delegado de Protección de Datos (DPO)</h2>
      <p>
        No resulta obligatorio designar un DPO para la actividad actual del sitio. Si en el
        futuro fuera necesario, se actualizará esta política.
      </p>

      <h2>3. Datos que tratamos y finalidad</h2>

      <h3>3.1. Navegación y uso del comparador</h3>
      <p>
        Al visitar el sitio sin registrarse, podemos tratar datos técnicos (dirección IP, tipo de
        navegador, páginas visitadas) para el funcionamiento, seguridad y estadísticas agregadas de
        visitas.
      </p>

      <h3>3.2. Registro de cuenta</h3>
      <p>
        Si creas una cuenta, tratamos: nombre de usuario, correo electrónico y contraseña
        (almacenada de forma cifrada). Finalidad: gestionar tu acceso, perfil y servicios
        asociados.
      </p>

      <h3>3.3. Perfil de usuario</h3>
      <p>
        Puedes modificar tu nombre de usuario, email y contraseña desde tu perfil. Conservamos
        estos datos mientras mantengas la cuenta activa.
      </p>

      <h3>3.4. Estadísticas de visitas</h3>
      <p>
        Registramos eventos de visita (por ejemplo, ruta visitada y fecha) para mostrar
        estadísticas en el panel de administración. No se utilizan para crear perfiles
        publicitarios propios.
      </p>

      <h3>3.5. CSBot y consultas a mercados</h3>
      <p>
        Si utilizas CSBot, podemos guardar tus preferencias de búsqueda y realizar consultas a
        APIs públicas de mercados (por ejemplo, Steam Community Market) según los parámetros que
        indiques. No compartimos tu contraseña con esos servicios.
      </p>

      <h3>3.6. Formulario de contacto</h3>
      <p>
        Si nos escribes, tratamos los datos que envíes (nombre, email, asunto y mensaje) para
        responder a tu solicitud.
      </p>

      <h3>3.7. Publicidad (Google AdSense)</h3>
      <p>
        Utilizamos o podemos utilizar <strong>Google AdSense</strong> para mostrar anuncios.
        Google y sus partners pueden usar cookies y tecnologías similares para mostrar anuncios
        basados en tus visitas anteriores a este u otros sitios, según el consentimiento que
        otorgues en nuestro banner de cookies. Consulta la{' '}
        <a href="/cookies">Política de cookies</a> y la política de privacidad de Google.
      </p>

      <h3>3.8. Suscripciones de pago (futuro)</h3>
      <p>
        La sección de suscripciones puede estar oculta al público mientras no exista pasarela de
        pago. Cuando se active, se informará de los datos tratados (facturación, identificación
        del plan, etc.) y se actualizará esta política.
      </p>

      <h2>4. Base legal</h2>
      <ul>
        <li>
          <strong>Ejecución de un contrato o medidas precontractuales:</strong> registro, cuenta y
          servicios solicitados.
        </li>
        <li>
          <strong>Interés legítimo:</strong> seguridad, mejora del servicio y estadísticas de
          visitas agregadas.
        </li>
        <li>
          <strong>Consentimiento:</strong> cookies no esenciales y publicidad personalizada (si
          las aceptas).
        </li>
        <li>
          <strong>Obligación legal:</strong> cuando la ley lo exija.
        </li>
      </ul>

      <h2>5. Destinatarios y encargados</h2>
      <p>
        Podemos compartir datos con proveedores que nos prestan servicios necesarios:
      </p>
      <ul>
        <li>
          <strong>{LEGAL.hosting.provider}</strong> ({LEGAL.hosting.product}): alojamiento web y
          base de datos MySQL en {LEGAL.hosting.locationNote}.
        </li>
        <li>
          <strong>Google Ireland Limited</strong>: publicidad (AdSense), si has dado
          consentimiento.
        </li>
        <li>Mercados y APIs públicas consultadas para mostrar precios (sin datos de cuenta).</li>
      </ul>

      <h2>6. Transferencias internacionales</h2>
      <p>
        Algunos proveedores (como Google) pueden tratar datos fuera del Espacio Económico Europeo
        con garantías adecuadas (cláusulas contractu tipo, decisiones de adecuación u otros
        mecanismos previstos en el RGPD).
      </p>

      <h2>7. Plazos de conservación</h2>
      <ul>
        <li>Datos de cuenta: {LEGAL.retention.account}.</li>
        <li>Registros de visitas (estadísticas): {LEGAL.retention.visits}.</li>
        <li>Mensajes de contacto: {LEGAL.retention.contact}.</li>
        <li>Cookies: {LEGAL.retention.cookies}.</li>
      </ul>

      <h2>8. Derechos de las personas usuarias</h2>
      <p>
        Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación
        del tratamiento y portabilidad (cuando proceda) escribiendo a{' '}
        <a href={`mailto:${LEGAL.emails.privacy}`}>{LEGAL.emails.privacy}</a>, indicando el
        derecho que deseas ejercer y acreditando tu identidad si es necesario.
      </p>
      <p>
        También puedes presentar una reclamación ante la{' '}
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noopener noreferrer"
        >
          Agencia Española de Protección de Datos (AEPD)
        </a>
        .
      </p>

      <h2>9. Menores de edad</h2>
      <p>
        El sitio está dirigido al público general. No recopilamos deliberadamente datos de
        menores. Si eres padre, madre o tutor y crees que un menor nos ha facilitado datos
        personales, contacta con nosotros para solicitar su eliminación.
      </p>

      <h2>10. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables para proteger los datos. Ningún
        sistema es 100 % seguro; te recomendamos usar contraseñas robustas y no compartir tus
        credenciales.
      </p>

      <h2>11. Cambios</h2>
      <p>
        Podemos actualizar esta política. Publicaremos la versión vigente en esta página con la
        fecha de actualización.
      </p>
    </LegalLayout>
  );
}
