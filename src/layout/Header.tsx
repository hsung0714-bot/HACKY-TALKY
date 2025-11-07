import React, { useState } from "react";
import styles from "./Header.module.css";
import ProfilePopup from "../compponent/ProfilePopup";
import Sidebox from "../compponent/SideBox"; 
import { Link } from "react-router-dom";

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
          <Link to="/">
          <img src="/Gil-T.png" alt="Gil-T 로고" className={styles.logoImg} />
          </Link>
        </div>

        <div className={styles.rightButtons}>
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