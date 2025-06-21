import React from 'react';
import * as IonIcons from "react-icons/io5";

interface ServiceCategory {
  id: string;
  name: string;
  icon?: string;
  services: any[];
}

const DashboardCategories = ({
  categories,
  setSelectedCategory,
  setShowCategoryModal,
  getIonIconComponent,
  getTaskersForCategory,
}: {
  categories: ServiceCategory[];
  setSelectedCategory: (category: ServiceCategory) => void;
  setShowCategoryModal: (show: boolean) => void;
  getIonIconComponent: (iconName?: string) => React.ComponentType<any> | null;
  getTaskersForCategory: (category: ServiceCategory) => any[];
}) => {
  const { IoGridOutline, IoChevronForwardOutline } = IonIcons;

  return (
    <div className="section">
      <div className="section-header">
        <h2>Service Categories</h2>
        <p>Manage categories and view assigned taskers.</p>
      </div>
      <div className="categories-grid">
        {categories.map((cat: ServiceCategory) => {
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
};

export default DashboardCategories; 