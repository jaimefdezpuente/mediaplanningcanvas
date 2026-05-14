'use client'
export const dynamic = 'force-dynamic'
import { useState, useRef, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { MpcMark, MpcLockup } from '@/lib/MpcLogo'
import { useRouter, useSearchParams } from 'next/navigation'

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

// ─── PLAN LIMITS ─────────────────────────────────────────────────────────────
const PLAN_LIMITS: Record<string, { plans: number; mejoras: number; analisis: number }> = {
  free:       { plans: 1,   mejoras: 10,  analisis: 0 },
  pro:        { plans: 10,  mejoras: 70,  analisis: 20 },
  business:   { plans: 30,  mejoras: 150, analisis: 60 },
  enterprise: { plans: 999, mejoras: 999, analisis: 999 },
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  async function goUpgrade() {
    const supabase = (await import('@/lib/supabase')).createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    const res = await fetch('/api/create-checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:user.email, plan:'pro_monthly' }) })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,41,66,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#fff', borderRadius:14, padding:36, maxWidth:440, width:'100%', boxShadow:'0 24px 48px rgba(15,41,66,0.25)', textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⭐</div>
        <h3 style={{ fontSize:20, fontWeight:600, color:C.navy, marginBottom:8, letterSpacing:'-0.02em' }}>Función de plan Pro</h3>
        <p style={{ fontSize:14, color:C.steel, lineHeight:1.7, marginBottom:24 }}>
          Has alcanzado el límite de tu plan actual. Pasa a Pro para acceder a más análisis con IA, mejoras de campos y planes ilimitados.
        </p>
        <div style={{ background:C.paper, borderRadius:8, padding:'12px 16px', marginBottom:20, textAlign:'left' }}>
          <div style={{ fontSize:13, color:C.navy, fontWeight:600, marginBottom:6 }}>Plan Pro — €15/mes</div>
          {['70 mejoras con IA/mes','20 análisis con IA/mes','10 planes completos/mes','Sin marca de agua en PDF'].map((f,i)=>(
            <div key={i} style={{ fontSize:12, color:C.steel, marginBottom:3 }}>✓ {f}</div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:6, border:`1px solid ${C.steel1}`, background:'transparent', color:C.steel, fontWeight:500, fontSize:13, cursor:'pointer', fontFamily:"'Geist',sans-serif" }}>Cancelar</button>
          <button onClick={goUpgrade} style={{ flex:2, padding:'11px', borderRadius:6, border:'none', background:C.navy, color:C.paper, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:"'Geist',sans-serif" }}>Activar Pro →</button>
        </div>
      </div>
    </div>
  )
}

function AiBtn({ label, used, max, onClick, disabled, small=false }: { label:string; used:number; max:number; onClick:()=>void; disabled?:boolean; small?:boolean }) {
  const remaining = max - used
  const isOut = remaining <= 0
  const pct = Math.max(0, Math.min(100, (remaining/max)*100))
  return (
    <button onClick={onClick} disabled={disabled||isOut} style={{ padding: small?'7px 12px':'9px 16px', borderRadius:6, border:`1px solid ${isOut?'#FECACA':C.steel1}`, background: isOut?'#FEF2F2':C.paper, color: isOut?'#B33A2E':C.steel, fontWeight:500, fontSize: small?11:12, cursor: isOut?'not-allowed':'pointer', fontFamily:"'Geist',sans-serif", display:'flex', alignItems:'center', gap:6, opacity:disabled&&!isOut?0.6:1 }}>
      <span style={{ color: isOut?'#B33A2E':C.accent }}>✨</span>
      {label}
      <span style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, padding:'2px 6px', borderRadius:4, background: isOut?'#FECACA':pct>50?'#F0FDF4':'#FFFBEB', color: isOut?'#B33A2E':pct>50?C.success:C.warn, fontWeight:600 }}>
        {remaining}/{max}
      </span>
    </button>
  )
}

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
      <div style={{ background:C.white, borderRadius:12, padding:32, maxWidth:440, width:'100%', boxShadow:'0 24px 48px -12px rgba(15,41,66,0.3)' }}>
        <div style={{ fontSize:24, marginBottom:12 }}>⚠️</div>
        <h3 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:10 }}>{title}</h3>
        <p style={{ fontSize:14, color:C.steel, lineHeight:1.6, marginBottom:24 }}>{body}</p>
        <button onClick={onClose} style={{ ...BTN_P, width:'100%', justifyContent:'center' }}>{btn}</button>
      </div>
    </div>
  )
}

function SaveModal({ onSave, onClose, busy, defaultName }: { onSave:(name:string)=>void; onClose:()=>void; busy:boolean; defaultName?:string }) {
  const [n, setN] = useState(defaultName||'')
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,41,66,0.45)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:C.white, borderRadius:12, padding:32, maxWidth:460, width:'100%', boxShadow:'0 24px 48px -12px rgba(15,41,66,0.3)' }}>
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

export default function NuevoPlanPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#F6F4EF', display:'flex', alignItems:'center', justifyContent:'center', color:'#4A6B8A', fontSize:14, fontFamily:"'Geist',sans-serif" }}>Cargando...</div>}>
      <WizardInner />
    </Suspense>
  )
}

