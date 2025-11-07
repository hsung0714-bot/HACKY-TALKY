# main.py
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

import requests
from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel

# --------------------
# App & Config
# --------------------
app = FastAPI(title="OTP Planner Wrapper", version="1.1")

OTP_BASE = "http://127.0.0.1:8080/otp/routers/default/plan"
KST = timezone(timedelta(hours=9))  # Asia/Seoul (UTC+9)


@app.get("/")
def root():
    return {
        "message": "OK. Use /route or open /docs",
        "examples": {
            "docs": "/docs",
            "route": (
                "/route?from_place=1:BS_3100_231001423&to_place=1:BS_3100_233002434"
                "&date=2025-11-08&time=18:05"
            ),
            "route_one": (
                "/route/one?from_place=1:BS_3100_231001423&to_place=1:BS_3100_233002434"
                "&date=2025-11-08&time=18:05&criterion=fastest"
            ),
        },
    }


# --------------------
# Models
# --------------------
class LegOut(BaseModel):
    mode: str
    route: Optional[str]
    from_name: str
    to_name: str
    start_time: str
    end_time: str


class ItineraryOut(BaseModel):
    summary: str
    duration_min: int
    transfers: int
    walk_distance_m: float
    depart_time: str
    arrive_time: str
    legs: List[LegOut]


class SortedPlans(BaseModel):
    fastest: List[ItineraryOut]
    fewest_transfers: List[ItineraryOut]
    least_walking: List[ItineraryOut]


class OneRouteResponse(BaseModel):
    criterion: str
    result: ItineraryOut


# --------------------
# Utils
# --------------------
def ms_to_kst_iso(ms: int) -> str:
    return datetime.fromtimestamp(ms / 1000, tz=KST).isoformat()


def extract_itinerary(it: Dict[str, Any]) -> ItineraryOut:
    legs_out: List[LegOut] = []
    for lg in it.get("legs", []):
        legs_out.append(
            LegOut(
                mode=lg.get("mode"),
                route=lg.get("routeShortName") or lg.get("route") or "",
                from_name=(lg.get("from") or {}).get("name", ""),
                to_name=(lg.get("to") or {}).get("name", ""),
                start_time=ms_to_kst_iso(lg.get("startTime")),
                end_time=ms_to_kst_iso(lg.get("endTime")),
            )
        )

    dur_min = int(round(it.get("duration", 0) / 60))
    transfers = int(it.get("transfers", 0))
    walk_distance = float(it.get("walkDistance", 0.0))
    depart = ms_to_kst_iso(it.get("startTime"))
    arrive = ms_to_kst_iso(it.get("endTime"))

    # 요약 문자열(모드/노선)
    modes: List[str] = []
    for lg in it.get("legs", []):
        if lg.get("transitLeg"):
            tag = (lg.get("mode") or "")
            rsn = (lg.get("routeShortName") or "").strip()
            if rsn:
                tag += f" {rsn}"
        else:
            tag = lg.get("mode") or ""
        tag = tag.strip()
        if tag:
            modes.append(tag)

    summary = " → ".join(modes) if modes else "Itinerary"

    return ItineraryOut(
        summary=summary,
        duration_min=dur_min,
        transfers=transfers,
        walk_distance_m=walk_distance,
        depart_time=depart,
        arrive_time=arrive,
        legs=legs_out,
    )


def build_otp_params(
    from_place: str,
    to_place: str,
    date: str,
    time: str,
    mode: str,
    search_window: int,
    num_itineraries: int,
    arrive_by: bool,
    max_transfers: Optional[int],
    max_walk_distance: Optional[int],
    walk_reluctance: Optional[float],
) -> Dict[str, Any]:
    params = {
        "fromPlace": from_place,
        "toPlace": to_place,
        "mode": mode,
        "date": date,
        "time": time,
        "searchWindow": str(search_window),
        "numItineraries": str(num_itineraries),
    }
    if arrive_by:
        params["arriveBy"] = "true"
    if max_transfers is not None:
        params["maxTransfers"] = str(max_transfers)
    if max_walk_distance is not None:
        params["maxWalkDistance"] = str(max_walk_distance)
    if walk_reluctance is not None:
        params["walkReluctance"] = str(walk_reluctance)
    return params


