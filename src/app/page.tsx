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
  "사주에 미친 젠이 사주 분석 중 👑",
  "천간지지 맞춰보는 중 🔮",
  "쓴소리 준비하는 중 💅",
  "오행 에너지 계산 중 ✨",
  "개운법 큐레이션 뽑는 중 🌿",
];

const GUNG_LOADING_MSGS = [
  "두 사람 기운 맞춰보는 중 💕",
  "궁합 에너지 분석 중 🔮",
  "케미 점수 계산하는 중 🔥",
  "솔직하게 말해줄 준비 중 👑",
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
  {key:"젠의 최종 조언", emoji:"👑", label:"언니의 한마디"},
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

// 개운법처럼 긴 텍스트도 잘리지 않게 정규식 수정
function parseResult(txt: string, secs: typeof SAJU_SECS): Section[] {
  if (!txt) return [];
  return secs.map(({key, emoji, label}) => {
    const rx = new RegExp(`\\[${key}\\]\\s*후킹:\\s*([^\\n]+)\\n([\\s\\S]*?)(?=\\n\\[|$)`, "i");
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
          <input className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
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
      const txt = await callAI(`너는 직진 스타일의 사주 언니야. 쿨하고 믿음직하게, 돌려말하지 않고 반말로 솔직하게 말해줘.
[의뢰인] 생년:${sYear}년 생월:${sMonth}월${sIsLeap ? " (윤달)" : ""} 생일:${sDay}일 생시:${sHour === "모름" ? "시간 모름" : sHour} 성별:${sGender}

아래 6항목을 정확히 이 형식으로 써줘. 후킹은 15자 이내. 이모지 적극 활용.

[성격과 기질]
후킹: (임팩트 있는 한줄)
(3문장 풀이)

[연애와 인간관계]
후킹: (임팩트 있는 한줄)
(3문장 풀이)

[직업과 돈복]
후킹: (임팩트 있는 한줄)
(3문장 풀이)

[이번 달 운세]
후킹: (${sTargetMonth}월 한줄 요약)
(운세 풀이)

[2025년 운세]
후킹: (2025년 한줄 요약)
(운세 풀이)

[개운법 큐레이션]
후킹: (행운을 부르는 한줄)
명리학을 현대 라이프스타일로 재해석해서 아래 5가지를 반드시 각각 1~2줄씩 구체적으로 써줘. 중간에 끊지 말고 끝까지 작성해.
💰 재물운 자산 습관:
✨ 관상 뷰티 케어:
💊 영양/건강 솔루션:
📱 인생 알고리즘 정돈:
🌀 운명을 비트는 행동:

모든 섹션을 빠짐없이 작성해줘.`);
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
      const txt = await callAI(`너는 직진 스타일의 사주 언니야. 쿨하고 솔직하게 반말로 말해줘.
[나] 생년:${g1Year}년 생월:${g1Month}월 생일:${g1Day}일 성별:${g1Gender}
[상대] 생년:${g2Year}년 생월:${g2Month}월 생일:${g2Day}일 성별:${g2Gender}

먼저 JSON으로 점수 줘:
\`\`\`json
{"total":75,"title":"폭발적 케미 🔥","sub":"불꽃 튀는 관계","cats":[{"label":"첫끌림","score":88},{"label":"연애케미","score":82},{"label":"갈등관리","score":60},{"label":"미래안정","score":70}]}
\`\`\`

그 다음 6항목 형식 맞춰줘.

[첫인상과 끌림]
후킹: (한줄)
(풀이)

[연애 케미]
후킹: (한줄)
(풀이)

[싸울 때 패턴]
후킹: (한줄)
(풀이)

[장기적 미래]
후킹: (한줄)
(풀이)

[언니의 최종 조언]
후킹: (한줄)
(풀이)

[궁합 개운법]
후킹: (한줄)
함께하면 좋은 것들을 아래 카테고리별로 끝까지 써줘.
📍 시너지 장소:
🎨 행운 컬러:
🍽️ 기운 음식:
🏃 추천 활동:
🌀 관계 업그레이드 행동:`);
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
            NO FILTER · NO SUGARCOAT
          </Badge>
          <h1 className="leading-none tracking-tight mb-3" style={{fontFamily:"Bebas Neue", fontSize:56}}>
            <span className="text-white">진짜 사주</span><br/>
            <span className="text-rose-500">돌려말하기</span><br/>
            <span className="text-white">없음</span>
          </h1>
        </div>

        {tab==="saju" && (
          <div className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="px-5 pt-5 pb-5 space-y-4">
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
                <button onClick={goSaju} disabled={sLoading}
                  className="w-full h-12 bg-rose-500 hover:bg-rose-600 disabled:opacity-70 text-white font-black text-sm tracking-wide rounded-xl transition-all flex items-center justify-center gap-2">
                  {sLoading ? <span>{sLoadingMsg.msg}{sLoadingMsg.dots}</span> : "👑 진짜 사주 보러가기"}
                </button>
                {sErr && <p className="text-xs text-red-400 text-center">{sErr}</p>}
              </CardContent>
            </Card>

            {sPillars.length>0 && (
              <div className="grid grid-cols-4 gap-2">
                {sPillars.map(p=>(
                  <div key={p.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-zinc-600 mb-1">{p.name}</p>
                    <p className="text-2xl font-black text-rose-500" style={{fontFamily:"Bebas Neue"}}>{p.stem}</p>
                    <p className="text-2xl font-black text-white" style={{fontFamily:"Bebas Neue"}}>{p.branch}</p>
                  </div>
                ))}
              </div>
            )}

            {sLoading && <LoadingScreen msgs={SAJU_LOADING_MSGS}/>}
            {sResult.map(s=><ResultSection key={s.label} s={s}/>)}
          </div>
        )}

        {tab==="gung" && (
          <div className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800 px-5 pt-5 pb-5">
              <p className="text-xs font-black text-rose-400 mb-4 uppercase">나</p>
              <BirthForm year={g1Year} setYear={setG1Year} month={g1Month} setMonth={setG1Month} day={g1Day} setDay={setG1Day} hour={g1Hour} setHour={setG1Hour} isLeap={g1IsLeap} setIsLeap={setG1IsLeap} gender={g1Gender} setGender={setG1Gender}/>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800 px-5 pt-5 pb-5">
              <p className="text-xs font-black text-rose-400 mb-4 uppercase">상대방</p>
              <BirthForm year={g2Year} setYear={setG2Year} month={g2Month} setMonth={setG2Month} day={g2Day} setDay={setG2Day} hour={g2Hour} setHour={setG2Hour} isLeap={g2IsLeap} setIsLeap={setG2IsLeap} gender={g2Gender} setGender={setG2Gender}/>
            </Card>
            <button onClick={goGung} disabled={gLoading}
              className="w-full h-12 bg-rose-500 hover:bg-rose-600 disabled:opacity-70 text-white font-black text-sm tracking-wide rounded-xl transition-all">
              {gLoading ? <span>{gLoadingMsg.msg}{gLoadingMsg.dots}</span> : "💕 우리 궁합 진짜로 보기"}
            </button>
            {gScore && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                <p className="text-7xl font-black text-rose-500 mb-2" style={{fontFamily:"Bebas Neue"}}>{gScore.total}</p>
                <p className="font-bold mb-1">{gScore.title}</p>
                <p className="text-xs text-zinc-500 mb-6">{gScore.sub}</p>
                <div className="grid grid-cols-2 gap-3">
                  {gScore.cats.map((c,i)=>(
                    <div key={i} className="bg-zinc-800 p-3 rounded-lg text-left">
                      <p className="text-[10px] text-zinc-500 font-bold mb-1">{c.label}</p>
                      <div className="h-1 bg-zinc-700 rounded-full overflow-hidden mb-1">
                        <div className="h-full" style={{width:`${c.score}%`, backgroundColor:barColors[i%4]}}/>
                      </div>
                      <p className="text-xs font-bold">{c.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {gLoading && <LoadingScreen msgs={GUNG_LOADING_MSGS}/>}
            {gResult.map(s=><ResultSection key={s.label} s={s}/>)}
          </div>
        )}
      </div>
    </div>
  );
}