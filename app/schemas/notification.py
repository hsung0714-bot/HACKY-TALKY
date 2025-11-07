"""
Notification 스키마 (Pydantic 모델)
API 요청/응답 검증을 위한 스키마 정의
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class NotificationScheduleCreate(BaseModel):
    """알림 예약 생성 스키마"""
    event_id: int = Field(..., description="이벤트 ID")
    user_id: int = Field(..., description="사용자 ID")
    minutes_before: List[int] = Field(..., description="이벤트 시작 몇 분 전에 알림을 보낼지 (분 단위 리스트)")


class NotificationResponse(BaseModel):
    """알림 응답 스키마"""
    id: int = Field(..., description="알림 ID")
    event_id: int = Field(..., description="이벤트 ID")
    user_id: int = Field(..., description="사용자 ID")
    send_at: datetime = Field(..., description="알림 전송 예정 시간")
    provider: str = Field(..., description="알림 제공자 (예: FCM)")
    status: str = Field(..., description="알림 상태 (scheduled/sent/failed)")
    payload: Dict[str, Any] = Field(..., description="알림 페이로드 데이터")
    created_at: Optional[datetime] = Field(None, description="생성 시간")

    class Config:
        from_attributes = True  # SQLAlchemy 모델에서 자동 변환
