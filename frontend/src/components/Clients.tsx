import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../App';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newClientName, setNewClientName] = useState('');
  const [newClientEvil, setNewClientEvil] = useState(false);
  const [newClientDesc, setNewClientDesc] = useState('');

  const fetchClients = useCallback(() => {
    api.get(`/clients?trashed=${showTrash}`).then(res => setClients(res.data)).catch(console.error);
  }, [showTrash]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', { name: newClientName, is_evil: newClientEvil, description: newClientDesc });
      setIsModalOpen(false);
      setNewClientName('');
      setNewClientDesc('');
      setNewClientEvil(false);
      fetchClients();
    } catch (err) {
      alert("Failed to create client");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/clients/${id}`);
      fetchClients();
    } catch (err) {
      alert("Failed to delete client");
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.patch(`/clients/${id}/restore`);
      fetchClients();
    } catch (err) {
      alert("Failed to restore client");
    }
  };

  const getClientImage = (name: string) => {
    if (name === 'MomCorp') return '/src/assets/MomCorp.webp';
    if (name === 'Robot Devil') return '/src/assets/Robot Devil.jpg';
    if (name === 'Government of Mars') return '/src/assets/Government of Mars.jpg';
    return '/src/assets/client-placeholder.png'; // default
  };

  return (
    <main className="main-content">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Client Database</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-cancel" onClick={() => setShowTrash(!showTrash)}>
            {showTrash ? 'View Active' : 'View Trash 🗑️'}
          </button>
          {!showTrash && <button className="btn-create" onClick={() => setIsModalOpen(true)}>+ New Client</button>}
        </div>
      </div>
      
      {showTrash && <div style={{ color: 'var(--danger-fatal)', marginBottom: '15px' }}>Viewing Trashed Clients</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {clients.map(client => (
          <div key={client.id} style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', opacity: showTrash ? 0.7 : 1 }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <img src={getClientImage(client.name)} alt={client.name} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', filter: showTrash ? 'grayscale(100%)' : 'none' }} />
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: 'var(--neon-green)', fontSize: '1.5em' }}>{client.name}</h3>
                  {client.is_evil ? (
                    <span className="badge badge-fatal">EVIL ENTITY</span>
                  ) : (
                    <span className="badge badge-low">NEUTRAL</span>
                  )}
                </div>
                
                <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
                  {client.description || 'No description available for this client.'}
                </p>

                {!showTrash && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                    <h4 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Order History</h4>
                    {client.deliveries && client.deliveries.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {client.deliveries.map((delivery: any) => (
                          <li key={delivery.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span>📦 {delivery.cargo_name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{delivery.status}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>No orders placed yet.</p>
                    )}
                  </div>
                )}

                <div style={{ textAlign: 'right' }}>
                  {showTrash ? (
                    <button className="btn-create" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => handleRestore(client.id)}>Restore ♻️</button>
                  ) : (
                    <button className="btn-cancel" style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid var(--danger-fatal)', color: 'var(--danger-fatal)' }} onClick={() => handleDelete(client.id)}>Delete 🗑️</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {clients.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No clients found.</div>}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: 'var(--neon-green)', marginBottom: '20px' }}>Register New Client</h3>
            <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label>Client Name</label>
                <input required type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '5px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={newClientEvil} onChange={e => setNewClientEvil(e.target.checked)} id="evil_check" />
                <label htmlFor="evil_check">Is Evil Entity?</label>
              </div>
              <div>
                <label>Description</label>
                <textarea rows={3} value={newClientDesc} onChange={e => setNewClientDesc(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '5px' }}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-create">Add Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
