// src/page/lookMap/LookMap.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from "react-router-dom";
import styles from './lookMap.module.css';
import Header from '../../layout/Header';

interface LocationState {
  startPosition: string;
  endPosition: string;
  date?: string;
  endtime?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const LookMap: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { startPosition, endPosition, date, endtime } = (location.state as LocationState) || {};

  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [endCoords, setEndCoords] = useState<Coordinates | null>(null);

  // 구글 맵 API 키
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; 
  // (⚠️ 키는 .env 파일에 저장하세요!)

  // 지오코딩 함수
  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK") {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      } else {
        console.error("Geocoding failed:", data.status);
        return null;
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
      return null;
    }
  };

  // 페이지 로드 시 자동 지오코딩
  useEffect(() => {
    if (startPosition && endPosition) {
      (async () => {
        const start = await geocodeAddress(startPosition);
        const end = await geocodeAddress(endPosition);
        setStartCoords(start);
        setEndCoords(end);

        if (start && end) {
          const response = await fetch("http://localhost:4000/api/route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              startCoords: start,
              endCoords: end,
              date,
              endtime
            }),
          });
          const result = await response.json();
          console.log("서버 응답:", result);
        }
      })();
    }
  }, [startPosition, endPosition]);

  return (
    <div>
        <Header/>
    <div className={styles.mapContainer}>
      {startPosition && endPosition ? (
        <>
          {/* 지도 표시 */}
          <div className={styles.map}>
            <div className={styles.mapPlaceholder}>
              <p>지도 표시 영역</p>
            </div>
          </div>

          {/* 정보 표시 */}
          <div className={styles.infoPanel}>
            <div className={styles.Position}>
              <p>출발지: {startPosition}</p>
              <p>도착지: {endPosition}</p>
            </div>

            {startCoords && endCoords && (
              <>
                <p>출발 좌표: {startCoords.lat}, {startCoords.lng}</p>
                <p>도착 좌표: {endCoords.lat}, {endCoords.lng}</p>
              </>
            )}
            {date && <p>날짜: {date}</p>}
            {endtime && <p>도착 시간: {endtime}</p>}
            <div>
                <label className={styles.endtime}>출발시간</label>
            </div>
          </div>
        </>
      ) : (
        <p>경로 데이터가 없습니다.</p>
      )}
    </div>
    </div>
  );
};

export default LookMap;
