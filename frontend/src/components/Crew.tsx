import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../App';
import { HireCrewModal } from './HireCrewModal';

export const Crew: React.FC = () => {
  const [crew, setCrew] = useState<any[]>([]);
  const [showFired, setShowFired] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCrew = useCallback(() => {
    api.get(`/crew?fired=${showFired}`).then(res => setCrew(res.data)).catch(console.error);
  }, [showFired]);

  useEffect(() => {
    fetchCrew();
  }, [fetchCrew]);

  const fireMember = async (id: number) => {
    const reason = window.prompt("Why are you firing this meatbag?");
    if (reason !== null) {
      try {
        await api.delete(`/crew/${id}`, { data: { reason } });
        fetchCrew();
      } catch (err) {
        console.error(err);
        alert("Failed to fire crew member.");
      }
    }
  };

  const restoreMember = async (id: number) => {
    try {
      await api.patch(`/crew/${id}/restore`);
      fetchCrew();
    } catch (err) {
      console.error(err);
      alert("Failed to re-hire crew member.");
    }
  };

  const getCrewImage = (name: string, role: string) => {
    const n = name.toLowerCase();
    if (n.includes('leela')) return '/src/assets/Turanga Leela.webp';
    if (n.includes('fry')) return '/src/assets/Philip J. Fry.webp';
    if (n.includes('bender')) return '/src/assets/Bender.webp';
    if (n.includes('farnsworth')) return '/src/assets/Farnsworth.webp';
    if (n.includes('zoidberg')) return '/src/assets/Dr. John A. Zoidberg.webp';
    if (n.includes('hermes')) return '/src/assets/hermes.jpg';
    return `https://api.dicebear.com/7.x/${role.toLowerCase().includes('robot') ? 'bottts' : 'avataaars'}/svg?seed=${name.replace(/\\s/g, '')}&backgroundColor=0B0D17`;
  };

  return (
    <main className="main-content">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Crew Roster</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-cancel" onClick={() => setShowFired(!showFired)}>
            {showFired ? 'Active Roster' : 'Terminated Meatbags'}
          </button>
          {!showFired && <button className="btn-create" onClick={() => setIsModalOpen(true)}>+ Hire</button>}
        </div>
      </div>
      
      {showFired && <div style={{ color: 'var(--danger-fatal)', marginBottom: '15px' }}>Viewing Terminated Employees</div>}

      <div className="deliveries-list">
        <div className="list-row header-row" style={{ gridTemplateColumns: showFired ? '2fr 1fr 2fr 1fr' : '2fr 1fr 1fr' }}>
          <div className="col-cargo">Name</div>
          <div className="col-planet">Role</div>
          {showFired && <div className="col-planet">Fire Reason</div>}
          <div></div>
        </div>
        {crew.map(member => (
          <div className="list-row" key={member.id} style={{ gridTemplateColumns: showFired ? '2fr 1fr 2fr 1fr' : '2fr 1fr 1fr', opacity: showFired ? 0.7 : 1 }}>
            <div className="col-cargo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={getCrewImage(member.name, member.role)} 
                alt={member.name} 
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-color)', objectFit: 'cover', filter: showFired ? 'grayscale(100%)' : 'none' }}
              />
              <span style={{ textDecoration: showFired ? 'line-through' : 'none' }}>{member.name}</span>
            </div>
            <div className="col-planet">{member.role}</div>
            {showFired && <div className="col-planet" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>"{member.fire_reason}"</div>}
            <div style={{ textAlign: 'right' }}>
              {showFired ? (
                <button 
                  className="btn-create" 
                  style={{ fontSize: '12px', padding: '4px 8px' }} 
                  onClick={() => restoreMember(member.id)}
                >
                  Re-hire
                </button>
              ) : (
                <button 
                  className="btn-cancel" 
                  style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid var(--danger-fatal)', color: 'var(--danger-fatal)' }} 
                  onClick={() => fireMember(member.id)}
                >
                  Fire
                </button>
              )}
            </div>
          </div>
        ))}
        {crew.length === 0 && <div className="list-row"><div className="col-cargo">No crew members found.</div></div>}
      </div>

      <HireCrewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchCrew} />
    </main>
  );
};
