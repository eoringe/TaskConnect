import React from 'react';

const DashboardTaskers = ({
  taskers,
  editId,
  editData,
  loading,
  error,
  handleEdit,
  handleEditChange,
  handleEditSave,
  handleDelete,
  base64ToImageSrc,
  thStyle,
  inputStyle,
  editBtnStyle,
  deleteBtnStyle,
  saveBtnStyle,
  cancelBtnStyle
}: any) => (
  <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(44,62,80,0.08)', padding: 32, overflowX: 'auto', marginBottom: 32 }}>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#4A80F0' }}>Taskers</h2>
    {loading ? (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <span style={{ fontSize: 18 }}>Loading...</span>
      </div>
    ) : error ? (
      <div style={{ color: '#e74c3c', marginBottom: 20 }}>{error}</div>
    ) : (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
        <thead>
          <tr style={{ background: '#f0f4fa' }}>
            <th style={thStyle}>Profile</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>ID Number</th>
            <th style={thStyle}>KRA PIN</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Services</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {taskers.map((tasker: any) => (
            <tr key={tasker.id} style={{ borderBottom: '1px solid #eaeaea' }}>
              <td style={{ padding: 10, textAlign: 'center' }}>
                {tasker.profileImageBase64 ? (
                  <img
                    src={base64ToImageSrc(tasker.profileImageBase64)}
                    alt="Profile"
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #4A80F0' }}
                  />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 24 }}>?</div>
                )}
              </td>
              <td style={{ padding: 10, fontWeight: 600 }}>
                {editId === tasker.id ? (
                  <input
                    type="text"
                    value={editData.firstName || ''}
                    onChange={e => handleEditChange('firstName', e.target.value)}
                    style={inputStyle}
                  />
                ) : (
                  `${tasker.firstName} ${tasker.lastName}`
                )}
              </td>
              <td style={{ padding: 10 }}>
                {editId === tasker.id ? (
                  <input
                    type="text"
                    value={editData.idNumber || ''}
                    onChange={e => handleEditChange('idNumber', e.target.value)}
                    style={inputStyle}
                  />
                ) : (
                  tasker.idNumber
                )}
              </td>
              <td style={{ padding: 10 }}>
                {editId === tasker.id ? (
                  <input
                    type="text"
                    value={editData.kraPin || ''}
                    onChange={e => handleEditChange('kraPin', e.target.value)}
                    style={inputStyle}
                  />
                ) : (
                  tasker.kraPin
                )}
              </td>
              <td style={{ padding: 10 }}>
                {editId === tasker.id ? (
                  <select
                    value={editData.onboardingStatus || 'pendingVerification'}
                    onChange={e => handleEditChange('onboardingStatus', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="pendingVerification">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <span style={{
                    color: tasker.onboardingStatus === 'completed' ? '#27ae60' : '#e67e22',
                    fontWeight: 700
                  }}>
                    {tasker.onboardingStatus === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                )}
              </td>
              <td style={{ padding: 10, maxWidth: 220 }}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {Array.isArray(tasker.services) && tasker.services.length > 0 ? (
                    tasker.services.map((svc: any, idx: number) => (
                      <li key={idx} style={{ marginBottom: 4, background: '#f6f8fc', borderRadius: 6, padding: '4px 8px', fontSize: 14 }}>
                        <b>{svc.title}</b> <span style={{ color: '#4A80F0' }}>({svc.category})</span> - <span style={{ color: '#888' }}>{svc.rate}</span>
                      </li>
                    ))
                  ) : (
                    <li style={{ color: '#aaa' }}>No services</li>
                  )}
                </ul>
              </td>
              <td style={{ padding: 10 }}>
                {editId === tasker.id ? (
                  <>
                    <button onClick={handleEditSave} style={saveBtnStyle}>Save</button>
                    <button onClick={() => handleEdit(null)} style={cancelBtnStyle}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(tasker)} style={editBtnStyle}>Edit</button>
                    <button onClick={() => handleDelete(tasker.id)} style={deleteBtnStyle}>Delete</button>
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