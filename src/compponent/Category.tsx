import React, { useState } from "react";
import styles from "./Category.module.css";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  onDelete?: (id: string) => void; // ✅ 삭제 함수 추가
  editingCategory?: { id: string; name: string; color: string } | null;
}

const COLORS = [
  "#7BA3D1", // 파란색
  "#E88B8B", // 빨간색
  "#8BC9A8", // 초록색
  "#F5C77E", // 노란색
  "#B8A8D8", // 보라색
  "#8DD4D4", // 민트색
  "#F5B8C8", // 분홍색
  "#7A8B99", // 회색
];

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingCategory,
}) => {
  const [categoryName, setCategoryName] = useState(
    editingCategory?.name || ""
  );
  const [selectedColor, setSelectedColor] = useState(
    editingCategory?.color || COLORS[0]
  );
  const [showColorPicker, setShowColorPicker] = useState(false);

  React.useEffect(() => {
    if (editingCategory) {
      setCategoryName(editingCategory.name);
      setSelectedColor(editingCategory.color);
    } else {
      setCategoryName("");
      setSelectedColor(COLORS[0]);
    }
  }, [editingCategory]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (categoryName.trim()) {
      onSave(categoryName, selectedColor);
      setCategoryName("");
      setSelectedColor(COLORS[0]);
      setShowColorPicker(false);
      onClose();
    }
  };

  // ✅ 삭제 핸들러
  const handleDelete = () => {
    if (editingCategory && onDelete) {
      if (window.confirm(`"${editingCategory.name}" 카테고리를 삭제하시겠습니까?`)) {
        onDelete(editingCategory.id);
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setCategoryName("");
    setSelectedColor(COLORS[0]);
    setShowColorPicker(false);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{editingCategory ? "카테고리 수정" : "카테고리 추가"}</h3>
          <button className={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.inputGroup}>
            <label>카테고리 이름</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="카테고리 이름을 입력하세요"
              className={styles.input}
            />
          </div>

          <div className={styles.colorSection}>
            <label>색상 선택</label>
            <button
              className={styles.colorButton}
              style={{ backgroundColor: selectedColor }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              {showColorPicker ? "▲" : "▼"}
            </button>
          </div>

          {showColorPicker && (
            <div className={styles.colorPicker}>
              <div className={styles.colorGrid}>
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`${styles.colorOption} ${
                      selectedColor === color ? styles.selected : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setSelectedColor(color);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ✅ 푸터 버튼 조건부 렌더링 */}
        <div className={styles.modalFooter}>
          {editingCategory ? (
            // 수정 모드: 삭제, 취소, 저장
            <>
              <button 
                className={styles.deleteButton} 
                onClick={handleDelete}
              >
                삭제
              </button>
              <div className={styles.rightButtons}>
                <button className={styles.cancelButton} onClick={handleClose}>
                  취소
                </button>
                <button className={styles.saveButton} onClick={handleSave}>
                  저장
                </button>
              </div>
            </>
          ) : (
            // 추가 모드: 취소, 추가
            <>
              <button className={styles.cancelButton} onClick={handleClose}>
                취소
              </button>
              <button className={styles.saveButton} onClick={handleSave}>
                추가
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
