import React from "react";
import styles from "./search.module.css";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string; // 필요시 외부 클래스 덧입히기
};

const Search: React.FC<Props> = ({ value, onChange, placeholder = "검색", className }) => {
  return (
    <div className={`${styles.container} ${className ?? ""}`}>
      <span className={styles.icon}>🔍</span>
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

export default Search;
