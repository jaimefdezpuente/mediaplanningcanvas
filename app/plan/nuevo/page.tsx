'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Jv = string | number | boolean | null | Jv[] | { [k: string]: Jv }
type Obj = { [k: string]: Jv }

interface ValStep { id: string; tipo: string; accion: string; objetivo: string }
interface ObjRow { id: string; tipo: string; kpi: string; dato: string; tiempo: string }
interface PlanData {
  pais: string; sector: string; producto: string; tipo_negocio: string
  competidores: string; presupuesto: string; fase_negocio: string; usp: string
  entorno: Obj | null; target: Obj | null; estrategia: Obj | null
  edits: { [k: string]: string }
  completed: number[]
  valueSteps: ValStep[]
  objectives: ObjRow[]
  selectedChannels: string[]
}

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const P = {
  bg: '#ffffff', bg2: '#f8fafc', card: '#ffffff',
  border: '#e2e8f0', border2: '#cbd5e1',
  acc: '#0284c7', accL: '#eff6ff', acc2: '#38bdf8',
  txt: '#0f172a', txt2: '#475569', txt3: '#94a3b8',
  ok: '#059669', okL: '#f0fdf4',
  warn: '#d97706', warnL: '#fffbeb',
  pur: '#7c3aed', purL: '#f5f3ff',
  err: '#dc2626', errL: '#fef2f2',
}

// ─── CHANNEL LIST FOR SELECTION ───────────────────────────────────────────────
const CH_OPTIONS = {
  notoriedad: ['Display CPM Branding','Meta Ads Branding','TikTok Branding','YouTube Branding','LinkedIn Branding','Influencer Paid','Influencer Gifting','Brand Ambassador','Branded Content','PR Digital','Eventos/Sponsor','OOH/Exterior','TV/Radio','RRSS Orgánico','Employee Branding'],
  interaccion: ['SEO / Blog','RRSS Contenidos','YouTube Canal Orgánico','Podcast','Webinar','WhatsApp Business','Google Business/Maps','Concursos y Sorteos','Banners Display Tráfico'],
  lead_venta: ['SEM / Buscadores','Meta Ads Performance','TikTok Performance','LinkedIn Performance','YouTube Performance','Display GDN','Email BBDD Comprada','Email Outreach','Email BBDD Propia','Afiliación','Influencer Performance','SMS Marketing','Lead Magnet','Cupones','Demo/Workshop','Partners Comerciales','Sales Force','Referidos/MGM','Punto de Venta/POS'],
  fidelizacion: ['Email Automation/CRM','WhatsApp Fidelización','Programa Fidelización/Puntos','Push Notifications','SMS Fidelización','Reviews/Reputación','Comunidad Propia','Customer Success'],
}

const KPI_OPTIONS = ['Nº Seguidores','Alcance / Impresiones','CPM','CTR','Visitas web','Tiempo en web','Nº Leads','CR Lead→Venta','CAC','ROAS','Nº Clientes','Ticket Medio','LTV','Tasa Retención','NPS','Otro...']

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function ss(v: Jv): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(x => ss(x as Jv)).join('\n')
  return ''
}
function gn(obj: Obj | null, ...keys: string[]): string {
  if (!obj) return ''
  let cur: Jv = obj
  for (const k of keys) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return ''
    cur = (cur as Obj)[k]
  }
  return ss(cur)
}
function ga(obj: Obj | null, ...keys: string[]): Jv[] {
  if (!obj) return []
  let cur: Jv = obj
  for (const k of keys) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return []
    cur = (cur as Obj)[k]
  }
  return Array.isArray(cur) ? cur : []
}
function uid() { return Math.random().toString(36).slice(2) }

// ─── BASE STYLES ─────────────────────────────────────────────────────────────
const INP: React.CSSProperties = { width:'100%', background:P.bg2, border:`1.5px solid ${P.border}`, borderRadius:10, padding:'12px 16px', color:P.txt, fontSize:16, outline:'none', display:'block', marginBottom:6, boxSizing:'border-box', fontFamily:'inherit', lineHeight:'1.6' }
const LBL: React.CSSProperties = { display:'block', fontSize:13, fontWeight:700, color:P.txt2, marginBottom:8, marginTop:18 }
const CARD: React.CSSProperties = { background:P.card, border:`1px solid ${P.border}`, borderRadius:16, padding:28, marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }
const BTN_P: React.CSSProperties = { padding:'13px 28px', borderRadius:10, background:P.acc, border:'none', color:'#fff', fontWeight:700, fontSize:16, cursor:'pointer' }
const BTN_S: React.CSSProperties = { padding:'13px 20px', borderRadius:10, background:'transparent', border:`1.5px solid ${P.border2}`, color:P.txt2, fontWeight:600, fontSize:15, cursor:'pointer' }
const BTN_SM: React.CSSProperties = { padding:'7px 14px', borderRadius:8, background:P.accL, border:`1px solid ${P.acc}`, color:P.acc, fontWeight:600, fontSize:13, cursor:'pointer' }

// ─── AUTO TEXTAREA ────────────────────────────────────────────────────────────
function AutoTA({ value, onChange, placeholder, style }: { value:string; onChange:(v:string)=>void; placeholder?:string; style?:React.CSSProperties }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px' }
  }, [value])
  return (
    <textarea ref={ref} style={{ ...INP, minHeight:80, resize:'none', overflow:'hidden', ...style }}
      value={value} placeholder={placeholder}
      onChange={e => { onChange(e.target.value); if (ref.current) { ref.current.style.height='auto'; ref.current.style.height=ref.current.scrollHeight+'px' } }} />
  )
}

