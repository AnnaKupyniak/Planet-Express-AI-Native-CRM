import React, { useState } from 'react';
import { CreateDeliveryModal } from './CreateDeliveryModal';
import { AssignCrewModal } from './AssignCrewModal';
import { api } from '../App';

// Defining shape for Delivery from backend
export interface Delivery {
  id: number;
  cargo_name: string;
  status: string;
  reward_cash: number;
  planet?: { name: string; danger_level: string };
  assignments?: { crew_member: { name: string } }[];
}

interface DashboardProps {
  deliveries: Delivery[];
  refetch: () => void;
  onSelectDelivery?: (id: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ deliveries, refetch, onSelectDelivery }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignModalId, setAssignModalId] = useState<number | null>(null);

  // Dynamic Metrics Calculation
  const cashReserves = deliveries.reduce((acc, curr) => acc + (curr.reward_cash || 0), 0);
  const activeCount = deliveries.length;

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/deliveries/${id}`, { status: newStatus });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="main-content">
      {/* METRICS ROW */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">TOTAL REWARDS</div>
          <div className="metric-value">$R {cashReserves.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">DARK MATTER FUEL</div>
          <div className="metric-value">84%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">ACTIVE DELIVERIES</div>
          <div className="metric-value neon-text">{activeCount}</div>
        </div>
      </div>

      {/* HEADER */}
      <div className="content-header">
        <h2 className="section-title">Current Missions</h2>
        <button className="btn-create" onClick={() => setIsModalOpen(true)}>+ Create</button>
      </div>

      {/* DELIVERIES LIST */}
      <div className="deliveries-list">
        <div className="list-row header-row" style={{ gridTemplateColumns: '0.5fr 2fr 1fr 1fr 1fr 1.5fr 1fr' }}>
          <div className="col-id">ID</div>
          <div className="col-cargo">Cargo</div>
          <div className="col-planet">Status</div>
          <div className="col-danger">Danger</div>
          <div className="col-reward">Reward</div>
          <div className="col-crew">Crew</div>
          <div></div>
        </div>
        
        {deliveries.map(delivery => {
          const dangerLevel = delivery.planet?.danger_level || 'low';
          return (
            <div className="list-row clickable-row" key={delivery.id} id={`mission-${delivery.id}`} style={{ gridTemplateColumns: '0.5fr 2fr 1fr 1fr 1fr 1.5fr 1fr', cursor: 'pointer' }}>
              <div className="col-id" style={{ color: 'var(--text-muted)' }}>#{delivery.id}</div>
              <div className="col-cargo" onClick={() => onSelectDelivery?.(delivery.id)} style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>
                {delivery.cargo_name}
              </div>
              <div className="col-planet">
                <select 
                  value={delivery.status} 
                  onChange={(e) => updateStatus(delivery.id, e.target.value)}
                  style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px' }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-danger">
                <span className={`badge badge-${dangerLevel.toLowerCase()}`}>
                  {dangerLevel}
                </span>
              </div>
              <div className="col-reward">$R {delivery.reward_cash?.toLocaleString()}</div>
              <div className="col-crew">
                {delivery.assignments?.length ? delivery.assignments.map(a => a.crew_member.name).join(' & ') : 'Unassigned'}
              </div>
              <div style={{ textAlign: 'right' }}>
                <button className="btn-cancel" style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid var(--border-color)', marginRight: '8px' }} onClick={() => setAssignModalId(delivery.id)}>
                  Assign
                </button>
                <button className="btn-create" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => onSelectDelivery?.(delivery.id)}>
                  View
                </button>
              </div>
            </div>
          );
        })}

        {deliveries.length === 0 && (
          <div className="list-row">
            <div className="col-cargo" style={{ color: 'var(--text-muted)' }}>No active deliveries found...</div>
          </div>
        )}
      </div>

      <CreateDeliveryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={refetch} 
      />
      <AssignCrewModal
        isOpen={assignModalId !== null}
        deliveryId={assignModalId}
        onClose={() => setAssignModalId(null)}
        onSuccess={refetch}
      />
    </main>
  );
};

