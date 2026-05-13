'use client'
export const dynamic = 'force-dynamic'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { MpcMark, MpcLockup } from '@/lib/MpcLogo'
import { useRouter } from 'next/navigation'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Jv = string | number | boolean | null | Jv[] | { [k: string]: Jv }
type Obj = { [k: string]: Jv }
interface ValStep { id: string; tipo: string; accion: string; objetivo: string }
interface ObjRow { id: string; tipo: string; kpi: string; dato: string; tiempo: string }
interface PlanData {
  projectName: string
  pais: string; sector: string; producto: string; web: string
  tipo_negocio: string; competidores: string; presupuesto: string; fase_negocio: string; usp: string
  entorno: Obj | null; target: Obj | null; estrategia: Obj | null
  edits: { [k: string]: string }
  completed: number[]
  valueSteps: ValStep[]
  objectives: ObjRow[]
  selectedChannels: string[]
}

// ─── BRAND COLORS ────────────────────────────────────────────────────────────
const C = {
  paper: '#F6F4EF', paper2: '#ECE8DF', paper3: '#E2DDD0',
  navy: '#0F2942', navy7: '#163659',
  steel: '#4A6B8A', steel1: '#DDE2E8', steel2: '#B5C2D0', steel3: '#8AA0B5',
  accent: '#C75A3C', accent7: '#A6452C',
  success: '#2F7D5C', warn: '#C28840', white: '#FFFFFF',
}

// ─── BASE STYLES ─────────────────────────────────────────────────────────────
const INP: React.CSSProperties = { width:'100%', background:C.white, border:`1px solid ${C.steel1}`, borderRadius:6, padding:'10px 14px', color:C.navy, fontSize:15, outline:'none', display:'block', marginBottom:6, boxSizing:'border-box', fontFamily:"'Geist',sans-serif", lineHeight:'1.5' }
const LBL: React.CSSProperties = { display:'block', fontSize:12, fontWeight:500, color:C.steel3, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:6, marginTop:16, fontFamily:"'Geist Mono',monospace" }
const CARD: React.CSSProperties = { background:C.white, border:`1px solid ${C.steel1}`, borderRadius:10, padding:24, marginBottom:16, boxShadow:'0 1px 2px rgba(15,41,66,0.05)' }
const BTN_P: React.CSSProperties = { padding:'11px 24px', borderRadius:6, background:C.navy, border:'none', color:C.paper, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:"'Geist',sans-serif", letterSpacing:'-0.01em' }
const BTN_S: React.CSSProperties = { padding:'11px 18px', borderRadius:6, background:'transparent', border:`1px solid ${C.steel1}`, color:C.steel, fontWeight:500, fontSize:14, cursor:'pointer', fontFamily:"'Geist',sans-serif" }
const BTN_SM: React.CSSProperties = { padding:'7px 14px', borderRadius:6, background:C.paper, border:`1px solid ${C.steel1}`, color:C.steel, fontWeight:500, fontSize:12, cursor:'pointer', fontFamily:"'Geist',sans-serif" }

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function ss(v: Jv): string { if(v===null||v===undefined)return ''; if(typeof v==='string')return v; if(typeof v==='number'||typeof v==='boolean')return String(v); if(Array.isArray(v))return v.map(x=>ss(x as Jv)).join('\n'); return '' }
function gn(obj:Obj|null,...keys:string[]):string { if(!obj)return ''; let cur:Jv=obj; for(const k of keys){if(!cur||typeof cur!=='object'||Array.isArray(cur))return ''; cur=(cur as Obj)[k]} return ss(cur) }
function ga(obj:Obj|null,...keys:string[]):Jv[] { if(!obj)return []; let cur:Jv=obj; for(const k of keys){if(!cur||typeof cur!=='object'||Array.isArray(cur))return []; cur=(cur as Obj)[k]} return Array.isArray(cur)?cur:[] }
function uid() { return Math.random().toString(36).slice(2) }

const KPI_MKT = ['Ventas','Leads','Registros','Tráfico web','Share of market','CAC','LTV','Churn','MRR/ARR','Uso del producto','Fidelización','Demos','Descargas','Suscripciones','Otro...']
const KPI_COM = ['Notoriedad de marca','Cobertura','Alcance','Seguidores RRSS','Conocimiento de funcionalidad','Afinidad de marca','Frecuencia de impacto','Compartir experiencia','Visualizaciones','Reposicionamiento','Otro...']

const CH_OPTIONS: Record<string, string[]> = {
  notoriedad: ['Meta Ads Branding','TikTok Ads Branding','LinkedIn Ads Branding','YouTube Branding','Display Branding','Influencer Paid','Influencer Envío Producto','Brand Ambassadors','Employer Branding','Employee Advocacy','Ponencias en Eventos','Contenidos Medios Pagados','Colaboración con Medios','Branded Content','Sponsorship','Podcast Propio','Blog / Vblog','Contenidos RRSS','Boca a Oreja','Premios','Brand Days','Exterior','Prensa y Revistas','Radio','TV','Cine'],
  interaccion: ['LinkedIn Empresa','LinkedIn Perfiles Personales','LinkedIn Groups','Webinars','Workshops','Contenidos Formativos','Eventos Propios','Google Business','Live Streaming','Referencias Online','Web Corporativa','Concursos','Acudir a Eventos','Comunidad Propia','Networking','WhatsApp Business','Bot IA','Demos','Casos de Éxito','Propuestas Interactivas','Soporte Humano','Call Center','Banners Interactivos','Slideshare','Puntos de Venta','Flyers','Seeding','Internet of Things'],
  lead_venta: ['SEO','ASO','Link Building','SEM / Buscadores','LLM Ads','Meta Ads Performance','TikTok Performance','LinkedIn Performance','Display Retargeting','Display Performance','Email BBDD Propia','Email Automation','Newsletters','Alquiler de BBDD','Cold Outreach','Social Selling','Marketing de Afiliación','Member Get Member','SMS','Influencer Performance','Lead Magnets','Cupones','Landing de Venta','Workshops Lead','Eventos Online','Eventos Presenciales','Punto de Venta','Merchandising'],
  fidelizacion: ['Email Automation CRM','WhatsApp Fidelización','Programa Fidelización','Push Notifications','SMS Fidelización','Reviews / Reputación','Comunidad Propia','Customer Success','NPS y Feedback','Contenido Exclusivo'],
}