// ─── VIDEO BLOCK ──────────────────────────────────────────────────────────────
function VideoBlock({ vimeoId, title }: { vimeoId: string; title: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background:P.accL, border:`1px solid ${P.acc}`, borderRadius:12, marginBottom:20, overflow:'hidden' }}>
      <button onClick={()=>setOpen(!open)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 18px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        <span style={{ fontSize:20 }}>🎬</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:P.acc }}>Vídeo formativo — {title}</div>
          <div style={{ fontSize:12, color:P.txt2 }}>Jaime te explica cómo trabajar esta fase</div>
        </div>
        <span style={{ fontSize:18, color:P.acc }}>{open?'▲':'▼'}</span>
      </button>
      {open && (
        <div style={{ padding:'0 18px 18px' }}>
          <div style={{ position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden', borderRadius:10 }}>
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?h=0&autoplay=1&color=0284c7&title=0&byline=0`}
              style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none', borderRadius:10 }}
              allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── EDIT FIELD ───────────────────────────────────────────────────────────────
function EditField({ label, fkey, value, onChange, onRefine, multiline=true }: { label:string; fkey:string; value:string; onChange:(v:string)=>void; onRefine:(p:string)=>void; multiline?:boolean }) {
  const [rp, setRp] = useState(''); const [show, setShow] = useState(false)
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        {label && <label style={{ fontSize:13, fontWeight:700, color:P.txt2 }}>{label}</label>}
        <button onClick={()=>setShow(!show)} style={{ fontSize:12, color:P.acc, background:'none', border:'none', cursor:'pointer', fontWeight:600, marginLeft:'auto', whiteSpace:'nowrap' }}>✨ Mejorar con IA</button>
      </div>
      {multiline ? <AutoTA value={value} onChange={onChange} /> : <input style={INP} type="text" value={value} onChange={e=>onChange(e.target.value)} />}
      {show && (
        <div style={{ background:P.accL, border:`1px solid ${P.acc}`, borderRadius:10, padding:14, marginTop:4 }}>
          <div style={{ display:'flex', gap:8 }}>
            <input style={{ ...INP, marginBottom:0, flex:1, fontSize:14 }} placeholder="Ej: Hazlo más conciso, enfócalo en B2B..." value={rp} onChange={e=>setRp(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&rp.trim()){onRefine(rp);setRp('');setShow(false)} }} />
            <button onClick={()=>{ if(rp.trim()){onRefine(rp);setRp('');setShow(false)} }} style={{ ...BTN_SM, padding:'10px 16px', whiteSpace:'nowrap' }}>→</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TOOLS ────────────────────────────────────────────────────────────────────
const TOOLS: Record<string, {name:string;url:string;desc:string}[]> = {
  macro:[{name:'Statista',url:'https://statista.com',desc:'Estadísticas de mercado globales'},{name:'DataCommons',url:'https://datacommons.org',desc:'Datos públicos Google'},{name:'Dataset Search',url:'https://datasetsearch.research.google.com',desc:'Busca datasets por sector'},{name:'Global Market Finder',url:'https://marketfinder.thinkwithgoogle.com',desc:'Demanda global por mercado'}],
  mercado:[{name:'Google Trends',url:'https://trends.google.com',desc:'Tendencias en tiempo real'},{name:'Exploding Topics',url:'https://explodingtopics.com',desc:'Tendencias emergentes'},{name:'Helium 10',url:'https://helium10.com',desc:'Investigación en Amazon'},{name:'Ubersuggest',url:'https://neilpatel.com/ubersuggest',desc:'Volumen SEO y competencia'}],
  competencia:[{name:'SimilarWeb',url:'https://similarweb.com',desc:'Tráfico y fuentes rivales'},{name:'SEMrush',url:'https://semrush.com',desc:'SEO y SEM de competidores'},{name:'WhatRunsWhere',url:'https://whatrunswhere.com',desc:'Creatividades y medios rival'},{name:'Inflact',url:'https://inflact.com',desc:'Análisis Instagram rival'},{name:'ScoringMy',url:'https://scoringmy.com',desc:'Puntuación digital vs rival'}],
  target:[{name:'Meta Audience Insights',url:'https://business.facebook.com/latest/insights/people',desc:'Audiencias FB/Instagram'},{name:'SparkToro',url:'https://sparktoro.com',desc:'Qué lee y escucha tu target'},{name:'Google Analytics',url:'https://analytics.google.com',desc:'Comportamiento de tu audiencia'}],
}
function ToolsBlock({title,cat}:{title:string;cat:string}) {
  const [open,setOpen]=useState(false)
  return (
    <div style={{ background:P.bg2, border:`1px solid ${P.border}`, borderRadius:12, padding:'13px 18px', marginTop:16 }}>
      <button onClick={()=>setOpen(!open)} style={{ background:'none', border:'none', cursor:'pointer', width:'100%', textAlign:'left', display:'flex', justifyContent:'space-between', padding:0 }}>
        <span style={{ fontSize:14, fontWeight:700, color:P.txt2 }}>🔧 Herramientas — {title}</span>
        <span style={{ color:P.txt3 }}>{open?'▲':'▼'}</span>
      </button>
      {open && <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10, marginTop:12 }}>
        {(TOOLS[cat]||[]).map((t,i)=>(
          <a key={i} href={t.url} target="_blank" rel="noopener noreferrer" style={{ background:P.card, border:`1px solid ${P.border}`, borderRadius:10, padding:'11px 13px', textDecoration:'none', display:'block' }}>
            <div style={{ fontWeight:700, fontSize:14, color:P.acc, marginBottom:3 }}>{t.name} ↗</div>
            <div style={{ fontSize:12, color:P.txt2 }}>{t.desc}</div>
          </a>
        ))}
      </div>}
    </div>
  )
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({title,body,btn,onClose}:{title:string;body:string;btn:string;onClose:()=>void}) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:P.card, borderRadius:16, padding:32, maxWidth:440, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize:20, marginBottom:12 }}>⚠️</div>
        <h3 style={{ fontSize:20, fontWeight:700, color:P.txt, marginBottom:10 }}>{title}</h3>
        <p style={{ fontSize:15, color:P.txt2, lineHeight:1.6, marginBottom:24 }}>{body}</p>
        <button onClick={onClose} style={{ ...BTN_P, width:'100%' }}>{btn}</button>
      </div>
    </div>
  )
}

// ─── VALUE LADDER EDITOR ──────────────────────────────────────────────────────
function ValLadder({steps,onChange,onGetIdeas,busy}:{steps:ValStep[];onChange:(s:ValStep[])=>void;onGetIdeas:()=>void;busy:boolean}) {
  const TIPOS = ['TOFU','MOFU','BOFU','FIDELIZACIÓN','RETENTION']
  function move(i:number,dir:number){const a=[...steps];[a[i],a[i+dir]]=[a[i+dir],a[i]];onChange(a)}
  function del(id:string){onChange(steps.filter(s=>s.id!==id))}
  function upd(id:string,f:keyof ValStep,v:string){onChange(steps.map(s=>s.id===id?{...s,[f]:v}:s))}
  function add(){onChange([...steps,{id:uid(),tipo:'MOFU',accion:'',objetivo:''}])}
  const phColors:Record<string,string>={TOFU:'#f59e0b',MOFU:'#0284c7',BOFU:'#059669',FIDELIZACIÓN:'#7c3aed',RETENTION:'#ec4899'}
  return (
    <div>
      {steps.map((s,i)=>(
        <div key={s.id} style={{ background:P.bg2, borderRadius:10, padding:'14px 16px', marginBottom:10, display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ width:4, borderRadius:4, background:phColors[s.tipo]||P.acc, alignSelf:'stretch', flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
              <select value={s.tipo} onChange={e=>upd(s.id,'tipo',e.target.value)} style={{ ...INP, marginBottom:0, width:'auto', fontSize:13, padding:'6px 10px', cursor:'pointer' }}>
                {TIPOS.map(t=><option key={t}>{t}</option>)}
              </select>
              <span style={{ fontSize:11, fontWeight:700, color:phColors[s.tipo]||P.acc, alignSelf:'center' }}>Paso {i+1}</span>
            </div>
            <input style={{ ...INP, marginBottom:6, fontSize:14 }} placeholder="Acción concreta..." value={s.accion} onChange={e=>upd(s.id,'accion',e.target.value)} />
            <input style={{ ...INP, marginBottom:0, fontSize:13 }} placeholder="Objetivo de este paso..." value={s.objetivo} onChange={e=>upd(s.id,'objetivo',e.target.value)} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
            <button onClick={()=>i>0&&move(i,-1)} style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${P.border}`, background:P.card, cursor:'pointer', fontSize:12, color:P.txt2 }} disabled={i===0}>↑</button>
            <button onClick={()=>i<steps.length-1&&move(i,1)} style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${P.border}`, background:P.card, cursor:'pointer', fontSize:12, color:P.txt2 }} disabled={i===steps.length-1}>↓</button>
            <button onClick={()=>del(s.id)} style={{ padding:'4px 8px', borderRadius:6, border:`1px solid #fecaca`, background:P.errL, cursor:'pointer', fontSize:12, color:P.err }}>✕</button>
          </div>
        </div>
      ))}
      <div style={{ display:'flex', gap:10, marginTop:10 }}>
        <button onClick={add} style={BTN_SM}>+ Añadir paso</button>
        <button onClick={onGetIdeas} style={{ ...BTN_SM, background:'#f5f3ff', borderColor:P.pur, color:P.pur }} disabled={busy}>{busy?'⏳ Pensando...':'🤖 Más ideas con IA'}</button>
      </div>
    </div>
  )
}

