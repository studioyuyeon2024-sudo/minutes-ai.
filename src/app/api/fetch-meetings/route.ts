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
      return NextResponse.json(await res.json());
    }

    if (action === "documents") {
      const csSession = searchParams.get("csSession") || "";
      const ctGroup = searchParams.get("ctGroup") || "";
      const ctUid = searchParams.get("ctUid") || "";
      const res = await fetch(
        `${BASE_URL}/assem/search/simple/LoadingList.json?searchCsSession=${csSession}&searchCtGroup=${ctGroup}&searchCtUid=${ctUid}`,
        { headers: HEADERS }
      );
      return NextResponse.json(await res.json());
    }

    if (action === "types") {
      const csDaesoo = searchParams.get("csDaesoo") || "12";
      const res = await fetch(
        `${BASE_URL}/assem/search/simple/LoadingType.json?searchCsDaesoo=${csDaesoo}`,
        { headers: HEADERS }
      );
      return NextResponse.json(await res.json());
    }

    if (action === "members") {
      const csDaesoo = searchParams.get("csDaesoo") || "12";
      const res = await fetch(
        `${BASE_URL}/assem/search/member/LoadingMember.json?searchCsDaesoo=${csDaesoo}&searchCiType=`,
        { headers: HEADERS }
      );
      return NextResponse.json(await res.json());
    }

    return NextResponse.json({ error: "유효하지 않은 action입니다." }, { status: 400 });
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Fetch meetings error:", err);
    return NextResponse.json({ error: "데이터를 가져오는 중 오류가 발생했습니다: " + err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "member-speeches") {
      const { cmUid, csDaesoo, ctGroup, searchWord, pageIndex } = body;
      const params = new URLSearchParams({
        cmUid: cmUid || "",
        csDaesoo: csDaesoo || "12",
        ctGroup: ctGroup || "",
        searchType: "",
        searchWord: searchWord || "",
        pageIndex: pageIndex || "1",
        recordCountPerPage: "10",
      });
      const res = await fetch(`${BASE_URL}/assem/search/simple/LoadingResult.json`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      return NextResponse.json(await res.json());
    }

    if (action === "keyword-search") {
      const { searchWord, ctType, sDaesoo, eDaesoo, sSession, eSession } = body;
      const params = new URLSearchParams({
        searchWord: searchWord || "",
        ctType: ctType || "A",
        sDaesoo: sDaesoo || "12",
        eDaesoo: eDaesoo || "12",
        sSession: sSession || "392",
        eSession: eSession || "425",
        sDaesooYear: "2022",
        eDaesooYear: "2026",
      });
      const res = await fetch(`${BASE_URL}/assem/search/detail/LoadingResult.json`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      return NextResponse.json(await res.json());
    }

    return NextResponse.json({ error: "유효하지 않은 action입니다." }, { status: 400 });
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Fetch meetings POST error:", err);
    return NextResponse.json({ error: "데이터를 가져오는 중 오류가 발생했습니다: " + err.message }, { status: 500 });
  }
}
