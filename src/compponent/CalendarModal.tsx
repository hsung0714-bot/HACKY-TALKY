// src/compponent/CalendarModal.tsx
import React, { useState, useEffect } from 'react';
import styles from './CalendarModal.module.css';
import { useNavigate } from "react-router-dom";

interface MyEvent {
  id?: string;
  title: string;
  date: string;
  startPosition: string;
  endPosition: string;
  memo?: string;
  notification?: string;
  endtime?: string;
}

interface CalendarModalProps {
  date: string | null;
  event?: MyEvent | null;
  onClose: () => void;
  onAddEvent: (
    title: string,
    date: string,
    startPosition: string,
    endPosition: string,
    memo?: string,
    notification?: string,
    endtime?: string
  ) => void;
  onDeleteEvent?: () => void; // 삭제용
}

const CalendarModal: React.FC<CalendarModalProps> = ({ date, event, onClose, onAddEvent, onDeleteEvent }) => {
  const [eventTitle, setEventTitle] = useState('');
  const [startPosition, setStartPosition] = useState('');
  const [endPosition, setEndPosition] = useState('');
  const [memo, setMemo] = useState('');
  const [notification, setNotification] = useState('1시간 전');
  const [endtime, setEndTime] = useState('');

  const navigate = useNavigate();


  useEffect(() => {
    setEventTitle(event?.title || '');
    setStartPosition(event?.startPosition || '');
    setEndPosition(event?.endPosition || '');
    setMemo(event?.memo || '');
    setNotification(event?.notification || '1시간 전');
    setEndTime(event?.endtime || '');
  }, [event]);

  if (!date) return null;

  const handleAddOrUpdate = () => {
    if (eventTitle.trim() === '') return;
    onAddEvent(eventTitle, date, startPosition, endPosition, memo, notification,endtime);
    onClose();
  };
  

const handleFindRoute = () => {
  console.log('경로찾기:', startPosition, '→', endPosition, '날짜:', date, '종료시간:', endtime);
  
  navigate(`/lookmap/${event?.id}`, {
    state: { 
      startPosition, 
      endPosition, 
      date,  
      endtime  
    }
  });
};

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div>
          <input
            className='title'
            type="text"
            placeholder="일정"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
          />
          <select className='select_category'>
            <option value="색">카테고리</option>
          </select>
        </div>
        <p>{date}</p>

        <div className={styles.locationContainer}>
          <div className={styles.locationInputs}>
            <div className={styles.locationRow}>
              <label>출발장소</label>
              <input
                type="text"
                placeholder="장소"
                value={startPosition}
                onChange={(e) => setStartPosition(e.target.value)}
              />
            </div>
            <div className={styles.locationRow}>
              <label>도착장소</label>
              <input
                type="text"
                placeholder="장소"
                value={endPosition}
                onChange={(e) => setEndPosition(e.target.value)}
              />
            </div>
            <div>
                <div className={styles.endtime}>
                    <label>도착시간</label>
                    <input 
                    type="time" 
                    className={styles.timeInput}
                    value={endtime}
                    onChange={(e)=> setEndTime(e.target.value)}
                    />
                </div>
            </div>
          </div>
          <button className={styles.findRouteButton} onClick={handleFindRoute}>
            경로찾기
          </button>
        </div>

        <div>
          <label>최적경로</label>
        </div>

        <div className='formGroup_noti'>
          <label>출발전 알림</label>
          <select className='select_noti' value={notification} onChange={e => setNotification(e.target.value)}>
            <option value="1시간 전">1 시간 전</option>
            <option value="30분 전">30 분 전</option>
            <option value="10분 전">10 분 전</option>
            <option value="5분 전">5분 전</option>
          </select>
        </div>

        <div className="memo">
          <label>메모</label>
          <textarea
            className="memo_input"
            placeholder="메모를 입력하세요."
            value={memo}
            onChange={e => setMemo(e.target.value)}
          ></textarea>
        </div>

        <div className={styles.buttons}>
          <button onClick={handleAddOrUpdate}>{event ? '수정' : '저장'}</button>
          {event && onDeleteEvent && (
            <button onClick={onDeleteEvent} style={{ marginLeft: '10px', backgroundColor: '#f55' }}>
              삭제
            </button>
          )}
          <button onClick={onClose} style={{ marginLeft: '10px' }}>취소</button>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
