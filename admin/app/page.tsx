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
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return (IonIcons as any)[compName] || null;
}


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

  const sortedCategoryTaskerCounts = [...categoryTaskerCounts].sort((a, b) => b.value - a.value).slice(0, 5);
  const pieColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: 'IoHomeOutline' },
    { id: 'taskers', label: 'Taskers', icon: 'IoPeopleOutline' },
    { id: 'categories', label: 'Categories', icon: 'IoAppsOutline' },
    { id: 'users', label: 'Users', icon: 'IoPersonCircleOutline' },
  ];

  const { IoBusinessOutline, IoChevronForwardOutline, IoChevronBackOutline, IoGridOutline } = IonIcons;

  const renderSidebar = () => (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <IoBusinessOutline size={32} color="#3B82F6" />
          {!sidebarCollapsed && <span>AdminPanel</span>}
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
          const IconComponent = (IonIcons as any)[item.icon] || IoGridOutline;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              title={sidebarCollapsed ? item.label : ''}
            >
              <IconComponent size={22} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );

  const renderSectionHeader = (title: string, subtitle: string) => (
    <div className="section-header">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );

  const renderOverview = () => (
    <div className="section">
      {renderSectionHeader("Dashboard Overview", `Welcome back, Admin!`)}
      <DashboardOverview
        totalUsers={users.length}
        totalTaskers={taskers.length}
        totalCategories={categories.length}
      />
      {renderSectionHeader("Analytics", "Key metrics and tasker distribution.")}
      <DashboardAnalytics
        categoryTaskerCounts={categoryTaskerCounts}
        sortedCategoryTaskerCounts={sortedCategoryTaskerCounts}
        pieColors={pieColors}
      />
    </div>
  );

  const renderTaskers = () => (
    <div className="section">
      {renderSectionHeader("Tasker Management", "View, edit, or remove taskers from the platform.")}
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
      />
    </div>
  );

  const renderCategories = () => (
    <div className="section">
      {renderSectionHeader("Service Categories", "Manage categories and view assigned taskers.")}
      <div className="categories-grid">
        {categories.map((cat) => {
          const IconComp = getIonIconComponent(cat.icon) || IoGridOutline;
          const taskerCount = getTaskersForCategory(cat).length;

          return (
            <div
              key={cat.id}
              className="category-card"
              onClick={() => { setSelectedCategory(cat); setShowCategoryModal(true); }}
            >
              <div className="category-icon-wrapper">
                <IconComp size={28} />
              </div>
              <div className="category-info">
                <h3>{cat.name}</h3>
                <p>{taskerCount} tasker{taskerCount !== 1 ? 's' : ''}</p>
              </div>
              <IoChevronForwardOutline className="category-arrow" size={20} />
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="section">
      {renderSectionHeader("User Management", `A list of all ${users.length} registered users on the platform.`)}
      <div className="user-list-container">
        {/* User list can be implemented here, similar to taskers table */}
        <p>User management UI is not yet implemented.</p>
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
      case 'users':
        return renderUsers();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-layout">
        {renderSidebar()}
        <main className="admin-main-content">
          {renderContent()}
        </main>
      </div>
      <style jsx global>{`
        /* Basic Reset & Font */
        :root { --sidebar-width: 240px; --collapsed-sidebar-width: 80px; }
        body { font-family: 'Inter', sans-serif; background-color: #f7f9fc; color: #1a202c; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        /* Layout */
        .admin-dashboard { max-width: 1800px; margin: 0 auto; }
        .admin-layout { display: flex; min-height: 100vh; }
        
        /* Sidebar */
        .sidebar {
          width: var(--sidebar-width);
          background: #ffffff;
          display: flex; flex-direction: column;
          padding: 16px;
          transition: width 0.3s ease;
          border-right: 1px solid #e2e8f0;
          position: fixed; top: 0; left: 0; height: 100%;
        }
        .sidebar.collapsed { width: var(--collapsed-sidebar-width); }
        .sidebar-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 4px; margin-bottom: 24px;
        }
        .logo {
          display: flex; align-items: center; gap: 12px;
          font-size: 20px; font-weight: 700; color: #111827;
          overflow: hidden; white-space: nowrap;
        }
        .collapse-btn {
          background: none; border: none; color: #4a5568; cursor: pointer;
          font-size: 24px; padding: 4px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .collapse-btn:hover { background: #f1f5f9; }
        
        .sidebar-nav { display: flex; flex-direction: column; gap: 8px; }
        .nav-item {
          display: flex; align-items: center; gap: 16px;
          background: none; border: none; color: #4a5568;
          font-size: 15px; font-weight: 500; text-align: left;
          width: 100%; padding: 12px; border-radius: 8px;
          cursor: pointer; transition: background 0.2s, color 0.2s;
        }
        .sidebar.collapsed .nav-item { justify-content: center; padding: 16px 12px; }
        .sidebar.collapsed .nav-item span { display: none; }
        .nav-item.active { background: #eef2ff; color: #4338ca; font-weight: 600; }
        .nav-item:not(.active):hover { background: #f8fafc; color: #111827; }
        
        /* Main Content */
        .admin-main-content {
          width: calc(100% - var(--sidebar-width));
          margin-left: var(--sidebar-width);
          padding: 32px 40px;
          transition: width 0.3s, margin-left 0.3s;
        }
        .sidebar.collapsed ~ .admin-main-content {
          width: calc(100% - var(--collapsed-sidebar-width));
          margin-left: var(--collapsed-sidebar-width);
        }
        .section-header { margin-bottom: 24px; }
        .section-header h2 { font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .section-header p { font-size: 16px; color: #6b7280; }

        /* Categories Grid */
        .categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        .category-card {
          background: #fff; border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          padding: 20px; display: flex; align-items: center; gap: 16px;
          cursor: pointer; border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        .category-card:hover { border-color: #4A80F0; transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(74,128,240,0.1), 0 4px 6px -2px rgba(74,128,240,0.05); }
        .category-icon-wrapper {
          font-size: 24px; color: #4A80F0; background: #eef2ff;
          border-radius: 8px; width: 48px; height: 48px;
          display: flex; align-items: center; justify-content: center;
        }
        .category-info { flex: 1; }
        .category-info h3 { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 2px; }
        .category-info p { font-size: 14px; color: #6b7280; }
        .category-arrow { color: #9ca3af; transition: transform 0.2s; }
        .category-card:hover .category-arrow { transform: translateX(4px); color: #4A80F0; }
        
        /* Tasker Table Row Hover Style */
        .tasker-row:hover { background-color: #f9fafb; }
      `}</style>
    </div>
  );
}