/** Datos del titular para textos legales (actualizar cuando cambien). */
export const LEGAL = {
  siteName: 'SkinAtlas',
  domain: 'skinatlas.es',
  url: 'https://skinatlas.es',
  description: 'comparador de precios de skins de Counter-Strike 2 (CS2)',
  language: 'español',
  lastUpdated: '29 de mayo de 2026',

  titulares: [
    { name: 'José Antonio Llorens Padilla', nif: '74013038G' },
    { name: 'Raúl Reolid Más', nif: null }, // Completar cuando se disponga del NIF
  ],

  address: 'Calle Sentenero, 23, España',

  emails: {
    public: 'jllorenspadilla@gmail.com',
    support: 'jllorenspadilla@gmail.com',
    sponsorships: 'raul312airsoft@hotmail.com',
    privacy: 'jllorenspadilla@gmail.com',
  },

  dataController: 'José Antonio Llorens Padilla',

  hosting: {
    provider: 'Hostinger',
    product: 'VPS',
    locationNote: 'Unión Europea (según infraestructura del proveedor)',
  },

  imageSources:
    'imágenes e información de ítems procedentes de la API pública CSGO-API (ByMykel), alojada en GitHub, y de los propios mercados cuando se muestran vistas previas enlazadas',

  externalMarkets:
    'Steam Community Market, Skinport, DMarket, Waxpeer, CSFloat y otros mercados enlazados',

  retention: {
    account: 'hasta que el usuario solicite la eliminación de su cuenta',
    visits: '12 meses desde la fecha de cada registro de visita',
    contact: '12 meses desde el envío del mensaje',
    cookies: 'según el tipo de cookie (ver Política de cookies)',
  },
};
