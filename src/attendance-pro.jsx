import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Constants ────────────────────────────────────────────────────────────── */
const USERS = [
  { id: "T001", name: "Dr. Adebayo",   role: "teacher", email: "adebayo@school.edu",  password: "teacher123", avatar: "DA" },
  { id: "T002", name: "Prof. Okonkwo", role: "teacher", email: "okonkwo@school.edu",  password: "teacher123", avatar: "PO" },
  { id: "S001", name: "Amara Okafor",  role: "student", email: "amara@school.edu",    password: "student123", avatar: "AO", studentId: "STU001" },
  { id: "S002", name: "Chidi Nwosu",   role: "student", email: "chidi@school.edu",    password: "student123", avatar: "CN", studentId: "STU002" },
  { id: "S003", name: "Fatima Bello",  role: "student", email: "fatima@school.edu",   password: "student123", avatar: "FB", studentId: "STU003" },
  { id: "S004", name: "Emeka Adeyemi", role: "student", email: "emeka@school.edu",    password: "student123", avatar: "EA", studentId: "STU004" },
  { id: "S005", name: "Ngozi Eze",     role: "student", email: "ngozi@school.edu",    password: "student123", avatar: "NE", studentId: "STU005" },
  { id: "S006", name: "Tunde Abiodun", role: "student", email: "tunde@school.edu",    password: "student123", avatar: "TA", studentId: "STU006" },
  { id: "S007", name: "Halima Musa",   role: "student", email: "halima@school.edu",   password: "student123", avatar: "HM", studentId: "STU007" },
  { id: "S008", name: "Seun Olawale",  role: "student", email: "seun@school.edu",     password: "student123", avatar: "SO", studentId: "STU008" },
];

const STUDENTS = USERS.filter(u => u.role === "student");

const CLASSES = [
  { id: "CS301", name: "Data Structures",  teacher: "T001" },
  { id: "CS302", name: "Web Engineering",  teacher: "T002" },
  { id: "CS303", name: "Database Systems", teacher: "T001" },
];

function qrUrl(token) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(token)}&bgcolor=ffffff&color=0a0a0f&qzone=2`;
}
function genToken(cid) {
  return `ATT-${cid}-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}

