"""
FastAPI 메인 애플리케이션
"""
from fastapi import FastAPI
from app.routers import users, events, notifications

app = FastAPI(
    title="Event Management API",
    description="이벤트 관리 API",
    version="1.0.0"
)

# 라우터 등록
app.include_router(users.router)
app.include_router(events.router)
app.include_router(notifications.router)


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {"message": "Event Management API"}