function WizardInner() {
  const [step, setStep] = useState(0)
  const [aiModal, setAiModal] = useState('')
  const [alert, setAlert] = useState<{title:string;body:string}|null>(null)
  const [saveModal, setSaveModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [showStrategy, setShowStrategy] = useState(false)
  const [competidorLoading, setCompetidorLoading] = useState(false)
  const [suggestedComps, setSuggestedComps] = useState<{nombre:string;descripcion:string;url:string}[]>([])
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [userPlan, setUserPlan] = useState('free')
  const [usedMejoras, setUsedMejoras] = useState(0)
  const [usedAnalisis, setUsedAnalisis] = useState(0)
  const [savedPlanId, setSavedPlanId] = useState<string|null>(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [headerMenu, setHeaderMenu] = useState(false)
  const [plan, setPlan] = useState<PlanData>({
    projectName:'', pais:'España', sector:'', producto:'', web:'',
    tipo_negocio:'B2C', competidores:'', presupuesto:'', fase_negocio:'launch', usp:'',
    entorno:null, target:null, estrategia:null,
    edits:{}, completed:[], valueSteps:[], objectives:[{id:uid(),tipo:'Marketing',kpi:'',dato:'',tiempo:'mes'}],
    selectedChannels:[],
  })
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const planKey = (user.user_metadata?.plan || 'free').toLowerCase()
      setUserPlan(planKey)
      setUsedMejoras(Number(user.user_metadata?.used_mejoras || 0))
      setUsedAnalisis(Number(user.user_metadata?.used_analisis || 0))

      // Load existing plan if plan_id in URL
      const planId = searchParams.get('plan_id')
      if (planId) {
        const { data: savedPlan } = await supabase.from('plans').select('*').eq('id', planId).eq('user_id', user.id).single()
        if (savedPlan) {
          setSavedPlanId(planId)
          setPlan(p => ({
            ...p,
            projectName: savedPlan.name || '',
            pais: savedPlan.pais || 'España',
            sector: savedPlan.sector || '',
            producto: savedPlan.producto || '',
            web: savedPlan.web || '',
            tipo_negocio: savedPlan.tipo_negocio || 'B2C',
            fase_negocio: savedPlan.fase_negocio || 'launch',
            usp: savedPlan.usp || '',
            competidores: savedPlan.competidores || '',
            presupuesto: savedPlan.presupuesto || '',
            entorno: savedPlan.entorno || null,
            target: savedPlan.target || null,
            estrategia: savedPlan.estrategia || null,
            completed: [
              ...(savedPlan.entorno ? [0] : []),
              ...(savedPlan.target ? [1] : []),
              ...(savedPlan.estrategia ? [2, 3] : []),
            ],
          }))
          // Go to the furthest completed step
          if (savedPlan.estrategia) setStep(4)
          else if (savedPlan.target) setStep(3)
          else if (savedPlan.entorno) setStep(2)
          else setStep(1)
        }
      }
    }
    init()
  }, [])

  // Listen for iframe height changes
  useEffect(() => {
    function handleMsg(e: MessageEvent) {
      if (e.data?.type === 'mpc-height' && typeof e.data.height === 'number' && e.data.height > 200) {
        const iframe = document.getElementById('tactico-iframe') as HTMLIFrameElement
        if (iframe) iframe.style.height = e.data.height + 'px'
      }
    }
    window.addEventListener('message', handleMsg)
    return () => window.removeEventListener('message', handleMsg)
  }, [])

  const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free

  function canUseMejora(): boolean {
    if (usedMejoras >= limits.mejoras) { setShowUpgrade(true); return false }
    return true
  }
  function canUseAnalisis(): boolean {
    if (usedAnalisis >= limits.analisis) { setShowUpgrade(true); return false }
    return true
  }
  async function trackMejora() {
    setUsedMejoras(n => n + 1)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.auth.updateUser({ data: { used_mejoras: (Number(user.user_metadata?.used_mejoras || 0)) + 1 } })
  }
  async function trackAnalisis() {
    setUsedAnalisis(n => n + 1)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.auth.updateUser({ data: { used_analisis: (Number(user.user_metadata?.used_analisis || 0)) + 1 } })
  }

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
    if (!canUseMejora()) return
    const r = await callAI('refine',{field_key:fkey,current_value:cur,user_prompt:p})
    if(r&&typeof r.refined_text==='string') { se(fkey,r.refined_text); trackMejora() }
  }

  async function buscarCompetidores() {
    if(!plan.producto||!plan.sector){setErr('Rellena primero el producto y sector');return}
    if(!canUseAnalisis()) return
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
    if(!canUseAnalisis()) return
    const r = await callAI('entorno')
    if(r){setPlan(p=>({...p,entorno:r}));markDone(0);setStep(1);trackAnalisis();autoSave({entorno:r as Obj})}
  }

  async function s1next() {
    if(!ed('d_fo','')) { setAlert({title:'Fortalezas obligatorias',body:'Las fortalezas son necesarias para que la IA cree una estrategia personalizada.'}); return }
    if(!ed('d_de','')) { setAlert({title:'Debilidades obligatorias',body:'Las debilidades son igual de importantes. Ayudan a la IA a crear una estrategia realista.'}); return }
    if(!canUseAnalisis()) return
    if(plan.target){markDone(1);setStep(2);return}
    const r = await callAI('target')
    if(r){
      const rawSteps = ga(r,'escalera_valor')
      let steps:ValStep[] = rawSteps.map(s=>{const o=s as Obj;return{id:uid(),tipo:ss(o.tipo)||'MOFU',accion:ss(o.accion)||'',objetivo:ss(o.objetivo)||''}})
      // Ensure minimum 4 steps
      const defaultSteps = [
        {id:uid(),tipo:'TOFU',accion:'',objetivo:'Captación de leads'},
        {id:uid(),tipo:'MOFU',accion:'',objetivo:'Consideración'},
        {id:uid(),tipo:'BOFU',accion:'',objetivo:'Conversión'},
      ]
      while(steps.length < 3) steps.push(defaultSteps[steps.length])
      setPlan(p=>({...p,target:r as Obj,valueSteps:steps}));markDone(1);setStep(2)
      trackAnalisis();autoSave({target:r as Obj})
    }
  }

  function s2next() {
    if(!ed('usp',plan.usp).trim()) { setAlert({title:'USP obligatoria',body:'Define tu Propuesta Única de Valor antes de continuar. Es la base de toda tu estrategia.'}); return }
    markDone(2);setStep(3);setShowStrategy(false)
    autoSave({usp:ed('usp',plan.usp)||plan.usp})
  }

  async function createStrategy() {
    const objText = plan.objectives.map(o=>`${o.tipo}: ${o.kpi} = ${o.dato} / ${o.tiempo}`).join(' | ')
    const r = await callAI('estrategia',{objetivos:objText,canales_seleccionados:plan.selectedChannels.join(', ')||'Sin selección',fortalezas:ed('d_fo','')})
    if(r){
      // Extract recommended channels from strategy and mark them selected
      const phases = ['notoriedad','interaccion','lead_venta','fidelizacion']
      const recommendedNames: string[] = []
      phases.forEach(ph=>{
        const chs = (r as Obj).canales_por_fase
        if(chs && typeof chs==='object' && !Array.isArray(chs)){
          const phArr = (chs as Obj)[ph]
          if(Array.isArray(phArr)){
            phArr.forEach((ch:Jv)=>{
              if(ch&&typeof ch==='object'&&!Array.isArray(ch)){
                const name = (ch as Obj).canal
                if(typeof name==='string'&&name) recommendedNames.push(name)
              }
            })
          }
        }
      })
      // Merge existing selection with recommended
      const merged = Array.from(new Set([...plan.selectedChannels, ...recommendedNames]))
      setPlan(p=>({...p, estrategia:r as Obj, selectedChannels:merged}))
      setShowStrategy(true)
      autoSave({estrategia:r as Obj})
    }
  }

  async function getValIdeas() {
    if(!canUseAnalisis()) return
    const cur = plan.valueSteps.map(s=>`${s.tipo}: ${s.accion}`).join(' | ')
    const r = await callAI('escalera_ideas',{pasos_actuales:cur})
    if(r&&Array.isArray(r.nuevos_pasos)){
      const newS:ValStep[] = (r.nuevos_pasos as Obj[]).map(s=>({id:uid(),tipo:ss(s.tipo)||'MOFU',accion:ss(s.accion)||'',objetivo:ss(s.objetivo)||''}))
      setPlan(p=>({...p,valueSteps:[...p.valueSteps,...newS]}))
      trackAnalisis()
    }
  }

  async function suggestUSP() {
    if(!canUseMejora()) return
    const r = await callAI('refine',{field_key:'usp',current_value:ed('usp',plan.usp)||'',user_prompt:`Crea una USP impactante y única para este producto: ${plan.producto}. Sector: ${plan.sector}. Tipo: ${plan.tipo_negocio}. En UNA sola frase corta, sin clichés.`})
    if(r&&typeof r.refined_text==='string'){se('usp',r.refined_text);upd('usp',r.refined_text);trackMejora()}
  }

  async function getQuickWinsIA() {
    if(!canUseAnalisis()) return
    const objText = plan.objectives.map(o=>`${o.tipo}: ${o.kpi}`).join(' | ')
    const r = await callAI('refine',{field_key:'quick_wins',current_value:'',user_prompt:`Genera 3 quick wins de marketing para: Producto: ${plan.producto}, Sector: ${plan.sector}, Objetivos: ${objText}. Deben ser acciones concretas de bajo coste y resultado rápido (menos de 30 días). Devuelve solo las 3 acciones como texto con saltos de línea.`})
    if(r&&typeof r.refined_text==='string'){
      se('qw_extra',r.refined_text)
      trackAnalisis()
    }
  }

  function validateObjectivesForStrategy(): {ok:boolean; mkt:number; com:number} {
    const mkt = plan.objectives.filter(o=>o.tipo==='Marketing'&&o.kpi&&o.kpi!=='').length
    const com = plan.objectives.filter(o=>o.tipo==='Comunicación'&&o.kpi&&o.kpi!=='').length
    return {ok: mkt>=2, mkt, com}
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

  async function autoSave(extra?: Partial<PlanData>) {
    if (userPlan === 'free') return // Free users can't save
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const current = { ...plan, ...extra }
    setAutoSaving(true)
    try {
      if (savedPlanId) {
        await supabase.from('plans').update({
          name: current.projectName || `Plan ${current.sector}`,
          pais: current.pais, sector: current.sector, producto: current.producto,
          tipo_negocio: current.tipo_negocio, fase_negocio: current.fase_negocio,
          usp: current.usp, entorno: current.entorno, target: current.target,
          estrategia: current.estrategia, status: 'in_progress', updated_at: new Date().toISOString(),
        }).eq('id', savedPlanId)
      } else {
        const { data } = await supabase.from('plans').insert({
          user_id: user.id,
          name: current.projectName || `Plan ${current.sector || 'nuevo'}`,
          pais: current.pais, sector: current.sector, producto: current.producto,
          tipo_negocio: current.tipo_negocio, fase_negocio: current.fase_negocio,
          usp: current.usp, entorno: current.entorno, target: current.target,
          estrategia: current.estrategia, status: 'in_progress',
        }).select('id').single()
        if (data?.id) setSavedPlanId(data.id)
      }
    } catch { /* silent fail */ }
    setAutoSaving(false)
  }

  async function handleSave(name: string) {
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    if (savedPlanId) {
      await supabase.from('plans').update({
        name: name.trim(), usp: plan.usp,
        entorno: plan.entorno, target: plan.target, estrategia: plan.estrategia, status: 'completed',
        updated_at: new Date().toISOString(),
      }).eq('id', savedPlanId)
    } else {
      await supabase.from('plans').insert({
        user_id: user.id, name: name.trim(),
        pais: plan.pais, sector: plan.sector, producto: plan.producto,
        tipo_negocio: plan.tipo_negocio, fase_negocio: plan.fase_negocio,
        usp: plan.usp, entorno: plan.entorno, target: plan.target, estrategia: plan.estrategia, status: 'completed',
      })
    }
    router.push('/dashboard?saved=true')
    setBusy(false)
  }

  // Phase nav accessible if completed or current
  function canNav(i:number) { return i===0||plan.completed.includes(i-1)||step>=i }

  return (
    <div style={{ minHeight:'100vh', background:C.paper }}>
      {aiModal&&<AiModal msg={aiModal}/>}
      {alert&&<AlertModal title={alert.title} body={alert.body} btn="Entendido" onClose={()=>setAlert(null)}/>}
      {saveModal&&<SaveModal onSave={handleSave} onClose={()=>setSaveModal(false)} busy={busy} defaultName={plan.projectName||`Plan ${plan.sector||'nuevo'}`}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)}/>}

      {/* HEADER */}
      <header style={{ background:C.white, borderBottom:`1px solid ${C.steel1}`, position:'sticky', top:0, zIndex:20, boxShadow:'0 1px 2px rgba(15,41,66,0.05)' }}>
        <div style={{ maxWidth:'100%', margin:'0 auto', padding:'0 24px', height:56, display:'flex', alignItems:'center', gap:16 }}>
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
          {plan.projectName&&<input value={plan.projectName} onChange={e=>upd('projectName',e.target.value)} style={{ fontSize:12, color:C.steel, flexShrink:0, maxWidth:160, background:'transparent', border:'none', outline:'none', borderBottom:`1px dashed ${C.steel2}`, fontFamily:"'Geist',sans-serif", padding:'1px 4px', fontStyle:'italic' }} title="Editar nombre del proyecto" />}
          {userPlan!=='free'&&<span style={{ fontSize:10, color:autoSaving?C.accent:C.steel3, fontFamily:"'Geist Mono',monospace", flexShrink:0 }}>{autoSaving?'Guardando...':'✓ Auto-guardado'}</span>}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <span style={{ fontSize:10, fontFamily:"'Geist Mono',monospace", padding:'3px 8px', borderRadius:4, background:userPlan==='free'?C.paper2:C.navy, color:userPlan==='free'?C.steel:C.paper, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{userPlan}</span>
            {userPlan!=='enterprise'&&<>
              <span title="Análisis IA disponibles" style={{ fontSize:10, color:C.steel3, fontFamily:"'Geist Mono',monospace" }}>◈ {limits.analisis-usedAnalisis}/{limits.analisis}</span>
              <span title="Mejoras IA disponibles" style={{ fontSize:10, color:C.steel3, fontFamily:"'Geist Mono',monospace" }}>✨ {limits.mejoras-usedMejoras}/{limits.mejoras}</span>
            </>}
            <span style={{ fontSize:11, color:C.steel3, fontFamily:"'Geist Mono',monospace" }}>{step+1}/{PHASES.length}</span>
            {/* User menu */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <button onClick={()=>setHeaderMenu(m=>!m)} style={{ width:30, height:30, borderRadius:'50%', background:C.navy, color:C.paper, border:'none', cursor:'pointer', fontWeight:600, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Geist',sans-serif" }}>
                {userPlan?.[0]?.toUpperCase()||'U'}
              </button>
              {headerMenu&&(
                <div style={{ position:'absolute', right:0, top:38, background:C.white, border:`1px solid ${C.steel1}`, borderRadius:10, boxShadow:'0 8px 24px -8px rgba(15,41,66,0.15)', minWidth:180, zIndex:100, overflow:'hidden' }}>
                  {[
                    {label:'Mi perfil', href:'/perfil'},
                    {label:'Cambiar contraseña', href:'/perfil?tab=password'},
                    {label:'Cambiar de plan', href:'/perfil?tab=plan'},
                    {label:'Dashboard', href:'/dashboard'},
                  ].map((item,i)=>(
                    <a key={i} href={item.href} style={{ display:'block', padding:'10px 16px', fontSize:13, color:C.navy, textDecoration:'none', borderBottom:i<3?`1px solid ${C.steel1}`:'none' }}>{item.label}</a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* TÁCTICO — same width as other steps */}
      {step===4&&(
        <div style={{ maxWidth:1040, margin:'0 auto', padding:'40px 24px 0' }}>
          {/* Title */}
          <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:4, letterSpacing:'-0.02em' }}>Táctico & Presupuesto</h1>
          <p style={{ fontSize:14, color:C.steel, marginBottom:16 }}>{plan.sector} · {plan.pais}</p>

          {/* Video */}
          <VideoBlock vimeoId="1103392013" title="Distribución táctica de presupuesto" />

          {/* B2C/B2B Toggle — prominent, below video */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:24, marginTop:8 }}>
            <div style={{ background:C.paper2, borderRadius:100, padding:4, display:'inline-flex', gap:4, border:`1px solid ${C.steel1}` }}>
              {(['B2C','B2B'] as const).map(m=>(
                <button key={m} onClick={()=>upd('tipo_negocio',m)} style={{ padding:'10px 36px', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Geist',sans-serif", fontWeight:600, fontSize:14, transition:'all 0.2s', background:plan.tipo_negocio===m?C.navy:'transparent', color:plan.tipo_negocio===m?C.paper:C.steel, boxShadow:plan.tipo_negocio===m?'0 2px 6px rgba(15,41,66,0.18)':'none' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {userPlan==='free'&&(
            <div style={{ background:'#FFFBEB', border:`1px solid #FDE68A`, borderRadius:8, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div style={{ fontSize:13, color:C.warn }}>⚠️ <strong>Plan Gratuito:</strong> Solo lectura. Activa Pro para modificar.</div>
              <button onClick={()=>setShowUpgrade(true)} style={{ ...BTN_SM, color:C.accent, borderColor:C.accent, whiteSpace:'nowrap' }}>Activar Pro →</button>
            </div>
          )}

          {/* iframe — auto-height via postMessage */}
          <div style={{ position:'relative', marginBottom:32, width:'100%', overflow:'hidden' }}>
            <iframe
              id="tactico-iframe"
              key={plan.tipo_negocio}
              src={`/calculadora.html?channels=${encodeURIComponent(plan.selectedChannels.join(','))}&budget=${plan.presupuesto.includes('1000_3000')?2000:plan.presupuesto.includes('3000_10000')?6000:plan.presupuesto.includes('10000_30000')?20000:plan.presupuesto.includes('mas_100000')?150000:plan.presupuesto.includes('30000')?60000:1000}&mode=${plan.tipo_negocio==='B2B'?'B2B':'B2C'}&readonly=${userPlan==='free'?'1':'0'}&noheader=1`}
              style={{ width:'100%', height:600, border:'none', display:'block', minHeight:600 }}
              scrolling="no"
              title="Calculadora"
            />
            {userPlan==='free'&&(
              <div onClick={()=>setShowUpgrade(true)} style={{ position:'absolute', inset:0, cursor:'pointer', zIndex:10 }} title="Activa Pro para editar" />
            )}
          </div>

          {/* Sticky bottom bar with nav buttons */}
          <div style={{ position:'sticky', bottom:0, background:C.paper, borderTop:`1px solid ${C.steel1}`, padding:'12px 0', display:'flex', justifyContent:'space-between', zIndex:10 }}>
            <button onClick={()=>setStep(3)} style={BTN_S}>← Atrás</button>
            <button onClick={()=>{markDone(4);setStep(5)}} style={{ ...BTN_P, padding:'12px 32px' }}>Ver Resumen →</button>
          </div>
          <div style={{ height:24 }} />
        </div>
      )}

      {step!==4&&(
        <div style={{ maxWidth:1040, margin:'0 auto', padding:'40px 24px 80px' }}>
          {err&&<div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 16px', fontSize:14, color:'#B33A2E', marginBottom:16 }}>⚠️ {err}</div>}

          {/* ── STEP 0: PROYECTO ─── */}
          {step===0&&(
            <div>
              <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:6, letterSpacing:'-0.02em' }}>Datos del proyecto</h1>
              <p style={{ fontSize:15, color:C.steel, marginBottom:16, lineHeight:1.6 }}>La IA analizará tu mercado con esta información.</p>
              <VideoBlock vimeoId="1103392013" title="Cómo empezar tu Media Planning Canvas" />
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
                  <AiBtn label="Buscar con IA" used={usedAnalisis} max={limits.analisis} onClick={buscarCompetidores} disabled={competidorLoading} small />
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

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:14, letterSpacing:'-0.01em' }}>Situación del País</h2>
                <EditField label="Resumen del entorno" fkey="e_res" value={ed('e_res',gn(plan.entorno,'situacion_pais','resumen'))} onChange={v=>se('e_res',v)} onRefine={p=>refine('e_res',ed('e_res',''),p)} />
                <EditField label="Variables macroeconómicas" fkey="e_mac" value={ed('e_mac',gn(plan.entorno,'situacion_pais','variables_macro'))} onChange={v=>se('e_mac',v)} onRefine={p=>refine('e_mac',ed('e_mac',''),p)} />
                <ToolsBlock title="Análisis Macro" tools={TOOLS_DATA.macro} />
                <VideoBlock vimeoId="1103392013" title="Entorno y situación del país" />
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
                    {k:'d_op',lb:'Oportunidades (IA)',src:gn(plan.entorno,'dafo','oportunidades'),bg:'#F0FDF4',col:C.success,ph:'',ia:true},
                    {k:'d_am',lb:'Amenazas (IA)',src:gn(plan.entorno,'dafo','amenazas'),bg:'#FFFBEB',col:C.warn,ph:'',ia:true},
                    {k:'d_fo',lb:'Fortalezas (tú) *',src:'',bg:'#EFF6FF',col:'#1E40AF',ph:'Precio, tecnología propia, equipo...',ia:false},
                    {k:'d_de',lb:'Debilidades (tú) *',src:'',bg:'#FDF4FF',col:'#7E22CE',ph:'Marca nueva, equipo pequeño...',ia:false},
                  ].map(item=>(
                    <div key={item.k} style={{ background:item.bg, borderRadius:8, padding:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:item.col, fontFamily:"'Geist Mono',monospace", letterSpacing:'0.1em', textTransform:'uppercase' }}>{item.lb}</div>
                        {item.ia&&<AiBtn label="Mejorar" used={usedMejoras} max={limits.mejoras} onClick={()=>refine(item.k,ed(item.k,item.src),'Mejora este análisis haciéndolo más específico y accionable')} disabled={busy} small />}
                      </div>
                      <textarea style={{ ...INP, minHeight:80, background:C.white, fontSize:13, resize:'none' }}
                        placeholder={item.ph}
                        value={ed(item.k,item.src)}
                        onChange={e=>se(item.k,e.target.value)} />
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:11, color:C.steel3, marginTop:10, fontFamily:"'Geist Mono',monospace" }}>* Fortalezas y Debilidades son obligatorias para analizar el Target</p>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button onClick={()=>setStep(0)} style={BTN_S}>← Atrás</button>
                <AiBtn label={`Analizar Target ${plan.target?'(regenerar)':'→'}`} used={usedAnalisis} max={limits.analisis} onClick={s1next} disabled={busy} />
              </div>
            </div>
          )}

          {/* ── STEP 2: TARGET ─── */}
          {step===2&&plan.target&&(
            <div>
              <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:6, letterSpacing:'-0.02em' }}>Target & Buyer Persona</h1>
              <p style={{ fontSize:15, color:C.steel, marginBottom:24 }}>Define tu propuesta de valor y conoce en profundidad a tu cliente.</p>

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:4, letterSpacing:'-0.01em' }}>USP — Propuesta Única de Valor <span style={{ color:C.accent, fontSize:14 }}>*</span></h2>
                <p style={{ fontSize:13, color:C.steel, marginBottom:14 }}>Una frase que ningún competidor pueda copiar. Obligatoria para continuar.</p>
                <EditField label="" fkey="usp" value={ed('usp',plan.usp)} onChange={v=>{se('usp',v);upd('usp',v)}} onRefine={p=>refine('usp',ed('usp',plan.usp),p)} multiline={false} />
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <AiBtn label="Sugerir USP con IA" used={usedMejoras} max={limits.mejoras} onClick={suggestUSP} disabled={busy} small />
                </div>
              </div>

              <VideoBlock vimeoId="1103392013" title="Cómo definir tu target" />

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

              <VideoBlock vimeoId="1103392013" title="Buyer Persona y Escalera de Valor" />

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
                  <AiBtn label="Ideas de Escalera IA" used={usedAnalisis} max={limits.analisis} onClick={getValIdeas} disabled={busy} small />
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

              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:6, letterSpacing:'-0.01em' }}>Objetivos del Plan</h2>
                <p style={{ fontSize:13, color:C.steel, marginBottom:16 }}>Define qué quieres conseguir. Añade tantos como necesites.</p>

                {plan.objectives.length>0&&(
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 120px 100px auto', gap:8, marginBottom:6 }}>
                      {['Tipo','KPI','Dato','Tiempo',''].map((h,i)=><div key={i} style={{ fontSize:10, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:"'Geist Mono',monospace" }}>{h}</div>)}
                    </div>
                    {plan.objectives.map(r=>{
                      const kpiList = r.tipo==='Marketing' ? KPI_MKT : KPI_COM
                      const isCustom = r.kpi==='Otro...' || (!kpiList.includes(r.kpi) && r.kpi!=='')
                      return(
                        <div key={r.id} style={{ marginBottom:8 }}>
                          <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 120px 100px auto', gap:8, alignItems:'center' }}>
                            <select value={r.tipo} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,tipo:e.target.value,kpi:''}:o)}))} style={{ ...INP, marginBottom:0, padding:'8px 10px', fontSize:13, cursor:'pointer' }}>
                              <option>Marketing</option><option>Comunicación</option>
                            </select>
                            <select value={isCustom?'Otro...':r.kpi} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,kpi:e.target.value}:o)}))} style={{ ...INP, marginBottom:0, padding:'8px 10px', fontSize:13, cursor:'pointer' }}>
                              <option value="">— KPI —</option>
                              {kpiList.map(k=><option key={k}>{k}</option>)}
                            </select>
                            <input style={{ ...INP, marginBottom:0, fontSize:13 }} placeholder="Ej: 1.000" value={r.dato} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,dato:e.target.value}:o)}))} />
                            <select value={r.tiempo} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,tiempo:e.target.value}:o)}))} style={{ ...INP, marginBottom:0, padding:'8px 10px', fontSize:13, cursor:'pointer' }}>
                              <option value="mes">Al mes</option><option value="trimestre">Trimestre</option><option value="semestre">Semestre</option><option value="año">Al año</option>
                            </select>
                            <button onClick={()=>setPlan(p=>({...p,objectives:p.objectives.filter(o=>o.id!==r.id)}))} style={{ ...BTN_SM, padding:'8px 10px', color:C.accent, borderColor:'#FECACA', background:'#FEF2F2' }}>✕</button>
                          </div>
                          {isCustom&&(
                            <div style={{ marginTop:4, paddingLeft:138 }}>
                              <input style={{ ...INP, marginBottom:0, fontSize:13 }} placeholder="Escribe tu propio KPI..." value={r.kpi==='Otro...'?'':r.kpi} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,kpi:e.target.value||'Otro...'}:o)}))} autoFocus />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setPlan(p=>({...p,objectives:[...p.objectives,{id:uid(),tipo:'Marketing',kpi:'',dato:'',tiempo:'mes'}]}))} style={BTN_SM}>+ Añadir objetivo</button>
                </div>
              </div>

              <VideoBlock vimeoId="1103392013" title="Cómo definir tus objetivos de marketing" />

              <div style={CARD}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6, flexWrap:'wrap', gap:10 }}>
                  <div>
                    <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, letterSpacing:'-0.01em' }}>Selección de Canales</h2>
                    <p style={{ fontSize:13, color:C.steel, marginTop:4 }}>Elige los canales con los que vas a trabajar. Luego la IA creará la estrategia.</p>
                  </div>
                  <AiBtn
                    label="Recomendar canales con IA"
                    used={usedAnalisis} max={limits.analisis}
                    onClick={()=>{
                      const v=validateObjectivesForStrategy()
                      if(!v.ok){setAlert({title:'Añade más objetivos',body:`Para recomendar canales necesitas al menos 2 objetivos de Marketing y 2 de Comunicación. Tienes ${v.mkt} Marketing y ${v.com} Comunicación.`});return}
                      createStrategy()
                    }}
                    disabled={busy}
                  />
                </div>
                <div style={{ background:C.paper, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:C.navy, fontWeight:500 }}>
                  ✓ <strong>{plan.selectedChannels.length}</strong> canales seleccionados
                </div>
                {Object.entries(CH_OPTIONS).map(([phase,channels])=>{
                  const phLabel:Record<string,string>={notoriedad:'Notoriedad',interaccion:'Interacción',lead_venta:'Lead / Venta',fidelizacion:'Fidelización'}
                  const phCol:Record<string,string>={notoriedad:C.warn,interaccion:'#1E40AF',lead_venta:C.success,fidelizacion:'#7E22CE'}
                  const phVideo:Record<string,string>={notoriedad:'Canales de Notoriedad y Branding',interaccion:'Canales de Interacción',lead_venta:'Canales de Lead y Venta'}
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
                      {phVideo[phase]&&<VideoBlock vimeoId="1103392013" title={phVideo[phase]} />}
                    </div>
                  )
                })}
                {/* Score legend */}
                <div style={{ marginTop:12, background:C.paper, borderRadius:8, padding:'10px 14px', display:'flex', gap:20, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:C.steel3, fontFamily:"'Geist Mono',monospace", fontWeight:600 }}>Puntuación IA:</span>
                  {[{dots:5,label:'Muy recomendado'},{dots:4,label:'Recomendado'},{dots:3,label:'Posible'},{dots:1,label:'No prioritario'}].map(({dots,label})=>(
                    <span key={dots} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:C.steel }}>
                      <span style={{ display:'flex', gap:2 }}>{[1,2,3,4,5].map(n=><span key={n} style={{ width:7, height:7, borderRadius:2, background:n<=dots?C.navy:C.steel1, display:'inline-block' }}/>)}</span>
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {!showStrategy&&(
                <div style={{ textAlign:'center', padding:'24px 0 32px' }}>
                  <p style={{ fontSize:14, color:C.steel, marginBottom:16 }}>Necesitas al menos 2 objetivos de Marketing para crear la estrategia.</p>
                  {(()=>{const v=validateObjectivesForStrategy();return !v.ok&&(
                    <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'10px 14px', fontSize:13, color:C.warn, marginBottom:16, textAlign:'left', maxWidth:500, margin:'0 auto 16px' }}>
                      ⚠️ Tienes {v.mkt}/2 objetivos de Marketing mínimos. Añade los que faltan arriba.
                    </div>
                  )})()}
                  <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                    <button onClick={()=>setStep(2)} style={BTN_S}>← Atrás</button>
                    <AiBtn label={busy?'Creando...':'Crear Estrategia'} used={usedAnalisis} max={limits.analisis}
                      onClick={()=>{const v=validateObjectivesForStrategy();if(!v.ok){setAlert({title:'Objetivos insuficientes',body:`Necesitas al menos 2 objetivos de Marketing para crear la estrategia. Ahora tienes ${v.mkt}. Añade los que faltan arriba.`});return;}createStrategy()}}
                      disabled={busy} />
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
                                  {ch.score_ia&&(
                                    <div title={`Puntuación IA: ${Number(ch.score_ia)}/5 — ${Number(ch.score_ia)>=4?"Muy recomendado":Number(ch.score_ia)>=3?"Recomendado":"Posible opción"}`} style={{ display:'flex', gap:2, cursor:'help', position:'relative' }}>
                                      {[1,2,3,4,5].map(n=><div key={n} style={{ width:8, height:8, borderRadius:2, background:n<=Number(ch.score_ia)?phCol[ph]:C.steel1 }}/>)}
                                      <span style={{ fontSize:10, color:C.steel3, marginLeft:4, alignSelf:'center' }}>{String(ch.score_ia)}/5</span>
                                    </div>
                                  )}
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
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                        <h2 style={{ fontSize:16, fontWeight:600, color:C.navy }}>Quick Wins</h2>
                        <AiBtn label="Nuevos Quick Wins IA" used={usedAnalisis} max={limits.analisis} onClick={getQuickWinsIA} disabled={busy} small />
                      </div>
                      {ga(plan.estrategia,'quick_wins').map((qw,i)=>(
                        <div key={i} style={{ display:'flex', gap:10, background:'#F0FDF4', borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
                          <span style={{ background:C.success, color:C.white, borderRadius:4, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:11, flexShrink:0 }}>{i+1}</span>
                          <span style={{ fontSize:14, color:C.navy }}>{ss(qw)}</span>
                        </div>
                      ))}
                      {plan.edits['qw_extra']&&(
                        <div style={{ marginTop:8, padding:'12px 14px', background:C.paper, borderRadius:8, border:`1px solid ${C.steel1}` }}>
                          <div style={{ fontSize:11, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:"'Geist Mono',monospace", marginBottom:8 }}>Nuevos Quick Wins IA</div>
                          {plan.edits['qw_extra'].split('\n').filter(Boolean).map((qw,i)=>(
                            <div key={i} style={{ display:'flex', gap:10, background:'#F0F9FF', borderRadius:8, padding:'10px 12px', marginBottom:6, border:'1px solid #BAE6FD' }}>
                              <span style={{ background:'#0369A1', color:C.white, borderRadius:4, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:11, flexShrink:0 }}>+</span>
                              <span style={{ fontSize:14, color:C.navy }}>{qw.replace(/^[-•*\d.]+\s*/,'')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>setStep(2)} style={BTN_S}>← Atrás</button>
                      <button onClick={()=>{setShowStrategy(false);}} style={BTN_S}>↺ Rehacer estrategia</button>
                    </div>
                    <button onClick={()=>{markDone(3);setStep(4);autoSave()}} style={BTN_P}>Táctico & Presupuesto →</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5: RESUMEN ─── */}
          {step===5&&(
            <div>
              <style>{`
                @media print {
                  body * { visibility: hidden !important; }
                  #plan-pdf, #plan-pdf * { visibility: visible !important; }
                  #plan-pdf { position: absolute; top: 0; left: 0; width: 100%; padding: 32px; background: white; }
                  .no-print { display: none !important; }
                }
              `}</style>
              <div className="no-print" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
                <div>
                  <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:4, letterSpacing:'-0.02em' }}>Resumen Ejecutivo</h1>
                  <p style={{ fontSize:14, color:C.steel }}>Tu plan completo de marketing</p>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>setStep(4)} style={BTN_S}>← Táctico</button>
                  <button onClick={()=>setSaveModal(true)} style={BTN_P}>
                    {'💾 Guardar plan'}
                  </button>
                  <button onClick={()=>window.print()} style={{ ...BTN_S, borderColor:C.navy, color:C.navy, fontWeight:600 }}>↓ Exportar PDF</button>
                </div>
              </div>

              <div id="plan-pdf">
                {/* HEADER */}
                <div style={{ background:C.navy, borderRadius:12, padding:28, marginBottom:16, color:C.paper }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                    <div>
                      <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(246,244,239,0.55)', marginBottom:6 }}>Media Planning Canvas</div>
                      <h2 style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.02em', marginBottom:4 }}>{plan.projectName||`Plan ${plan.sector}`}</h2>
                      <div style={{ fontSize:13, color:'rgba(246,244,239,0.7)' }}>{plan.pais} · {plan.sector} · {plan.tipo_negocio} · {plan.fase_negocio}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:11, color:'rgba(246,244,239,0.5)', marginBottom:4 }}>{new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</div>
                      {plan.web&&<div style={{ fontSize:12, color:'rgba(246,244,239,0.7)' }}>{plan.web}</div>}
                      {ed('usp',plan.usp)&&<div style={{ fontSize:13, fontStyle:'italic', color:'rgba(246,244,239,0.85)', maxWidth:280, marginTop:6 }}>"{ed('usp',plan.usp)}"</div>}
                    </div>
                  </div>
                </div>

                {/* MERCADO */}
                {plan.entorno&&(
                  <div style={{ ...CARD, marginBottom:12 }}>
                    <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>01 · Mercado</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Entorno</div>
                        <div style={{ fontSize:13, color:C.navy, lineHeight:1.6 }}>{ed('e_res',gn(plan.entorno,'situacion_pais','resumen'))}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Mercado</div>
                        <div style={{ fontSize:13, color:C.navy, lineHeight:1.6 }}>{ed('e_mkt',gn(plan.entorno,'mercado','descripcion'))}</div>
                        <div style={{ fontSize:12, color:C.steel, marginTop:4 }}>{ed('e_siz',gn(plan.entorno,'mercado','tamano_estimado'))}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:C.success, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Oportunidades</div>
                        <div style={{ fontSize:13, color:C.navy, whiteSpace:'pre-line', lineHeight:1.6 }}>{ed('d_op',gn(plan.entorno,'dafo','oportunidades'))}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:C.warn, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Amenazas</div>
                        <div style={{ fontSize:13, color:C.navy, whiteSpace:'pre-line', lineHeight:1.6 }}>{ed('d_am',gn(plan.entorno,'dafo','amenazas'))}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:'#1E40AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Fortalezas</div>
                        <div style={{ fontSize:13, color:C.navy, whiteSpace:'pre-line', lineHeight:1.6 }}>{ed('d_fo','')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:'#7E22CE', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Debilidades</div>
                        <div style={{ fontSize:13, color:C.navy, whiteSpace:'pre-line', lineHeight:1.6 }}>{ed('d_de','')}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TARGET */}
                {plan.target&&(
                  <div style={{ ...CARD, marginBottom:12 }}>
                    <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>02 · Target & Buyer Persona</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                      <div style={{ background:C.paper, borderRadius:8, padding:14 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:C.navy, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Core Target</div>
                        <div style={{ fontSize:13, color:C.navy, marginBottom:4 }}>{ed('t_cor',gn(plan.target,'core_target','descripcion'))}</div>
                        <div style={{ fontSize:11, color:C.steel3 }}>Volumen: {ed('t_vol',gn(plan.target,'core_target','volumen_estimado'))} · Edad: {ed('t_soc',gn(plan.target,'core_target','sociodemografico','edad'))}</div>
                      </div>
                      <div style={{ background:C.paper, borderRadius:8, padding:14 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:C.steel, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Broad Target</div>
                        <div style={{ fontSize:13, color:C.navy, marginBottom:4 }}>{ed('t_bro',gn(plan.target,'broad_target','descripcion'))}</div>
                        <div style={{ fontSize:11, color:C.steel3 }}>Volumen: {ed('t_bvol',gn(plan.target,'broad_target','volumen_estimado'))}</div>
                      </div>
                    </div>
                    <div style={{ background:C.paper, borderRadius:8, padding:16, marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:C.navy, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
                        Buyer Persona — {gn(plan.target,'buyer_persona','nombre')}
                      </div>
                      <div style={{ fontSize:13, color:C.navy, lineHeight:1.7, marginBottom:10 }}>{ed('bp_nar',gn(plan.target,'buyer_persona','descripcion_narrativa'))}</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        {[
                          {lb:'Barreras a la compra',k:'bp_bar',src:gn(plan.target,'buyer_persona','barreras_compra')},
                          {lb:'Consumer Insight',k:'bp_ins',src:gn(plan.target,'buyer_persona','consumer_insight')},
                        ].map(f=>(
                          <div key={f.k}>
                            <div style={{ fontSize:10, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{f.lb}</div>
                            <div style={{ fontSize:12, color:C.navy, whiteSpace:'pre-line', lineHeight:1.6 }}>{ed(f.k,f.src)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {plan.valueSteps.length>0&&(
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Escalera de Valor</div>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {plan.valueSteps.map((s,i)=>{
                            const cols:Record<string,string>={TOFU:'#92400E',MOFU:'#1E40AF',BOFU:C.success,FIDELIZACIÓN:'#7E22CE',RETENTION:'#831843'}
                            return(
                              <div key={s.id} style={{ flex:1, minWidth:140, background:C.paper, borderRadius:8, padding:'10px 12px', borderLeft:`3px solid ${cols[s.tipo]||C.steel2}` }}>
                                <div style={{ fontSize:9, fontWeight:600, color:cols[s.tipo]||C.steel3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{s.tipo} · {i+1}</div>
                                <div style={{ fontSize:12, fontWeight:600, color:C.navy, marginBottom:2 }}>{s.accion}</div>
                                <div style={{ fontSize:11, color:C.steel }}>{s.objetivo}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* OBJETIVOS */}
                {plan.objectives.filter(o=>o.kpi).length>0&&(
                  <div style={{ ...CARD, marginBottom:12 }}>
                    <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>03 · Objetivos del Plan</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {['Marketing','Comunicación'].map(tipo=>(
                        <div key={tipo}>
                          <div style={{ fontSize:11, fontWeight:600, color:tipo==='Marketing'?C.navy:C.steel, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{tipo}</div>
                          {plan.objectives.filter(o=>o.tipo===tipo&&o.kpi).map((o,i)=>(
                            <div key={o.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 10px', background:C.paper, borderRadius:6, marginBottom:4 }}>
                              <span style={{ fontSize:13, color:C.navy, fontWeight:500 }}>{o.kpi}</span>
                              <span style={{ fontSize:12, color:C.steel, fontFamily:"'Geist Mono',monospace" }}>{o.dato}/{o.tiempo}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ESTRATEGIA */}
                {plan.estrategia&&(
                  <div style={{ ...CARD, marginBottom:12 }}>
                    <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>04 · Estrategia de Canales</div>
                    <div style={{ fontSize:14, color:C.navy, lineHeight:1.7, marginBottom:14 }}>{gn(plan.estrategia,'estrategia_resumen')}</div>
                    {['notoriedad','interaccion','lead_venta','fidelizacion'].map(ph=>{
                      const phLabel:Record<string,string>={notoriedad:'Notoriedad',interaccion:'Interacción',lead_venta:'Lead / Venta',fidelizacion:'Fidelización'}
                      const phCol:Record<string,string>={notoriedad:C.warn,interaccion:'#1E40AF',lead_venta:C.success,fidelizacion:'#7E22CE'}
                      const channels=ga(plan.estrategia,'canales_por_fase',ph) as Obj[]
                      if(!channels||channels.length===0) return null
                      return(
                        <div key={ph} style={{ marginBottom:10 }}>
                          <div style={{ fontSize:11, fontWeight:600, color:phCol[ph], textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{phLabel[ph]}</div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:6 }}>
                            {channels.map((ch,i)=>(
                              <div key={i} style={{ background:C.paper, borderRadius:6, padding:'8px 10px', borderLeft:`2px solid ${phCol[ph]}` }}>
                                <div style={{ fontSize:13, fontWeight:600, color:C.navy, marginBottom:2 }}>{ss(ch.canal)}</div>
                                <div style={{ fontSize:11, color:C.steel }}>{ss(ch.accion)}</div>
                                <div style={{ fontSize:10, color:C.steel3, marginTop:2 }}>KPI: {ss(ch.kpi)} · {ss(ch.presupuesto_pct)}%</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    {ga(plan.estrategia,'quick_wins').length>0&&(
                      <div style={{ marginTop:12 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Quick Wins</div>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {ga(plan.estrategia,'quick_wins').map((qw,i)=>(
                            <div key={i} style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:6, padding:'6px 10px', fontSize:12, color:C.navy }}>✓ {ss(qw)}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* COMPETIDORES */}
                {plan.competidores&&(
                  <div style={{ ...CARD, marginBottom:12 }}>
                    <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Competidores</div>
                    <div style={{ fontSize:13, color:C.navy }}>{plan.competidores}</div>
                  </div>
                )}

                {/* FOOTER PDF */}
                <div style={{ textAlign:'center', padding:'16px 0', marginTop:8 }}>
                  <div style={{ fontSize:10, color:C.steel3, fontFamily:"'Geist Mono',monospace" }}>Media Planning Canvas · mediaplanningcanvas.com · {new Date().getFullYear()}</div>
                </div>
              </div>

              {/* Save button bottom */}
              {userPlan==='free'&&(
                <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'12px 16px', marginTop:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                  <span style={{ fontSize:13, color:C.warn }}>⚠️ Con el plan gratuito no puedes guardar tu plan. Activa Pro para guardarlo.</span>
                  <button onClick={()=>setShowUpgrade(true)} style={{ ...BTN_P, background:C.accent, padding:'9px 18px', fontSize:13 }}>Activar Pro →</button>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
