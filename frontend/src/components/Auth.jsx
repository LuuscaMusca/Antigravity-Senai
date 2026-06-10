import React, { useState } from 'react';
import { Mail, Lock, User, Key } from 'lucide-react';

export default function Auth({ onLoginSuccess, API_URL }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password || (!isLogin && !name)) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro. Tente novamente.');
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.token, data.user);
      } else {
        setSuccess('Cadastro realizado com sucesso! Você já pode fazer login.');
        setIsLogin(true);
        setName('');
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="nav-brand" style={{ justifyContent: 'center', marginBottom: '1.5rem', fontSize: '2rem' }}>
            <Key size={32} /> LifePlanner
          </div>
          <h2>{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
          <p>{isLogin ? 'Organize sua rotina e domine seu dia.' : 'Comece sua jornada de organização pessoal hoje.'}</p>
        </div>

        {error && (
          <div className="alert-notification alert-error" style={{ position: 'static', margin: '0 0 1.5rem 0', animation: 'none' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-notification alert-success" style={{ position: 'static', margin: '0 0 1.5rem 0', animation: 'none' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Seu Nome</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  id="name"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Ex: Lucas Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Endereço de E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                id="email"
                type="email"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Senha Pessoal</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                id="password"
                type="password"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Aguarde...' : isLogin ? 'Entrar na Conta' : 'Registrar'}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <>
              Não tem uma conta?{' '}
              <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); setIsLogin(false); setError(''); }}>
                Cadastre-se grátis
              </a>
            </>
          ) : (
            <>
              Já possui uma conta?{' '}
              <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); setIsLogin(true); setError(''); }}>
                Faça login
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
