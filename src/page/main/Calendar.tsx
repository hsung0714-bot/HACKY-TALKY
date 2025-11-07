import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import CalendarModal from '../../compponent/CalendarModal';
import styles from './Calendar.module.css';

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

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MyEvent | null>(null);

  // 날짜 클릭 → 새 이벤트 모달
  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr);
    setSelectedEvent(null);
  };

  // 기존 이벤트 클릭 → 수정 모달
  const handleEventClick = (info: any) => {
    const clickedEvent = events.find(ev => ev.id === info.event.id);
    if (clickedEvent) {
      setSelectedEvent(clickedEvent);
      setSelectedDate(clickedEvent.date);
    }
  };

  // 이벤트 추가/수정
  const handleAddOrUpdateEvent = (
    title: string,
    date: string,
    startPosition: string,
    endPosition: string,
    memo?: string,
    notification?: string,
    endtime?: string
  ) => {
    if (selectedEvent) {
      // 수정
      setEvents(events.map(ev =>
        ev.id === selectedEvent.id ? { ...ev, title, date, startPosition, endPosition, memo, notification, endtime } : ev
      ));
      setSelectedEvent(null);
    } else {
      // 새 이벤트 추가
      const newEvent: MyEvent = {
        id: Date.now().toString(),
        title,
        date,
        startPosition,
        endPosition,
        memo,
        notification,
        endtime
      };
      setEvents([...events, newEvent]);
    }
  };

  // 이벤트 삭제
  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(ev => ev.id !== id));
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
    setSelectedEvent(null);
  };

  return (
    <div className={styles.calendarContainer}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: ''
        }}
        editable={true}
        selectable={true}
        events={events.map(ev => ({ ...ev, id: ev.id }))}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
      />

      <CalendarModal
        date={selectedDate}
        event={selectedEvent}
        onClose={handleCloseModal}
        onAddEvent={handleAddOrUpdateEvent}
        onDeleteEvent={selectedEvent ? () => handleDeleteEvent(selectedEvent.id) : undefined}
      />
    </div>
  );
};

export default Calendar;
