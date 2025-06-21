import React from 'react';

interface DashboardCategoriesProps {
  categories: any[];
  selectedCategory: any;
  setSelectedCategory: (cat: any) => void;
  setShowCategoryModal: (show: boolean) => void;
  getIonIconComponent: (iconName: string) => React.ElementType | null;
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: '#232946',
  marginBottom: 8,
  marginTop: 0,
  paddingTop: 0,
};

const sectionSubtitleStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#666',
  marginBottom: 24,
  marginTop: 0,
  paddingTop: 0,
};

const DashboardCategories: React.FC<DashboardCategoriesProps> = ({ categories, selectedCategory, setSelectedCategory, setShowCategoryModal, getIonIconComponent }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={sectionTitleStyle}>Service Categories</h2>
    <p style={sectionSubtitleStyle}>Browse and manage all service categories in the system</p>
    <div className="categories-grid">
      {categories.map((cat) => {
        const IconComp = getIonIconComponent(cat.icon);
        return (
          <div
            key={cat.id}
            className={`category-card${selectedCategory?.id === cat.id ? ' selected' : ''}`}
            onClick={() => { setSelectedCategory(cat); setShowCategoryModal(true); }}
          >
            <div className="category-icon">
              {IconComp ? <IconComp size={32} color="#4A80F0" /> : <span>📦</span>}
            </div>
            <div className="category-name">{cat.name}</div>
          </div>
        );
      })}
    </div>
  </div>
);

export default DashboardCategories; 