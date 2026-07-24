import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../App';

export const Planets: React.FC = () => {
  const [planets, setPlanets] = useState<any[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newPlanetName, setNewPlanetName] = useState('');
  const [newPlanetDanger, setNewPlanetDanger] = useState('low');
  const [newPlanetDesc, setNewPlanetDesc] = useState('');

  const fetchPlanets = useCallback(() => {
    api.get(`/planets?trashed=${showTrash}`).then(res => setPlanets(res.data)).catch(console.error);
  }, [showTrash]);

  useEffect(() => {
    fetchPlanets();
  }, [fetchPlanets]);

  const handleCreatePlanet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/planets', { name: newPlanetName, danger_level: newPlanetDanger, description: newPlanetDesc });
      setIsModalOpen(false);
      setNewPlanetName('');
      setNewPlanetDesc('');
      fetchPlanets();
    } catch (err) {
      alert("Failed to create planet");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/planets/${id}`);
      fetchPlanets();
    } catch (err) {
      alert("Failed to delete planet");
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.patch(`/planets/${id}/restore`);
      fetchPlanets();
    } catch (err) {
      alert("Failed to restore planet");
    }
  };

  const getPlanetImage = (name: string) => {
    if (name === 'Earth') return '/src/assets/earth.webp';
    if (name === 'Omicron Persei 8') return '/src/assets/Omicron Persei 8.webp';
    if (name === 'Chapek 9') return '/src/assets/Chapek 9.webp';
    if (name === 'Mars' || name === 'Government of Mars') return '/src/assets/Mars.webp';
    return '/src/assets/planet-placeholder.png'; // default
  };

  return (
    <main className="main-content">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Planetary Database</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-cancel" onClick={() => setShowTrash(!showTrash)}>
            {showTrash ? 'View Active' : 'View Trash 🗑️'}
          </button>
          {!showTrash && <button className="btn-create" onClick={() => setIsModalOpen(true)}>+ New Planet</button>}
        </div>
      </div>
      
      {showTrash && <div style={{ color: 'var(--danger-fatal)', marginBottom: '15px' }}>Viewing Trashed Planets</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {planets.map(planet => (
          <div key={planet.id} style={{ background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', opacity: showTrash ? 0.7 : 1 }}>
            <img src={getPlanetImage(planet.name)} alt={planet.name} style={{ width: '100%', height: '200px', objectFit: 'cover', filter: showTrash ? 'grayscale(100%)' : 'none' }} />
            
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: 'var(--neon-green)', fontSize: '1.4em' }}>{planet.name}</h3>
                <span className={`badge badge-${planet.danger_level?.toLowerCase() || 'low'}`}>
                  Danger: {planet.danger_level}
                </span>
              </div>
              
              <p style={{ color: 'var(--text-muted)', margin: 0, minHeight: '60px' }}>
                {planet.description || 'No planetary data available.'}
              </p>

              <div style={{ marginTop: '15px', textAlign: 'right' }}>
                {showTrash ? (
                  <button className="btn-create" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => handleRestore(planet.id)}>Restore ♻️</button>
                ) : (
                  <button className="btn-cancel" style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid var(--danger-fatal)', color: 'var(--danger-fatal)' }} onClick={() => handleDelete(planet.id)}>Delete 🗑️</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {planets.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No planets found.</div>}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: 'var(--neon-green)', marginBottom: '20px' }}>Chart a New Planet</h3>
            <form onSubmit={handleCreatePlanet} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label>Planet Name</label>
                <input required type="text" value={newPlanetName} onChange={e => setNewPlanetName(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '5px' }} />
              </div>
              <div>
                <label>Danger Level</label>
                <select value={newPlanetDanger} onChange={e => setNewPlanetDanger(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '5px' }}>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="fatal">Fatal</option>
                </select>
              </div>
              <div>
                <label>Description</label>
                <textarea rows={3} value={newPlanetDesc} onChange={e => setNewPlanetDesc(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '5px' }}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-create">Add Planet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
