import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL을 입력해 주세요." }, { status: 400 });
    }

    // Allow jbstatecouncil domain and common council record domains
    const allowed = ["jbstatecouncil.jeonbuk.kr"];
    const parsed = new URL(url);
    if (!allowed.some((d) => parsed.hostname.endsWith(d))) {
      return NextResponse.json(
        { error: "전북특별자치도의회 전자회의록 URL만 지원합니다." },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `페이지를 가져올 수 없습니다 (HTTP ${res.status})` },
        { status: 400 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, navigation
    $("script, style, nav, header, footer, .gnb, .lnb, .snb").remove();

    // Try known selectors for council meeting records
    let text = "";

    // Common selectors for Korean council meeting record systems
    const selectors = [
      ".content_area",
      ".record_content",
      ".minutes_content",
      "#content_body",
      "#divContent",
      ".sub_content",
      ".view_content",
      "#contents",
      ".cont_area",
      "article",
      "main",
      ".content",
    ];

    for (const sel of selectors) {
      const el = $(sel);
      if (el.length && el.text().trim().length > 200) {
        text = el.text().trim();
        break;
      }
    }

    // Fallback: get body text
    if (!text || text.length < 200) {
      text = $("body").text().trim();
    }

    // Clean up whitespace
    text = text
      .replace(/\t/g, " ")
      .replace(/ {3,}/g, "  ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (text.length < 100) {
      return NextResponse.json(
        {
          error:
            "페이지에서 충분한 텍스트를 추출할 수 없습니다. 회의록 상세 페이지 URL인지 확인하세요. JavaScript로 동적 로딩되는 페이지의 경우 텍스트를 직접 복사·붙여넣기 해주세요.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ text, length: text.length });
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Fetch URL error:", err);
    return NextResponse.json(
      { error: "URL을 가져오는 중 오류가 발생했습니다: " + err.message },
      { status: 500 }
    );
  }
}