def fetch_otp_plan(params: Dict[str, Any]) -> Dict[str, Any]:
    """OTP /plan 호출 및 기본 오류 처리"""
    try:
        r = requests.get(OTP_BASE, params=params, timeout=30)
        data = r.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"OTP 서버 연결 실패: {e}")
    except ValueError:
        raise HTTPException(status_code=502, detail="OTP JSON 파싱 실패")

    # OTP는 200이면서 body에 error를 줄 수 있음
    if data.get("error"):
        err = data["error"]
        # 경미한 경고(TOO_CLOSE 등)는 허용하되, 아래는 치명적으로 간주
        if err.get("id") in (404, 440):  # PATH_NOT_FOUND, GEOCODE_FROM_NOT_FOUND
            raise HTTPException(
                status_code=400,
                detail=f"OTP 오류: {err.get('message')} ({err.get('msg')})",
            )
    return data


def transform_sorted_plans(data: Dict[str, Any]) -> SortedPlans:
    plan = data.get("plan")
    if not plan:
        raise HTTPException(status_code=404, detail="경로(plan)가 없습니다.")

    itineraries = plan.get("itineraries", [])
    if not itineraries:
        raise HTTPException(
            status_code=404, detail="검색 조건에서 경로가 없습니다(Itineraries empty)."
        )

    outs: List[ItineraryOut] = [extract_itinerary(it) for it in itineraries]

    fastest = sorted(outs, key=lambda x: (x.duration_min, x.transfers, x.walk_distance_m))
    fewest_transfers = sorted(outs, key=lambda x: (x.transfers, x.duration_min, x.walk_distance_m))
    least_walking = sorted(outs, key=lambda x: (x.walk_distance_m, x.duration_min, x.transfers))

    return SortedPlans(
        fastest=fastest,
        fewest_transfers=fewest_transfers,
        least_walking=least_walking,
    )


def select_one(plans: SortedPlans, criterion: str) -> ItineraryOut:
    crit = criterion.lower()
    if crit == "fastest":
        pool = plans.fastest
    elif crit == "fewest_transfers":
        pool = plans.fewest_transfers
    elif crit == "least_walking":
        pool = plans.least_walking
    else:
        raise HTTPException(
            status_code=400,
            detail="criterion은 fastest / fewest_transfers / least_walking 중 하나여야 합니다.",
        )

    if not pool:
        raise HTTPException(status_code=404, detail="조건에 맞는 경로가 없습니다.")
    return pool[0]


# --------------------
# Endpoints
# --------------------
@app.get("/route", response_model=SortedPlans)
def get_routes(
    from_place: str = Query(..., description="예) '37.5665,126.9780' 또는 '1:BS_3100_231001423'"),
    to_place: str = Query(..., description="예) '37.4812,126.9526' 또는 '1:BS_3100_233002434'"),
    date: str = Query(..., description="YYYY-MM-DD"),
    time: str = Query(..., description="HH:MM (24h)"),
    mode: str = Query("TRANSIT,WALK"),
    search_window: int = Query(7200, ge=300, le=43200, description="초 단위 탐색창 (기본 2시간)"),
    num_itineraries: int = Query(5, ge=1, le=10),
    arrive_by: bool = Query(False),
    max_transfers: Optional[int] = Query(None, ge=0, le=6),
    max_walk_distance: Optional[int] = Query(None, ge=0, description="미터"),
    walk_reluctance: Optional[float] = Query(None, ge=0.1, le=20.0),
):
    params = build_otp_params(
        from_place, to_place, date, time, mode,
        search_window, num_itineraries, arrive_by,
        max_transfers, max_walk_distance, walk_reluctance,
    )
    data = fetch_otp_plan(params)
    plans = transform_sorted_plans(data)

    # 요청한 개수만큼 자르기(각 리스트별)
    n = min(num_itineraries, len(plans.fastest))
    return SortedPlans(
        fastest=plans.fastest[:n],
        fewest_transfers=plans.fewest_transfers[:n],
        least_walking=plans.least_walking[:n],
    )


