import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || text.trim().length < 100) {
      return NextResponse.json({ error: "텍스트가 너무 짧습니다." }, { status: 400 });
    }

    // Truncate to ~60k chars to stay within token limits
    const truncated = text.slice(0, 60000);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `당신은 대한민국 지방의회 회의록 분석 전문가입니다.
입력된 회의록 텍스트를 분석하여 반드시 아래 JSON 형식으로만 응답하세요.

{
  "title": "회의 제목 (예: 제12대 제415회 교육위원회 제1차 회의)",
  "date": "회의 일자 (예: 2024-11-15)",
  "committee": "위원회명 (예: 교육위원회)",
  "attendees": ["참석자1", "참석자2"],
  "overall_summary": "전체 회의 내용을 3~5문장으로 요약",
  "agendas": [
    {
      "title": "안건 제목",
      "summary": "안건 내용 요약 (2~3문장)",
      "speakers": [
        {
          "name": "발언자 이름 (직함 포함)",
          "key_points": ["핵심 발언 1", "핵심 발언 2"]
        }
      ],
      "decision": "의결/결정 사항 (없으면 빈 문자열)",
      "follow_up": "후속 조치 사항 (없으면 빈 문자열)"
    }
  ]
}

분석 규칙:
1. 안건별로 분류하고 핵심 논의 내용을 빠짐없이 추출
2. 발언자의 이름과 직함을 정확히 기록
3. 의결 사항과 후속 조치를 명확히 구분
4. 숫자, 예산액, 날짜 등 정량적 정보를 반드시 포함
5. 회의록에 없는 내용을 추측하여 추가하지 않을 것`
        },
        {
          role: "user",
          content: `다음 회의록을 분석해 주세요:\n\n${truncated}`
        }
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });
    }

    const result = JSON.parse(content);
    return NextResponse.json({ result });
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Analyze error:", err);
    if (err.message?.includes("API key")) {
      return NextResponse.json({ error: "OpenAI API 키가 설정되지 않았습니다. 환경변수 OPENAI_API_KEY를 확인하세요." }, { status: 500 });
    }
    return NextResponse.json({ error: "분석 중 오류가 발생했습니다: " + err.message }, { status: 500 });
  }
}