// ─── PHASE LABELS ─────────────────────────────────────────────────────────────
const PHASES = [
  { label:'Proyecto' },{ label:'Mercado' },{ label:'Target' },
  { label:'Estrategia' },{ label:'Táctico' },{ label:'Resumen' },
]

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function AiModal({ msg }: { msg: string }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,41,66,0.45)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
      <div style={{ background:C.white, borderRadius:12, padding:'36px 44px', textAlign:'center', boxShadow:'0 24px 48px -12px rgba(15,41,66,0.35)', maxWidth:360, width:'90%' }}>
        <div style={{ width:48, height:48, border:`3px solid ${C.navy}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 20px' }} />
        <MpcMark size={32} style={{ margin:'0 auto 14px' }} />
        <div style={{ fontSize:15, fontWeight:500, color:C.navy, lineHeight:1.5 }}>{msg}</div>
        <div style={{ fontSize:12, color:C.steel3, marginTop:8, fontFamily:"'Geist Mono',monospace" }}>Esto tarda 15-20 segundos...</div>
      </div>
    </div>
  )
}

function AlertModal({ title, body, btn, onClose }: { title:string; body:string; btn:string; onClose:()=>void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,41,66,0.45)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:C.white, borderRadius:12, padding:32, maxWidth:400, width:'100%', boxShadow:'0 24px 48px -12px rgba(15,41,66,0.3)' }}>
        <div style={{ fontSize:24, marginBottom:12 }}>⚠️</div>
        <h3 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:10 }}>{title}</h3>
        <p style={{ fontSize:14, color:C.steel, lineHeight:1.6, marginBottom:24 }}>{body}</p>
        <button onClick={onClose} style={{ ...BTN_P, width:'100%', justifyContent:'center' }}>{btn}</button>
      </div>
    </div>
  )
}

function SaveModal({ onSave, onClose, busy }: { onSave:(name:string)=>void; onClose:()=>void; busy:boolean }) {
  const [n, setN] = useState('')
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,41,66,0.45)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:C.white, borderRadius:12, padding:32, maxWidth:420, width:'100%', boxShadow:'0 24px 48px -12px rgba(15,41,66,0.3)' }}>
        <h3 style={{ fontSize:20, fontWeight:600, color:C.navy, marginBottom:8 }}>Guardar plan</h3>
        <p style={{ fontSize:14, color:C.steel, marginBottom:20 }}>Dale un nombre para encontrarlo en tu dashboard.</p>
        <label style={LBL}>Nombre del proyecto</label>
        <input style={INP} type="text" placeholder="Ej: Plan Marketing Q3 2025" value={n} onChange={e=>setN(e.target.value)} onKeyDown={e=>e.key==='Enter'&&n.trim()&&onSave(n)} autoFocus />
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <button onClick={onClose} style={BTN_S}>Cancelar</button>
          <button onClick={()=>n.trim()&&onSave(n)} style={{ ...BTN_P, flex:1, justifyContent:'center' }} disabled={busy||!n.trim()}>
            {busy?'Guardando...':'Guardar →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function VideoBlock({ vimeoId, title }: { vimeoId: string; title: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border:`1px solid ${C.steel1}`, borderRadius:8, marginBottom:16, overflow:'hidden' }}>
      <button onClick={()=>setOpen(!open)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:C.paper, border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ width:28, height:28, borderRadius:6, background:C.navy, display:'flex', alignItems:'center', justifyContent:'center', color:C.paper, fontSize:12, flexShrink:0 }}>▶</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:500, color:C.navy }}>Formación — {title}</div>
          <div style={{ fontSize:11, color:C.steel3 }}>Jaime explica esta fase en vídeo</div>
        </div>
        <span style={{ color:C.steel3 }}>{open?'▲':'▼'}</span>
      </button>
      {open && (
        <div style={{ padding:'0 4px 4px' }}>
          <div style={{ position:'relative', paddingBottom:'56.25%', height:0 }}>
            <iframe src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&color=0F2942&title=0&byline=0`} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none', borderRadius:6 }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}
    </div>
  )
}

function ToolsBlock({ title, tools }: { title:string; tools:{name:string;url:string;desc:string}[] }) {
  const [open,setOpen]=useState(false)
  return (
    <div style={{ border:`1px solid ${C.steel1}`, borderRadius:8, marginTop:16 }}>
      <button onClick={()=>setOpen(!open)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 16px', background:'transparent', border:'none', cursor:'pointer', fontFamily:"'Geist',sans-serif" }}>
        <span style={{ fontSize:13, fontWeight:500, color:C.steel }}>Herramientas complementarias — {title}</span>
        <span style={{ color:C.steel3, fontSize:14 }}>{open?'▲':'▼'}</span>
      </button>
      {open && <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8, padding:'0 12px 12px' }}>
        {tools.map((t,i)=>(
          <a key={i} href={t.url} target="_blank" rel="noopener noreferrer" style={{ background:C.paper, border:`1px solid ${C.steel1}`, borderRadius:6, padding:'10px 12px', textDecoration:'none' }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.navy, marginBottom:2 }}>{t.name} ↗</div>
            <div style={{ fontSize:11, color:C.steel }}>{t.desc}</div>
          </a>
        ))}
      </div>}
    </div>
  )
}

