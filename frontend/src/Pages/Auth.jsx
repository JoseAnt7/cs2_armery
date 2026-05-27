import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../api/client';
import '../styles/auth.css';

export function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  function clearMessage() {
    setMessage({ type: '', text: '' });
  }

  async function handleLogin(event) {
    event.preventDefault();
    clearMessage();
    setLoading(true);

    try {
      const data = await loginUser({
        username: loginForm.identifier,
        password: loginForm.password,
      });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-changed'));
      setMessage({ type: 'success', text: 'Sesión iniciada correctamente' });
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    clearMessage();

    if (registerForm.password !== registerForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (registerForm.password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
      });
      setMessage({
        type: 'success',
        text: 'Cuenta creada. Ya puedes iniciar sesión.',
      });
      setLoginForm({ identifier: registerForm.username, password: '' });
      setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
      setTab('login');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__header">
        <h1 className="auth-page__title">Tu cuenta</h1>
        <p className="auth-page__subtitle">
          Inicia sesión o crea una cuenta para guardar tus skins favoritas
        </p>
      </div>

      <div className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Tipo de formulario">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'login'}
            className={`auth-tab ${tab === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setTab('login'); clearMessage(); }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'register'}
            className={`auth-tab ${tab === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => { setTab('register'); clearMessage(); }}
          >
            Registrarse
          </button>
        </div>

        {tab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-field">
              <label htmlFor="login-identifier">Usuario o email</label>
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                value={loginForm.identifier}
                onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-field">
              <label htmlFor="register-username">Usuario</label>
              <input
                id="register-username"
                type="text"
                autoComplete="username"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="register-password">Contraseña</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="form-field">
              <label htmlFor="register-confirm">Confirmar contraseña</label>
              <input
                id="register-confirm"
                type="password"
                autoComplete="new-password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        )}

        {message.text && (
          <p className={`auth-message auth-message--${message.type}`} role="alert">
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
