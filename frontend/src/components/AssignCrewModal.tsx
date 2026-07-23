import React, { useEffect, useState } from 'react';
import { api } from '../App';

interface ModalProps {
  isOpen: boolean;
  deliveryId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignCrewModal: React.FC<ModalProps> = ({ isOpen, deliveryId, onClose, onSuccess }) => {
  const [crew, setCrew] = useState<any[]>([]);
  const [crewId, setCrewId] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/crew').then(res => setCrew(res.data)).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !deliveryId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/assignments', {
        delivery_id: deliveryId,
        crew_member_id: Number(crewId),
        role_on_ship: role
      });
      onSuccess();
      onClose();
      setCrewId('');
      setRole('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign crew');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Assign Crew Member</h2>
        {error && <div className="modal-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Crew Member</label>
            <select required value={crewId} onChange={e => setCrewId(e.target.value)}>
              <option value="" disabled>Select a crew member</option>
              {crew.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Role on this Mission</label>
            <input type="text" required value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Pilot, Gunner" />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-create-submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Crew'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
