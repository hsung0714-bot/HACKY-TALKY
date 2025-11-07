"""
FastAPI 서버 실행 스크립트
"""
import uvicorn

if __name__ == "__main__":
    print("🚀 FastAPI 서버를 시작합니다...")
    print("📖 API 문서: http://localhost:8080/docs")
    print("\n서버를 중지하려면 Ctrl+C를 누르세요.\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,  # 개발 모드: 코드 변경 시 자동 재시작
        log_level="info"
    )

