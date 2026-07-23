import React, { useEffect, useState } from 'react';
import { api } from '../App';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDeliveryModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [planets, setPlanets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  
  const [cargoName, setCargoName] = useState('');
  const [rewardCash, setRewardCash] = useState(100);
  const [planetId, setPlanetId] = useState('');
  const [clientId, setClientId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Fetch options when modal opens
      api.get('/planets').then(res => setPlanets(res.data)).catch(console.error);
      api.get('/clients').then(res => setClients(res.data)).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await api.post('/deliveries', {
        cargo_name: cargoName,
        reward_cash: Number(rewardCash),
        planet_id: Number(planetId),
        client_id: Number(clientId)
      });
      
      onSuccess(); // Triggers refetch
      onClose(); // Closes modal
      
      // Reset form
      setCargoName('');
      setRewardCash(100);
      setPlanetId('');
      setClientId('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Create New Mission</h2>
        
        {error && <div className="modal-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Cargo Name</label>
            <input 
              type="text" 
              required 
              value={cargoName} 
              onChange={e => setCargoName(e.target.value)} 
              placeholder="e.g. Slurm Shipment"
            />
          </div>
          
          <div className="form-group">
            <label>Reward ($R)</label>
            <input 
              type="number" 
              required 
              value={rewardCash} 
              onChange={e => setRewardCash(Number(e.target.value))} 
            />
          </div>
          
          <div className="form-group">
            <label>Destination Planet</label>
            <select required value={planetId} onChange={e => setPlanetId(e.target.value)}>
              <option value="" disabled>Select a planet</option>
              {planets.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.danger_level})</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Client</label>
            <select required value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="" disabled>Select a client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-create-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Deploy Mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
