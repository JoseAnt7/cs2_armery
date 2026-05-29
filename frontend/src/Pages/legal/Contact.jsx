import { useState } from 'react';
import { LegalLayout } from '../../components/LegalLayout';
import { submitContact } from '../../api/client';
import { LEGAL } from '../../content/legalSite';

export function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: 'support',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setLoading(true);
    try {
      await submitContact(form);
      setFeedback({
        type: 'success',
        text: 'Mensaje enviado. Te responderemos lo antes posible.',
      });
      setForm({ name: '', email: '', topic: 'support', message: '' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <LegalLayout title="Contacto">
      <p>
        Puedes escribirnos para soporte, consultas generales o propuestas de patrocinio. También
        puedes usar los correos indicados en el <a href="/aviso-legal">Aviso legal</a>.
      </p>

      <ul>
        <li>
          Soporte: <a href={`mailto:${LEGAL.emails.support}`}>{LEGAL.emails.support}</a>
        </li>
        <li>
          Patrocinios:{' '}
          <a href={`mailto:${LEGAL.emails.sponsorships}`}>{LEGAL.emails.sponsorships}</a>
        </li>
      </ul>

      <h2>Formulario de contacto</h2>
      <p>
        Los datos que envíes se tratarán según nuestra{' '}
        <a href="/privacidad">Política de privacidad</a>.
      </p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            maxLength={120}
            autoComplete="name"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
            maxLength={200}
            autoComplete="email"
          />
        </label>
        <label>
          Motivo
          <select
            value={form.topic}
            onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
          >
            <option value="support">Soporte técnico</option>
            <option value="general">Consulta general</option>
            <option value="sponsorship">Patrocinio / colaboración</option>
            <option value="privacy">Privacidad y datos</option>
            <option value="other">Otro</option>
          </select>
        </label>
        <label>
          Mensaje
          <textarea
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            required
            minLength={10}
            maxLength={5000}
          />
        </label>
        <button type="submit" className="contact-form__submit" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar mensaje'}
        </button>
      </form>

      {feedback.text && (
        <p className={`contact-message contact-message--${feedback.type}`}>{feedback.text}</p>
      )}
    </LegalLayout>
  );
}
