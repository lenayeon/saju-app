"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const HOUR_MAP: Record<string, number> = {자시:0,축시:1,인시:2,묘시:3,진시:4,사시:5,오시:6,미시:7,신시:8,유시:9,술시:10,해시:11};
const HOURS = [
  {value:"모름", label:"모름 (시주 제외)"},
  {value:"자시", label:"자시 (23:00~01:00)"},
  {value:"축시", label:"축시 (01:00~03:00)"},
  {value:"인시", label:"인시 (03:00~05:00)"},
  {value:"묘시", label:"묘시 (05:00~07:00)"},
  {value:"진시", label:"진시 (07:00~09:00)"},
  {value:"사시", label:"사시 (09:00~11:00)"},
  {value:"오시", label:"오시 (11:00~13:00)"},
  {value:"미시", label:"미시 (13:00~15:00)"},
  {value:"신시", label:"신시 (15:00~17:00)"},
  {value:"유시", label:"유시 (17:00~19:00)"},
  {value:"술시", label:"술시 (19:00~21:00)"},
  {value:"해시", label:"해시 (21:00~23:00)"},
];

const SAJU_LOADING_MSGS = [
  "젠이 좋아하는 사주언니가 분석 중 👑",
  "천간지지 맞춰보는 중 🔮",
  "쓴소리 준비하는 중 💅",
  "오행 에너지 계산 중 ✨",
  "거의 다 됐어, 잠깐만 ⏳",
  "열심히 보고 있어 👀",
  "돌려말하기 없이 정리하는 중 🔥",
  "개운법 큐레이션 뽑는 중 🌿",
];

const GUNG_LOADING_MSGS = [
  "두 사람 기운 맞춰보는 중 💕",
  "궁합 에너지 분석 중 🔮",
  "케미 점수 계산하는 중 🔥",
  "솔직하게 말해줄 준비 중 👑",
  "거의 다 됐어, 잠깐만 ⏳",
  "두 사람 미래 그려보는 중 🌟",
  "궁합 개운법 뽑는 중 🌿",
];

const SAJU_SECS = [
  {key:"성격과 기질", emoji:"💁", label:"성격 & 기질"},
  {key:"연애와 인간관계", emoji:"💕", label:"연애 & 관계"},
  {key:"직업과 돈복", emoji:"💰", label:"직업 & 돈복"},
  {key:"이번 달 운세", emoji:"📅", label:"이번 달 운세"},
  {key:"2026년 운세", emoji:"🌟", label:"2026 운세"},
  {key:"개운법 큐레이션", emoji:"✨", label:"개운법 큐레이션"},
];

const GUNG_SECS = [
  {key:"첫인상과 끌림", emoji:"👀", label:"첫인상 & 끌림"},
  {key:"연애 케미", emoji:"🔥", label:"연애 케미"},
  {key:"싸울 때 패턴", emoji:"⚡", label:"갈등 패턴"},
  {key:"장기적 미래", emoji:"🔮", label:"장기적 미래"},
  {key:"언니의 최종 조언", emoji:"👑", label:"언니의 한마디"},
  {key:"궁합 개운법", emoji:"✨", label:"궁합 개운법"},
];

const MONTHS_KR = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const now = new Date();
const currentMonth = now.getMonth() + 1;

type Section = {emoji:string; label:string; hook:string; content:string};
type ScoreData = {total:number; title:string; sub:string; cats:{label:string; score:number}[]};

function getPillar(y: number, m: number, d: number, h: string) {
  const pillars = [
    { name:"년주", stem:STEMS[(y-4)%10], branch:BRANCHES[(y-4)%12] },
    { name:"월주", stem:STEMS[((y-4)%10*12+(m-1)*2)%10], branch:BRANCHES[(m+1)%12] },
    { name:"일주", stem:STEMS[Math.abs(y*12+m*30+d)%10], branch:BRANCHES[Math.abs(y*12+m*30+d)%12] },
  ];
  if (h !== "모름") {
    pillars.push({ name:"시주", stem:STEMS[((HOUR_MAP[h]||0)*2)%10], branch:BRANCHES[(HOUR_MAP[h]||0)%12] });
  }
  return pillars;
}

