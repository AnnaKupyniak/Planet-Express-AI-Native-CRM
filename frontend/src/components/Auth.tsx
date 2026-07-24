import React, { useState } from 'react';
import { api } from '../App';

interface AuthProps {
  onSuccess: (token: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const res = await api.post(endpoint, { email, password });
      
      if (res.data && res.data.access_token) {
        onSuccess(res.data.access_token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-content" style={{ animation: 'none', position: 'relative' }}>
        <h1 className="brand-title" style={{ textAlign: 'center', marginBottom: '8px' }}>P. EXPRESS</h1>
        <div className="brand-subtitle" style={{ textAlign: 'center', marginBottom: '32px' }}>NEURAL LINK AUTHORIZATION</div>
        
        {error && <div className="modal-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email ID</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="agent@planetexpress.com" />
          </div>
          <div className="form-group">
            <label>Access Code</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          
          <button type="submit" className="btn-create-submit" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
            {loading ? 'AUTHENTICATING...' : (isLogin ? 'LOGIN' : 'SIGN UP')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an access code? " : "Already have clearance? "}
          </span>
          <span 
            style={{ color: 'var(--neon-green)', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Request Access' : 'Initialize Login'}
          </span>
        </div>
      </div>
    </div>
  );
};