/* ─── CSV / Excel export helpers ──────────────────────────────────────────── */
function exportCSV(sessions) {
  const rows = [["Student ID","Name","Class","Subject","Date","Time","Status"]];
  CLASSES.forEach(cls => {
    const s = sessions[cls.id];
    if (!s) return;
    const date = new Date(s.createdAt).toLocaleDateString();
    STUDENTS.forEach(st => {
      const rec = s.scanned?.find(x => x.studentId === st.studentId);
      rows.push([st.studentId, st.name, cls.id, cls.name, date, rec ? rec.time : "-", rec ? "Present" : "Absent"]);
    });
  });
  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "attendance_report.csv"; a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(sessions) {
  const rows = [];
  CLASSES.forEach(cls => {
    const s = sessions[cls.id];
    if (!s) return;
    const date = new Date(s.createdAt).toLocaleDateString();
    STUDENTS.forEach(st => {
      const rec = s.scanned?.find(x => x.studentId === st.studentId);
      rows.push({ id: st.studentId, name: st.name, cls: cls.name, date, time: rec ? rec.time : "-", status: rec ? "Present" : "Absent" });
    });
  });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;padding:32px;color:#111}
  h1{font-size:22px;margin-bottom:4px}
  p{color:#666;font-size:13px;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#0a0a0f;color:#00ff88;padding:10px 12px;text-align:left;font-size:11px;letter-spacing:1px}
  td{padding:9px 12px;border-bottom:1px solid #eee}
  tr:nth-child(even) td{background:#f9f9f9}
  .present{color:#16a34a;font-weight:700}
  .absent{color:#dc2626;font-weight:700}
</style></head><body>
<h1>AttendQR — Attendance Report</h1>
<p>Generated: ${new Date().toLocaleString()}</p>
<table><thead><tr><th>ID</th><th>Name</th><th>Subject</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
<tbody>${rows.map(r=>`<tr><td>${r.id}</td><td>${r.name}</td><td>${r.cls}</td><td>${r.date}</td><td>${r.time}</td><td class="${r.status.toLowerCase()}">${r.status}</td></tr>`).join("")}
</tbody></table></body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "attendance_report.html"; a.click();
  URL.revokeObjectURL(url);
}

/* ─── Countdown ring ──────────────────────────────────────────────────────── */
function Ring({ s, total }) {
  const r = 42, c = 2*Math.PI*r;
  const col = s>total*.5?"#00ff88":s>total*.2?"#ffcc00":"#ff4444";
  return (
    <svg width={100} height={100} style={{transform:"rotate(-90deg)"}}>
      <circle cx={50} cy={50} r={r} fill="none" stroke="#1a1a2e" strokeWidth={5}/>
      <circle cx={50} cy={50} r={r} fill="none" stroke={col} strokeWidth={5}
        strokeDasharray={`${(s/total)*c} ${c}`} style={{transition:"stroke-dasharray 1s linear,stroke .3s"}}/>
    </svg>
  );
}

/* ─── Login Page ──────────────────────────────────────────────────────────── */
function LoginPage({ onLogin }) {
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = () => {
    setErr(""); setLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.email === email.trim().toLowerCase() && u.password === pass);
      if (user) { onLogin(user); }
      else { setErr("Invalid email or password."); }
      setLoading(false);
    }, 800);
  };

  const demo = (role) => {
    const u = USERS.find(u => u.role === role);
    setEmail(u.email); setPass(u.password);
  };

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:400}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#00ff88,#00aacc)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:16,boxShadow:"0 0 40px rgba(0,255,136,.35)"}}>◈</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:"#fff"}}>AttendQR</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#3a3a5a",letterSpacing:3,marginTop:4}}>SMART ATTENDANCE SYSTEM</div>
        </div>

        <div style={{background:"#0d0d1a",border:"1px solid #1e1e3a",borderRadius:20,padding:32,display:"flex",flexDirection:"column",gap:20}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"#5a5a7a",letterSpacing:2,textAlign:"center"}}>SIGN IN TO YOUR ACCOUNT</div>

          {/* Email */}
          <div>
            <label style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#5a5a7a",letterSpacing:2,display:"block",marginBottom:8}}>EMAIL</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
              placeholder="you@school.edu"
              style={{width:"100%",padding:"12px 16px",background:"#111128",border:"1px solid #1e1e3a",borderRadius:10,color:"#d0d0e0",fontFamily:"'Space Mono',monospace",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border .2s"}}
              onFocus={e=>e.target.style.borderColor="#00ff88"} onBlur={e=>e.target.style.borderColor="#1e1e3a"}/>
          </div>

          {/* Password */}
          <div>
            <label style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#5a5a7a",letterSpacing:2,display:"block",marginBottom:8}}>PASSWORD</label>
            <div style={{position:"relative"}}>
              <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
                placeholder="••••••••"
                style={{width:"100%",padding:"12px 44px 12px 16px",background:"#111128",border:"1px solid #1e1e3a",borderRadius:10,color:"#d0d0e0",fontFamily:"'Space Mono',monospace",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border .2s"}}
                onFocus={e=>e.target.style.borderColor="#00ff88"} onBlur={e=>e.target.style.borderColor="#1e1e3a"}/>
              <button onClick={()=>setShowPass(!showPass)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#5a5a7a",cursor:"pointer",fontSize:14}}>
                {showPass?"🙈":"👁"}
              </button>
            </div>
          </div>

          {err && <div style={{padding:"10px 14px",background:"rgba(255,68,68,.1)",border:"1px solid #ff4444",borderRadius:8,color:"#ff6666",fontFamily:"'Space Mono',monospace",fontSize:12}}>{err}</div>}

          <button onClick={submit} disabled={loading} style={{padding:"14px",borderRadius:12,border:"none",cursor:"pointer",background:loading?"rgba(0,255,136,.2)":"linear-gradient(135deg,#00ff88,#00ccaa)",color:loading?"#00ff88":"#0a0a0f",fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,letterSpacing:2,transition:"all .2s",boxShadow:loading?"none":"0 0 24px rgba(0,255,136,.25)"}}>
            {loading?"SIGNING IN...":"→ SIGN IN"}
          </button>

          {/* Demo buttons */}
          <div style={{borderTop:"1px solid #1e1e3a",paddingTop:16}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#3a3a5a",letterSpacing:1,textAlign:"center",marginBottom:10}}>DEMO ACCOUNTS</div>
            <div style={{display:"flex",gap:10}}>
              {["teacher","student"].map(r=>(
                <button key={r} onClick={()=>demo(r)} style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid #1e1e3a",background:"transparent",color:"#5a5a7a",fontFamily:"'Space Mono',monospace",fontSize:11,cursor:"pointer",letterSpacing:1,transition:"all .2s"}}
                  onMouseEnter={e=>{e.target.style.borderColor="#00ff88";e.target.style.color="#00ff88"}} onMouseLeave={e=>{e.target.style.borderColor="#1e1e3a";e.target.style.color="#5a5a7a"}}>
                  {r==="teacher"?"🎓":"📱"} {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Camera QR Scanner ───────────────────────────────────────────────────── */
function CameraScanner({ onDetected, onClose }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const [status, setStatus]   = useState("Initialising camera…");
  const [error, setError]     = useState("");
  const [detected, setDetected] = useState(null);

  // Try to load jsQR from CDN
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
        setStatus("Point camera at QR code…");
        scan();
      } catch(e) {
        setError("Camera access denied. Please allow camera permission and try again.");
      }
    };

    if (!window.jsQR) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js";
      s.onload = () => startCamera();
      s.onerror = () => setError("Could not load QR library.");
      document.head.appendChild(s);
    } else { startCamera(); }
    return () => { stopCamera(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t=>t.stop());
  };

  const scan = () => {
    const tick = () => {
      const v = videoRef.current, c = canvasRef.current;
      if (!v || !c || v.readyState !== v.HAVE_ENOUGH_DATA) { rafRef.current=requestAnimationFrame(tick); return; }
      c.width = v.videoWidth; c.height = v.videoHeight;
      const ctx = c.getContext("2d");
      ctx.drawImage(v,0,0);
      if (window.jsQR) {
        const img = ctx.getImageData(0,0,c.width,c.height);
        const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts:"dontInvert" });
        if (code) {
          setDetected(code.data);
          setStatus("QR Code detected!");
          stopCamera();
          setTimeout(()=>{ onDetected(code.data); }, 600);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:420,background:"#0d0d1a",border:"1px solid #1e1e3a",borderRadius:20,overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:"1px solid #1e1e3a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"#00ff88",letterSpacing:2}}>📷 CAMERA SCANNER</span>
          <button onClick={()=>{stopCamera();onClose();}} style={{background:"none",border:"none",color:"#5a5a7a",cursor:"pointer",fontSize:18}}>✕</button>
        </div>

        {/* Video */}
        <div style={{position:"relative",background:"#000",aspectRatio:"1"}}>
          <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover",display:detected?"none":"block"}} muted playsInline/>
          <canvas ref={canvasRef} style={{display:"none"}}/>

          {/* Scan overlay */}
          {!detected && !error && (
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
              <div style={{width:200,height:200,position:"relative"}}>
                {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos,i)=>(
                  <div key={i} style={{position:"absolute",width:32,height:32,...pos,
                    borderTop:pos.top===0?"3px solid #00ff88":"none",
                    borderBottom:pos.bottom===0?"3px solid #00ff88":"none",
                    borderLeft:pos.left===0?"3px solid #00ff88":"none",
                    borderRight:pos.right===0?"3px solid #00ff88":"none"}}/>
                ))}
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#00ff88,transparent)",animation:"scanLine 1.5s ease-in-out infinite"}}/>
              </div>
            </div>
          )}

          {detected && (
            <div style={{position:"absolute",inset:0,background:"rgba(0,255,136,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontSize:64}}>✅</div>
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{padding:"16px 20px",textAlign:"center"}}>
          {error
            ? <div style={{color:"#ff6666",fontFamily:"'Space Mono',monospace",fontSize:12}}>{error}</div>
            : <div style={{color:detected?"#00ff88":"#7a7a9a",fontFamily:"'Space Mono',monospace",fontSize:12,letterSpacing:1}}>{status}</div>
          }
        </div>
      </div>
    </div>
  );
}

/* ─── Teacher Dashboard ───────────────────────────────────────────────────── */
function TeacherDash({ user, sessions, onCreate, onEnd }) {
  const myClasses = CLASSES.filter(c=>c.teacher===user.id);
  const [sel, setSel] = useState(myClasses[0]?.id||"");
  const [dur, setDur] = useState(120);
  const active = sessions[sel];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      {/* Class tabs */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {myClasses.map(c=>(
          <button key={c.id} onClick={()=>setSel(c.id)} style={{padding:"10px 18px",borderRadius:8,border:"none",cursor:"pointer",background:sel===c.id?"#00ff88":"#1a1a2e",color:sel===c.id?"#0a0a0f":"#5a5a7a",fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,transition:"all .2s"}}>
            {c.id}
          </button>
        ))}
      </div>

      {/* Info card */}
      {sel && (()=>{
        const cls = CLASSES.find(c=>c.id===sel);
        return (
          <div style={{background:"linear-gradient(135deg,#0d0d1a,#121228)",border:"1px solid #1e1e3a",borderRadius:16,padding:22}}>
            <div style={{fontFamily:"'Space Mono',monospace",color:"#00ff88",fontSize:10,letterSpacing:3,marginBottom:6}}>SELECTED CLASS</div>
            <div style={{fontSize:22,fontFamily:"'Syne',sans-serif",fontWeight:800,color:"#fff"}}>{cls.name}</div>
          </div>
        );
      })()}

      {!active ? (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <label style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#5a5a7a",letterSpacing:2,display:"block",marginBottom:10}}>SESSION DURATION</label>
            <div style={{display:"flex",gap:8}}>
              {[60,120,300].map(d=>(
                <button key={d} onClick={()=>setDur(d)} style={{padding:"9px 16px",borderRadius:7,border:`1px solid ${dur===d?"#00ff88":"#1e1e3a"}`,background:dur===d?"rgba(0,255,136,.1)":"transparent",color:dur===d?"#00ff88":"#5a5a7a",fontFamily:"'Space Mono',monospace",fontSize:12,cursor:"pointer"}}>
                  {d}s
                </button>
              ))}
            </div>
          </div>
          <button onClick={()=>sel&&onCreate(sel,dur)} style={{padding:"15px",borderRadius:12,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#00ff88,#00ccaa)",color:"#0a0a0f",fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,letterSpacing:2,boxShadow:"0 0 28px rgba(0,255,136,.3)"}}>
            ▶ GENERATE QR SESSION
          </button>
        </div>
      ) : (
        <ActiveSession session={active} onEnd={()=>onEnd(sel)}/>
      )}
    </div>
  );
}

/* ─── Active QR Session ───────────────────────────────────────────────────── */
function ActiveSession({ session, onEnd }) {
  const [t, setT] = useState(session.duration);
  useEffect(()=>{
    const id=setInterval(()=>setT(x=>{ if(x<=1){clearInterval(id);onEnd();return 0;} return x-1; }),1000);
    return ()=>clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{background:"#0d0d1a",border:"1px solid #1e1e3a",borderRadius:20,padding:28,display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#00ff88",letterSpacing:3}}>SCAN TO MARK ATTENDANCE</div>
        <div style={{padding:14,background:"#fff",borderRadius:14,boxShadow:"0 0 50px rgba(0,255,136,.2)"}}>
          <img src={qrUrl(session.token)} width={200} height={200} alt="QR"/>
        </div>
        <div style={{position:"relative",width:100,height:100}}>
          <Ring s={t} total={session.duration}/>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700,color:"#fff"}}>{t}</span>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:"#3a3a5a",letterSpacing:2}}>SEC</span>
          </div>
        </div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#2a2a4a",wordBreak:"break-all",textAlign:"center",maxWidth:240}}>{session.token}</div>
      </div>

      {/* Scanned list */}
      <div style={{background:"#0d0d1a",border:"1px solid #1e1e3a",borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid #1e1e3a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#5a5a7a",letterSpacing:2}}>CHECKED IN</span>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,color:"#00ff88"}}>{(session.scanned||[]).length}/{STUDENTS.length}</span>
        </div>
        {(session.scanned||[]).length===0
          ? <div style={{padding:20,textAlign:"center",color:"#2a2a4a",fontSize:12,fontFamily:"'Space Mono',monospace"}}>Waiting…</div>
          : (session.scanned||[]).map(s=>(
            <div key={s.studentId} style={{padding:"11px 18px",borderBottom:"1px solid #111128",display:"flex",alignItems:"center",gap:12,animation:"slideIn .3s ease"}}>
              <div style={{width:32,height:32,borderRadius:7,background:"linear-gradient(135deg,#00ff88,#00aacc)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#0a0a0f",fontFamily:"'Space Mono',monospace",flexShrink:0}}>{s.avatar}</div>
              <div>
                <div style={{color:"#d0d0e0",fontSize:13,fontFamily:"'Syne',sans-serif",fontWeight:600}}>{s.name}</div>
                <div style={{color:"#3a3a5a",fontSize:10,fontFamily:"'Space Mono',monospace"}}>{s.time}</div>
              </div>
              <span style={{marginLeft:"auto",color:"#00ff88",fontSize:16}}>✓</span>
            </div>
          ))
        }
      </div>

      <button onClick={onEnd} style={{padding:"12px",borderRadius:10,border:"1px solid #ff4444",background:"transparent",color:"#ff4444",fontFamily:"'Space Mono',monospace",fontSize:12,cursor:"pointer",letterSpacing:2}}>
        ■ END SESSION
      </button>
    </div>
  );
}

/* ─── Student Dashboard ───────────────────────────────────────────────────── */
function StudentDash({ user, sessions, onScan }) {
  const [showCam, setShowCam]   = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualScan, setManualScan] = useState(false);

  const handleDetected = useCallback((token) => {
    setShowCam(false);
    // find matching active session
    const entry = Object.entries(sessions).find(([,s])=>s&&s.active&&s.token===token);
    if (!entry) { setScanResult({ok:false,msg:"No matching active session found."}); return; }
    const [classId,session] = entry;
    if (session.scanned?.find(x=>x.studentId===user.studentId)) {
      setScanResult({ok:false,msg:"You're already checked in!"}); return;
    }
    onScan(classId, user);
    const cls = CLASSES.find(c=>c.id===classId);
    setScanResult({ok:true,msg:`✓ Checked into ${cls?.name}!`});
  }, [sessions, user, onScan]);

  // Simulate scan (for demo — clicks scan on any open session)
  const simulateScan = () => {
    setManualScan(true); setScanResult(null);
    setTimeout(()=>{
      const entry = Object.entries(sessions).find(([,s])=>s&&s.active);
      if (entry) handleDetected(entry[1].token);
      else setScanResult({ok:false,msg:"No active session right now."});
      setManualScan(false);
    },1400);
  };

  const attended = Object.entries(sessions)
    .filter(([,s])=>s?.scanned?.find(x=>x.studentId===user.studentId))
    .map(([cid])=>CLASSES.find(c=>c.id===cid)).filter(Boolean);

  const total = CLASSES.filter(c=>sessions[c.id]).length;
  const pct   = total>0?Math.round((attended.length/total)*100):0;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      {showCam && <CameraScanner onDetected={handleDetected} onClose={()=>setShowCam(false)}/>}

      {/* Profile card */}
      <div style={{background:"linear-gradient(135deg,#0d0d1a,#121228)",border:"1px solid #1e1e3a",borderRadius:16,padding:22,display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:52,height:52,borderRadius:12,background:"linear-gradient(135deg,#00ff88,#00aacc)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#0a0a0f",fontFamily:"'Space Mono',monospace",flexShrink:0}}>{user.avatar}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontFamily:"'Syne',sans-serif",fontWeight:800,color:"#fff"}}>{user.name}</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#3a3a5a",letterSpacing:1,marginTop:2}}>{user.studentId}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700,color:pct>=75?"#00ff88":pct>=50?"#ffcc00":"#ff4444"}}>{pct}%</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#3a3a5a",letterSpacing:1}}>ATTENDANCE</div>
        </div>
      </div>

      {/* Scanner box */}
      <div style={{background:"#0d0d1a",border:`1px solid ${manualScan?"#00ff88":"#1e1e3a"}`,borderRadius:20,padding:28,display:"flex",flexDirection:"column",alignItems:"center",gap:18,transition:"border .3s",boxShadow:manualScan?"0 0 30px rgba(0,255,136,.12)":"none"}}>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#5a5a7a",letterSpacing:2}}>SCAN ATTENDANCE QR</div>

        <div style={{width:130,height:130,borderRadius:14,border:`2px solid ${manualScan?"#00ff88":"#1e1e3a"}`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",transition:"border .3s"}}>
          {manualScan
            ? <><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#00ff88,transparent)",animation:"scanLine 1s ease-in-out infinite"}}/><div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"#00ff88",letterSpacing:1}}>SCANNING…</div></>
            : <div style={{textAlign:"center"}}><div style={{fontSize:38,marginBottom:6}}>📷</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#2a2a4a",letterSpacing:1}}>POINT AT QR</div></div>
          }
        </div>

        {scanResult && (
          <div style={{padding:"12px 22px",borderRadius:10,background:scanResult.ok?"rgba(0,255,136,.1)":"rgba(255,68,68,.1)",border:`1px solid ${scanResult.ok?"#00ff88":"#ff4444"}`,color:scanResult.ok?"#00ff88":"#ff6666",fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,textAlign:"center"}}>
            {scanResult.msg}
          </div>
        )}

        <div style={{display:"flex",gap:10,width:"100%"}}>
          <button onClick={()=>setShowCam(true)} style={{flex:1,padding:"13px",borderRadius:10,border:"1px solid #1e1e3a",background:"#111128",color:"#7a7aba",fontFamily:"'Space Mono',monospace",fontSize:11,cursor:"pointer",letterSpacing:1,transition:"all .2s"}}
            onMouseEnter={e=>{e.target.style.borderColor="#00aacc";e.target.style.color="#00aacc"}} onMouseLeave={e=>{e.target.style.borderColor="#1e1e3a";e.target.style.color="#7a7aba"}}>
            📷 USE CAMERA
          </button>
          <button onClick={simulateScan} disabled={manualScan} style={{flex:1,padding:"13px",borderRadius:10,border:"none",cursor:manualScan?"not-allowed":"pointer",background:manualScan?"rgba(0,255,136,.15)":"linear-gradient(135deg,#00ff88,#00ccaa)",color:manualScan?"#00ff88":"#0a0a0f",fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:1,transition:"all .2s"}}>
            {manualScan?"SCANNING…":"⚡ SIMULATE"}
          </button>
        </div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#2a2a4a",textAlign:"center",letterSpacing:1}}>
          Use camera for real QR scan · Simulate if no active session
        </div>
      </div>

      {/* Attended today */}
      {attended.length>0 && (
        <div style={{background:"#0d0d1a",border:"1px solid #1e1e3a",borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"12px 18px",borderBottom:"1px solid #1e1e3a"}}><span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#5a5a7a",letterSpacing:2}}>ATTENDED TODAY</span></div>
          {attended.map(cls=>(
            <div key={cls.id} style={{padding:"12px 18px",borderBottom:"1px solid #111128",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 6px #00ff88"}}/>
              <div>
                <div style={{color:"#d0d0e0",fontSize:13,fontFamily:"'Syne',sans-serif",fontWeight:600}}>{cls.name}</div>
                <div style={{color:"#3a3a5a",fontSize:10,fontFamily:"'Space Mono',monospace"}}>{cls.id}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Reports ──────────────────────────────────────────────────────────────── */
function Reports({ sessions }) {
  const [exporting, setExporting] = useState("");
  const rows = STUDENTS.map(s=>{
    const present = CLASSES.filter(c=>sessions[c.id]?.scanned?.find(x=>x.studentId===s.studentId)).length;
    const total   = CLASSES.filter(c=>sessions[c.id]).length;
    const pct     = total>0?Math.round((present/total)*100):0;
    return {...s,present,total,pct};
  });

  const doExport = (type) => {
    setExporting(type);
    setTimeout(()=>{ type==="csv"?exportCSV(sessions):exportPDF(sessions); setExporting(""); },400);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {[
          {label:"STUDENTS",val:STUDENTS.length,col:"#00ff88"},
          {label:"SESSIONS",val:CLASSES.filter(c=>sessions[c.id]).length,col:"#00aaff"},
          {label:"AVG ATT.",val:`${rows.length?Math.round(rows.reduce((a,r)=>a+r.pct,0)/rows.length):0}%`,col:"#ffcc00"},
        ].map(s=>(
          <div key={s.label} style={{background:"#0d0d1a",border:"1px solid #1e1e3a",borderRadius:14,padding:"18px 10px",textAlign:"center"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:20,fontWeight:700,color:s.col,marginBottom:6}}>{s.val}</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:"#3a3a5a",letterSpacing:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div style={{display:"flex",gap:10}}>
        {[{id:"csv",label:"⬇ EXPORT CSV",col:"#00aaff"},{id:"pdf",label:"⬇ EXPORT PDF",col:"#ff8800"}].map(b=>(
          <button key={b.id} onClick={()=>doExport(b.id)} disabled={!!exporting} style={{flex:1,padding:"12px",borderRadius:10,border:`1px solid ${b.col}`,background:`rgba(${b.id==="csv"?"0,170,255":"255,136,0"},.08)`,color:b.col,fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1,transition:"all .2s",opacity:exporting===b.id?.6:1}}>
            {exporting===b.id?"EXPORTING…":b.label}
          </button>
        ))}
      </div>

      {/* Per-class breakdown */}
      {CLASSES.map(cls=>{
        const s=sessions[cls.id];
        if(!s)return null;
        return (
          <div key={cls.id} style={{background:"#0d0d1a",border:"1px solid #1e1e3a",borderRadius:14,overflow:"hidden"}}>
            <div style={{padding:"12px 18px",borderBottom:"1px solid #1e1e3a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:"#d0d0e0"}}>{cls.name}</span>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"#00ff88"}}>{cls.id}</span>
            </div>
            {STUDENTS.map(st=>{
              const rec=s.scanned?.find(x=>x.studentId===st.studentId);
              return (
                <div key={st.studentId} style={{padding:"10px 18px",borderBottom:"1px solid #111128",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:28,height:28,borderRadius:6,background:rec?"linear-gradient(135deg,#00ff88,#00aacc)":"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:rec?"#0a0a0f":"#3a3a5a",fontFamily:"'Space Mono',monospace",flexShrink:0}}>{st.avatar}</div>
                  <span style={{flex:1,color:"#c0c0d0",fontSize:13,fontFamily:"'Syne',sans-serif",fontWeight:600}}>{st.name}</span>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,color:rec?"#00ff88":"#ff4444"}}>{rec?"PRESENT":"ABSENT"}</span>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Student summary table */}
      <div style={{background:"#0d0d1a",border:"1px solid #1e1e3a",borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid #1e1e3a"}}><span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#5a5a7a",letterSpacing:2}}>STUDENT SUMMARY</span></div>
        {rows.map((r,i)=>(
          <div key={r.id} style={{padding:"12px 18px",borderBottom:i<rows.length-1?"1px solid #111128":"none",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:32,height:32,borderRadius:8,background:r.pct>=75?"linear-gradient(135deg,#00ff88,#00aacc)":r.pct>=50?"linear-gradient(135deg,#ffcc00,#ff8800)":"linear-gradient(135deg,#ff4444,#cc2222)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#0a0a0f",fontFamily:"'Space Mono',monospace",flexShrink:0}}>{r.avatar}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:"#d0d0e0",fontSize:13,fontFamily:"'Syne',sans-serif",fontWeight:600}}>{r.name}</div>
              <div style={{marginTop:5,height:3,background:"#1a1a2e",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${r.pct}%`,background:r.pct>=75?"#00ff88":r.pct>=50?"#ffcc00":"#ff4444",borderRadius:2,transition:"width .8s ease"}}/>
              </div>
            </div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,color:r.pct>=75?"#00ff88":r.pct>=50?"#ffcc00":"#ff4444",minWidth:40,textAlign:"right"}}>{r.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── App Shell ───────────────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser]         = useState(null);
  const [sessions, setSessions] = useState({});
  const [tab, setTab]           = useState("main");

  const createSession = (cid,dur) => setSessions(s=>({...s,[cid]:{token:genToken(cid),classId:cid,duration:dur,active:true,scanned:[],createdAt:new Date().toISOString()}}));
  const endSession    = (cid)    => setSessions(s=>({...s,[cid]:{...s[cid],active:false}}));
  const scanIn        = (cid,u)  => setSessions(s=>{
    const sess=s[cid]; if(!sess)return s;
    return {...s,[cid]:{...sess,scanned:[...(sess.scanned||[]),{studentId:u.studentId,name:u.name,avatar:u.avatar,time:new Date().toLocaleTimeString()}]}};
  });

  if (!user) return <LoginPage onLogin={u=>{setUser(u);setTab(u.role==="teacher"?"main":"scan");}}/>;

  const isTeacher = user.role==="teacher";

  const tabs = isTeacher
    ? [{id:"main",label:"SESSIONS",icon:"🎓"},{id:"reports",label:"REPORTS",icon:"📊"}]
    : [{id:"scan",label:"SCAN",icon:"📱"},{id:"reports",label:"REPORTS",icon:"📊"}];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@600;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0a0f}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scanLine{0%{top:0;opacity:1}50%{top:calc(100% - 2px);opacity:.5}100%{top:0;opacity:1}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#0a0a0f}::-webkit-scrollbar-thumb{background:#1e1e3a;border-radius:2px}
        input::placeholder{color:#2a2a4a}
      `}</style>

      <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",paddingBottom:40}}>
        {/* Top bar */}
        <div style={{width:"100%",maxWidth:520,padding:"24px 20px 0",display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#00ff88,#00aacc)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 18px rgba(0,255,136,.3)"}}>◈</div>
              <div>
                <div style={{fontSize:16,fontFamily:"'Syne',sans-serif",fontWeight:800,color:"#fff"}}>AttendQR</div>
                <div style={{fontSize:9,color:"#3a3a5a",fontFamily:"'Space Mono',monospace",letterSpacing:2}}>PRO</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:"#d0d0e0"}}>{user.name.split(" ")[0]}</div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:isTeacher?"#00aaff":"#00ff88",letterSpacing:1}}>{isTeacher?"TEACHER":"STUDENT"}</div>
              </div>
              <button onClick={()=>setUser(null)} style={{width:32,height:32,borderRadius:8,border:"1px solid #1e1e3a",background:"#0d0d1a",color:"#5a5a7a",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>⏏</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",background:"#0d0d1a",borderRadius:12,padding:4,border:"1px solid #1a1a2e"}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 0",borderRadius:9,border:"none",cursor:"pointer",background:tab===t.id?"#1a1a2e":"transparent",color:tab===t.id?"#00ff88":"#3a3a5a",fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:tab===t.id?700:400,letterSpacing:1,transition:"all .2s",boxShadow:tab===t.id?"0 0 10px rgba(0,255,136,.08)":"none"}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{width:"100%",maxWidth:520,padding:"22px 20px 0"}}>
          {tab==="main"  && isTeacher  && <TeacherDash user={user} sessions={sessions} onCreate={createSession} onEnd={endSession}/>}
          {tab==="scan"  && !isTeacher && <StudentDash user={user} sessions={sessions} onScan={scanIn}/>}
          {tab==="reports"             && <Reports sessions={sessions}/>}
        </div>
      </div>
    </>
  );
}