function parseResult(txt: string, secs: typeof SAJU_SECS): Section[] {
  if (!txt) return [];
  return secs.map(({key, emoji, label}) => {
    const rx = new RegExp(`\\[${key}\\]\\s*후킹:([^\\n]+)\\n([\\s\\S]*?)(?=\\[|$)`);
    const m = txt.match(rx);
    const hook = m ? m[1].trim() : "";
    const content = m ? m[2].trim() : "";
    if (!content) return null;
    return { emoji, label, hook, content };
  }).filter((x): x is Section => x !== null);
}

function useLoadingMsg(msgs: string[], active: boolean) {
  const [idx, setIdx] = useState(0);
  const [dots, setDots] = useState("");
  useEffect(() => {
    if (!active) { setIdx(0); setDots(""); return; }
    const t1 = setInterval(() => setIdx(i => (i+1) % msgs.length), 2000);
    const t2 = setInterval(() => setDots(d => d.length >= 3 ? "" : d+"."), 400);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [active, msgs]);
  return { msg: msgs[idx], dots, idx };
}

function LoadingScreen({msgs}: {msgs: string[]}) {
  const [idx, setIdx] = useState(0);
  const [dots, setDots] = useState("");
  useEffect(() => {
    const t1 = setInterval(() => setIdx(i => (i+1) % msgs.length), 2000);
    const t2 = setInterval(() => setDots(d => d.length >= 3 ? "" : d+"."), 400);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [msgs]);
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-rose-500/20"/>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-500 animate-spin"/>
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-rose-300 animate-spin" style={{animationDuration:"1.5s",animationDirection:"reverse"}}/>
        <div className="absolute inset-0 flex items-center justify-center text-xl">👑</div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-sm font-bold text-rose-400 min-h-[20px]">{msgs[idx]}{dots}</p>
        <p className="text-xs text-zinc-500">보통 20~30초 걸려요</p>
      </div>
      <div className="flex gap-1">
        {msgs.map((_,i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i===idx ? "bg-rose-500 scale-125" : "bg-zinc-700"}`}/>
        ))}
      </div>
    </div>
  );
}

function GenderToggle({value, onChange}: {value:string, onChange:(v:string)=>void}) {
  return (
    <div className="flex bg-zinc-900 rounded-lg border border-zinc-800 p-1 h-11">
      {["여자 👸","남자 🤴"].map(g => {
        const v = g.startsWith("여") ? "여자" : "남자";
        return (
          <button key={g} onClick={()=>onChange(v)}
            className={`flex-1 rounded-md text-sm font-bold transition-all ${value===v ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
            {g}
          </button>
        );
      })}
    </div>
  );
}

