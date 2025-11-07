"""
Celery 애플리케이션 설정
비동기 작업 처리를 위한 Celery 설정
"""
import os
from celery import Celery
from datetime import datetime, timezone

# Celery 브로커 및 백엔드 설정 (환경 변수에서 가져오거나 기본값 사용)
CELERY_BROKER_URL = os.getenv(
    "CELERY_BROKER_URL",
    "redis://localhost:6379/0"
)
CELERY_RESULT_BACKEND = os.getenv(
    "CELERY_RESULT_BACKEND",
    "redis://localhost:6379/0"
)

# Celery 앱 생성
celery_app = Celery(
    "event_notifications",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND
)

# Celery 설정
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30분
    task_soft_time_limit=25 * 60,  # 25분
)


@celery_app.task(name="send_notification")
def send_notification(notification_id: int):
    """
    알림 전송 태스크
    notification_id를 받아서 알림을 전송합니다.
    
    Args:
        notification_id: 전송할 알림의 ID
    """
    # 순환 참조 방지를 위해 함수 내부에서 import
    from app.DB import SessionLocal
    from app.models import Notification
    
    db = SessionLocal()
    try:
        # 알림 조회
        notification = db.query(Notification).filter(
            Notification.id == notification_id
        ).first()
        
        if not notification:
            print(f"알림 ID {notification_id}를 찾을 수 없습니다.")
            return
        
        # 이미 전송된 알림이면 스킵
        if notification.status != "scheduled":
            print(f"알림 ID {notification_id}는 이미 처리되었습니다. 상태: {notification.status}")
            return
        
        # 알림 전송 시간 확인
        now = datetime.now(timezone.utc)
        if notification.send_at > now:
            print(f"알림 ID {notification_id}의 전송 시간이 아직 되지 않았습니다.")
            return
        
        # TODO: 실제 FCM 알림 전송 로직 구현
        # 여기에 FCM (Firebase Cloud Messaging) API를 사용한 알림 전송 코드를 추가해야 합니다.
        print(f"알림 전송: ID={notification_id}, 사용자={notification.user_id}, 이벤트={notification.event_id}")
        
        # 알림 상태 업데이트
        notification.status = "sent"
        notification.sent_at = now
        db.commit()
        
        print(f"알림 ID {notification_id} 전송 완료")
        
    except Exception as e:
        print(f"알림 전송 중 오류 발생 (ID: {notification_id}): {str(e)}")
        # 오류 발생 시 상태 업데이트
        try:
            notification = db.query(Notification).filter(
                Notification.id == notification_id
            ).first()
            if notification:
                notification.status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

