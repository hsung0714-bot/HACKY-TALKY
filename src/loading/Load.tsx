import React from "react";
import styles from "./Load.module.css";

interface LoadingProps {
  /** 전체화면 오버레이 여부 */
  fullscreen?: boolean;
  /** 타이틀 텍스트 */
  title?: string;
  /** 하단 설명(선택) */
  caption?: string;
}

const Loading: React.FC<LoadingProps> = ({
  fullscreen = true,
  title = "Generating Path...",
  caption = "경로를 생성하고 있어요. 잠시만 기다려 주세요.",
}) => {
  const Content = (
    <div className={styles.card} role="alert" aria-busy="true" aria-live="polite">
      <div className={styles.title}>{title}</div>

      <div className={styles.rule} />
      <div className={styles.rule} />

      <div className={styles.boxRow} aria-hidden="true">
        <div className={styles.box} />
        <div className={styles.box} />
        <div className={styles.box} />
        <div className={styles.box} />
      </div>

      <div className={styles.rule} />
      <div className={styles.rule} />

      {caption && <div className={styles.caption}>{caption}</div>}
    </div>
  );

  if (fullscreen) {
    return <div className={styles.overlay}>{Content}</div>;
  }
  return Content;
};

export default Loading;
