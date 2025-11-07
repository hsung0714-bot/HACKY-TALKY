import React, { useState } from "react";
import styles from "./Header.module.css";
import ProfilePopup from "./ProfilePopup";
import Sidebox from "./Sidebox"; 

const Header: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSideboxOpen, setIsSideboxOpen] = useState(false);  

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const toggleSidebox = () => { 
    setIsSideboxOpen(!isSideboxOpen);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.leftSection}>
          <button 
            className={styles.menuButton} 
            aria-label="메뉴 열기"
            onClick={toggleSidebox} 
          >
            ☰
          </button>
          <img src="/GilTlogo.png" alt="Gil-T 로고" className={styles.logoImg} />
        </div>

        <div className={styles.rightButtons}>
          <button aria-label="오늘 보기">오늘</button>
          <button aria-label="월별 보기">월</button>
          <button aria-label="연도별 보기">연도</button>
          <button 
            onClick={togglePopup} 
            className={styles.profileButton}
            aria-label="프로필 메뉴"
          >
            👤
          </button>

          <ProfilePopup 
            isOpen={isPopupOpen} 
            onClose={() => setIsPopupOpen(false)} 
          />
        </div>
      </header>

      <Sidebox 
        isOpen={isSideboxOpen} 
        onClose={() => setIsSideboxOpen(false)} 
      />
    </>
  );
};

export default Header;
