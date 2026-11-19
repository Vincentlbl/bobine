import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './AuthForm.css';

const PASSWORD_MIN_LENGTH = 8;

const TEXTS = {
  login: {
    title: 'Connexion',
    intro: 'Retrouve ta watchlist, tes notes et tes critiques.',
    submit: 'Se connecter',
    success: 'Tu es connecté.',
    switchQuestion: 'Pas encore de compte ?',
    switchLabel: 'Créer un compte',
    switchTo: '/inscription',
  },
  register: {
    title: 'Créer ton journal',
    intro: 'Un email et un mot de passe suffisent. Ton journal reste privé : personne d’autre ne le voit.',
    submit: 'Créer mon compte',
    success: 'Ton compte est créé.',
    switchQuestion: 'Déjà un compte ?',
    switchLabel: 'Se connecter',
    switchTo: '/connexion',
  },
};

// Formulaire commun à la connexion (mode "login") et à l'inscription (mode "register").
export default function AuthForm({ mode }) {
  const texts = TEXTS[mode];
  const auth = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  // Page d'où l'on vient (ex. une fiche de film) : on y retourne après connexion.
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    try {
      if (mode === 'login') await auth.login(email, password);
      else await auth.register(email, password);
      showToast(texts.success);
      navigate(from, { replace: true });
    } catch (error) {
      // Le message vient de l'API (email déjà utilisé, identifiants incorrects...).
      setErrorMessage(error.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="page auth">
      <h1>{texts.title}</h1>
      <p className="muted auth__intro">{texts.intro}</p>

      <form className="auth__form" onSubmit={handleSubmit}>
        {errorMessage && (
          <p className="form-error" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="field">
          <label htmlFor="email" className="field__label">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password" className="field__label">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            className="input"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={mode === 'register' ? PASSWORD_MIN_LENGTH : undefined}
            aria-describedby={mode === 'register' ? 'password-hint' : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {mode === 'register' && (
            <span id="password-hint" className="field__hint">
              {PASSWORD_MIN_LENGTH} caractères au minimum.
            </span>
          )}
        </div>

        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? 'Un instant…' : texts.submit}
        </button>
      </form>

      <p className="auth__switch muted">
        {texts.switchQuestion}{' '}
        <Link to={texts.switchTo} state={{ from }}>
          {texts.switchLabel}
        </Link>
      </p>
    </div>
  );
}