function EditField({ label, fkey, value, onChange, onRefine, multiline=true, small=false }: { label:string; fkey:string; value:string; onChange:(v:string)=>void; onRefine:(p:string)=>void; multiline?:boolean; small?:boolean }) {
  const [rp,setRp]=useState(''); const [show,setShow]=useState(false)
  const ref=useRef<HTMLTextAreaElement>(null)
  useEffect(()=>{ if(ref.current&&multiline){ref.current.style.height='auto'; ref.current.style.height=ref.current.scrollHeight+'px'} },[value])
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        {label&&<label style={{ fontSize:small?11:12, fontWeight:500, color:C.steel3, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'Geist Mono',monospace" }}>{label}</label>}
        <button onClick={()=>setShow(!show)} style={{ fontSize:11, color:C.accent, background:'none', border:'none', cursor:'pointer', fontWeight:500, marginLeft:'auto', whiteSpace:'nowrap', fontFamily:"'Geist',sans-serif" }}>✨ Mejorar</button>
      </div>
      {multiline
        ? <textarea ref={ref} style={{ ...INP, minHeight:72, resize:'none', overflow:'hidden', fontSize:small?13:15 }} value={value} onChange={e=>{ onChange(e.target.value); if(ref.current){ref.current.style.height='auto'; ref.current.style.height=ref.current.scrollHeight+'px'} }} />
        : <input style={{ ...INP, fontSize:small?13:15 }} type="text" value={value} onChange={e=>onChange(e.target.value)} />
      }
      {show&&(
        <div style={{ background:C.paper2, border:`1px solid ${C.steel1}`, borderRadius:8, padding:12, marginTop:4, display:'flex', gap:8 }}>
          <input style={{ ...INP, marginBottom:0, flex:1, fontSize:13, background:C.white }} placeholder="Ej: Hazlo más conciso, enfócalo en B2B..." value={rp} onChange={e=>setRp(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&rp.trim()){onRefine(rp);setRp('');setShow(false)} }} />
          <button onClick={()=>{ if(rp.trim()){onRefine(rp);setRp('');setShow(false)} }} style={{ ...BTN_SM, padding:'10px 14px', whiteSpace:'nowrap', background:C.navy, color:C.paper, border:'none' }}>→</button>
        </div>
      )}
    </div>
  )
}

const TOOLS_DATA: Record<string,{name:string;url:string;desc:string}[]> = {
  macro:[{name:'Statista',url:'https://statista.com',desc:'Estadísticas globales de mercado'},{name:'DataCommons',url:'https://datacommons.org',desc:'Datos públicos de Google'},{name:'Dataset Search',url:'https://datasetsearch.research.google.com',desc:'Busca datasets por sector'},{name:'Global Market Finder',url:'https://marketfinder.thinkwithgoogle.com',desc:'Demanda global'}],
  mercado:[{name:'Google Trends',url:'https://trends.google.com',desc:'Tendencias en tiempo real'},{name:'Exploding Topics',url:'https://explodingtopics.com',desc:'Tendencias emergentes'},{name:'Helium 10',url:'https://helium10.com',desc:'Investigación en Amazon'},{name:'Ubersuggest',url:'https://neilpatel.com/ubersuggest',desc:'SEO y competencia'}],
  competencia:[{name:'SimilarWeb',url:'https://similarweb.com',desc:'Tráfico y fuentes rivales'},{name:'SEMrush',url:'https://semrush.com',desc:'SEO y SEM de competidores'},{name:'WhatRunsWhere',url:'https://whatrunswhere.com',desc:'Creatividades rival'},{name:'Inflact',url:'https://inflact.com',desc:'Instagram rival'},{name:'ScoringMy',url:'https://scoringmy.com',desc:'Puntuación digital'}],
  target:[{name:'Meta Audience Insights',url:'https://business.facebook.com/latest/insights/people',desc:'Audiencias FB/IG'},{name:'SparkToro',url:'https://sparktoro.com',desc:'Qué lee y escucha tu target'},{name:'Google Analytics',url:'https://analytics.google.com',desc:'Tu audiencia actual'}],
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function NuevoPlanPage() {
  const [step, setStep] = useState(0)
  const [aiModal, setAiModal] = useState('')
  const [alert, setAlert] = useState<{title:string;body:string}|null>(null)
  const [saveModal, setSaveModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [showStrategy, setShowStrategy] = useState(false)
  const [competidorLoading, setCompetidorLoading] = useState(false)
  const [suggestedComps, setSuggestedComps] = useState<{nombre:string;descripcion:string;url:string}[]>([])
  const [plan, setPlan] = useState<PlanData>({
    projectName:'', pais:'España', sector:'', producto:'', web:'',
    tipo_negocio:'B2C', competidores:'', presupuesto:'', fase_negocio:'launch', usp:'',
    entorno:null, target:null, estrategia:null,
    edits:{}, completed:[], valueSteps:[], objectives:[{id:uid(),tipo:'Marketing',kpi:'',dato:'',tiempo:'mes'}],
    selectedChannels:[],
  })
  const supabase = createClient()
  const router = useRouter()

  function upd(f: keyof PlanData, v: string) { setPlan(p=>({...p,[f]:v})) }
  function se(k:string,v:string) { setPlan(p=>({...p,edits:{...p.edits,[k]:v}})) }
  function ed(k:string,fb:string) { return plan.edits[k]!==undefined?plan.edits[k]:fb }
  function markDone(s:number) { setPlan(p=>({...p,completed:p.completed.includes(s)?p.completed:[...p.completed,s]})) }

  async function callAI(fase:string, extra?:Record<string,string>) {
    setBusy(true); setErr('')
    const msgs:Record<string,string> = {
      entorno:`Analizando mercado de ${plan.sector} en ${plan.pais}...`,
      target:'Creando buyer persona y target...',
      estrategia:'Creando estrategia de canales...',
      objetivos_estimados:'Calculando objetivos estimados...',
      escalera_ideas:'Generando ideas de valor...',
      refine:'Mejorando el texto...',
      canal_score:'Puntuando canales con IA...',
    }
    setAiModal(msgs[fase]||'Procesando...')
    try {
      const res = await fetch('/api/ai', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ fase, datos:{ pais:plan.pais, sector:plan.sector, producto:plan.producto, web:plan.web, tipo_negocio:plan.tipo_negocio, competidores:plan.competidores, presupuesto:plan.presupuesto, fase_negocio:plan.fase_negocio, usp:plan.usp, ...extra } })
      })
      const json = await res.json()
      if(!json.success) throw new Error(json.error)
      return json.data as Obj
    } catch { setErr('Error con la IA. Inténtalo de nuevo.'); return null }
    finally { setBusy(false); setAiModal('') }
  }

  async function refine(fkey:string,cur:string,p:string) {
    const r = await callAI('refine',{field_key:fkey,current_value:cur,user_prompt:p})
    if(r&&typeof r.refined_text==='string') se(fkey,r.refined_text)
  }

  async function buscarCompetidores() {
    if(!plan.producto||!plan.sector){setErr('Rellena primero el producto y sector');return}
    setCompetidorLoading(true); setAiModal(`Buscando competidores de ${plan.sector} en ${plan.pais}...`)
    try {
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fase:'competidores', datos:{ producto:plan.producto, pais:plan.pais, sector:plan.sector, web:plan.web } }) })
      const json = await res.json()
      if(json.success&&Array.isArray(json.data?.competidores)) {
        setSuggestedComps(json.data.competidores)
        const names = json.data.competidores.map((c: {nombre:string})=>c.nombre).join(', ')
        setPlan(p=>({...p,competidores:names}))
      }
    } catch { setErr('Error buscando competidores.') }
    finally { setCompetidorLoading(false); setAiModal('') }
  }

  async function s0next() {
    if(!plan.sector||!plan.producto) { setErr('Rellena sector y descripción del producto'); return }
    if(plan.entorno){markDone(0);setStep(1);return}
    const r = await callAI('entorno')
    if(r){setPlan(p=>({...p,entorno:r}));markDone(0);setStep(1)}
  }

  async function s1next() {
    if(!ed('d_fo','')) { setAlert({title:'Fortalezas obligatorias',body:'Las fortalezas de tu producto son clave para que la IA cree una estrategia personalizada. Por favor, rellena al menos las fortalezas antes de continuar.'}); return }
    if(plan.target){markDone(1);setStep(2);return}
    const r = await callAI('target')
    if(r){
      const rawSteps = ga(r,'escalera_valor')
      const steps:ValStep[] = rawSteps.map(s=>{const o=s as Obj;return{id:uid(),tipo:ss(o.tipo)||'MOFU',accion:ss(o.accion)||'',objetivo:ss(o.objetivo)||''}})
      setPlan(p=>({...p,target:r as Obj,valueSteps:steps}));markDone(1);setStep(2)
    }
  }

  function s2next() {
    markDone(2);setStep(3);setShowStrategy(false)
  }

  async function createStrategy() {
    const objText = plan.objectives.map(o=>`${o.tipo}: ${o.kpi} = ${o.dato} / ${o.tiempo}`).join(' | ')
    const r = await callAI('estrategia',{objetivos:objText,canales_seleccionados:plan.selectedChannels.join(', ')||'Sin selección',fortalezas:ed('d_fo','')})
    if(r){setPlan(p=>({...p,estrategia:r as Obj}));setShowStrategy(true)}
  }

  async function getValIdeas() {
    const cur = plan.valueSteps.map(s=>`${s.tipo}: ${s.accion}`).join(' | ')
    const r = await callAI('escalera_ideas',{pasos_actuales:cur})
    if(r&&Array.isArray(r.nuevos_pasos)){
      const newS:ValStep[] = (r.nuevos_pasos as Obj[]).map(s=>({id:uid(),tipo:ss(s.tipo)||'MOFU',accion:ss(s.accion)||'',objetivo:ss(s.objetivo)||''}))
      setPlan(p=>({...p,valueSteps:[...p.valueSteps,...newS]}))
    }
  }

  async function getObjectivosEstimados() {
    const targetDesc = gn(plan.target,'core_target','descripcion')
    const r = await callAI('objetivos_estimados',{target_desc:targetDesc})
    if(r){
      const mkts = (Array.isArray(r.objetivos_marketing)?r.objetivos_marketing:[]) as Obj[]
      const coms = (Array.isArray(r.objetivos_comunicacion)?r.objetivos_comunicacion:[]) as Obj[]
      const newRows:ObjRow[] = [
        ...mkts.map(o=>({id:uid(),tipo:'Marketing',kpi:ss(o.kpi),dato:ss(o.dato_estimado),tiempo:ss(o.tiempo)})),
        ...coms.map(o=>({id:uid(),tipo:'Comunicación',kpi:ss(o.kpi),dato:ss(o.dato_estimado),tiempo:ss(o.tiempo)})),
      ]
      setPlan(p=>({...p,objectives:[...p.objectives,...newRows]}))
    }
  }

  async function handleSave(name:string) {
    setBusy(true)
    const{data:{user}}=await supabase.auth.getUser()
    if(!user){router.push('/login');return}
    await supabase.from('plans').insert({
      user_id:user.id, name:name.trim(),
      pais:plan.pais, sector:plan.sector, producto:plan.producto,
      tipo_negocio:plan.tipo_negocio, fase_negocio:plan.fase_negocio,
      usp:plan.usp, entorno:plan.entorno, target:plan.target, estrategia:plan.estrategia, status:'completed',
    })
    router.push('/dashboard?saved=true')
    setBusy(false)
  }

  // Phase nav accessible if completed or current
  function canNav(i:number) { return i===0||plan.completed.includes(i-1)||step>=i }

  return (
    <div style={{ minHeight:'100vh', background:C.paper }}>
      {aiModal&&<AiModal msg={aiModal}/>}
      {alert&&<AlertModal title={alert.title} body={alert.body} btn="Entendido" onClose={()=>setAlert(null)}/>}
      {saveModal&&<SaveModal onSave={handleSave} onClose={()=>setSaveModal(false)} busy={busy}/>}

      {/* HEADER */}
      <header style={{ background:C.white, borderBottom:`1px solid ${C.steel1}`, position:'sticky', top:0, zIndex:20, boxShadow:'0 1px 2px rgba(15,41,66,0.05)' }}>
        <div style={{ maxWidth:step===4?'100%':920, margin:'0 auto', padding:'0 24px', height:56, display:'flex', alignItems:'center', gap:16 }}>
          <a href="/dashboard" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
            <MpcMark size={22} />
          </a>
          <div style={{ fontSize:12, color:C.steel2 }}>|</div>
          <div style={{ flex:1, display:'flex', gap:0, overflowX:'auto' }}>
            {PHASES.map((ph,i)=>{
              const done=plan.completed.includes(i); const cur=step===i; const acc=canNav(i)
              return(
                <button key={i} onClick={()=>acc&&setStep(i)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'5px 10px', background:cur?C.paper:'transparent', border:'none', borderRadius:6, cursor:acc?'pointer':'default', opacity:acc?1:0.4, flexShrink:0 }}>
                  <div style={{ width:20, height:20, borderRadius:4, background:done&&!cur?C.navy:cur?C.navy:C.paper2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600, color:done||cur?C.paper:C.steel3 }}>{done&&!cur?'✓':i+1}</div>
                  <span style={{ fontSize:10, fontWeight:cur?600:400, color:cur?C.navy:done?C.success:C.steel3, whiteSpace:'nowrap', fontFamily:"'Geist Mono',monospace", letterSpacing:'0.05em', textTransform:'uppercase' }}>{ph.label}</span>
                </button>
              )
            })}
          </div>
          {plan.projectName&&<div style={{ fontSize:12, color:C.steel3, fontStyle:'italic', flexShrink:0, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{plan.projectName}</div>}
          <span style={{ fontSize:11, color:C.steel3, fontFamily:"'Geist Mono',monospace", flexShrink:0 }}>{step+1}/{PHASES.length}</span>
        </div>
      </header>

      {/* TÁCTICO — fullscreen */}
      {step===4&&(
        <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 56px)' }}>
          <div style={{ background:C.white, borderBottom:`1px solid ${C.steel1}`, padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <span style={{ fontSize:16, fontWeight:600, color:C.navy }}>Táctico & Presupuesto</span>
              <span style={{ fontSize:13, color:C.steel, marginLeft:12 }}>{plan.sector} · {plan.pais} · {plan.tipo_negocio}</span>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setStep(3)} style={BTN_S}>← Atrás</button>
              <button onClick={()=>{markDone(4);setStep(5)}} style={BTN_P}>Ver Resumen →</button>
            </div>
          </div>
          <iframe src="/calculadora.html" style={{ flex:1, border:'none', width:'100%' }} title="Calculadora" />
        </div>
      )}

      {step!==4&&(
        <div style={{ maxWidth:860, margin:'0 auto', padding:'40px 24px 80px' }}>
          {err&&<div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 16px', fontSize:14, color:'#B33A2E', marginBottom:16 }}>⚠️ {err}</div>}

          {/* ── STEP 0: PROYECTO ─── */}
          {step===0&&(
            <div>
              <VideoBlock vimeoId="1103392013" title="Cómo empezar tu Media Planning Canvas" />
              <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:6, letterSpacing:'-0.02em' }}>Datos del proyecto</h1>
              <p style={{ fontSize:15, color:C.steel, marginBottom:28, lineHeight:1.6 }}>La IA analizará tu mercado con esta información.</p>
              <div style={CARD}>
                <label style={LBL}>Nombre del proyecto *</label>
                <input style={INP} type="text" placeholder="Ej: Lanzamiento App Q3 2025" value={plan.projectName} onChange={e=>upd('projectName',e.target.value)} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <label style={LBL}>País *</label>
                    <select style={{ ...INP, cursor:'pointer' }} value={plan.pais} onChange={e=>upd('pais',e.target.value)}>
                      {['España','México','Argentina','Colombia','Chile','Perú','Estados Unidos','United Kingdom','France','Germany'].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>Sector *</label>
                    <select style={{ ...INP, cursor:'pointer' }} value={plan.sector} onChange={e=>upd('sector',e.target.value)}>
                      <option value="">— Selecciona —</option>
                      {['Moda y Accesorios','Alimentación','Salud y Belleza','Tecnología','Servicios B2B','Formación y Educación','Viajes y Turismo','Inmobiliario','Deporte y Fitness','Hogar y Decoración','Automoción','Seguros y Finanzas','Hostelería y Restauración','Farmacia y Salud','Energía y Sostenibilidad','Medios y Entretenimiento','Otros'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <label style={LBL}>Descripción del producto o servicio *</label>
                <textarea style={{ ...INP, minHeight:80, resize:'vertical' }} placeholder="Ej: Plataforma SaaS de gestión de redes sociales para pymes. Automatiza publicación y analítica en Instagram, Facebook y LinkedIn." value={plan.producto} onChange={e=>upd('producto',e.target.value)} />
                <label style={LBL}>Web del producto / empresa</label>
                <input style={INP} type="url" placeholder="https://www.tuempresa.com" value={plan.web} onChange={e=>upd('web',e.target.value)} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <label style={LBL}>Tipo de negocio</label>
                    <select style={{ ...INP, cursor:'pointer' }} value={plan.tipo_negocio} onChange={e=>upd('tipo_negocio',e.target.value)}>
                      <option value="B2C">B2C — Vendes a consumidores</option>
                      <option value="B2B">B2B — Vendes a empresas</option>
                      <option value="B2B2C">B2B2C — Ambos</option>
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>Fase del negocio</label>
                    <select style={{ ...INP, cursor:'pointer' }} value={plan.fase_negocio} onChange={e=>upd('fase_negocio',e.target.value)}>
                      <option value="launch">Lanzamiento</option>
                      <option value="growth">Crecimiento</option>
                      <option value="maturity">Madurez</option>
                    </select>
                  </div>
                </div>
                <label style={LBL}>Competidores principales</label>
                <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                  <input style={{ ...INP, marginBottom:0, flex:1 }} type="text" placeholder="Ej: Hootsuite, Buffer, Metricool" value={plan.competidores} onChange={e=>upd('competidores',e.target.value)} />
                  <button onClick={buscarCompetidores} disabled={competidorLoading} style={{ ...BTN_SM, whiteSpace:'nowrap', flexShrink:0, padding:'10px 14px' }}>
                    {competidorLoading?'Buscando...':'◈ Buscar con IA'}
                  </button>
                </div>
                {suggestedComps.length>0&&(
                  <div style={{ background:C.paper2, borderRadius:8, padding:14, marginTop:8 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.navy, marginBottom:8, fontFamily:"'Geist Mono',monospace", letterSpacing:'0.08em', textTransform:'uppercase' }}>Competidores identificados por IA</div>
                    {suggestedComps.map((c,i)=>(
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:8, paddingBottom:8, borderBottom:i<suggestedComps.length-1?`1px solid ${C.steel1}`:'none' }}>
                        <div style={{ flex:1 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:C.navy }}>{c.nombre}</span>
                          {c.url&&<a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.accent, marginLeft:8 }}>↗ Ver</a>}
                          <div style={{ fontSize:12, color:C.steel, marginTop:2 }}>{c.descripcion}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <label style={LBL}>Presupuesto mensual estimado</label>
                <select style={{ ...INP, cursor:'pointer' }} value={plan.presupuesto} onChange={e=>upd('presupuesto',e.target.value)}>
                  <option value="">— No especificado —</option>
                  <option value="menos_1000">Menos de €1.000/mes</option>
                  <option value="1000_3000">€1.000 – €3.000/mes</option>
                  <option value="3000_10000">€3.000 – €10.000/mes</option>
                  <option value="10000_30000">€10.000 – €30.000/mes</option>
                  <option value="30000_100000">€30.000 – €100.000/mes</option>
                  <option value="mas_100000">Más de €100.000/mes</option>
                </select>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button onClick={s0next} style={BTN_P} disabled={busy}>Analizar Mercado con IA →</button>
              </div>
            </div>
          )}

          {/* ── STEP 1: MERCADO ─── */}
          {step===1&&plan.entorno&&(
            <div>
              <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:6, letterSpacing:'-0.02em' }}>Mercado</h1>
              <p style={{ fontSize:15, color:C.steel, marginBottom:24 }}>Edita cada campo. Usa ✨ para refinarlo con IA.</p>

              <VideoBlock vimeoId="1103392013" title="Análisis del Mercado" />

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:14, letterSpacing:'-0.01em' }}>Situación del País</h2>
                <EditField label="Resumen del entorno" fkey="e_res" value={ed('e_res',gn(plan.entorno,'situacion_pais','resumen'))} onChange={v=>se('e_res',v)} onRefine={p=>refine('e_res',ed('e_res',''),p)} />
                <EditField label="Variables macroeconómicas" fkey="e_mac" value={ed('e_mac',gn(plan.entorno,'situacion_pais','variables_macro'))} onChange={v=>se('e_mac',v)} onRefine={p=>refine('e_mac',ed('e_mac',''),p)} />
                <ToolsBlock title="Análisis Macro" tools={TOOLS_DATA.macro} />
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:14, letterSpacing:'-0.01em' }}>Tu Mercado</h2>
                <VideoBlock vimeoId="1103392013" title="Cómo analizar tu mercado" />
                <EditField label="Descripción del mercado" fkey="e_mkt" value={ed('e_mkt',gn(plan.entorno,'mercado','descripcion'))} onChange={v=>se('e_mkt',v)} onRefine={p=>refine('e_mkt',ed('e_mkt',''),p)} />
                <EditField label="Tamaño estimado y tendencia" fkey="e_siz" value={ed('e_siz',[gn(plan.entorno,'mercado','tamano_estimado'),gn(plan.entorno,'mercado','tendencia')].filter(Boolean).join(' — '))} onChange={v=>se('e_siz',v)} onRefine={p=>refine('e_siz',ed('e_siz',''),p)} />
                <ToolsBlock title="Análisis de Mercado" tools={TOOLS_DATA.mercado} />
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:14, letterSpacing:'-0.01em' }}>Competencia</h2>
                <VideoBlock vimeoId="1103392013" title="Análisis de competidores" />
                <EditField label="Análisis de la competencia" fkey="e_cmp" value={ed('e_cmp',gn(plan.entorno,'competencia','analisis'))} onChange={v=>se('e_cmp',v)} onRefine={p=>refine('e_cmp',ed('e_cmp',''),p)} />
                <ToolsBlock title="Competencia en Medios" tools={TOOLS_DATA.competencia} />
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:14, letterSpacing:'-0.01em' }}>DAFO</h2>
                <VideoBlock vimeoId="1103392013" title="Cómo construir tu DAFO" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    {k:'d_op',lb:'Oportunidades (IA)',src:gn(plan.entorno,'dafo','oportunidades'),bg:'#F0FDF4',col:C.success,ph:''},
                    {k:'d_am',lb:'Amenazas (IA)',src:gn(plan.entorno,'dafo','amenazas'),bg:'#FFFBEB',col:C.warn,ph:''},
                    {k:'d_fo',lb:'Fortalezas (tú) *',src:'',bg:'#EFF6FF',col:'#1E40AF',ph:'Precio, tecnología propia, equipo...'},
                    {k:'d_de',lb:'Debilidades (tú)',src:'',bg:'#FDF4FF',col:'#7E22CE',ph:'Marca nueva, equipo pequeño...'},
                  ].map(item=>(
                    <div key={item.k} style={{ background:item.bg, borderRadius:8, padding:14 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:item.col, marginBottom:8, fontFamily:"'Geist Mono',monospace", letterSpacing:'0.1em', textTransform:'uppercase' }}>{item.lb}</div>
                      <textarea style={{ ...INP, minHeight:80, background:C.white, fontSize:13, resize:'none' }}
                        placeholder={item.ph}
                        value={ed(item.k,item.src)}
                        onChange={e=>se(item.k,e.target.value)} />
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:11, color:C.steel3, marginTop:10, fontFamily:"'Geist Mono',monospace" }}>* Las fortalezas son obligatorias para avanzar al siguiente paso</p>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button onClick={()=>setStep(0)} style={BTN_S}>← Atrás</button>
                <button onClick={s1next} style={BTN_P} disabled={busy}>Analizar Target →</button>
              </div>
            </div>
          )}

          {/* ── STEP 2: TARGET ─── */}
          {step===2&&plan.target&&(
            <div>
              <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:6, letterSpacing:'-0.02em' }}>Target & Buyer Persona</h1>
              <p style={{ fontSize:15, color:C.steel, marginBottom:24 }}>Define tu propuesta de valor y conoce en profundidad a tu cliente.</p>

              <VideoBlock vimeoId="1103392013" title="Cómo definir tu target" />

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:6, letterSpacing:'-0.01em' }}>USP — Propuesta Única de Valor</h2>
                <p style={{ fontSize:13, color:C.steel, marginBottom:14 }}>Una frase que ningún competidor pueda copiar.</p>
                <EditField label="" fkey="usp" value={ed('usp',plan.usp)} onChange={v=>{se('usp',v);upd('usp',v)}} onRefine={p=>refine('usp',ed('usp',plan.usp),p)} multiline={false} />
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:4, letterSpacing:'-0.01em' }}>Target</h2>
                <p style={{ fontSize:12, color:C.steel3, marginBottom:14, fontFamily:"'Geist Mono',monospace" }}>* Datos generados con IA. Pueden no ser exactos. Recomendamos contrastar con las herramientas complementarias.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div style={{ background:C.paper, borderRadius:8, padding:16, border:`1px solid ${C.steel1}` }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.navy, fontFamily:"'Geist Mono',monospace", letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Core Target</div>
                    <EditField label="Descripción del nicho principal" fkey="t_cor" value={ed('t_cor',gn(plan.target,'core_target','descripcion'))} onChange={v=>se('t_cor',v)} onRefine={p=>refine('t_cor',ed('t_cor',''),p)} />
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <EditField label="Volumen estimado *" fkey="t_vol" value={ed('t_vol',gn(plan.target,'core_target','volumen_estimado'))} onChange={v=>se('t_vol',v)} onRefine={p=>refine('t_vol',ed('t_vol',''),p)} multiline={false} small />
                      <EditField label="Edad / Sociodem. *" fkey="t_soc" value={ed('t_soc',gn(plan.target,'core_target','sociodemografico','edad'))} onChange={v=>se('t_soc',v)} onRefine={p=>refine('t_soc',ed('t_soc',''),p)} multiline={false} small />
                    </div>
                  </div>
                  <div style={{ background:C.paper, borderRadius:8, padding:16, border:`1px solid ${C.steel1}` }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.steel, fontFamily:"'Geist Mono',monospace", letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Broad Target</div>
                    <EditField label="Descripción del target amplio" fkey="t_bro" value={ed('t_bro',gn(plan.target,'broad_target','descripcion'))} onChange={v=>se('t_bro',v)} onRefine={p=>refine('t_bro',ed('t_bro',''),p)} />
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <EditField label="Volumen estimado *" fkey="t_bvol" value={ed('t_bvol',gn(plan.target,'broad_target','volumen_estimado'))} onChange={v=>se('t_bvol',v)} onRefine={p=>refine('t_bvol',ed('t_bvol',''),p)} multiline={false} small />
                      <EditField label="Edad *" fkey="t_bage" value={ed('t_bage',gn(plan.target,'broad_target','sociodemografico','edad'))} onChange={v=>se('t_bage',v)} onRefine={p=>refine('t_bage',ed('t_bage',''),p)} multiline={false} small />
                    </div>
                  </div>
                </div>
                <ToolsBlock title="Análisis de Audiencias" tools={TOOLS_DATA.target} />
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:4, letterSpacing:'-0.01em' }}>Buyer Persona</h2>
                <VideoBlock vimeoId="1103392013" title="Cómo construir el Buyer Persona" />
                <div style={{ background:C.paper, borderRadius:8, padding:16, border:`1px solid ${C.steel1}`, marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.navy, fontFamily:"'Geist Mono',monospace", letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Descripción narrativa</div>
                  <EditField label="" fkey="bp_nar" value={ed('bp_nar',gn(plan.target,'buyer_persona','descripcion_narrativa'))} onChange={v=>se('bp_nar',v)} onRefine={p=>refine('bp_nar',ed('bp_nar',''),'Hazlo más detallado y humano, '+p)} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    {k:'bp_mom',lb:'⏰ Momentos en que piensa en el producto',src:gn(plan.target,'buyer_persona','momentos_pensamiento')},
                    {k:'bp_pns',lb:'💭 Qué piensa de este tipo de productos',src:gn(plan.target,'buyer_persona','que_piensa_producto')},
                    {k:'bp_inf',lb:'🔍 Dónde se informa',src:gn(plan.target,'buyer_persona','donde_se_informa')},
                    {k:'bp_esc',lb:'👂 Qué escucha en el mercado',src:gn(plan.target,'buyer_persona','que_escucha_mercado')},
                    {k:'bp_dic',lb:'💬 Qué dice',src:gn(plan.target,'buyer_persona','que_dice')},
                    {k:'bp_exp',lb:'✨ Expectativas',src:gn(plan.target,'buyer_persona','expectativas')},
                    {k:'bp_bar',lb:'🚧 Barreras a la compra',src:gn(plan.target,'buyer_persona','barreras_compra')},
                    {k:'bp_cre',lb:'🔒 Barreras a la comunicación',src:gn(plan.target,'buyer_persona','barreras_comunicacion')},
                  ].map(f=>(
                    <EditField key={f.k} label={f.lb} fkey={f.k} value={ed(f.k,f.src)} onChange={v=>se(f.k,v)} onRefine={p=>refine(f.k,ed(f.k,f.src),p)} small />
                  ))}
                </div>
                {/* Consumer insight - full width */}
                <div style={{ marginTop:12 }}>
                  <EditField label="💡 Consumer Insight — qué les mueve a comprar" fkey="bp_ins" value={ed('bp_ins',gn(plan.target,'buyer_persona','consumer_insight'))} onChange={v=>se('bp_ins',v)} onRefine={p=>refine('bp_ins',ed('bp_ins',''),p)} />
                </div>
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:14, letterSpacing:'-0.01em' }}>Escalera de Valor</h2>
                <VideoBlock vimeoId="1103392013" title="La Escalera de Valor" />
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {plan.valueSteps.map((s,i)=>{
                    const cols:Record<string,string>={TOFU:'#92400E',MOFU:'#1E40AF',BOFU:C.success,FIDELIZACIÓN:'#7E22CE',RETENTION:'#831843'}
                    return(
                      <div key={s.id} style={{ background:C.paper, borderRadius:8, padding:14, display:'flex', gap:12, alignItems:'flex-start', border:`1px solid ${C.steel1}` }}>
                        <div style={{ width:4, borderRadius:2, background:cols[s.tipo]||C.steel2, alignSelf:'stretch', flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                            <select value={s.tipo} onChange={e=>setPlan(p=>({...p,valueSteps:p.valueSteps.map(vs=>vs.id===s.id?{...vs,tipo:e.target.value}:vs)}))} style={{ ...INP, marginBottom:0, width:'auto', fontSize:12, padding:'4px 8px', cursor:'pointer' }}>
                              {['TOFU','MOFU','BOFU','FIDELIZACIÓN','RETENTION'].map(t=><option key={t}>{t}</option>)}
                            </select>
                            <span style={{ fontSize:11, color:C.steel3, alignSelf:'center', fontFamily:"'Geist Mono',monospace" }}>Paso {i+1}</span>
                          </div>
                          <input style={{ ...INP, marginBottom:6, fontSize:14 }} placeholder="Acción concreta..." value={s.accion} onChange={e=>setPlan(p=>({...p,valueSteps:p.valueSteps.map(vs=>vs.id===s.id?{...vs,accion:e.target.value}:vs)}))} />
                          <input style={{ ...INP, marginBottom:0, fontSize:13 }} placeholder="Objetivo de este paso..." value={s.objetivo} onChange={e=>setPlan(p=>({...p,valueSteps:p.valueSteps.map(vs=>vs.id===s.id?{...vs,objetivo:e.target.value}:vs)}))} />
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
                          <button onClick={()=>{if(i>0){const a=[...plan.valueSteps];[a[i],a[i-1]]=[a[i-1],a[i]];setPlan(p=>({...p,valueSteps:a}))}}} style={{ ...BTN_SM, padding:'4px 8px' }} disabled={i===0}>↑</button>
                          <button onClick={()=>{if(i<plan.valueSteps.length-1){const a=[...plan.valueSteps];[a[i],a[i+1]]=[a[i+1],a[i]];setPlan(p=>({...p,valueSteps:a}))}}} style={{ ...BTN_SM, padding:'4px 8px' }} disabled={i===plan.valueSteps.length-1}>↓</button>
                          <button onClick={()=>setPlan(p=>({...p,valueSteps:p.valueSteps.filter(vs=>vs.id!==s.id)}))} style={{ ...BTN_SM, padding:'4px 8px', color:C.accent, borderColor:'#FECACA', background:'#FEF2F2' }}>✕</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <button onClick={()=>setPlan(p=>({...p,valueSteps:[...p.valueSteps,{id:uid(),tipo:'MOFU',accion:'',objetivo:''}]}))} style={BTN_SM}>+ Añadir paso</button>
                  <button onClick={getValIdeas} style={{ ...BTN_SM, color:C.accent, borderColor:C.accent }} disabled={busy}>{busy?'⏳...':'✨ Más ideas con IA'}</button>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button onClick={()=>setStep(1)} style={BTN_S}>← Atrás</button>
                <button onClick={s2next} style={BTN_P}>Definir Objetivos →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: ESTRATEGIA ─── */}
          {step===3&&(
            <div>
              <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:6, letterSpacing:'-0.02em' }}>Objetivos & Estrategia</h1>
              <p style={{ fontSize:15, color:C.steel, marginBottom:24 }}>Define qué quieres conseguir y elige tus canales.</p>

              <VideoBlock vimeoId="1103392013" title="Cómo definir tus objetivos" />

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:6, letterSpacing:'-0.01em' }}>Objetivos del Plan</h2>
                <p style={{ fontSize:13, color:C.steel, marginBottom:16 }}>Define qué quieres conseguir. Añade tantos como necesites.</p>

                {plan.objectives.length>0&&(
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 120px 100px auto', gap:8, marginBottom:6 }}>
                      {['Tipo','KPI','Dato','Tiempo',''].map((h,i)=><div key={i} style={{ fontSize:10, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:"'Geist Mono',monospace" }}>{h}</div>)}
                    </div>
                    {plan.objectives.map(r=>(
                      <div key={r.id} style={{ display:'grid', gridTemplateColumns:'120px 1fr 120px 100px auto', gap:8, alignItems:'center', marginBottom:8 }}>
                        <select value={r.tipo} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,tipo:e.target.value}:o)}))} style={{ ...INP, marginBottom:0, padding:'8px 10px', fontSize:13, cursor:'pointer' }}>
                          <option>Marketing</option><option>Comunicación</option>
                        </select>
                        <select value={r.kpi} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,kpi:e.target.value}:o)}))} style={{ ...INP, marginBottom:0, padding:'8px 10px', fontSize:13, cursor:'pointer' }}>
                          <option value="">— KPI —</option>
                          <optgroup label="Marketing">{KPI_MKT.map(k=><option key={k}>{k}</option>)}</optgroup>
                          <optgroup label="Comunicación">{KPI_COM.map(k=><option key={k}>{k}</option>)}</optgroup>
                        </select>
                        <input style={{ ...INP, marginBottom:0, fontSize:13 }} placeholder="Ej: 1.000" value={r.dato} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,dato:e.target.value}:o)}))} />
                        <select value={r.tiempo} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,tiempo:e.target.value}:o)}))} style={{ ...INP, marginBottom:0, padding:'8px 10px', fontSize:13, cursor:'pointer' }}>
                          <option value="mes">Al mes</option><option value="trimestre">Trimestre</option><option value="semestre">Semestre</option><option value="año">Al año</option>
                        </select>
                        <button onClick={()=>setPlan(p=>({...p,objectives:p.objectives.filter(o=>o.id!==r.id)}))} style={{ ...BTN_SM, padding:'8px 10px', color:C.accent, borderColor:'#FECACA', background:'#FEF2F2' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setPlan(p=>({...p,objectives:[...p.objectives,{id:uid(),tipo:'Marketing',kpi:'',dato:'',tiempo:'mes'}]}))} style={BTN_SM}>+ Añadir objetivo</button>
                  <button onClick={getObjectivosEstimados} style={{ ...BTN_SM, color:C.accent, borderColor:C.accent }} disabled={busy}>{busy?'⏳...':'◈ Calcular objetivos estimados con IA'}</button>
                </div>
              </div>

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:6, letterSpacing:'-0.01em' }}>Selección de Canales</h2>
                <p style={{ fontSize:13, color:C.steel, marginBottom:16 }}>Elige los canales con los que vas a trabajar. La IA recomendará el mix óptimo.</p>
                <div style={{ background:C.paper, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:C.navy, fontWeight:500 }}>
                  ✓ <strong>{plan.selectedChannels.length}</strong> canales seleccionados
                </div>
                {Object.entries(CH_OPTIONS).map(([phase,channels])=>{
                  const phLabel:Record<string,string>={notoriedad:'Notoriedad',interaccion:'Interacción',lead_venta:'Lead / Venta',fidelizacion:'Fidelización'}
                  const phCol:Record<string,string>={notoriedad:C.warn,interaccion:'#1E40AF',lead_venta:C.success,fidelizacion:'#7E22CE'}
                  return(
                    <div key={phase} style={{ marginBottom:16 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:phCol[phase], fontFamily:"'Geist Mono',monospace", letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{phLabel[phase]}</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {channels.map(ch=>{
                          const on=plan.selectedChannels.includes(ch)
                          return(
                            <button key={ch} onClick={()=>setPlan(p=>({...p,selectedChannels:on?p.selectedChannels.filter(s=>s!==ch):[...p.selectedChannels,ch]}))} style={{ padding:'6px 12px', borderRadius:999, border:`1px solid ${on?phCol[phase]:C.steel1}`, background:on?phCol[phase]+'18':C.white, color:on?phCol[phase]:C.steel, fontWeight:on?600:400, fontSize:12, cursor:'pointer', fontFamily:"'Geist',sans-serif", transition:'all 0.15s' }}>
                              {on?'✓ ':''}{ch}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {!showStrategy&&(
                <div style={{ textAlign:'center', padding:'24px 0 32px' }}>
                  <p style={{ fontSize:14, color:C.steel, marginBottom:20 }}>Cuando hayas definido objetivos y canales, la IA creará tu estrategia.</p>
                  <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                    <button onClick={()=>setStep(2)} style={BTN_S}>← Atrás</button>
                    <button onClick={createStrategy} style={{ ...BTN_P, padding:'13px 32px', fontSize:15 }} disabled={busy||plan.objectives.length<1}>
                      {busy?'⏳ Creando...':'Crear Estrategia →'}
                    </button>
                  </div>
                </div>
              )}

              {showStrategy&&plan.estrategia&&(
                <div>
                  <div style={{ ...CARD, background:'#F0F9FF', border:`1px solid #BAE6FD` }}>
                    <h2 style={{ fontSize:16, fontWeight:600, color:'#0369A1', marginBottom:10 }}>Estrategia Recomendada</h2>
                    <p style={{ fontSize:15, color:C.navy, lineHeight:1.7 }}>{gn(plan.estrategia,'estrategia_resumen')}</p>
                  </div>
                  {['notoriedad','interaccion','lead_venta','fidelizacion'].map(ph=>{
                    const phLabel:Record<string,string>={notoriedad:'Notoriedad',interaccion:'Interacción',lead_venta:'Lead / Venta',fidelizacion:'Fidelización'}
                    const phCol:Record<string,string>={notoriedad:C.warn,interaccion:'#1E40AF',lead_venta:C.success,fidelizacion:'#7E22CE'}
                    const channels=ga(plan.estrategia,'canales_por_fase',ph) as Obj[]
                    if(!channels||channels.length===0)return null
                    return(
                      <div key={ph} style={CARD}>
                        <h2 style={{ fontSize:16, fontWeight:600, color:phCol[ph], marginBottom:12 }}>{phLabel[ph]}</h2>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {channels.map((ch,i)=>(
                            <div key={i} style={{ background:C.paper, borderRadius:8, padding:'12px 14px', display:'flex', gap:12, border:`1px solid ${C.steel1}` }}>
                              <div style={{ width:3, background:phCol[ph], borderRadius:2, flexShrink:0, alignSelf:'stretch' }}/>
                              <div style={{ flex:1 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                                  <span style={{ fontSize:15, fontWeight:600, color:C.navy }}>{ss(ch.canal)}</span>
                                  <span style={{ fontSize:11, color:C.steel3 }}>{ss(ch.kpi)}</span>
                                  {ch.score_ia&&<div style={{ display:'flex', gap:2 }}>{[1,2,3,4,5].map(n=><div key={n} style={{ width:8, height:8, borderRadius:2, background:n<=Number(ch.score_ia)?phCol[ph]:C.steel1 }}/>)}</div>}
                                  <span style={{ fontSize:12, color:C.steel3, marginLeft:'auto' }}>{ss(ch.presupuesto_pct)}%</span>
                                </div>
                                <div style={{ fontSize:13, color:C.steel, marginBottom:2 }}>{ss(ch.accion)}</div>
                                <div style={{ fontSize:12, color:C.steel3 }}>{ss(ch.razon)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {ga(plan.estrategia,'quick_wins').length>0&&(
                    <div style={CARD}>
                      <h2 style={{ fontSize:16, fontWeight:600, color:C.navy, marginBottom:12 }}>Quick Wins</h2>
                      {ga(plan.estrategia,'quick_wins').map((qw,i)=>(
                        <div key={i} style={{ display:'flex', gap:10, background:'#F0FDF4', borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
                          <span style={{ background:C.success, color:C.white, borderRadius:4, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:11, flexShrink:0 }}>{i+1}</span>
                          <span style={{ fontSize:14, color:C.navy }}>{ss(qw)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>setStep(2)} style={BTN_S}>← Atrás</button>
                      <button onClick={()=>setShowStrategy(false)} style={BTN_S}>↺ Regenerar</button>
                    </div>
                    <button onClick={()=>{markDone(3);setStep(4)}} style={BTN_P}>Táctico & Presupuesto →</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5: RESUMEN ─── */}
          {step===5&&(
            <div>
              <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:6, letterSpacing:'-0.02em' }}>Resumen Ejecutivo</h1>
              <p style={{ fontSize:15, color:C.steel, marginBottom:28 }}>Tu plan de marketing está completo. Dale un nombre y guárdalo.</p>
              <div style={{ background:'#F0F9FF', border:`1px solid #BAE6FD`, borderRadius:12, padding:28, textAlign:'center', marginBottom:24 }}>
                <div style={{ fontSize:20, fontWeight:600, color:C.navy, marginBottom:4 }}>{plan.projectName||`Plan ${plan.sector} — ${plan.pais}`}</div>
                <div style={{ fontSize:13, color:C.steel, marginBottom:20 }}>{plan.pais} · {plan.tipo_negocio} · {plan.fase_negocio}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, maxWidth:380, margin:'0 auto' }}>
                  {[{lb:'Mercado',ok:!!plan.entorno},{lb:'Target',ok:!!plan.target},{lb:'Estrategia',ok:!!plan.estrategia},{lb:'Táctico',ok:plan.completed.includes(4)}].map((it,i)=>(
                    <div key={i} style={{ background:it.ok?'#F0FDF4':'#F8FAFC', border:`1px solid ${it.ok?'#BBF7D0':C.steel1}`, borderRadius:8, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ flex:1, textAlign:'left' }}>
                        <div style={{ fontSize:11, color:C.steel3, fontFamily:"'Geist Mono',monospace", letterSpacing:'0.08em', textTransform:'uppercase' }}>Fase {i+1}</div>
                        <div style={{ fontSize:14, fontWeight:600, color:C.navy }}>{it.lb}</div>
                      </div>
                      <span style={{ fontWeight:700, color:it.ok?C.success:C.steel3 }}>{it.ok?'✓':'—'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                <button onClick={()=>setSaveModal(true)} style={{ ...BTN_P, padding:'13px 28px', fontSize:15 }}>Guardar Plan</button>
                <button style={BTN_S}>Exportar PDF</button>
              </div>
              <div style={{ marginTop:16, display:'flex', justifyContent:'flex-start' }}>
                <button onClick={()=>setStep(4)} style={BTN_S}>← Volver al Táctico</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
