import React, { useState } from 'react';
import { api } from '../App';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const HireCrewModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/crew', { name, role });
      onSuccess();
      onClose();
      setName('');
      setRole('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to hire crew member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Hire New Crew</h2>
        {error && <div className="modal-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Scruffy" />
          </div>
          
          <div className="form-group">
            <label>Role</label>
            <input type="text" required value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Janitor" />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-create-submit" disabled={loading}>
              {loading ? 'Hiring...' : 'Hire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
