"""
로그인 API 라우터
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.DB import get_db
from app.models import User

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


class LoginRequest(BaseModel):
    """로그인 요청 스키마"""
    id: int
    password: str


class LoginResponse(BaseModel):
    """로그인 응답 스키마"""
    success: bool
    message: str


@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    로그인 API
    id와 password를 받아서 users 테이블과 비교
    """
    # users 테이블에서 id로 사용자 조회
    user = db.query(User).filter(User.id == login_data.id).first()
    
    # 사용자가 존재하고 password가 일치하는지 확인
    if user and user.password == login_data.password:
        return LoginResponse(success=True, message="일치")
    else:
        return LoginResponse(success=False, message="불일치")

