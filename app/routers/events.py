"""
이벤트 API 라우터
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.DB import get_db
from app.models import Event, User, Location
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.schemas.location import LocationResponse

router = APIRouter(
    prefix="/events",
    tags=["events"]
)


def check_and_update_event_status(event: Event, db: Session):
    """
    이벤트의 start_at이 현재 시간보다 이전이면 status를 'done'으로 업데이트
    """
    now = datetime.now(timezone.utc)
    if event.status == "scheduled" and event.start_at < now:
        event.status = "done"
        db.flush()  # commit 전에 변경사항 반영


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """
    이벤트 ID로 단일 이벤트 조회 API
    """
    # 이벤트 조회
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"이벤트 ID {event_id}를 찾을 수 없습니다."
        )
    
    # start_at이 지났으면 status를 'done'으로 자동 업데이트
    check_and_update_event_status(event, db)
    db.commit()
    db.refresh(event)
    
    # 관련 locations 조회
    locations = db.query(Location).filter(Location.event_id == event_id).all()
    
    # 응답 생성
    response = EventResponse.model_validate(event)
    response.locations = [LocationResponse.model_validate(loc) for loc in locations]
    
    return response


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(event_data: EventCreate, db: Session = Depends(get_db)):
    """
    이벤트 생성 API
    user_id, title, start_at, 출발장소, 도착장소를 받아서 events 테이블과 locations 테이블에 저장
    """
    # user_id가 존재하는지 확인
    user = db.query(User).filter(User.id == event_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"사용자 ID {event_data.user_id}를 찾을 수 없습니다."
        )
    
    # status 값 검증
    if event_data.status and event_data.status not in ["scheduled", "done"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status는 'scheduled' 또는 'done'이어야 합니다."
        )
    
    # start_at이 지났는지 확인하여 기본 status 결정
    now = datetime.now(timezone.utc)
    default_status = "done" if event_data.start_at < now else "scheduled"
    final_status = event_data.status or default_status
    
    # Event 생성
    new_event = Event(
        user_id=event_data.user_id,
        title=event_data.title,
        start_at=event_data.start_at,
        status=final_status
    )
    
    db.add(new_event)
    db.flush()  # commit 전에 ID를 얻기 위해 flush
    
    # 출발장소 생성
    start_location = Location(
        event_id=new_event.id,
        type="start",
        name=event_data.start_location.name,
        address=event_data.start_location.address,
        lat=event_data.start_location.lat,
        lng=event_data.start_location.lng
    )
    
    # 도착장소 생성
    end_location = Location(
        event_id=new_event.id,
        type="end",
        name=event_data.end_location.name,
        address=event_data.end_location.address,
        lat=event_data.end_location.lat,
        lng=event_data.end_location.lng
    )
    
    db.add(start_location)
    db.add(end_location)
    db.commit()
    db.refresh(new_event)
    db.refresh(start_location)
    db.refresh(end_location)
    
    # 응답에 locations 포함
    response = EventResponse.model_validate(new_event)
    response.locations = [
        LocationResponse.model_validate(start_location),
        LocationResponse.model_validate(end_location)
    ]
    
    return response


@router.put("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, event_data: EventUpdate, db: Session = Depends(get_db)):
    """
    이벤트 수정 API
    event_id로 이벤트를 찾아서 제공된 필드만 업데이트
    """
    # 이벤트 조회
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"이벤트 ID {event_id}를 찾을 수 없습니다."
        )
    
    # status 값 검증
    if event_data.status and event_data.status not in ["scheduled", "done"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status는 'scheduled' 또는 'done'이어야 합니다."
        )
    
    # 이벤트 필드 업데이트
    if event_data.title is not None:
        event.title = event_data.title
    if event_data.start_at is not None:
        event.start_at = event_data.start_at
    if event_data.status is not None:
        event.status = event_data.status
    
    # start_at이 변경되었거나 수정 후 start_at이 지났으면 status 자동 업데이트
    check_and_update_event_status(event, db)
    
    # 출발장소 업데이트
    if event_data.start_location is not None:
        start_location = db.query(Location).filter(
            Location.event_id == event_id,
            Location.type == "start"
        ).first()
        
        if start_location:
            start_location.name = event_data.start_location.name
            start_location.address = event_data.start_location.address
            start_location.lat = event_data.start_location.lat
            start_location.lng = event_data.start_location.lng
        else:
            # 출발장소가 없으면 새로 생성
            start_location = Location(
                event_id=event.id,
                type="start",
                name=event_data.start_location.name,
                address=event_data.start_location.address,
                lat=event_data.start_location.lat,
                lng=event_data.start_location.lng
            )
            db.add(start_location)
    
    # 도착장소 업데이트
    if event_data.end_location is not None:
        end_location = db.query(Location).filter(
            Location.event_id == event_id,
            Location.type == "end"
        ).first()
        
        if end_location:
            end_location.name = event_data.end_location.name
            end_location.address = event_data.end_location.address
            end_location.lat = event_data.end_location.lat
            end_location.lng = event_data.end_location.lng
        else:
            # 도착장소가 없으면 새로 생성
            end_location = Location(
                event_id=event.id,
                type="end",
                name=event_data.end_location.name,
                address=event_data.end_location.address,
                lat=event_data.end_location.lat,
                lng=event_data.end_location.lng
            )
            db.add(end_location)
    
    db.commit()
    db.refresh(event)
    
    # 관련 locations 조회
    locations = db.query(Location).filter(Location.event_id == event_id).all()
    
    # 응답 생성
    response = EventResponse.model_validate(event)
    response.locations = [LocationResponse.model_validate(loc) for loc in locations]
    
    return response


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    """
    이벤트 삭제 API
    event_id로 이벤트를 찾아서 삭제 (관련 locations는 CASCADE로 자동 삭제됨)
    """
    # 이벤트 조회
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"이벤트 ID {event_id}를 찾을 수 없습니다."
        )
    
    # 이벤트 삭제 (CASCADE로 locations도 자동 삭제됨)
    db.delete(event)
    db.commit()
    
    return None

