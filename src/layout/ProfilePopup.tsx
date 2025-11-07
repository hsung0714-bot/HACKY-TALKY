import React, { useRef, useEffect } from "react";
import styles from "./ProfilePopup.module.css";

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfilePopup: React.FC<ProfilePopupProps> = ({ isOpen, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = () => {
    // 로그아웃 로직
    console.log("로그아웃");
    onClose();
  };

  const handleProfileSettings = () => {
    // 프로필 설정 페이지로 이동
    console.log("프로필 설정");
    onClose();
  };

  return (
    <div className={styles.popup} ref={popupRef}>
      <div className={styles.profileSection}>
        <div className={styles.profileImage}>
          <span className={styles.profileIcon}>👤</span>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      <div className={styles.inputSection}>
        <div className={styles.inputGroup}>
          <label htmlFor="name">이름</label>
          <input 
            type="text" 
            id="name" 
            placeholder="이름을 입력하세요"
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password">비밀번호</label>
          <input 
            type="password" 
            id="password" 
            placeholder="비밀번호를 입력하세요"
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email">이메일</label>
          <input 
            type="email" 
            id="email" 
            placeholder="이메일을 입력하세요"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.buttonSection}>
        <button 
          className={styles.actionButton}
          onClick={handleLogout}
        >
          로그아웃
        </button>
        <button 
          className={styles.actionButton}
          onClick={handleProfileSettings}
        >
          계정 삭제
        </button>
        <button 
          className={`${styles.actionButton} ${styles.saveButton}`}
          onClick={() => {
            console.log("저장");
            onClose();
          }}
        >
          저장
        </button>
      </div>
    </div>
  );
};

export default ProfilePopup;
