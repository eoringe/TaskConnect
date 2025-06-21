"use client";
import React, { useEffect, useState } from "react";
import { db } from "./firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

interface Tasker {
  id: string;
  firstName: string;
  lastName: string;
  profileImageBase64?: string;
  idNumber: string;
  kraPin: string;
  onboardingStatus: string;
  services: any[];
}

const base64ToImageSrc = (base64?: string) =>
  base64 ? `data:image/jpeg;base64,${base64}` : undefined;

export default function AdminDashboard() {
  const [taskers, setTaskers] = useState<Tasker[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Tasker>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchTaskers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "taskers"));
      const data: Tasker[] = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Tasker[];
      setTaskers(data);
    } catch (err: any) {
      setError("Failed to fetch taskers: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskers();
  }, []);

  const handleEdit = (tasker: Tasker) => {
    setEditId(tasker.id);
    setEditData({ ...tasker });
  };

  const handleEditChange = (field: keyof Tasker, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!editId) return;
    try {
      await updateDoc(doc(db, "taskers", editId), editData);
      setEditId(null);
      setEditData({});
      fetchTaskers();
    } catch (err: any) {
      setError("Failed to update tasker: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tasker?")) return;
    try {
      await deleteDoc(doc(db, "taskers", id));
      setTaskers((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError("Failed to delete tasker: " + err.message);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: 0,
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "40px 20px"
      }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          marginBottom: 30,
          color: "#2d3a4a",
          letterSpacing: -1
        }}>TaskConnect Admin Dashboard</h1>
        <div style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 4px 24px rgba(44,62,80,0.08)",
          padding: 32,
          overflowX: "auto"
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#4A80F0" }}>Taskers</h2>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <span style={{ fontSize: 18 }}>Loading...</span>
            </div>
          ) : error ? (
            <div style={{ color: "#e74c3c", marginBottom: 20 }}>{error}</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16 }}>
              <thead>
                <tr style={{ background: "#f0f4fa" }}>
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
                {taskers.map((tasker) => (
                  <tr key={tasker.id} style={{ borderBottom: "1px solid #eaeaea" }}>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      {tasker.profileImageBase64 ? (
                        <img
                          src={base64ToImageSrc(tasker.profileImageBase64)}
                          alt="Profile"
                          style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #4A80F0" }}
                        />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 24 }}>?</div>
                      )}
                    </td>
                    <td style={{ padding: 10, fontWeight: 600 }}>
                      {editId === tasker.id ? (
                        <input
                          type="text"
                          value={editData.firstName || ""}
                          onChange={e => handleEditChange("firstName", e.target.value)}
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
                          value={editData.idNumber || ""}
                          onChange={e => handleEditChange("idNumber", e.target.value)}
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
                          value={editData.kraPin || ""}
                          onChange={e => handleEditChange("kraPin", e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        tasker.kraPin
                      )}
                    </td>
                    <td style={{ padding: 10 }}>
                      {editId === tasker.id ? (
                        <select
                          value={editData.onboardingStatus || "pendingVerification"}
                          onChange={e => handleEditChange("onboardingStatus", e.target.value)}
                          style={inputStyle}
                        >
                          <option value="pendingVerification">Pending</option>
                          <option value="completed">Completed</option>
                        </select>
                      ) : (
                        <span style={{
                          color: tasker.onboardingStatus === "completed" ? "#27ae60" : "#e67e22",
                          fontWeight: 700
                        }}>
                          {tasker.onboardingStatus === "completed" ? "Completed" : "Pending"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 10, maxWidth: 220 }}>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                        {Array.isArray(tasker.services) && tasker.services.length > 0 ? (
                          tasker.services.map((svc, idx) => (
                            <li key={idx} style={{ marginBottom: 4, background: "#f6f8fc", borderRadius: 6, padding: "4px 8px", fontSize: 14 }}>
                              <b>{svc.title}</b> <span style={{ color: "#4A80F0" }}>({svc.category})</span> - <span style={{ color: "#888" }}>{svc.rate}</span>
                            </li>
                          ))
                        ) : (
                          <li style={{ color: "#aaa" }}>No services</li>
                        )}
                      </ul>
                    </td>
                    <td style={{ padding: 10 }}>
                      {editId === tasker.id ? (
                        <>
                          <button onClick={handleEditSave} style={saveBtnStyle}>Save</button>
                          <button onClick={() => setEditId(null)} style={cancelBtnStyle}>Cancel</button>
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
      </div>
      <style>{`
        body { background: #f5f7fa; }
        ::selection { background: #4A80F0; color: #fff; }
        th, td { text-align: left; }
        th { font-weight: 700; }
        button { font-family: inherit; }
      `}</style>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: 12,
  background: "#f0f4fa",
  color: "#2d3a4a",
  fontWeight: 700,
  fontSize: 15,
  borderBottom: "2px solid #eaeaea"
};

const inputStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #c3cfe2",
  fontSize: 15,
  width: "100%",
  background: "#f8fafc"
};

const editBtnStyle: React.CSSProperties = {
  background: "#4A80F0",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 14px",
  marginRight: 8,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s"
};

const deleteBtnStyle: React.CSSProperties = {
  background: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 14px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s"
};

const saveBtnStyle: React.CSSProperties = {
  background: "#27ae60",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 14px",
  marginRight: 8,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s"
};

const cancelBtnStyle: React.CSSProperties = {
  background: "#aaa",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 14px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s"
};
