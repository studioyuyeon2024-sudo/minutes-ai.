import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://r.jbstatecouncil.jeonbuk.kr";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/json",
  "Accept-Language": "ko-KR,ko;q=0.9",
  Referer: `${BASE_URL}/assem/search/simple/council.do?ctGroup=B`,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "sessions") {
      const csDaesoo = searchParams.get("csDaesoo") || "12";
      const ctGroup = searchParams.get("ctGroup") || "";
      const ctUid = searchParams.get("ctUid") || "";

      const res = await fetch(
        `${BASE_URL}/assem/search/simple/LoadingSession_Year.json?searchCsDaesoo=${csDaesoo}&searchCtGroup=${ctGroup}&searchCtUid=${ctUid}`,
        { headers: HEADERS }
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "documents") {
      const csSession = searchParams.get("csSession") || "";
      const ctGroup = searchParams.get("ctGroup") || "";
      const ctUid = searchParams.get("ctUid") || "";

      const res = await fetch(
        `${BASE_URL}/assem/search/simple/LoadingList.json?searchCsSession=${csSession}&searchCtGroup=${ctGroup}&searchCtUid=${ctUid}`,
        { headers: HEADERS }
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "types") {
      const csDaesoo = searchParams.get("csDaesoo") || "12";

      const res = await fetch(
        `${BASE_URL}/assem/search/simple/LoadingType.json?searchCsDaesoo=${csDaesoo}`,
        { headers: HEADERS }
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "action 파라미터가 필요합니다 (sessions, documents, types)" }, { status: 400 });
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Fetch meetings error:", err);
    return NextResponse.json({ error: "회의 목록을 가져오는 중 오류가 발생했습니다: " + err.message }, { status: 500 });
  }
}
