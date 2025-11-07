import React, { useRef, useEffect, useState } from "react";
import styles from "./Sidebox.module.css";
import CategoryModal from "../commponet/Category";

interface Category {
  id: string;
  name: string;
  color: string;
  checked: boolean;
}

interface SideboxProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_CATEGORIES = 8; // ✅ 최대 카테고리 개수 제한

const Sidebox: React.FC<SideboxProps> = ({ isOpen, onClose }) => {
  const sideboxRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "카테고리 1", color: "#7BA3D1", checked: false },
    { id: "2", name: "카테고리 2", color: "#E88B8B", checked: false },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const handleDeleteCategory = (id: string) => {
   setCategories(prev => prev.filter(cat => cat.id !== id)); // ✅ 상태에서 제거
 };
  // ✅ 모달이 열려있을 때는 사이드박스 외부 클릭 감지 비활성화
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 모달이 열려있으면 외부 클릭 무시
      if (isModalOpen) return;
      
      if (sideboxRef.current && !sideboxRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isModalOpen]); // ✅ isModalOpen 의존성 추가

  const handleAddCategory = (name: string, color: string) => {
    if (editingCategory) {
      // 수정
      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id ? { ...cat, name, color } : cat
        )
      );
      setEditingCategory(null);
    } else {
      // 추가
      const newCategory: Category = {
        id: Date.now().toString(),
        name,
        color,
        checked: false,
      };
      setCategories([...categories, newCategory]);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const toggleCategoryCheck = (id: string) => {
    setCategories(
      categories.map((cat) =>
        cat.id === id ? { ...cat, checked: !cat.checked } : cat
      )
    );
  };

  // ✅ 카테고리 추가 버튼 클릭 핸들러
  const handleAddButtonClick = () => {
    if (categories.length >= MAX_CATEGORIES) {
      alert(`카테고리는 최대 ${MAX_CATEGORIES}개까지 추가할 수 있습니다.`);
      return;
    }
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <div
        className={`${styles.sidebox} ${isOpen ? styles.open : ""}`}
        ref={sideboxRef}
      >
        <div className={styles.header}>
          <div className={styles.logo}>
            <button className={styles.hamburgerButton} onClick={onClose}>☰</button>

            <img src="/GilTlogo.png" alt="Gil-T 로고" className={styles.logoImg} />
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="검색"
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.categorySection}>
          <div className={styles.categoryHeader}>
            <span>카테고리</span>
            <button
              className={styles.addButton}
              onClick={handleAddButtonClick} // ✅ 핸들러 변경
            >
              +
            </button>
          </div>

          <div className={styles.categoryList}>
            {categories.map((category) => (
              <div key={category.id} className={styles.categoryItem}>
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  className={styles.checkbox}
                  style={{
                    accentColor: category.color,
                  }}
                  checked={category.checked}
                  onChange={() => toggleCategoryCheck(category.id)}
                />
                <label htmlFor={`category-${category.id}`}>
                  {category.name}
                </label>
                <button
                  className={styles.settingsButton}
                  onClick={() => handleEditCategory(category)}
                >
                  ⚙️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 카테고리 추가/수정 모달 */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleAddCategory}
        editingCategory={editingCategory}
        onDelete={handleDeleteCategory}
      />
    </>
  );
};

export default Sidebox;
