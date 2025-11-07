"""
데이터베이스 연결 설정
SQLAlchemy를 사용한 데이터베이스 세션 관리
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool

# 데이터베이스 URL (환경 변수에서 가져오거나 기본값 사용)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/eventdb"
)

# SQLAlchemy 엔진 생성
# echo=True는 개발 시 SQL 쿼리 로깅을 위해 사용 (프로덕션에서는 False로 설정)
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # 연결 풀 사용 안 함 (필요시 변경 가능)
    echo=False  # SQL 쿼리 로깅 (디버깅 시 True로 변경)
)

# 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """
    FastAPI 의존성 주입을 위한 데이터베이스 세션 생성 함수
    각 요청마다 새로운 세션을 생성하고, 요청 완료 후 자동으로 닫힘
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