// ─── OBJECTIVES EDITOR ────────────────────────────────────────────────────────
function ObjectivesEditor({rows,onChange}:{rows:ObjRow[];onChange:(r:ObjRow[])=>void}) {
  function upd(id:string,f:keyof ObjRow,v:string){onChange(rows.map(r=>r.id===id?{...r,[f]:v}:r))}
  function del(id:string){onChange(rows.filter(r=>r.id!==id))}
  function add(){onChange([...rows,{id:uid(),tipo:'Marketing',kpi:'',dato:'',tiempo:'mes'}])}
  return (
    <div>
      {rows.length>0&&(
        <div style={{ display:'grid', gap:10, marginBottom:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8 }}>
            {['Tipo','KPI','Dato','Tiempo',''].map((h,i)=><div key={i} style={{ fontSize:11, fontWeight:700, color:P.txt3, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</div>)}
          </div>
          {rows.map(r=>(
            <div key={r.id} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8, alignItems:'center' }}>
              <select value={r.tipo} onChange={e=>upd(r.id,'tipo',e.target.value)} style={{ ...INP, marginBottom:0, padding:'9px 10px', fontSize:14, cursor:'pointer' }}>
                <option>Marketing</option><option>Comunicación</option>
              </select>
              <select value={r.kpi} onChange={e=>upd(r.id,'kpi',e.target.value)} style={{ ...INP, marginBottom:0, padding:'9px 10px', fontSize:14, cursor:'pointer' }}>
                <option value="">— KPI —</option>
                {KPI_OPTIONS.map(k=><option key={k}>{k}</option>)}
              </select>
              <input style={{ ...INP, marginBottom:0, fontSize:14 }} placeholder="Ej: 1.000" value={r.dato} onChange={e=>upd(r.id,'dato',e.target.value)} />
              <select value={r.tiempo} onChange={e=>upd(r.id,'tiempo',e.target.value)} style={{ ...INP, marginBottom:0, padding:'9px 10px', fontSize:14, cursor:'pointer' }}>
                <option value="mes">Al mes</option><option value="trimestre">Trimestre</option>
                <option value="semestre">Semestre</option><option value="año">Al año</option>
              </select>
              <button onClick={()=>del(r.id)} style={{ padding:'9px 12px', borderRadius:8, border:`1px solid #fecaca`, background:P.errL, cursor:'pointer', fontSize:13, color:P.err }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <button onClick={add} style={BTN_SM}>+ Añadir objetivo</button>
    </div>
  )
}

// ─── CHANNEL SELECTOR ─────────────────────────────────────────────────────────
function ChannelSelector({selected,onChange}:{selected:string[];onChange:(s:string[])=>void}) {
  const PHASE_LABELS:{[k:string]:string} = {notoriedad:'📣 Notoriedad',interaccion:'🔄 Interacción',lead_venta:'💰 Lead / Venta',fidelizacion:'❤️ Fidelización'}
  const PHASE_COLORS:{[k:string]:string} = {notoriedad:P.warn,interaccion:P.acc,lead_venta:P.ok,fidelizacion:P.pur}
  function toggle(ch:string){onChange(selected.includes(ch)?selected.filter(s=>s!==ch):[...selected,ch])}
  return (
    <div>
      {Object.entries(CH_OPTIONS).map(([phase,channels])=>(
        <div key={phase} style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PHASE_COLORS[phase], marginBottom:8 }}>{PHASE_LABELS[phase]}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {channels.map(ch=>{
              const on=selected.includes(ch)
              return (
                <button key={ch} onClick={()=>toggle(ch)} style={{ padding:'7px 14px', borderRadius:20, border:`1.5px solid ${on?PHASE_COLORS[phase]:P.border}`, background:on?PHASE_COLORS[phase]+'15':P.bg2, color:on?PHASE_COLORS[phase]:P.txt2, fontWeight:on?700:500, fontSize:13, cursor:'pointer', transition:'all 0.15s' }}>
                  {on?'✓ ':''}{ch}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── PHASES NAV ───────────────────────────────────────────────────────────────
const PHASES = [{icon:'📝',label:'Datos'},{icon:'🌍',label:'Entorno'},{icon:'🎯',label:'Target'},{icon:'📐',label:'Estrategia'},{icon:'📊',label:'Táctico'},{icon:'✅',label:'Resumen'}]

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function NuevoPlanPage() {
  const [step,setStep]=useState(0)
  const [busy,setBusy]=useState(false)
  const [aiMsg,setAiMsg]=useState('')
  const [err,setErr]=useState('')
  const [modal,setModal]=useState<{title:string;body:string}|null>(null)
  const [saveModal,setSaveModal]=useState(false)
  const [planName,setPlanName]=useState('')
  const [showStrategy,setShowStrategy]=useState(false)
  const [plan,setPlan]=useState<PlanData>({
    pais:'España',sector:'',producto:'',tipo_negocio:'B2C',
    competidores:'',presupuesto:'',fase_negocio:'launch',usp:'',
    entorno:null,target:null,estrategia:null,
    edits:{},completed:[],
    valueSteps:[],objectives:[{id:uid(),tipo:'Marketing',kpi:'',dato:'',tiempo:'mes'}],
    selectedChannels:[],
  })
  const supabase=createClient()
  const router=useRouter()

  function upd(f:keyof PlanData,v:string){setPlan(p=>({...p,[f]:v}))}
  function se(k:string,v:string){setPlan(p=>({...p,edits:{...p.edits,[k]:v}}))}
  function ed(k:string,fb:string){return plan.edits[k]!==undefined?plan.edits[k]:fb}
  function done(s:number){setPlan(p=>({...p,completed:p.completed.includes(s)?p.completed:[...p.completed,s]}))}

  async function ai(fase:string,extra?:Record<string,string>) {
    setBusy(true);setErr('')
    const msgs:Record<string,string>={entorno:`Analizando mercado de ${plan.sector} en ${plan.pais}...`,target:'Creando buyer persona y target...',estrategia:'Creando estrategia de canales...',escalera_ideas:'Generando ideas de valor...',refine:'Mejorando el texto...'}
    setAiMsg('🤖 '+( msgs[fase]||'Procesando...'))
    try {
      const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fase,datos:{pais:plan.pais,sector:plan.sector,producto:plan.producto,tipo_negocio:plan.tipo_negocio,competidores:plan.competidores,presupuesto:plan.presupuesto,fase_negocio:plan.fase_negocio,usp:plan.usp,...extra}})})
      const json=await res.json()
      if(!json.success)throw new Error(json.error)
      return json.data as Obj
    } catch {setErr('Error con la IA. Inténtalo de nuevo.');return null}
    finally{setBusy(false);setAiMsg('')}
  }

  async function refine(fkey:string,cur:string,p:string){const r=await ai('refine',{field_key:fkey,current_value:cur,user_prompt:p});if(r&&typeof r.refined_text==='string')se(fkey,r.refined_text)}

  // Advance handlers
  async function s0next(){
    if(!plan.sector||!plan.producto){setErr('Rellena sector y descripción del producto');return}
    if(plan.entorno){done(0);setStep(1);return}
    const r=await ai('entorno');if(r){setPlan(p=>({...p,entorno:r}));done(0);setStep(1)}
  }

  async function s1next(){
    if(plan.target){done(1);setStep(2);return}
    const r=await ai('target')
    if(r){
      const rawSteps=ga(r as Obj,'escalera_valor')
      const steps:ValStep[]=rawSteps.map((s,i)=>{const obj=s as Obj;return{id:uid(),tipo:ss(obj.tipo)||'MOFU',accion:ss(obj.accion)||'',objetivo:ss(obj.objetivo)||''}})
      setPlan(p=>({...p,target:r as Obj,valueSteps:steps}));done(1);setStep(2)
    }
  }

  function s2next(){
    if(!ed('d_fo','')&&!plan.edits['d_fo']){setModal({title:'Fortalezas obligatorias',body:'Las fortalezas de tu producto son información clave que la IA necesita para crear una estrategia personalizada. Por favor, rellena al menos las fortalezas antes de continuar.'});return}
    done(2);setStep(3);setShowStrategy(false)
  }

  async function createStrategy(){
    const objText=plan.objectives.map(o=>`${o.tipo}: ${o.kpi} = ${o.dato} / ${o.tiempo}`).join(' | ')
    const chText=plan.selectedChannels.join(', ')||'Sin selección'
    const r=await ai('estrategia',{objetivos:objText,canales_seleccionados:chText,fortalezas:ed('d_fo',''),usp:plan.usp})
    if(r){setPlan(p=>({...p,estrategia:r as Obj}));setShowStrategy(true)}
  }

  async function getValIdeas(){
    const cur=plan.valueSteps.map(s=>`${s.tipo}: ${s.accion}`).join(' | ')
    const r=await ai('escalera_ideas',{pasos_actuales:cur})
    if(r&&Array.isArray(r.nuevos_pasos)){
      const newSteps:ValStep[]=(r.nuevos_pasos as Obj[]).map(s=>({id:uid(),tipo:ss(s.tipo)||'MOFU',accion:ss(s.accion)||'',objetivo:ss(s.objetivo)||''}))
      setPlan(p=>({...p,valueSteps:[...p.valueSteps,...newSteps]}))
    }
  }

  async function handleSave(){
    if(!planName.trim()){return}
    setBusy(true)
    try{
      const{data:{user}}=await supabase.auth.getUser()
      if(!user){router.push('/login');return}
      const{error:saveErr}=await supabase.from('plans').insert({
        user_id:user.id,name:planName.trim(),
        pais:plan.pais,sector:plan.sector,producto:plan.producto,
        tipo_negocio:plan.tipo_negocio,fase_negocio:plan.fase_negocio,
        usp:plan.usp,entorno:plan.entorno,target:plan.target,
        estrategia:plan.estrategia,status:'completed',
      })
      if(saveErr)throw saveErr
      router.push('/dashboard?saved=true')
    }catch(e){setErr('Error guardando. Inténtalo de nuevo.');setBusy(false)}
  }

  const VIMEO_IDS:Record<number,string>={0:'1103392013',1:'1103392013',2:'1103392013',3:'1103392013',4:'1103392013',5:'1103392013'}

  return (
    <div style={{ minHeight:'100vh', background:P.bg, color:P.txt, fontFamily:'inherit' }}>

      {/* HEADER */}
      <div style={{ borderBottom:`1px solid ${P.border}`, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(8px)', position:'sticky', top:0, zIndex:30, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth:step===4?'100%':940, margin:'0 auto', padding:'0 24px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <a href="/dashboard" style={{ textDecoration:'none', fontSize:14, color:P.txt2, fontWeight:500, whiteSpace:'nowrap' }}>← Dashboard</a>
          <div style={{ display:'flex', alignItems:'center', flex:1, justifyContent:'center', gap:0, overflowX:'auto' }}>
            {PHASES.map((ph,i)=>{
              const dn=plan.completed.includes(i);const cur=step===i
              const acc2=i===0||dn||plan.completed.includes(i-1)||step>=i
              return(
                <button key={i} onClick={()=>acc2&&setStep(i)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'5px 10px', background:cur?P.accL:'transparent', border:'none', borderRadius:8, cursor:acc2?'pointer':'default', opacity:acc2?1:0.35 }}>
                  <span style={{ fontSize:14 }}>{dn&&!cur?'✓':ph.icon}</span>
                  <span style={{ fontSize:10, fontWeight:cur?700:500, color:cur?P.acc:dn?P.ok:P.txt3, whiteSpace:'nowrap' }}>{ph.label}</span>
                </button>
              )
            })}
          </div>
          <span style={{ fontSize:12, color:P.txt3, whiteSpace:'nowrap' }}>{step+1}/{PHASES.length}</span>
        </div>
      </div>

      {/* AI BANNER */}
      {busy&&<div style={{ position:'fixed', top:58, left:0, right:0, zIndex:40, background:P.accL, borderBottom:`1px solid ${P.acc}`, padding:'10px 24px', display:'flex', gap:10, alignItems:'center' }}><div style={{ width:18, height:18, border:`2.5px solid ${P.acc}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }}/><span style={{ fontSize:14, color:P.acc, fontWeight:600 }}>{aiMsg}</span></div>}

      {/* MODALS */}
      {modal&&<Modal title={modal.title} body={modal.body} btn="Entendido, voy a rellenarlo" onClose={()=>setModal(null)}/>}
      {saveModal&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:P.card, borderRadius:16, padding:32, maxWidth:440, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize:22, fontWeight:700, color:P.txt, marginBottom:8 }}>💾 Guardar Plan</h3>
            <p style={{ fontSize:15, color:P.txt2, marginBottom:20 }}>Dale un nombre a tu plan para encontrarlo fácilmente en el dashboard.</p>
            <label style={LBL}>Nombre del plan</label>
            <input style={INP} type="text" placeholder={`Plan ${plan.sector} — ${plan.pais}`} value={planName} onChange={e=>setPlanName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSave()} autoFocus />
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button onClick={()=>setSaveModal(false)} style={BTN_S}>Cancelar</button>
              <button onClick={handleSave} style={{ ...BTN_P, flex:1, justifyContent:'center' }} disabled={busy||!planName.trim()}>{busy?'Guardando...':'💾 Guardar →'}</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — CALCULATOR */}
      {step===4&&(
        <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 58px)' }}>
          <div style={{ background:P.bg2, borderBottom:`1px solid ${P.border}`, padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:17, fontWeight:700, color:P.txt }}>📊 Fase 04 · Táctico — {plan.sector} · {plan.pais}</span>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setStep(3)} style={BTN_S}>← Atrás</button>
              <button onClick={()=>{done(4);setStep(5)}} style={{ ...BTN_P }}>Ver Resumen →</button>
            </div>
          </div>
          <iframe src="/calculadora.html" style={{ flex:1, border:'none', width:'100%' }} title="Calculadora" />
        </div>
      )}

      {step!==4&&(
        <div style={{ maxWidth:880, margin:'0 auto', padding:busy?'80px 24px 80px':'48px 24px 80px' }}>

          {err&&<div style={{ background:P.errL, border:`1px solid #fecaca`, borderRadius:10, padding:'12px 16px', fontSize:15, color:P.err, marginBottom:20 }}>⚠️ {err}</div>}

          {/* ─── STEP 0 ─── */}
          {step===0&&(
            <div>
              <VideoBlock vimeoId={VIMEO_IDS[0]} title="Introducción al Media Planning Canvas" />
              <h1 style={{ fontSize:32, fontWeight:800, color:P.txt, marginBottom:8 }}>📝 Datos de tu negocio</h1>
              <p style={{ fontSize:17, color:P.txt2, marginBottom:28, lineHeight:1.6 }}>La IA analizará tu mercado con esta información.</p>
              <div style={CARD}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
                  <div><label style={LBL}>🌍 País *</label>
                    <select style={{ ...INP, cursor:'pointer' }} value={plan.pais} onChange={e=>upd('pais',e.target.value)}>
                      {['España','México','Argentina','Colombia','Chile','Perú','Estados Unidos','United Kingdom'].map(p=><option key={p}>{p}</option>)}
                    </select></div>
                  <div><label style={LBL}>🏷️ Sector *</label>
                    <select style={{ ...INP, cursor:'pointer' }} value={plan.sector} onChange={e=>upd('sector',e.target.value)}>
                      <option value="">— Selecciona —</option>
                      {['Moda y Accesorios','Alimentación','Salud y Belleza','Tecnología','Servicios B2B','Formación y Educación','Viajes y Turismo','Inmobiliario','Deporte y Fitness','Hogar y Decoración','Automoción','Seguros y Finanzas','Hostelería y Restauración','Otros'].map(s=><option key={s}>{s}</option>)}
                    </select></div>
                </div>
                <label style={LBL}>📦 Producto o servicio *</label>
                <AutoTA value={plan.producto} onChange={v=>upd('producto',v)} placeholder="Ej: Plataforma SaaS de gestión de redes sociales para pymes..." />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
                  <div><label style={LBL}>🏢 Tipo de negocio</label>
                    <select style={{ ...INP, cursor:'pointer' }} value={plan.tipo_negocio} onChange={e=>upd('tipo_negocio',e.target.value)}>
                      <option value="B2C">B2C — Vendes a consumidores</option>
                      <option value="B2B">B2B — Vendes a empresas</option>
                      <option value="B2B2C">B2B2C — Ambos</option>
                    </select></div>
                  <div><label style={LBL}>🚀 Fase del negocio</label>
                    <select style={{ ...INP, cursor:'pointer' }} value={plan.fase_negocio} onChange={e=>upd('fase_negocio',e.target.value)}>
                      <option value="launch">🚀 Lanzamiento</option>
                      <option value="growth">📈 Crecimiento</option>
                      <option value="maturity">🏛️ Madurez</option>
                    </select></div>
                </div>
                <label style={LBL}>🏆 Competidores principales</label>
                <input style={INP} type="text" placeholder="Ej: Hootsuite, Buffer, Metricool" value={plan.competidores} onChange={e=>upd('competidores',e.target.value)} />
                <label style={LBL}>💰 Presupuesto mensual estimado</label>
                <select style={{ ...INP, cursor:'pointer' }} value={plan.presupuesto} onChange={e=>upd('presupuesto',e.target.value)}>
                  <option value="">— No especificado —</option>
                  <option value="menos_1000">Menos de €1.000/mes</option>
                  <option value="1000_3000">€1.000 – €3.000/mes</option>
                  <option value="3000_10000">€3.000 – €10.000/mes</option>
                  <option value="mas_10000">Más de €10.000/mes</option>
                </select>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button onClick={s0next} style={{ ...BTN_P, opacity:busy?0.7:1 }} disabled={busy}>{busy?'⏳ Analizando...':'🤖 Analizar Entorno →'}</button>
              </div>
            </div>
          )}

          {/* ─── STEP 1: ENTORNO ─── */}
          {step===1&&plan.entorno&&(
            <div>
              <VideoBlock vimeoId={VIMEO_IDS[1]} title="Cómo analizar el Entorno" />
              <h1 style={{ fontSize:30, fontWeight:800, color:P.txt, marginBottom:8 }}>🌍 Fase 01 · Entorno</h1>
              <p style={{ fontSize:16, color:P.txt2, marginBottom:24 }}>Edita cada campo. Usa ✨ para mejorarlo con IA.</p>

              <div style={CARD}>
                <h2 style={{ fontSize:20, fontWeight:700, color:P.txt, marginBottom:14 }}>📊 Situación del País</h2>
                <EditField label="Resumen del entorno" fkey="e_res" value={ed('e_res',gn(plan.entorno,'situacion_pais','resumen'))} onChange={v=>se('e_res',v)} onRefine={p=>refine('e_res',ed('e_res',''),p)} />
                <EditField label="Variables macroeconómicas" fkey="e_mac" value={ed('e_mac',gn(plan.entorno,'situacion_pais','variables_macro'))} onChange={v=>se('e_mac',v)} onRefine={p=>refine('e_mac',ed('e_mac',''),p)} />
                <ToolsBlock title="Análisis Macro" cat="macro" />
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:20, fontWeight:700, color:P.txt, marginBottom:14 }}>🏪 Tu Mercado</h2>
                <EditField label="Descripción del mercado" fkey="e_mkt" value={ed('e_mkt',gn(plan.entorno,'mercado','descripcion'))} onChange={v=>se('e_mkt',v)} onRefine={p=>refine('e_mkt',ed('e_mkt',''),p)} />
                <EditField label="Tamaño y tendencia" fkey="e_siz" value={ed('e_siz',[gn(plan.entorno,'mercado','tamano_estimado'),gn(plan.entorno,'mercado','tendencia')].filter(Boolean).join(' — '))} onChange={v=>se('e_siz',v)} onRefine={p=>refine('e_siz',ed('e_siz',''),p)} multiline={false} />
                <ToolsBlock title="Análisis de Mercado" cat="mercado" />
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:20, fontWeight:700, color:P.txt, marginBottom:14 }}>🥊 Competencia</h2>
                <EditField label="Análisis de la competencia" fkey="e_cmp" value={ed('e_cmp',gn(plan.entorno,'competencia','analisis'))} onChange={v=>se('e_cmp',v)} onRefine={p=>refine('e_cmp',ed('e_cmp',''),p)} />
                <ToolsBlock title="Competencia en Medios" cat="competencia" />
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:20, fontWeight:700, color:P.txt, marginBottom:14 }}>⚡ DAFO</h2>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {[
                    {k:'d_op',lb:'🟢 Oportunidades (IA)',src:gn(plan.entorno,'dafo','oportunidades'),bg:P.okL,col:P.ok,ph:''},
                    {k:'d_am',lb:'🔴 Amenazas (IA)',src:gn(plan.entorno,'dafo','amenazas'),bg:P.warnL,col:P.warn,ph:''},
                    {k:'d_fo',lb:'💪 Fortalezas (tú) *',src:'',bg:P.accL,col:P.acc,ph:'Precio competitivo, tecnología propia, equipo experto...'},
                    {k:'d_de',lb:'⚠️ Debilidades (tú)',src:'',bg:P.purL,col:P.pur,ph:'Marca nueva, equipo pequeño, recursos limitados...'},
                  ].map(item=>(
                    <div key={item.k} style={{ background:item.bg, borderRadius:10, padding:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:item.col, marginBottom:8 }}>{item.lb}</div>
                      <AutoTA style={{ background:P.card }} value={ed(item.k,item.src)} onChange={v=>se(item.k,v)} placeholder={item.ph} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button onClick={()=>setStep(0)} style={BTN_S}>← Atrás</button>
                <button onClick={s1next} style={{ ...BTN_P, opacity:busy?0.7:1 }} disabled={busy}>{busy?'⏳ Analizando target...':'🤖 Analizar Target →'}</button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: TARGET ─── */}
          {step===2&&plan.target&&(
            <div>
              <VideoBlock vimeoId={VIMEO_IDS[2]} title="Cómo definir el Target y Buyer Persona" />
              <h1 style={{ fontSize:30, fontWeight:800, color:P.txt, marginBottom:8 }}>🎯 Fase 02 · Producto & Target</h1>
              <p style={{ fontSize:16, color:P.txt2, marginBottom:24 }}>Define tu propuesta de valor y conoce en profundidad a tu buyer persona.</p>

              <div style={CARD}>
                <h2 style={{ fontSize:20, fontWeight:700, color:P.txt, marginBottom:6 }}>✦ USP — Propuesta Única de Valor</h2>
                <p style={{ fontSize:14, color:P.txt2, marginBottom:14 }}>Una frase que ningún competidor pueda copiar.</p>
                <EditField label="" fkey="usp" value={ed('usp',plan.usp)} onChange={v=>{se('usp',v);upd('usp',v)}} onRefine={p=>refine('usp',ed('usp',plan.usp),p)} multiline={false} />
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:20, fontWeight:700, color:P.txt, marginBottom:4 }}>👥 Core Target</h2>
                <EditField label="Descripción" fkey="t_cor" value={ed('t_cor',gn(plan.target,'core_target','descripcion'))} onChange={v=>se('t_cor',v)} onRefine={p=>refine('t_cor',ed('t_cor',''),p)} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <EditField label="Volumen estimado" fkey="t_vol" value={ed('t_vol',gn(plan.target,'core_target','volumen_estimado'))} onChange={v=>se('t_vol',v)} onRefine={p=>refine('t_vol',ed('t_vol',''),p)} multiline={false} />
                  <EditField label="Edad / Sociodemográfico" fkey="t_soc" value={ed('t_soc',gn(plan.target,'core_target','sociodemografico','edad'))} onChange={v=>se('t_soc',v)} onRefine={p=>refine('t_soc',ed('t_soc',''),p)} multiline={false} />
                </div>
                <ToolsBlock title="Análisis de Audiencias" cat="target" />
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:20, fontWeight:700, color:P.txt, marginBottom:6 }}>🧠 Buyer Persona</h2>
                <div style={{ background:P.accL, border:`1px solid ${P.acc}`, borderRadius:12, padding:18, marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:P.acc, marginBottom:8 }}>📖 Descripción narrativa</div>
                  <AutoTA style={{ background:P.card }} value={ed('bp_nar',gn(plan.target,'buyer_persona','descripcion_narrativa'))} onChange={v=>se('bp_nar',v)} placeholder="Marisa es directora de marketing de una empresa de servicios..." />
                  <button onClick={()=>refine('bp_nar',ed('bp_nar',''),'Hazlo más detallado y humano')} style={{ ...BTN_SM, marginTop:8 }}>✨ Mejorar con IA</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {[
                    {k:'bp_mom',lb:'⏰ Momentos en que piensa en el producto',src:gn(plan.target,'buyer_persona','momentos_pensamiento')},
                    {k:'bp_pns',lb:'💭 Qué piensa de este tipo de productos',src:gn(plan.target,'buyer_persona','que_piensa_producto')},
                    {k:'bp_inf',lb:'🔍 Dónde se informa',src:gn(plan.target,'buyer_persona','donde_se_informa')},
                    {k:'bp_esc',lb:'👂 Qué escucha en el mercado',src:gn(plan.target,'buyer_persona','que_escucha_mercado')},
                    {k:'bp_dic',lb:'💬 Qué dice',src:gn(plan.target,'buyer_persona','que_dice')},
                    {k:'bp_exp',lb:'✨ Expectativas',src:gn(plan.target,'buyer_persona','expectativas')},
                    {k:'bp_bar',lb:'🚧 Barreras a la compra',src:gn(plan.target,'buyer_persona','barreras_compra')},
                    {k:'bp_cre',lb:'🔒 Barreras a la comunicación (credibilidad)',src:gn(plan.target,'buyer_persona','barreras_comunicacion')},
                    {k:'bp_ins',lb:'💡 Consumer Insight (qué les mueve a comprar)',src:gn(plan.target,'buyer_persona','consumer_insight')},
                  ].map(f=>(
                    <EditField key={f.k} label={f.lb} fkey={f.k} value={ed(f.k,f.src)} onChange={v=>se(f.k,v)} onRefine={p=>refine(f.k,ed(f.k,f.src),p)} />
                  ))}
                </div>
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:20, fontWeight:700, color:P.txt, marginBottom:14 }}>🪜 Escalera de Valor</h2>
                <p style={{ fontSize:14, color:P.txt2, marginBottom:16 }}>Cómo llevas al cliente de desconocido a fan. Edita, reordena o elimina cada paso.</p>
                <ValLadder steps={plan.valueSteps} onChange={steps=>setPlan(p=>({...p,valueSteps:steps}))} onGetIdeas={getValIdeas} busy={busy} />
              </div>

              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button onClick={()=>setStep(1)} style={BTN_S}>← Atrás</button>
                <button onClick={s2next} style={{ ...BTN_P, opacity:busy?0.7:1 }} disabled={busy}>Definir Estrategia →</button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: ESTRATEGIA ─── */}
          {step===3&&(
            <div>
              <VideoBlock vimeoId={VIMEO_IDS[3]} title="Cómo definir la Estrategia" />
              <h1 style={{ fontSize:30, fontWeight:800, color:P.txt, marginBottom:8 }}>📐 Fase 03 · Estrategia</h1>
              <p style={{ fontSize:16, color:P.txt2, marginBottom:24 }}>Define tus objetivos y elige los canales. Luego la IA creará la estrategia.</p>

              {/* OBJECTIVES */}
              <div style={CARD}>
                <h2 style={{ fontSize:20, fontWeight:700, color:P.txt, marginBottom:6 }}>🎯 Objetivos del Plan</h2>
                <p style={{ fontSize:14, color:P.txt2, marginBottom:16 }}>Define qué quieres conseguir. Añade tantos como necesites.</p>
                <ObjectivesEditor rows={plan.objectives} onChange={rows=>setPlan(p=>({...p,objectives:rows}))} />
              </div>

              {/* CHANNEL SELECTION */}
              <div style={CARD}>
                <h2 style={{ fontSize:20, fontWeight:700, color:P.txt, marginBottom:6 }}>📡 Selecciona tus Canales</h2>
                <p style={{ fontSize:14, color:P.txt2, marginBottom:16 }}>Elige los canales con los que vas a trabajar. La IA los completará y recomendará el mix óptimo.</p>
                <div style={{ background:P.accL, borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:14, color:P.acc }}>
                  ✓ <strong>{plan.selectedChannels.length}</strong> canales seleccionados
                </div>
                <ChannelSelector selected={plan.selectedChannels} onChange={chs=>setPlan(p=>({...p,selectedChannels:chs}))} />
              </div>

              {/* CREATE STRATEGY BUTTON */}
              {!showStrategy&&(
                <div style={{ textAlign:'center', padding:'32px 0' }}>
                  <p style={{ fontSize:15, color:P.txt2, marginBottom:20 }}>Cuando hayas definido tus objetivos y canales, pulsa el botón para que la IA cree tu estrategia.</p>
                  <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                    <button onClick={()=>setStep(2)} style={BTN_S}>← Atrás</button>
                    <button onClick={createStrategy} style={{ ...BTN_P, fontSize:17, padding:'15px 36px' }} disabled={busy}>
                      {busy?'⏳ Creando estrategia...':'🤖 Crear Estrategia →'}
                    </button>
                  </div>
                </div>
              )}

              {/* STRATEGY RESULT */}
              {showStrategy&&plan.estrategia&&(
                <div>
                  <div style={{ ...CARD, background:P.accL, border:`1.5px solid ${P.acc}` }}>
                    <h2 style={{ fontSize:20, fontWeight:700, color:P.acc, marginBottom:10 }}>📐 Estrategia Recomendada por la IA</h2>
                    <p style={{ fontSize:16, color:P.txt, lineHeight:1.7 }}>{gn(plan.estrategia,'estrategia_resumen')}</p>
                  </div>

                  {/* Channels by phase */}
                  {['notoriedad','interaccion','lead_venta','fidelizacion'].map(ph=>{
                    const phLabel:{[k:string]:string}={notoriedad:'📣 Notoriedad',interaccion:'🔄 Interacción',lead_venta:'💰 Lead / Venta',fidelizacion:'❤️ Fidelización'}
                    const phColor:{[k:string]:string}={notoriedad:P.warn,interaccion:P.acc,lead_venta:P.ok,fidelizacion:P.pur}
                    const channels=ga(plan.estrategia,'canales_por_fase',ph) as Obj[]
                    if(!channels||channels.length===0)return null
                    return(
                      <div key={ph} style={CARD}>
                        <h2 style={{ fontSize:18, fontWeight:700, color:phColor[ph], marginBottom:14 }}>{phLabel[ph]}</h2>
                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                          {channels.map((ch,i)=>(
                            <div key={i} style={{ background:P.bg2, borderRadius:10, padding:'14px 16px', display:'flex', gap:12 }}>
                              <div style={{ width:4, background:phColor[ph], borderRadius:4, flexShrink:0, alignSelf:'stretch' }}/>
                              <div style={{ flex:1 }}>
                                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                                  <span style={{ fontSize:16, fontWeight:700, color:P.txt }}>{ss(ch.canal)}</span>
                                  <span style={{ fontSize:12, color:P.txt3 }}>KPI: {ss(ch.kpi)}</span>
                                  <span style={{ fontSize:12, color:phColor[ph], marginLeft:'auto' }}>{ss(ch.presupuesto_pct)}% presupuesto</span>
                                </div>
                                <div style={{ fontSize:14, color:P.txt2, marginBottom:4 }}>{ss(ch.accion)}</div>
                                <div style={{ fontSize:13, color:P.txt3 }}>{ss(ch.razon)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {/* Quick wins */}
                  {ga(plan.estrategia,'quick_wins').length>0&&(
                    <div style={CARD}>
                      <h2 style={{ fontSize:18, fontWeight:700, color:P.txt, marginBottom:12 }}>⚡ Quick Wins</h2>
                      {ga(plan.estrategia,'quick_wins').map((qw,i)=>(
                        <div key={i} style={{ display:'flex', gap:12, background:P.okL, borderRadius:10, padding:'11px 14px', marginBottom:8 }}>
                          <span style={{ background:P.ok, color:'#fff', borderRadius:6, width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, flexShrink:0 }}>{i+1}</span>
                          <span style={{ fontSize:15, color:P.txt }}>{ss(qw)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={()=>setStep(2)} style={BTN_S}>← Atrás</button>
                      <button onClick={()=>{setShowStrategy(false)}} style={BTN_S}>🔄 Regenerar</button>
                    </div>
                    <button onClick={()=>{done(3);setStep(4)}} style={{ ...BTN_P }}>Abrir Calculadora →</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 5: RESUMEN ─── */}
          {step===5&&(
            <div>
              <h1 style={{ fontSize:30, fontWeight:800, color:P.txt, marginBottom:8 }}>✅ Resumen Ejecutivo</h1>
              <p style={{ fontSize:16, color:P.txt2, marginBottom:28 }}>Tu plan de marketing está listo. Dale un nombre y guárdalo.</p>

              <div style={{ background:P.accL, border:`1.5px solid ${P.acc}`, borderRadius:16, padding:32, textAlign:'center', marginBottom:24 }}>
                <div style={{ fontSize:22, fontWeight:800, color:P.txt, marginBottom:4 }}>Plan de Marketing — {plan.sector}</div>
                <div style={{ fontSize:15, color:P.txt2, marginBottom:24 }}>{plan.pais} · {plan.tipo_negocio} · {plan.fase_negocio}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, maxWidth:440, margin:'0 auto' }}>
                  {[{icon:'🌍',lb:'Entorno',ok:!!plan.entorno},{icon:'🎯',lb:'Target',ok:!!plan.target},{icon:'📐',lb:'Estrategia',ok:!!plan.estrategia},{icon:'📊',lb:'Táctico',ok:plan.completed.includes(4)}].map((it,i)=>(
                    <div key={i} style={{ background:it.ok?P.okL:P.bg2, border:`1px solid ${it.ok?'#bbf7d0':P.border}`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:20 }}>{it.icon}</span>
                      <div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:13, color:P.txt2 }}>Fase {i+1}</div><div style={{ fontSize:15, fontWeight:700, color:P.txt }}>{it.lb}</div></div>
                      <span style={{ fontWeight:700, color:it.ok?P.ok:P.txt3 }}>{it.ok?'✓':'—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
                <button onClick={()=>setSaveModal(true)} style={{ ...BTN_P, fontSize:17, padding:'15px 32px' }}>💾 Guardar Plan</button>
                <button style={BTN_S}>🖨️ Exportar PDF</button>
              </div>
              <div style={{ marginTop:20 }}>
                <button onClick={()=>setStep(4)} style={BTN_S}>← Volver al Táctico</button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
