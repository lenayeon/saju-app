"use client";
import { useState } from "react";

const STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const HOUR_MAP: Record<string, number> = {자시:0,축시:1,인시:2,묘시:3,진시:4,사시:5,오시:6,미시:7,신시:8,유시:9,술시:10,해시:11};

function getPillar(y: number, m: number, d: number, h: string) {
  return [
    { name:"년주", stem:STEMS[(y-4)%10], branch:BRANCHES[(y-4)%12] },
    { name:"월주", stem:STEMS[((y-4)%10*12+(m-1)*2)%10], branch:BRANCHES[(m+1)%12] },
    { name:"일주", stem:STEMS[Math.abs(y*12+m*30+d)%10], branch:BRANCHES[Math.abs(y*12+m*30+d)%12] },
    { name:"시주", stem:STEMS[((HOUR_MAP[h]||0)*2)%10], branch:BRANCHES[(HOUR_MAP[h]||0)%12] },
  ];
}

const SAJU_SECS = [
  {key:"성격과 기질", emoji:"💁", label:"성격 & 기질"},
  {key:"연애와 인간관계", emoji:"💕", label:"연애 & 관계"},
  {key:"직업과 돈복", emoji:"💰", label:"직업 & 돈복"},
  {key:"이번 달 운세", emoji:"📅", label:"이번 달 운세"},
  {key:"2025년 운세", emoji:"🌟", label:"2025 운세"},
];

const GUNG_SECS = [
  {key:"첫인상과 끌림", emoji:"👀", label:"첫인상 & 끌림"},
  {key:"연애 케미", emoji:"🔥", label:"연애 케미"},
  {key:"싸울 때 패턴", emoji:"⚡", label:"갈등 패턴"},
  {key:"장기적 미래", emoji:"🔮", label:"장기적 미래"},
  {key:"언니의 최종 조언", emoji:"👑", label:"언니의 한마디"},
];

type Section = {emoji:string; label:string; hook:string; content:string};
type ScoreData = {total:number; title:string; sub:string; cats:{label:string; score:number}[]};

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

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const now = new Date();
const currentMonth = now.getMonth() + 1;

