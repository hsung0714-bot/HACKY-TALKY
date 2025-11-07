// src/page/lookMap/LookMap.tsx
import React from 'react';
import { useParams, useLocation } from "react-router-dom";
import styles from './lookMap.module.css';

interface LocationState {
  startPosition: string;
  endPosition: string;
  date?: string;
  endtime?: string;
}

const LookMap: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { startPosition, endPosition, date, endtime } = (location.state as LocationState) || {};
  
  console.log("id:", id);
  console.log("출발:", startPosition);
  console.log("도착:", endPosition);
  console.log("날짜:", date);
  console.log("종료 시간:", endtime);

  return (
    <div className={styles.mapContainer}>
      {startPosition && endPosition ? (
        <>
          {/* 왼쪽: 지도 영역 */}
          <div className={styles.map}>
            <div className={styles.mapPlaceholder}>
              <p>지도 표시 영역</p>
            </div>
          </div>

          {/* 오른쪽: 정보 패널 */}
          <div className={styles.infoPanel}>
            <div className={styles.Position}>
              <p>출발지: {startPosition}</p>
              <p>도착지: {endPosition}</p>
            </div>
            {date && <p className='date'>날짜: {date}</p>}
            {endtime && <p className='endtime'>도착 시간: {endtime}</p>}
          </div>
        </>
      ) : (
        <p>경로 데이터가 없습니다.</p>
      )}
    </div>
  );
};

export default LookMap;
