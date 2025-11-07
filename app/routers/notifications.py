"""
알림 예약 API 라우터
"""
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.DB import get_db
from app.models import Notification, Event, User
from app.schemas.notification import NotificationScheduleCreate, NotificationResponse
# Celery 태스크는 함수 내부에서 import하여 순환 참조 방지

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"]
)


@router.post("", response_model=List[NotificationResponse], status_code=status.HTTP_201_CREATED)
def schedule_notifications(
    notification_data: NotificationScheduleCreate,
    db: Session = Depends(get_db)
):
    """
    알림 예약 등록 또는 덮어쓰기로 수정 가능
    event_id, user_id, 몇 분 전에 알림보낼건지 (리스트)를 받아서 알림을 예약합니다.
    같은 event_id와 user_id 조합에 대한 기존 알림이 있으면 삭제하고 새로 생성합니다.
    빈 배열이면 기존 알림만 삭제하고 새 알림은 생성하지 않습니다.
    """
    # 이벤트 존재 확인
    event = db.query(Event).filter(Event.id == notification_data.event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"이벤트 ID {notification_data.event_id}를 찾을 수 없습니다."
        )
    
    # 사용자 존재 확인
    user = db.query(User).filter(User.id == notification_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"사용자 ID {notification_data.user_id}를 찾을 수 없습니다."
        )
    
    # 기존 알림 삭제 (덮어쓰기)
    existing_notifications = db.query(Notification).filter(
        Notification.event_id == notification_data.event_id,
        Notification.user_id == notification_data.user_id
    ).all()
    
    for existing_notification in existing_notifications:
        # scheduled 상태인 알림의 Celery 태스크 취소 (가능한 경우)
        if existing_notification.status == "scheduled":
            # Celery 태스크 ID가 있다면 취소할 수 있지만, 
            # 현재 구조에서는 태스크 ID를 저장하지 않으므로 스킵
            pass
        db.delete(existing_notification)
    
    # 빈 배열이면 알림 예약 없음 처리 (기존 알림만 삭제하고 빈 배열 반환)
    if not notification_data.minutes_before:
        db.commit()
        return []
    
    # minutes_before 검증 (양수만 허용)
    if any(m <= 0 for m in notification_data.minutes_before):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="minutes_before는 양수여야 합니다."
        )
    
    # 현재 시간
    now = datetime.now(timezone.utc)
    
    # 새로운 알림 생성
    created_notifications = []
    for minutes in notification_data.minutes_before:
        # 알림 전송 시간 계산 (이벤트 시작 시간 - minutes 분)
        send_at = event.start_at - timedelta(minutes=minutes)
        
        # 과거 시간이면 스킵
        if send_at <= now:
            continue
        
        # 알림 생성
        notification = Notification(
            event_id=notification_data.event_id,
            user_id=notification_data.user_id,
            send_at=send_at,
            provider="FCM",
            status="scheduled",
            payload={
                "event_id": event.id,
                "event_title": event.title,
                "event_start_at": event.start_at.isoformat(),
                "minutes_before": minutes
            }
        )
        
        db.add(notification)
        db.flush()  # ID를 얻기 위해 flush
        
        # Celery 태스크 예약 (순환 참조 방지를 위해 함수 내부에서 import)
        from celery_app import celery_app
        celery_app.send_task(
            "send_notification",
            args=[notification.id],
            eta=send_at
        )
        
        created_notifications.append(notification)
    
    db.commit()
    
    # 생성된 알림들 새로고침
    for notification in created_notifications:
        db.refresh(notification)
    
    return [NotificationResponse.model_validate(n) for n in created_notifications]


@router.get("", response_model=List[NotificationResponse])
def get_scheduled_notifications(
    event_id: int = Query(..., description="이벤트 ID"),
    db: Session = Depends(get_db)
):
    """
    예약된 알림 목록 조회
    event_id로 필터링하여 예약된 알림 목록을 반환합니다.
    """
    # 이벤트 존재 확인
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"이벤트 ID {event_id}를 찾을 수 없습니다."
        )
    
    # 예약된 알림 조회
    notifications = db.query(Notification).filter(
        Notification.event_id == event_id
    ).order_by(Notification.send_at.asc()).all()
    
    return [NotificationResponse.model_validate(n) for n in notifications]

