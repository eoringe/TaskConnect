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
import * as IonIcons from "react-icons/io5";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import DashboardOverview from './components/DashboardOverview';
import DashboardAnalytics from './components/DashboardAnalytics';
import DashboardTaskers from './components/DashboardTaskers';

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

interface ServiceCategory {
  id: string;
  name: string;
  icon?: string;
  services: any[];
}

const base64ToImageSrc = (base64?: string) =>
  base64 ? `data:image/jpeg;base64,${base64}` : undefined;

function getIonIconComponent(iconName: string | undefined) {
  if (!iconName) return null;
  let compName = "Io";
  const parts = iconName.split("-");
  compName += parts
    .map((part, i) =>
      part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");
  if (iconName.endsWith("-outline")) compName += "Outline";
  if (iconName.endsWith("-sharp")) compName += "Sharp";
  return (IonIcons as any)[compName] || null;
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

export default function AdminDashboard() {
  const [taskers, setTaskers] = useState<Tasker[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Tasker>>({});
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "serviceCategories"));
      const data: ServiceCategory[] = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as ServiceCategory[];
      setCategories(data);
    } catch (err: any) {
      setError("Failed to fetch categories: " + err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const data = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setUsers(data);
    } catch (err: any) {
      setError("Failed to fetch users: " + err.message);
    }
  };

  useEffect(() => {
    fetchTaskers();
    fetchCategories();
    fetchUsers();
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

  const getTaskersForCategory = (category: ServiceCategory) => {
    const taskerIds = new Set((category.services || []).map((svc: any) => svc.taskerId));
    return taskers.filter((t) => taskerIds.has(t.id));
  };

  // Analytics Data Preparation
  const categoryTaskerCounts = categories.map(cat => ({
    name: cat.name,
    value: new Set((cat.services || []).map((svc: any) => svc.taskerId)).size
  })).filter(c => c.value > 0);

  const sortedCategoryTaskerCounts = [...categoryTaskerCounts].sort((a, b) => b.value - a.value);
  const pieColors = ["#6366F1", "#06D6A0", "#F59E0B", "#EF4444", "#8B5CF6", "#F97316", "#10B981", "#3B82F6", "#EC4899", "#84CC16"];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: 'IoHomeOutline' },
    { id: 'taskers', label: 'Taskers', icon: 'IoPeopleOutline' },
    { id: 'categories', label: 'Categories', icon: 'IoGridOutline' },
    { id: 'analytics', label: 'Analytics', icon: 'IoBarChartOutline' },
    { id: 'users', label: 'Users', icon: 'IoPersonOutline' },
  ];

  const renderSidebar = () => (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <IoBusinessOutline size={32} />
          {!sidebarCollapsed && <span>TaskConnect</span>}
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <IoChevronForwardOutline /> : <IoChevronBackOutline />}
        </button>
      </div>
      <nav className="sidebar-nav">
        {sidebarItems.map((item) => {
          const IconComponent = (IonIcons as any)[item.icon];
          return (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <IconComponent size={20} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );

  const renderOverview = () => (
    <div className="section">
      <DashboardOverview
        totalUsers={users.length}
        totalTaskers={taskers.length}
        totalCategories={categories.length}
      />
      <DashboardAnalytics
        categoryTaskerCounts={categoryTaskerCounts}
        sortedCategoryTaskerCounts={sortedCategoryTaskerCounts}
        pieColors={pieColors}
      />
    </div>
  );

  const renderTaskers = () => (
    <DashboardTaskers
      taskers={taskers}
      editId={editId}
      editData={editData}
      loading={loading}
      error={error}
      handleEdit={handleEdit}
      handleEditChange={handleEditChange}
      handleEditSave={handleEditSave}
      handleDelete={handleDelete}
      base64ToImageSrc={base64ToImageSrc}
      thStyle={thStyle}
      inputStyle={inputStyle}
      editBtnStyle={editBtnStyle}
      deleteBtnStyle={deleteBtnStyle}
      saveBtnStyle={saveBtnStyle}
      cancelBtnStyle={cancelBtnStyle}
    />
  );

  const renderCategories = () => (
    <div className="section">
      <div className="section-header">
        <h2>Service Categories</h2>
        <p>Manage service categories and view assigned taskers</p>
      </div>
      
      <div className="categories-grid">
        {categories.map((cat) => {
          const IconComp = getIonIconComponent(cat.icon);
          const taskerCount = getTaskersForCategory(cat).length;
          
          return (
            <div 
              key={cat.id} 
              className="category-card"
              onClick={() => { setSelectedCategory(cat); setShowCategoryModal(true); }}
            >
              <div className="category-icon">
                {IconComp ? <IconComp size={32} /> : <IoGridOutline size={32} />}
              </div>
              <div className="category-info">
                <h3>{cat.name}</h3>
                <p>{taskerCount} tasker{taskerCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="category-arrow">
                <IoChevronForwardOutline size={20} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'taskers':
        return renderTaskers();
      case 'categories':
        return renderCategories();
      case 'analytics':
        return renderOverview(); // Reuse overview for now
      case 'users':
        return (
          <div className="section">
            <div className="section-header">
              <h2>Users Management</h2>
              <p>Total registered users: {users.length}</p>
            </div>
            <div className="stat-card primary">
              <div className="stat-icon">
                <IoPersonOutline size={24} />
              </div>
              <div className="stat-content">
                <h3>{users.length}</h3>
                <p>Total App Users</p>
              </div>
            </div>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  const { IoBusinessOutline, IoChevronForwardOutline, IoChevronBackOutline, IoHomeOutline, IoPeopleOutline, IoGridOutline, IoBarChartOutline, IoPersonOutline, IoCheckmarkCircleOutline, IoCheckmarkOutline, IoCloseOutline, IoPencilOutline, IoTrashOutline } = IonIcons;

  return (
    <div>
      <div className="admin-layout">
        {renderSidebar()}
        <div className="admin-main-content">
          {renderContent()}
        </div>
      </div>
      <style jsx global>{`
        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .admin-layout {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 220px;
          background: #232946;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          padding: 0;
          transition: width 0.2s;
          box-shadow: 2px 0 12px rgba(44,62,80,0.04);
          z-index: 10;
        }
        .sidebar.collapsed {
          width: 64px;
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 20px 16px 20px;
          border-bottom: 1px solid #2d3a4a;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
        }
        .collapse-btn {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 20px;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .collapse-btn:hover {
          background: #2d3a4a;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 24px;
          padding: 0 8px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          background: none;
          border: none;
          color: #bfc9e0;
          font-size: 16px;
          font-weight: 500;
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.18s, color 0.18s;
          margin-bottom: 2px;
        }
        .nav-item.active, .nav-item:hover {
          background: #4A80F0;
          color: #fff;
        }
        .admin-main-content {
          flex: 1;
          padding: 40px 32px 32px 32px;
          background: none;
          min-width: 0;
        }
        /* Service Categories Grid */
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }
        .category-card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 12px rgba(44,62,80,0.07);
          padding: 32px 20px 24px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          border: 2px solid transparent;
          transition: box-shadow 0.18s, border 0.18s, transform 0.18s;
          position: relative;
          min-height: 170px;
        }
        .category-card:hover, .category-card.selected {
          border: 2px solid #4A80F0;
          box-shadow: 0 4px 24px rgba(74,128,240,0.10);
          transform: translateY(-2px) scale(1.03);
        }
        .category-icon {
          font-size: 44px;
          margin-bottom: 14px;
          color: #4A80F0;
          background: #f0f4fa;
          border-radius: 50%;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 4px rgba(44,62,80,0.04);
        }
        .category-name {
          font-size: 18px;
          font-weight: 700;
          color: #232946;
          text-align: center;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}