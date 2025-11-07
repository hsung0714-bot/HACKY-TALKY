import React from "react";
import styles from "./Welcome.module.css";
import { Link } from "react-router-dom";

const Welcome: React.FC = () => {
  return (
    <div className={styles.page}>
      {/* 상단 헤더 */}
      <header className={styles.header}>
        <div className={styles.left}>
          {/* public 폴더의 로고 직접 사용 */}
          <img src="/dark.png" alt="Gi-T logo" className={styles.logo} />
        </div>

        <div className={styles.right}>
          <Link to="/calendar">
      <button className={`${styles.btn} ${styles.hollow}`}>
        시작하기!
      </button>
    </Link>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.titleBox}>
          <h1 className={styles.title}>Too Cool Too Be Late.</h1>
        </div>

        <div className={styles.subBox}>
          <p className={styles.sub}>즐겁게 들어갈 준비되었나요?</p>
        </div>
        {/* 하단 이미지 */}
        <div className={styles.imageWrap}>
          {/*  public 폴더의 cal.png 직접 사용 */}
          <img src="/cal.png" alt="calendar preview" className={styles.heroImg} />
        </div>
      </main>
    </div>
  );
};

export default Welcome;