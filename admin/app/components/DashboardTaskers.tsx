import React from 'react';
import { IoPencilOutline, IoTrashOutline, IoCheckmarkOutline, IoCloseOutline } from 'react-icons/io5';

interface Tasker {
  id: string;
  firstName: string;
  lastName: string;
  profileImageBase64?: string;
  idNumber: string;
  kraPin: string;
  onboardingStatus: string;
  services: any[];
  email?: string;
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: '#f9fafb',
  color: '#6b7280',
  fontWeight: 600,
  fontSize: 13,
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'left',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  fontSize: 14,
  width: '100%',
  background: '#fff',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const baseBtnStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 6,
  padding: '8px 12px',
  marginRight: 8,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s, transform 0.1s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: 14,
};

const editBtnStyle: React.CSSProperties = { ...baseBtnStyle, background: '#3b82f6', color: '#fff' };
const deleteBtnStyle: React.CSSProperties = { ...baseBtnStyle, background: '#ef4444', color: '#fff' };
const saveBtnStyle: React.CSSProperties = { ...baseBtnStyle, background: '#22c55e', color: '#fff' };
const cancelBtnStyle: React.CSSProperties = { ...baseBtnStyle, background: '#6b7280', color: '#fff' };

const getStatusPillStyle = (status: string): React.CSSProperties => {
  const base: React.CSSProperties = {
    borderRadius: '9999px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 600,
    display: 'inline-block',
    textTransform: 'capitalize',
  };
  if (status === 'completed') {
    return { ...base, background: '#dcfce7', color: '#166534' };
  }
  return { ...base, background: '#fef3c7', color: '#92400e' };
};

const DashboardTaskers = ({
  taskers,
  editId,
  editData,
  loading,
  error,
  handleEdit,
  handleCancelEdit,
  handleEditChange,
  handleEditSave,
  handleDelete,
  base64ToImageSrc,
}: {
  taskers: Tasker[];
  editId: string | null;
  editData: Partial<Tasker>;
  loading: boolean;
  error: string | null;
  handleEdit: (tasker: Tasker) => void;
  handleCancelEdit: () => void;
  handleEditChange: (field: keyof Tasker, value: any) => void;
  handleEditSave: () => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  base64ToImageSrc: (base64?: string) => string | undefined;
}) => (
  <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
    <h2 style={{ fontSize: 22, fontWeight: 700, padding: '24px 24px 0 24px', color: '#111827' }}>Tasker Management</h2>
    {loading ? (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading taskers...</div>
    ) : error ? (
      <div style={{ color: '#ef4444', padding: '24px' }}>{error}</div>
    ) : (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={thStyle}>Tasker</th>
            <th style={thStyle}>ID Number / KRA PIN</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Services</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ color: '#374151' }}>
          {taskers.map((tasker: Tasker) => (
            <tr key={tasker.id} style={{ borderBottom: '1px solid #e5e7eb' }} className="tasker-row">
              <td style={{ padding: '12px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={base64ToImageSrc(tasker.profileImageBase64) || 'https://via.placeholder.com/48'}
                  alt="Profile"
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }}
                />
                <div>
                  {editId === tasker.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input
                        type="text"
                        value={editData.firstName || ''}
                        onChange={e => handleEditChange('firstName', e.target.value)}
                        style={{ ...inputStyle, width: '200px' }}
                        placeholder="First Name"
                      />
                      <input
                        type="text"
                        value={editData.lastName || ''}
                        onChange={e => handleEditChange('lastName', e.target.value)}
                        style={{ ...inputStyle, width: '200px' }}
                        placeholder="Last Name"
                      />
                    </div>
                  ) : (
                    <div style={{ fontWeight: 600 }}>{`${tasker.firstName} ${tasker.lastName}`}</div>
                  )}
                  {editId !== tasker.id && <div style={{ fontSize: 13, color: '#6b7280' }}>{tasker.email || 'no-email@test.com'}</div>}
                </div>
              </td>
              <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                {editId === tasker.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input type="text" value={editData.idNumber || ''} onChange={e => handleEditChange('idNumber', e.target.value)} style={{ ...inputStyle, width: '200px' }} placeholder="ID Number" />
                    <input type="text" value={editData.kraPin || ''} onChange={e => handleEditChange('kraPin', e.target.value)} style={{ ...inputStyle, width: '200px' }} placeholder="KRA Pin" />
                  </div>
                ) : (
                  <>
                    <div>ID: <strong>{tasker.idNumber}</strong></div>
                    <div>KRA: <strong>{tasker.kraPin}</strong></div>
                  </>
                )}
              </td>
              <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                {editId === tasker.id ? (
                  <select
                    value={editData.onboardingStatus || 'pendingVerification'}
                    onChange={e => handleEditChange('onboardingStatus', e.target.value)}
                    style={{ ...inputStyle, width: '200px' }}
                  >
                    <option value="pendingVerification">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <span style={getStatusPillStyle(tasker.onboardingStatus)}>
                    {tasker.onboardingStatus === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                )}
              </td>
              <td style={{ padding: '12px 16px', verticalAlign: 'top', maxWidth: 280 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Array.isArray(tasker.services) && tasker.services.length > 0 ? (
                    tasker.services.map((svc: any, idx: number) => (
                      <div key={idx} style={{ background: '#eef2ff', borderRadius: '6px', padding: '4px 8px', fontSize: '13px', color: '#4338ca', fontWeight: 500 }}>
                        {svc.title} - <span style={{ opacity: 0.7 }}>{svc.rate}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#9ca3af' }}>No services</div>
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                {editId === tasker.id ? (
                  <>
                    <button onClick={handleEditSave} style={saveBtnStyle}><IoCheckmarkOutline /> Save</button>
                    <button onClick={handleCancelEdit} style={cancelBtnStyle}><IoCloseOutline /> Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(tasker)} style={editBtnStyle}><IoPencilOutline /> Edit</button>
                    <button onClick={() => handleDelete(tasker.id)} style={deleteBtnStyle}><IoTrashOutline /> Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default DashboardTaskers; 