@app.get("/route/one", response_model=OneRouteResponse)
def get_best_route(
    from_place: str,
    to_place: str,
    date: str,
    time: str,
    mode: str = "TRANSIT,WALK",
    search_window: int = 7200,
    num_itineraries: int = 5,
    arrive_by: bool = False,
    max_transfers: Optional[int] = None,
    max_walk_distance: Optional[int] = None,
    walk_reluctance: Optional[float] = None,
    criterion: str = Query("fastest", description="fastest / fewest_transfers / least_walking"),
):
    params = build_otp_params(
        from_place, to_place, date, time, mode,
        search_window, num_itineraries, arrive_by,
        max_transfers, max_walk_distance, walk_reluctance,
    )
    data = fetch_otp_plan(params)
    plans = transform_sorted_plans(data)
    chosen = select_one(plans, criterion)
    return OneRouteResponse(criterion=criterion, result=chosen)

# ---- 추가/갱신 모델 ----
from datetime import datetime as dt

class ArrivePlans(BaseModel):
    recommended_departure_time: str
    remaining_minutes: int                  # ✅ 숫자: 지금부터 N분 후 출발
    relative_departure_text: str            # ✅ 사람 친화 텍스트
    plans: Dict[str, List[ItineraryOut]]    # fastest / fewest_transfers / least_walking 중 존재하는 것만


# ---- 새 엔드포인트(최종): 도착 시각 기준 출발 시각 + 남은 분/텍스트 + 경로(1~3종) ----
@app.get("/route/arrive", response_model=ArrivePlans)
def get_routes_by_arrival(
    from_place: str = Query(..., description="예) '37.5665,126.9780' 또는 '1:BS_3100_231001423'"),
    to_place: str   = Query(..., description="예) '37.4812,126.9526' 또는 '1:BS_3100_233002434'"),
    date: str       = Query(..., description="YYYY-MM-DD"),
    arrive_time: str = Query(..., description="도착 시각 HH:MM (24h)"),
    mode: str = Query("TRANSIT,WALK"),
    search_window: int = Query(7200, ge=300, le=43200, description="초 단위 탐색창 (기본 2시간)"),
    num_itineraries: int = Query(5, ge=1, le=10),
    max_transfers: Optional[int] = Query(None, ge=0, le=6),
    max_walk_distance: Optional[int] = Query(None, ge=0, description="미터"),
    walk_reluctance: Optional[float] = Query(None, ge=0.1, le=20.0),
):
    # OTP 호출 (도착 시각 기준)
    params = build_otp_params(
        from_place=from_place,
        to_place=to_place,
        date=date,
        time=arrive_time,          # 도착 시각
        mode=mode,
        search_window=search_window,
        num_itineraries=num_itineraries,
        arrive_by=True,            # ✅ 핵심
        max_transfers=max_transfers,
        max_walk_distance=max_walk_distance,
        walk_reluctance=walk_reluctance,
    )
    data = fetch_otp_plan(params)
    all_plans = transform_sorted_plans(data)

    # 실제로 존재하는 섹션만 채운다(1~3종)
    plan_dict: Dict[str, List[ItineraryOut]] = {}
    if all_plans.fastest:
        plan_dict["fastest"] = [all_plans.fastest[0]]
    if all_plans.fewest_transfers:
        plan_dict["fewest_transfers"] = [all_plans.fewest_transfers[0]]
    if all_plans.least_walking:
        plan_dict["least_walking"] = [all_plans.least_walking[0]]

    if not plan_dict:
        raise HTTPException(status_code=404, detail="해당 도착 시각에 맞는 경로가 없습니다.")

    # 기준: 'fastest' 1순위의 출발 시각
    recommended_departure_time = all_plans.fastest[0].depart_time

    # 남은 분/텍스트 계산
    now_kst = dt.now(KST)
    try:
        dep_dt = dt.fromisoformat(recommended_departure_time)
    except Exception:
        dep_dt = now_kst
    diff_sec = (dep_dt - now_kst).total_seconds()
    diff_min = int(diff_sec / 60)  # 정수 분

    if diff_min > 0:
        relative_text = f"지금부터 약 {diff_min}분 후 출발해야 합니다."
    elif diff_min > -5:
        relative_text = "지금 바로 출발해야 합니다!"
    else:
        relative_text = f"{abs(diff_min)}분 전에 출발했어야 합니다."

    return ArrivePlans(
        recommended_departure_time=recommended_departure_time,
        remaining_minutes=diff_min,
        relative_departure_text=relative_text,
        plans=plan_dict,
    )

