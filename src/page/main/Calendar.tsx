// src/page/calendar/Calendar.tsx

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import CalendarModal from '../../compponent/CalendarModal';
import styles from './Calendar.module.css';
import Header from '../../layout/Header';

interface MyEvent {
  id: string;
  title: string;
  date: string;
  startPosition: string;
  endPosition: string;
  memo?: string;
  notification?: string;
  endtime?: string;
}

const STORAGE_KEY = 'myCalendarEvents';

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MyEvent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false); // ✅ 데이터 로딩 완료 여부

  // 1. 페이지 로드 시 localStorage에서 불러오기
  useEffect(() => {
    const savedEvents = localStorage.getItem(STORAGE_KEY);
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        setEvents(parsed);
        console.log('📦 로컬스토리지에서 이벤트 불러옴:', parsed);
      } catch (e) {
        console.error('❌ 로컬스토리지 파싱 오류:', e);
      }
    }
    setIsLoaded(true); // 불러오기 완료 후 렌더링 시작
  }, []);

  // 2. events 변경 시 localStorage에 자동 저장
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      console.log('💾 이벤트 저장됨:', events);
    }
  }, [events, isLoaded]);

  // 날짜 클릭 → 새 이벤트 추가
  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr);
    setSelectedEvent(null);
  };

  // 기존 이벤트 클릭 → 수정
  const handleEventClick = (info: any) => {
    const clickedEvent = events.find(ev => ev.id === info.event.id);
    if (clickedEvent) {
      setSelectedEvent(clickedEvent);
      setSelectedDate(clickedEvent.date);
    }
  };

  // 이벤트 추가 또는 수정
  const handleAddOrUpdateEvent = (
    title: string,
    date: string,
    startPosition: string,
    endPosition: string,
    memo?: string,
    notification?: string,
    endtime?: string
  ) => {
    const formattedDate = new Date(date).toISOString().split('T')[0]; // ✅ 'YYYY-MM-DD'로 통일

    if (selectedEvent) {
      // 수정
      const updatedEvents = events.map(ev =>
        ev.id === selectedEvent.id
          ? { ...ev, title, date: formattedDate, startPosition, endPosition, memo, notification, endtime }
          : ev
      );
      setEvents(updatedEvents);
      setSelectedEvent(null);
    } else {
      // 새 이벤트 추가
      const newEvent: MyEvent = {
        id: Date.now().toString(),
        title,
        date: formattedDate,
        startPosition,
        endPosition,
        memo,
        notification,
        endtime,
      };
      setEvents(prev => [...prev, newEvent]);
    }
  };

  // 이벤트 삭제
  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(ev => ev.id !== id);
    setEvents(updated);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setSelectedDate(null);
    setSelectedEvent(null);
  };

  return (
    <div>
      <Header />
      <div className={styles.calendarContainer}>
        {/* localStorage에서 불러오기 완료 후에만 렌더링 */}
        {isLoaded && (
          <FullCalendar
            key={events.length} // 이벤트 갯수 변화 시 강제 리렌더
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            editable={true}
            selectable={true}
            events={events.map(ev => ({
              id: ev.id,
              title: ev.title,
              start: ev.date, // FullCalendar가 인식할 수 있는 필드명
            }))}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
          />
        )}

        {/* 이벤트 추가/수정 모달 */}
        <CalendarModal
          date={selectedDate}
          event={selectedEvent}
          onClose={handleCloseModal}
          onAddEvent={handleAddOrUpdateEvent}
          onDeleteEvent={selectedEvent ? () => handleDeleteEvent(selectedEvent.id) : undefined}
        />
      </div>
    </div>
  );
};

export default Calendar;