function ResultSection({s}: {s:Section}) {
  const isGaeun = s.label === "개운법 큐레이션" || s.label === "궁합 개운법";
  return (
    <div className={`rounded-xl border p-4 mb-3 ${isGaeun ? "bg-rose-500/5 border-rose-500/30 border-l-2 border-l-rose-400" : "bg-zinc-900 border-zinc-800 border-l-2 border-l-rose-500"}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{s.emoji}</span>
        <span className="text-xs font-black tracking-widest text-rose-400 uppercase">{s.label}</span>
        {isGaeun && <span className="ml-auto text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">운명 보완 큐레이션</span>}
      </div>
      {s.hook && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 mb-3">
          <p className="text-sm font-black text-rose-300">💬 {s.hook}</p>
        </div>
      )}
      <p className="text-sm leading-loose text-zinc-300 break-keep whitespace-pre-line">{s.content}</p>
    </div>
  );
}

function BirthForm({
  year, setYear, month, setMonth, day, setDay,
  hour, setHour, isLeap, setIsLeap, gender, setGender,
  targetMonth, setTargetMonth, showMonth
}: {
  year:string, setYear:(v:string)=>void,
  month:string, setMonth:(v:string)=>void,
  day:string, setDay:(v:string)=>void,
  hour:string, setHour:(v:string)=>void,
  isLeap:boolean, setIsLeap:(v:boolean)=>void,
  gender:string, setGender:(v:string)=>void,
  targetMonth?:string, setTargetMonth?:(v:string)=>void,
  showMonth?:boolean
}) {
  const months = Array.from({length:12},(_,i)=>i+1);
  const getDays = (m:string, y:string) => {
    const max = m && y ? new Date(+y,+m,0).getDate() : 31;
    return Array.from({length:max},(_,i)=>i+1);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className="text-xs text-zinc-400 font-bold tracking-wide mb-1.5 block">연도</label>
          <input className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 transition-colors"
            type="number" placeholder="1995" value={year} onChange={e=>setYear(e.target.value)}/>
        </div>
        <div>
          <label className="text-xs text-zinc-400 font-bold tracking-wide mb-1.5 block">월</label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-11 bg-zinc-900 border-zinc-700 text-sm"><SelectValue placeholder="월"/></SelectTrigger>
            <SelectContent>{months.map(m=><SelectItem key={m} value={String(m)}>{m}월</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-zinc-400 font-bold tracking-wide mb-1.5 block">일</label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger className="h-11 bg-zinc-900 border-zinc-700 text-sm"><SelectValue placeholder="일"/></SelectTrigger>
            <SelectContent>{getDays(month,year).map(d=><SelectItem key={d} value={String(d)}>{d}일</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={()=>setIsLeap(!isLeap)}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${isLeap ? "bg-rose-500 border-rose-500" : "border-zinc-600"}`}>
          {isLeap && <span className="text-white text-xs">✓</span>}
        </button>
        <span className="text-xs text-zinc-400 font-medium">윤달 출생</span>
        <span className="text-xs text-zinc-600">(음력 윤달에 태어났으면 체크)</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-400 font-bold tracking-wide mb-1.5 block">태어난 시간</label>
          <Select value={hour} onValueChange={setHour}>
            <SelectTrigger className="h-11 bg-zinc-900 border-zinc-700 text-sm"><SelectValue placeholder="시간 선택"/></SelectTrigger>
            <SelectContent>{HOURS.map(h=><SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-zinc-400 font-bold tracking-wide mb-1.5 block">성별</label>
          <GenderToggle value={gender} onChange={setGender}/>
        </div>
      </div>

      {showMonth && setTargetMonth && (
        <div>
          <label className="text-xs text-zinc-400 font-bold tracking-wide mb-1.5 block">몇 월 운세 볼래?</label>
          <Select value={targetMonth} onValueChange={setTargetMonth}>
            <SelectTrigger className="h-11 bg-zinc-900 border-zinc-700 text-sm"><SelectValue/></SelectTrigger>
            <SelectContent>
              {MONTHS_KR.map((m,i)=>(
                <SelectItem key={i} value={String(i+1)}>{m}{i+1===currentMonth ? " (이번 달)" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"saju"|"gung">("saju");

  const [sYear, setSYear] = useState("");
  const [sMonth, setSMonth] = useState("");
  const [sDay, setSDay] = useState("");
  const [sHour, setSHour] = useState("");
  const [sIsLeap, setSIsLeap] = useState(false);
  const [sGender, setSGender] = useState("여자");
  const [sTargetMonth, setSTargetMonth] = useState(String(currentMonth));
  const [sLoading, setSLoading] = useState(false);
  const [sResult, setSResult] = useState<Section[]>([]);
  const [sPillars, setSPillars] = useState<{name:string;stem:string;branch:string}[]>([]);
  const [sErr, setSErr] = useState("");

  const [g1Year, setG1Year] = useState("");
  const [g1Month, setG1Month] = useState("");
  const [g1Day, setG1Day] = useState("");
  const [g1Hour, setG1Hour] = useState("");
  const [g1IsLeap, setG1IsLeap] = useState(false);
  const [g1Gender, setG1Gender] = useState("여자");
  const [g2Year, setG2Year] = useState("");
  const [g2Month, setG2Month] = useState("");
  const [g2Day, setG2Day] = useState("");
  const [g2Hour, setG2Hour] = useState("");
  const [g2IsLeap, setG2IsLeap] = useState(false);
  const [g2Gender, setG2Gender] = useState("남자");
  const [gLoading, setGLoading] = useState(false);
  const [gResult, setGResult] = useState<Section[]>([]);
  const [gScore, setGScore] = useState<ScoreData|null>(null);
  const [gErr, setGErr] = useState("");

  const sLoadingMsg = useLoadingMsg(SAJU_LOADING_MSGS, sLoading);
  const gLoadingMsg = useLoadingMsg(GUNG_LOADING_MSGS, gLoading);

  async function callAI(prompt: string): Promise<string> {
    const res = await fetch("/api/saju", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({prompt}),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return (data.text ?? "") as string;
  }

  async function goSaju() {
    if (!sYear||!sMonth||!sDay||!sHour) { setSErr("🙅 빈칸 있어, 다 채워줘!"); return; }
    setSErr(""); setSPillars(getPillar(+sYear,+sMonth,+sDay,sHour));
    setSLoading(true); setSResult([]);
    try {
      const leapNote = sIsLeap ? " (윤달 출생)" : "";
      const hourNote = sHour === "모름" ? "시간 모름 (시주 제외)" : sHour;
      const txt = await callAI(`너는 직진 스타일의 사주 언니야. 쿨하고 믿음직하게, 돌려말하지 않고 반말로 솔직하게 말해줘.
[의뢰인] 생년:${sYear}년 생월:${sMonth}월${leapNote} 생일:${sDay}일 생시:${hourNote} 성별:${sGender}

아래 6항목을 정확히 이 형식으로 써줘. 후킹은 15자 이내 임팩트 있는 한 줄 요약. 이모지 2~3개, 한자 금지.

[성격과 기질]
후킹: (임팩트 있는 한줄)
(3~4문장 풀이)

[연애와 인간관계]
후킹: (임팩트 있는 한줄)
(3~4문장 풀이)

[직업과 돈복]
후킹: (임팩트 있는 한줄)
(3~4문장 풀이)

[이번 달 운세]
후킹: (${sTargetMonth}월 임팩트 있는 한줄)
(${sTargetMonth}월 운세 3~4문장 풀이)

[2025년 운세]
후킹: (임팩트 있는 한줄)
(3~4문장 풀이)

[개운법 큐레이션]
후킹: (임팩트 있는 한줄)
너는 전통 명리학을 현대적인 라이프스타일로 재해석하는 개운법 컨설턴트야. 이 사람의 사주에서 부족한 오행을 보완하는 방향으로 아래 5가지 카테고리를 각각 1~2줄씩 반말로 써줘. 뻔한 표현 금지. 구체적인 브랜드나 장소 언급해서 현실감 높여줘. 너무 길면 줄여도돼. 5개 카테고리가 모두 짤리지만않게 조절해줘.

💰 재물운을 깨우는 자산 습관: (계좌 정리, 구독 해지, 지갑 컬러 등 금융 액션)
✨ 관상을 바꾸는 뷰티 케어: (에스테틱, 각질 제거, 립 컬러, 인상 밝히는 습관 등)
💊 운의 엔진을 돌리는 영양/건강: (오행에 맞는 영양제, 음식, 스트레칭 부위 등)
📱 인생 알고리즘 개선 (디지털/환경): (스마트폰 정리, SNS 정돈, 배경화면, 작업공간 배치 등)
🌀 운명을 비트는 의외의 행동: (평소 안 가던 장소, 안 마시던 음료, 왼손으로 행동하기 등)

항목 사이 빈 줄 넣어줘.`);
      setSResult(parseResult(txt, SAJU_SECS));
    } catch(e) {
      setSErr("❌ 오류났어: " + (e instanceof Error ? e.message : String(e)));
    }
    setSLoading(false);
  }

  async function goGung() {
    if (!g1Year||!g1Month||!g1Day||!g2Year||!g2Month||!g2Day) { setGErr("🙅 빈칸 있어, 다 채워줘!"); return; }
    setGErr(""); setGLoading(true); setGResult([]); setGScore(null);
    try {
      const txt = await callAI(`너는 직진 스타일의 사주 언니야. 쿨하고 믿음직하게 반말로 솔직하게 말해줘.
[나] 생년:${g1Year}년 생월:${g1Month}월${g1IsLeap?" (윤달)":""} 생일:${g1Day}일 생시:${g1Hour||"모름"} 성별:${g1Gender}
[상대] 생년:${g2Year}년 생월:${g2Month}월${g2IsLeap?" (윤달)":""} 생일:${g2Day}일 생시:${g2Hour||"모름"} 성별:${g2Gender}

먼저 JSON 블록으로 점수 줘:
\`\`\`json
{"total":75,"title":"폭발적 케미 🔥","sub":"끌리는 건 맞는데 불꽃 튀어","cats":[{"label":"첫끌림","score":88},{"label":"연애케미","score":82},{"label":"갈등관리","score":60},{"label":"미래안정","score":70}]}
\`\`\`

그 다음 6항목을 정확히 이 형식으로 써줘. 후킹은 15자 이내. 이모지 2~3개, 한자 금지.

[첫인상과 끌림]
후킹: (임팩트 있는 한줄)
(3~4문장 풀이)

[연애 케미]
후킹: (임팩트 있는 한줄)
(3~4문장 풀이)

[싸울 때 패턴]
후킹: (임팩트 있는 한줄)
(3~4문장 풀이)

[장기적 미래]
후킹: (임팩트 있는 한줄)
(3~4문장 풀이)

[언니의 최종 조언]
후킹: (임팩트 있는 한줄)
(3~4문장 풀이)

[궁합 개운법]
후킹: (임팩트 있는 한줄)
두 사람의 부족한 오행을 함께 채워주는 개운법을 아래 카테고리별로 각 1~2줄씩 반말로 써줘. 구체적인 장소나 브랜드 언급해서 현실감 높여줘.

📍 함께 가면 시너지 나는 장소: (매우 구체적으로)
🎨 두 사람 공통 행운 컬러와 활용법:
🍽️ 같이 먹으면 기운 올라가는 음식:
🏃 함께하면 좋은 운동이나 활동:
🌀 두 사람 관계를 업그레이드하는 의외의 행동:

항목 사이 빈 줄 넣어줘.`);
      const jm = txt.match(/```json([\s\S]*?)```/);
      if (jm) { try { setGScore(JSON.parse(jm[1].trim())); } catch(e) {} }
      setGResult(parseResult(txt, GUNG_SECS));
    } catch(e) {
      setGErr("❌ 오류났어: " + (e instanceof Error ? e.message : String(e)));
    }
    setGLoading(false);
  }

  const barColors = ["#FF0066","#FF6B9D","#4ECDC4","#FFD700"];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@400;700;900&family=Montserrat:wght@900&display=swap" rel="stylesheet"/>

      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-lg mx-auto">
          <Tabs value={tab} onValueChange={v=>setTab(v as "saju"|"gung")}>
            <TabsList className="w-full bg-transparent h-12 rounded-none border-0 p-0">
              <TabsTrigger value="saju" className="flex-1 h-12 rounded-none border-b-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-400 data-[state=inactive]:border-transparent text-zinc-500 font-bold text-sm">
                🔮 내 사주
              </TabsTrigger>
              <TabsTrigger value="gung" className="flex-1 h-12 rounded-none border-b-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-400 data-[state=inactive]:border-transparent text-zinc-500 font-bold text-sm">
                💕 궁합운
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-16">
        <div className="text-center pt-8 pb-6">
          <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs tracking-widest mb-4 font-mono">
          TRUTH OVER COMFORT
          </Badge>
          <h1 className="leading-none tracking-tight mb-3" style={{fontFamily:"Bebas Neue", fontSize:56}}>
            <span className="text-white">진짜 사주</span><br/>
            <span className="text-rose-500">돌려말하기</span><br/>
            <span className="text-white">없음</span>
          </h1>
          <p className="text-xs text-zinc-500 leading-relaxed">
            쓴소리도 OK · 너를 바꿔줄 핵심만 말해줌<br/>
            <span className="text-zinc-400 font-bold">젠도 믿고 맡기는 사주 언니</span>
          </p>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-rose-500 to-transparent mb-6"/>

        {/* ── 내 사주 탭 ── */}
        {tab==="saju" && (
          <div className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2 pt-5 px-5">
                <p className="text-xs font-black tracking-widest text-rose-400 uppercase" style={{fontFamily:"Montserrat"}}>내 정보 입력</p>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                <BirthForm
                  year={sYear} setYear={setSYear}
                  month={sMonth} setMonth={setSMonth}
                  day={sDay} setDay={setSDay}
                  hour={sHour} setHour={setSHour}
                  isLeap={sIsLeap} setIsLeap={setSIsLeap}
                  gender={sGender} setGender={setSGender}
                  targetMonth={sTargetMonth} setTargetMonth={setSTargetMonth}
                  showMonth={true}
                />
                <button
                  onClick={goSaju}
                  disabled={sLoading}
                  className="w-full h-12 bg-rose-500 hover:bg-rose-600 disabled:opacity-70 text-white font-black text-sm tracking-wide rounded-xl transition-all flex items-center justify-center gap-2"
                  style={{fontFamily:"Montserrat"}}>
                  {sLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      <span className="transition-all">{sLoadingMsg.msg}{sLoadingMsg.dots}</span>
                    </>
                  ) : "사주 확인하기"}
                </button>
                {sErr && <p className="text-xs text-red-400 text-center">{sErr}</p>}
              </CardContent>
            </Card>

            {sPillars.length>0 && (
              <div>
                <p className="text-xs font-bold tracking-widest text-zinc-600 mb-2 uppercase" style={{fontFamily:"Montserrat"}}>✦ 사주 팔자</p>
                <div className="grid grid-cols-4 gap-2">
                  {sPillars.map(p=>(
                    <div key={p.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-zinc-600 mb-1 tracking-wide">{p.name}</p>
                      <p className="text-2xl font-black text-rose-500" style={{fontFamily:"Bebas Neue"}}>{p.stem}</p>
                      <p className="text-2xl font-black text-white" style={{fontFamily:"Bebas Neue"}}>{p.branch}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sLoading && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-0"><LoadingScreen msgs={SAJU_LOADING_MSGS}/></CardContent>
              </Card>
            )}

            {sResult.length>0 && (
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <div className="bg-rose-500 px-5 py-4 flex items-center gap-3">
                  <span className="text-2xl">👑</span>
                  <div>
                    <p className="font-black text-white text-sm" style={{fontFamily:"Montserrat"}}>언니의 찐 사주 풀이</p>
                    <p className="text-xs text-rose-100 opacity-85">쓴소리도 다 해줄게, 믿어</p>
                  </div>
                </div>
                <CardContent className="p-4">
                  {sResult.map(s=><ResultSection key={s.label} s={s}/>)}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── 궁합 탭 ── */}
        {tab==="gung" && (
          <div className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2 pt-5 px-5">
                <p className="text-xs font-black tracking-widest text-rose-400 uppercase" style={{fontFamily:"Montserrat"}}>나</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <BirthForm
                  year={g1Year} setYear={setG1Year}
                  month={g1Month} setMonth={setG1Month}
                  day={g1Day} setDay={setG1Day}
                  hour={g1Hour} setHour={setG1Hour}
                  isLeap={g1IsLeap} setIsLeap={setG1IsLeap}
                  gender={g1Gender} setGender={setG1Gender}
                />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2 pt-5 px-5">
                <p className="text-xs font-black tracking-widest text-rose-400 uppercase" style={{fontFamily:"Montserrat"}}>상대방</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <BirthForm
                  year={g2Year} setYear={setG2Year}
                  month={g2Month} setMonth={setG2Month}
                  day={g2Day} setDay={setG2Day}
                  hour={g2Hour} setHour={setG2Hour}
                  isLeap={g2IsLeap} setIsLeap={setG2IsLeap}
                  gender={g2Gender} setGender={setG2Gender}
                />
              </CardContent>
            </Card>

            <button
              onClick={goGung}
              disabled={gLoading}
              className="w-full h-12 bg-rose-500 hover:bg-rose-600 disabled:opacity-70 text-white font-black text-sm tracking-wide rounded-xl transition-all flex items-center justify-center gap-2"
              style={{fontFamily:"Montserrat"}}>
              {gLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  <span>{gLoadingMsg.msg}{gLoadingMsg.dots}</span>
                </>
              ) : "💕 우리 궁합 진짜로 보기"}
            </button>
            {gErr && <p className="text-xs text-red-400 text-center mt-2">{gErr}</p>}

            {gLoading && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-0"><LoadingScreen msgs={GUNG_LOADING_MSGS}/></CardContent>
              </Card>
            )}

            {gScore && (
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <CardContent className="p-5 text-center">
                  <p className="text-7xl font-black text-rose-500 leading-none mb-1" style={{fontFamily:"Bebas Neue"}}>{Math.round(gScore.total)}</p>
                  <p className="text-xs text-zinc-600 mb-3 font-mono">/ 100</p>
                  <p className="font-black text-white text-sm mb-1" style={{fontFamily:"Montserrat"}}>{gScore.title}</p>
                  <p className="text-xs text-zinc-500 mb-5">{gScore.sub}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {gScore.cats.map((c,i)=>(
                      <div key={c.label} className="bg-zinc-800 rounded-lg p-3 text-left">
                        <p className="text-xs text-zinc-500 font-bold tracking-wide mb-2 uppercase" style={{fontFamily:"Montserrat"}}>{c.label}</p>
                        <div className="bg-zinc-900 rounded h-1.5 overflow-hidden mb-1.5">
                          <div className="h-1.5 rounded transition-all duration-1000" style={{width:`${c.score}%`, background:barColors[i%barColors.length]}}/>
                        </div>
                        <p className="text-sm font-black text-white" style={{fontFamily:"Montserrat"}}>{c.score}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {gResult.length>0 && (
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <div className="bg-rose-500 px-5 py-4 flex items-center gap-3">
                  <span className="text-2xl">💕</span>
                  <div>
                    <p className="font-black text-white text-sm" style={{fontFamily:"Montserrat"}}>언니의 궁합 찐 풀이</p>
                    <p className="text-xs text-rose-100 opacity-85">솔직하게, 다 말해줄게</p>
                  </div>
                </div>
                <CardContent className="p-4">
                  {gResult.map(s=><ResultSection key={s.label} s={s}/>)}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <p className="text-center text-xs text-zinc-700 mt-8">재미로 보는 AI 사주 👑 실제 운명을 결정하지 않아요</p>
      </div>
    </div>
  );
}