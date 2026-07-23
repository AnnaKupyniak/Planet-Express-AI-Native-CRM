import React, { useEffect, useState } from 'react';
import { api } from '../App';

interface DeliveryDetailsProps {
  deliveryId: number;
  onBack: () => void;
}

export const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({ deliveryId, onBack }) => {
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const res = await api.get(`/deliveries/${deliveryId}`);
        setDelivery(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDelivery();
  }, [deliveryId]);

  if (loading) return <div className="main-content">Loading Mission Briefing...</div>;
  if (!delivery) return <div className="main-content">Mission not found</div>;

  const dangerLevel = delivery.planet?.danger_level || 'low';
  
  // Mapping images based on names
  const getPlanetImage = (name: string) => {
    if (name === 'Earth') return '/src/assets/earth.webp';
    if (name === 'Omicron Persei 8') return '/src/assets/Omicron Persei 8.webp';
    if (name === 'Chapek 9') return '/src/assets/Chapek 9.webp';
    return '/src/assets/planet-placeholder.png'; // default
  };

  const getClientImage = (name: string) => {
    if (name === 'MomCorp') return '/src/assets/MomCorp.webp';
    if (name === 'Robot Devil') return '/src/assets/Robot Devil.jpg';
    if (name === 'Government of Mars') return '/src/assets/Government of Mars.jpg';
    return '/src/assets/client-placeholder.png'; // default
  };

  const getCrewImage = (name: string) => {
    if (name.includes('Bender')) return '/src/assets/Bender.webp';
    if (name.includes('Fry')) return '/src/assets/Philip J. Fry.webp';
    if (name.includes('Leela')) return '/src/assets/Turanga Leela.webp';
    if (name.includes('Zoidberg')) return '/src/assets/Dr. John A. Zoidberg.webp';
    return '/src/assets/hero.png'; // default placeholder
  };

  return (
    <main className="main-content">
      <button className="btn-cancel" onClick={onBack} style={{ marginBottom: '20px' }}>&larr; Back to Dashboard</button>
      
      <div className="content-header" id={`mission-details-${delivery.id}`}>
        <h2 className="section-title">Mission #{delivery.id}: {delivery.cargo_name}</h2>
        <span className={`badge badge-${dangerLevel.toLowerCase()}`} style={{ fontSize: '1.2em' }}>
          {delivery.status.toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Planet Info */}
        <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ color: 'var(--neon-green)', marginBottom: '15px' }}>Destination Planet</h3>
          {delivery.planet && (
            <div style={{ display: 'flex', gap: '15px' }}>
              <img src={getPlanetImage(delivery.planet.name)} alt={delivery.planet.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }} />
              <div>
                <h4 style={{ fontSize: '1.2em', marginBottom: '10px' }}>{delivery.planet.name}</h4>
                <span className={`badge badge-${dangerLevel.toLowerCase()}`}>Danger: {dangerLevel}</span>
                <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>{delivery.planet.description || 'No data available in the central database.'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Client Info */}
        <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ color: 'var(--neon-green)', marginBottom: '15px' }}>Client Info</h3>
          {delivery.client && (
            <div style={{ display: 'flex', gap: '15px' }}>
              <img src={getClientImage(delivery.client.name)} alt={delivery.client.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }} />
              <div>
                <h4 style={{ fontSize: '1.2em', marginBottom: '10px' }}>{delivery.client.name}</h4>
                {delivery.client.is_evil && <span className="badge badge-fatal">Evil Entity</span>}
                <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>{delivery.client.description || 'No records found.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crew Info */}
      <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
        <h3 style={{ color: 'var(--neon-green)', marginBottom: '15px' }}>Assigned Crew</h3>
        {delivery.assignments?.length > 0 ? (
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {delivery.assignments.map((a: any) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                <img src={getCrewImage(a.crew_member.name)} alt={a.crew_member.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{a.crew_member.name}</div>
                  <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>Role: {a.role_on_ship}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No crew assigned to this mission.</p>
        )}
      </div>

    </main>
  );
};