export default function Home() {
  const [tab, setTab] = useState<"saju"|"gung">("saju");

  const [sYear, setSYear] = useState("");
  const [sMonth, setSMonth] = useState("");
  const [sDay, setSDay] = useState("");
  const [sHour, setSHour] = useState("");
  const [sGender, setSGender] = useState("여자");
  const [sTargetMonth, setSTargetMonth] = useState(String(currentMonth));
  const [sLoading, setSLoading] = useState(false);
  const [sResult, setSResult] = useState<Section[]>([]);
  const [sPillars, setSPillars] = useState<{name:string;stem:string;branch:string}[]>([]);
  const [sErr, setSErr] = useState(false);
  const [sErrMsg, setSErrMsg] = useState("");

  const [g1Year, setG1Year] = useState("");
  const [g1Month, setG1Month] = useState("");
  const [g1Day, setG1Day] = useState("");
  const [g1Gender, setG1Gender] = useState("여자");
  const [g2Year, setG2Year] = useState("");
  const [g2Month, setG2Month] = useState("");
  const [g2Day, setG2Day] = useState("");
  const [g2Gender, setG2Gender] = useState("남자");
  const [gLoading, setGLoading] = useState(false);
  const [gResult, setGResult] = useState<Section[]>([]);
  const [gScore, setGScore] = useState<ScoreData|null>(null);
  const [gErr, setGErr] = useState(false);
  const [gErrMsg, setGErrMsg] = useState("");

  const months = Array.from({length:12},(_,i)=>i+1);
  const getDays = (m: string, y: string) => {
    const max = m && y ? new Date(+y, +m, 0).getDate() : 31;
    return Array.from({length:max},(_,i)=>i+1);
  };

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
    if (!sYear||!sMonth||!sDay||!sHour) { setSErr(true); setSErrMsg("🙅 빈칸 있어, 다 채워줘!"); return; }
    setSErr(false); setSErrMsg("");
    setSPillars(getPillar(+sYear,+sMonth,+sDay,sHour));
    setSLoading(true); setSResult([]);
    try {
      const txt = await callAI(`너는 직진 스타일의 사주 언니야. 쿨하고 믿음직하게, 돌려말하지 않고 반말로 솔직하게 말해줘.
[의뢰인] 생년:${sYear}년 생월:${sMonth}월 생일:${sDay}일 생시:${sHour} 성별:${sGender}

아래 5항목을 정확히 이 형식으로 써줘. 후킹은 10자 이내 임팩트 있는 한 줄 요약이야. 이모지 2~3개, 한자 금지.

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

항목 사이 빈 줄 넣어줘.`);
      setSResult(parseResult(txt, SAJU_SECS));
    } catch(e) {
      setSErr(true);
      setSErrMsg("❌ 오류났어: " + (e instanceof Error ? e.message : String(e)));
    }
    setSLoading(false);
  }

  async function goGung() {
    if (!g1Year||!g1Month||!g1Day||!g2Year||!g2Month||!g2Day) { setGErr(true); setGErrMsg("🙅 빈칸 있어, 다 채워줘!"); return; }
    setGErr(false); setGErrMsg("");
    setGLoading(true); setGResult([]); setGScore(null);
    try {
      const txt = await callAI(`너는 직진 스타일의 사주 언니야. 쿨하고 믿음직하게 반말로 솔직하게 말해줘.
[나] 생년:${g1Year}년 생월:${g1Month}월 생일:${g1Day}일 성별:${g1Gender}
[상대] 생년:${g2Year}년 생월:${g2Month}월 생일:${g2Day}일 성별:${g2Gender}

먼저 JSON 블록으로 점수 줘:
\`\`\`json
{"total":75,"title":"폭발적 케미 🔥","sub":"끌리는 건 맞는데 불꽃 튀어","cats":[{"label":"첫끌림","score":88},{"label":"연애케미","score":82},{"label":"갈등관리","score":60},{"label":"미래안정","score":70}]}
\`\`\`

그 다음 아래 5항목을 정확히 이 형식으로 써줘. 후킹은 10자 이내 임팩트 있는 한 줄 요약. 이모지 2~3개, 한자 금지.

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

항목 사이 빈 줄 넣어줘.`);

      const jm = txt.match(/```json([\s\S]*?)```/);
      if (jm) { try { setGScore(JSON.parse(jm[1].trim())); } catch(e) {} }
      setGResult(parseResult(txt, GUNG_SECS));
    } catch(e) {
      setGErr(true);
      setGErrMsg("❌ 오류났어: " + (e instanceof Error ? e.message : String(e)));
    }
    setGLoading(false);
  }

  const hot = "#FF0066";
  const card = {background:"#161616", borderRadius:16, padding:20, margin:"0 0 16px", border:"1px solid #2A2A2A", position:"relative" as const, overflow:"hidden" as const};
  const fi = {width:"100%", height:44, background:"#0A0A0A", border:"1px solid #333", borderRadius:10, padding:"0 14px", fontSize:14, color:"#fff", fontFamily:"inherit"};
  const lbl = {fontSize:11, color:"#ccc", fontWeight:700, letterSpacing:.5, marginBottom:4, display:"block" as const};

  function GenderToggle({value, onChange}: {value:string, onChange:(v:string)=>void}) {
    return (
      <div style={{display:"flex", background:"#0A0A0A", borderRadius:10, border:"1px solid #333", padding:3, height:44}}>
        {["여자 👸","남자 🤴"].map(g => {
          const v = g.startsWith("여") ? "여자" : "남자";
          return (
            <button key={g} onClick={()=>onChange(v)} style={{flex:1, border:"none", borderRadius:8, fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer", background: value===v ? hot : "transparent", color: value===v ? "#fff" : "#aaa", transition:"all .2s"}}>
              {g}
            </button>
          );
        })}
      </div>
    );
  }

  function ResultCard({s}: {s: Section}) {
    return (
      <div style={{marginBottom:14, background:"#1E1E1E", borderRadius:12, padding:16, borderLeft:`3px solid ${hot}`}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
          <span style={{fontSize:18}}>{s.emoji}</span>
          <span style={{fontFamily:"Montserrat", fontSize:11, fontWeight:900, letterSpacing:2, color:hot, textTransform:"uppercase"}}>{s.label}</span>
        </div>
        {s.hook && (
          <div style={{background:"#FF006618", border:`1px solid #FF006644`, borderRadius:8, padding:"8px 12px", marginBottom:10}}>
            <p style={{fontSize:13, fontWeight:900, color:"#FF6699", lineHeight:1.5}}>💬 {s.hook}</p>
          </div>
        )}
        <p style={{fontSize:14, lineHeight:2, color:"#ccc", wordBreak:"keep-all"}}>{s.content}</p>
      </div>
    );
  }

  return (
    <div style={{background:"#0A0A0A", minHeight:"100vh", color:"#fff", fontFamily:"'Noto Sans KR', sans-serif", maxWidth:480, margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@400;700;900&family=Montserrat:wght@900&display=swap" rel="stylesheet"/>

      {/* 탭 */}
      <div style={{display:"flex", background:"#111", borderBottom:"1px solid #2A2A2A", position:"sticky", top:0, zIndex:10}}>
        {(["saju","gung"] as const).map((t,i)=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1, padding:"14px 8px", fontSize:13, fontWeight:700, border:"none", background:"transparent", color: tab===t ? hot : "#777", borderBottom: tab===t ? `2px solid ${hot}` : "2px solid transparent", cursor:"pointer", fontFamily:"inherit"}}>
            {["🔮 내 사주","💕 궁합운"][i]}
          </button>
        ))}
      </div>

      {/* 헤더 */}
      <div style={{padding:"28px 20px 0", textAlign:"center"}}>
        <div style={{display:"inline-block", border:`1px solid #333`, borderRadius:4, padding:"3px 12px", fontSize:10, fontWeight:700, letterSpacing:2, color:"#777", marginBottom:16, fontFamily:"Montserrat"}}>
          NO FILTER · NO SUGARCOAT
        </div>
        <div style={{fontFamily:"Bebas Neue", fontSize:52, lineHeight:.92, letterSpacing:1, marginBottom:12}}>
          <div style={{color:"#fff"}}>진짜 사주</div>
          <div style={{color:hot}}>돌려말하기</div>
          <div style={{color:"#fff"}}>없음</div>
        </div>
        <p style={{fontSize:12, color:"#666", lineHeight:1.8, marginBottom:20}}>
          쓴소리도 OK · 장단점 다 말해줌<br/>
          <b style={{color:"#999"}}>믿고 맡기는 AI 사주 언니</b>
        </p>
      </div>
      <div style={{height:1, background:`linear-gradient(90deg,transparent,${hot},transparent)`, margin:"0 20px 24px"}}/>

      {/* ── 내 사주 탭 ── */}
      {tab==="saju" && (
        <div style={{padding:"0 20px"}}>
          <div style={card}>
            <div style={{fontSize:10, fontWeight:700, letterSpacing:3, color:hot, marginBottom:16, fontFamily:"Montserrat"}}>내 정보 입력</div>
            <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10, marginBottom:10}}>
              <div><span style={lbl}>태어난 연도</span><input style={fi} type="number" placeholder="예) 1995" value={sYear} onChange={e=>setSYear(e.target.value)}/></div>
              <div><span style={lbl}>월</span>
                <select style={fi} value={sMonth} onChange={e=>setSMonth(e.target.value)}>
                  <option value="">월</option>
                  {months.map(m=><option key={m} value={m}>{m}월</option>)}
                </select>
              </div>
              <div><span style={lbl}>일</span>
                <select style={fi} value={sDay} onChange={e=>setSDay(e.target.value)}>
                  <option value="">일</option>
                  {getDays(sMonth,sYear).map(d=><option key={d} value={d}>{d}일</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10}}>
              <div><span style={lbl}>태어난 시간</span>
                <select style={fi} value={sHour} onChange={e=>setSHour(e.target.value)}>
                  <option value="">시간 선택</option>
                  {["자시","축시","인시","묘시","진시","사시","오시","미시","신시","유시","술시","해시"].map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div><span style={lbl}>성별</span><GenderToggle value={sGender} onChange={setSGender}/></div>
            </div>
            <div style={{marginBottom:16}}>
              <span style={lbl}>몇 월 운세 볼래?</span>
              <select style={fi} value={sTargetMonth} onChange={e=>setSTargetMonth(e.target.value)}>
                {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}{i+1===currentMonth ? " (이번 달)" : ""}</option>)}
              </select>
            </div>
            <button onClick={goSaju} disabled={sLoading} style={{width:"100%", padding:18, background:hot, border:"none", borderRadius:12, color:"#fff", fontFamily:"Montserrat", fontSize:16, fontWeight:900, cursor:"pointer", opacity:sLoading?0.5:1}}>
              {sLoading ? "언니가 보는 중… 👀" : "👑 진짜 사주 보러가기"}
            </button>
            {sErr && <p style={{fontSize:12, color:"#FF4466", textAlign:"center", marginTop:8}}>{sErrMsg}</p>}
          </div>

          {sPillars.length>0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10, fontWeight:700, letterSpacing:3, color:"#555", marginBottom:10, fontFamily:"Montserrat"}}>✦ 사주 팔자</div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8}}>
                {sPillars.map(p=>(
                  <div key={p.name} style={{background:"#161616", border:"1px solid #2A2A2A", borderRadius:12, padding:"14px 6px", textAlign:"center"}}>
                    <div style={{fontSize:9, color:"#555", marginBottom:6, letterSpacing:1}}>{p.name}</div>
                    <div style={{fontFamily:"Bebas Neue", fontSize:28, color:hot}}>{p.stem}</div>
                    <div style={{fontFamily:"Bebas Neue", fontSize:28, color:"#fff"}}>{p.branch}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sResult.length>0 && (
            <div style={{background:"#161616", border:"1px solid #2A2A2A", borderRadius:14, overflow:"hidden", marginBottom:24}}>
              <div style={{background:hot, padding:"16px 20px", display:"flex", alignItems:"center", gap:12}}>
                <span style={{fontSize:26}}>👑</span>
                <div>
                  <strong style={{display:"block", fontFamily:"Montserrat", fontSize:15}}>언니의 찐 사주 풀이</strong>
                  <span style={{fontSize:11, opacity:.85}}>쓴소리도 다 해줄게, 믿어</span>
                </div>
              </div>
              <div style={{padding:20}}>
                {sResult.map(s=><ResultCard key={s.label} s={s}/>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 궁합 탭 ── */}
      {tab==="gung" && (
        <div style={{padding:"0 20px"}}>
          <div style={card}>
            <div style={{fontSize:10, fontWeight:700, letterSpacing:3, color:hot, marginBottom:16, fontFamily:"Montserrat"}}>나</div>
            <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10, marginBottom:10}}>
              <div><span style={lbl}>태어난 연도</span><input style={fi} type="number" placeholder="예) 1995" value={g1Year} onChange={e=>setG1Year(e.target.value)}/></div>
              <div><span style={lbl}>월</span>
                <select style={fi} value={g1Month} onChange={e=>setG1Month(e.target.value)}>
                  <option value="">월</option>{months.map(m=><option key={m} value={m}>{m}월</option>)}
                </select>
              </div>
              <div><span style={lbl}>일</span>
                <select style={fi} value={g1Day} onChange={e=>setG1Day(e.target.value)}>
                  <option value="">일</option>{getDays(g1Month,g1Year).map(d=><option key={d} value={d}>{d}일</option>)}
                </select>
              </div>
            </div>
            <div><span style={lbl}>성별</span><GenderToggle value={g1Gender} onChange={setG1Gender}/></div>
          </div>

          <div style={card}>
            <div style={{fontSize:10, fontWeight:700, letterSpacing:3, color:hot, marginBottom:16, fontFamily:"Montserrat"}}>상대방</div>
            <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10, marginBottom:10}}>
              <div><span style={lbl}>태어난 연도</span><input style={fi} type="number" placeholder="예) 1993" value={g2Year} onChange={e=>setG2Year(e.target.value)}/></div>
              <div><span style={lbl}>월</span>
                <select style={fi} value={g2Month} onChange={e=>setG2Month(e.target.value)}>
                  <option value="">월</option>{months.map(m=><option key={m} value={m}>{m}월</option>)}
                </select>
              </div>
              <div><span style={lbl}>일</span>
                <select style={fi} value={g2Day} onChange={e=>setG2Day(e.target.value)}>
                  <option value="">일</option>{getDays(g2Month,g2Year).map(d=><option key={d} value={d}>{d}일</option>)}
                </select>
              </div>
            </div>
            <div><span style={lbl}>성별</span><GenderToggle value={g2Gender} onChange={setG2Gender}/></div>
          </div>

          <button onClick={goGung} disabled={gLoading} style={{width:"100%", padding:18, background:hot, border:"none", borderRadius:12, color:"#fff", fontFamily:"Montserrat", fontSize:16, fontWeight:900, cursor:"pointer", marginBottom:16, opacity:gLoading?0.5:1}}>
            {gLoading ? "두 사람 기운 읽는 중 💕" : "💕 우리 궁합 진짜로 보기"}
          </button>
          {gErr && <p style={{fontSize:12, color:"#FF4466", textAlign:"center", marginBottom:12}}>{gErrMsg}</p>}

          {gScore && (
            <div style={{background:"#161616", border:"1px solid #2A2A2A", borderRadius:16, marginBottom:16, overflow:"hidden"}}>
              <div style={{padding:"24px 20px", textAlign:"center"}}>
                <div style={{fontFamily:"Bebas Neue", fontSize:72, color:hot, lineHeight:1}}>{Math.round(gScore.total)}</div>
                <div style={{fontSize:11, color:"#555", marginBottom:8, fontFamily:"Montserrat"}}>/ 100</div>
                <div style={{fontFamily:"Montserrat", fontSize:14, fontWeight:900, marginBottom:6}}>{gScore.title}</div>
                <div style={{fontSize:12, color:"#666"}}>{gScore.sub}</div>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:"0 20px 20px"}}>
                {gScore.cats.map((c,i)=>{
                  const colors=["#FF0066","#FF6B9D","#4ECDC4","#FFD700"];
                  return (
                    <div key={c.label} style={{background:"#1E1E1E", borderRadius:10, padding:12}}>
                      <div style={{fontSize:10, color:"#666", fontWeight:700, letterSpacing:1, marginBottom:8, fontFamily:"Montserrat"}}>{c.label}</div>
                      <div style={{background:"#111", borderRadius:4, height:6, overflow:"hidden"}}>
                        <div style={{height:6, borderRadius:4, background:colors[i%colors.length], width:`${c.score}%`}}/>
                      </div>
                      <div style={{fontSize:13, fontWeight:900, color:"#fff", marginTop:6, fontFamily:"Montserrat"}}>{c.score}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {gResult.length>0 && (
            <div style={{background:"#161616", border:"1px solid #2A2A2A", borderRadius:14, overflow:"hidden", marginBottom:24}}>
              <div style={{background:hot, padding:"16px 20px", display:"flex", alignItems:"center", gap:12}}>
                <span style={{fontSize:26}}>💕</span>
                <div>
                  <strong style={{display:"block", fontFamily:"Montserrat", fontSize:15}}>언니의 궁합 찐 풀이</strong>
                  <span style={{fontSize:11, opacity:.85}}>솔직하게, 다 말해줄게</span>
                </div>
              </div>
              <div style={{padding:20}}>
                {gResult.map(s=><ResultCard key={s.label} s={s}/>)}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{textAlign:"center", padding:"24px 20px 32px", fontSize:11, color:"#333"}}>
        재미로 보는 AI 사주 👑 실제 운명을 결정하지 않아요
      </div>
    </div>
  );
}