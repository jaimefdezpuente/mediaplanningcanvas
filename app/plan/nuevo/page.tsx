'use client'
export const dynamic = 'force-dynamic'
import { useState, useRef, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { MpcMark, MpcLockup } from '@/lib/MpcLogo'
import { AppHeader } from '@/lib/AppHeader'
import { useRouter, useSearchParams } from 'next/navigation'

type Jv = string | number | boolean | null | Jv[] | { [k: string]: Jv }
type Obj = { [k: string]: Jv }
interface ValStep { id: string; tipo: string; accion: string; objetivo: string }
interface ObjRow { id: string; tipo: string; kpi: string; dato: string; tiempo: string; mandatory?: boolean }
interface PlanData {
  projectName: string; pais: string; sector: string; producto: string; web: string
  tipo_negocio: string; competidores: string; presupuesto: string; fase_negocio: string; usp: string
  entorno: Obj | null; target: Obj | null; estrategia: Obj | null
  edits: { [k: string]: string }; completed: number[]; valueSteps: ValStep[]
  objectives: ObjRow[]; selectedChannels: string[]
}

const C = {
  paper:'#F6F4EF', paper2:'#ECE8DF', paper3:'#E2DDD0',
  navy:'#0F2942', navy7:'#163659',
  steel:'#4A6B8A', steel1:'#DDE2E8', steel2:'#B5C2D0', steel3:'#8AA0B5',
  accent:'#C75A3C', accent7:'#A6452C', success:'#2F7D5C', warn:'#C28840', white:'#FFFFFF',
}
const INP: React.CSSProperties = { width:'100%', background:C.white, border:`1px solid ${C.steel1}`, borderRadius:6, padding:'10px 14px', color:C.navy, fontSize:15, outline:'none', display:'block', marginBottom:6, boxSizing:'border-box', fontFamily:"'Geist',sans-serif", lineHeight:'1.5' }
const LBL: React.CSSProperties = { display:'block', fontSize:12, fontWeight:500, color:C.steel3, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:6, marginTop:16, fontFamily:"'Geist Mono',monospace" }
const CARD: React.CSSProperties = { background:C.white, border:`1px solid ${C.steel1}`, borderRadius:10, padding:24, marginBottom:16, boxShadow:'0 1px 2px rgba(15,41,66,0.05)' }
const BTN_P: React.CSSProperties = { padding:'11px 24px', borderRadius:6, background:C.navy, border:'none', color:C.paper, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:"'Geist',sans-serif", letterSpacing:'-0.01em' }
const BTN_S: React.CSSProperties = { padding:'11px 18px', borderRadius:6, background:'transparent', border:`1px solid ${C.steel1}`, color:C.steel, fontWeight:500, fontSize:14, cursor:'pointer', fontFamily:"'Geist',sans-serif" }
const BTN_SM: React.CSSProperties = { padding:'7px 14px', borderRadius:6, background:C.paper, border:`1px solid ${C.steel1}`, color:C.steel, fontWeight:500, fontSize:12, cursor:'pointer', fontFamily:"'Geist',sans-serif" }

function ss(v: Jv): string { if(v===null||v===undefined)return ''; if(typeof v==='string')return v; if(typeof v==='number'||typeof v==='boolean')return String(v); if(Array.isArray(v))return v.map(x=>ss(x as Jv)).join('\n'); return '' }
function gn(obj:Obj|null,...keys:string[]):string { if(!obj)return ''; let cur:Jv=obj; for(const k of keys){if(!cur||typeof cur!=='object'||Array.isArray(cur))return ''; cur=(cur as Obj)[k]} return ss(cur) }
function ga(obj:Obj|null,...keys:string[]):Jv[] { if(!obj)return []; let cur:Jv=obj; for(const k of keys){if(!cur||typeof cur!=='object'||Array.isArray(cur))return []; cur=(cur as Obj)[k]} return Array.isArray(cur)?cur:[] }
function uid() { return Math.random().toString(36).slice(2) }

const KPI_MKT = ['Ventas (ingresos EUR)','Ventas (unidades)','Ticket Medio','Leads','LTV','MRR/ARR','Registros','Demos','Descargas','Suscripciones','Trafico web','Churn','Share of market','Uso del producto','Fidelizacion','Otro...']
const KPI_COM = ['Notoriedad de marca','Cobertura','Alcance','Seguidores RRSS','Conocimiento de funcionalidad','Afinidad de marca','Frecuencia de impacto','Compartir experiencia','Visualizaciones','Reposicionamiento','Otro...']

const PLAN_LIMITS: Record<string, { plans: number; mejoras: number; analisis: number }> = {
  free:       { plans: 1,   mejoras: 10,  analisis: 3 },
  pro:        { plans: 10,  mejoras: 70,  analisis: 20 },
  business:   { plans: 30,  mejoras: 150, analisis: 60 },
  enterprise: { plans: 999, mejoras: 999, analisis: 999 },
}

const CH_OPTIONS: Record<string, string[]> = {
  notoriedad: ['Meta Ads Branding','TikTok Ads Branding','LinkedIn Ads Branding','YouTube Branding','Display Branding','Influencer Paid','Influencer Envío Producto','Brand Ambassadors','Employer Branding','Employee Advocacy','Ponencias en Eventos','Contenidos Medios Pagados','Colaboración con Medios','Branded Content','Sponsorship','Podcast Propio','Blog / Vblog','Contenidos RRSS','Boca a Oreja','Premios','Brand Days','Exterior','Prensa y Revistas','Radio','TV','Cine'],
  interaccion: ['LinkedIn Empresa','LinkedIn Perfiles Personales','LinkedIn Groups','Webinars','Workshops','Contenidos Formativos','Eventos Propios','Google Business','Live Streaming','Referencias Online','Web Corporativa','Concursos','Acudir a Eventos','Comunidad Propia','Networking','WhatsApp Business','Bot IA','Demos','Casos de Éxito','Propuestas Interactivas','Soporte Humano','Call Center','Banners Interactivos','Slideshare','Puntos de Venta','Flyers','Seeding','Internet of Things'],
  lead_venta: ['SEO','ASO','Link Building','SEM / Buscadores','LLM Ads','Meta Ads Performance','TikTok Performance','LinkedIn Performance','Display Retargeting','Display Performance','Email BBDD Propia','Email Automation','Newsletters','Alquiler de BBDD','Cold Outreach','Social Selling','Marketing de Afiliación','Member Get Member','SMS','Influencer Performance','Lead Magnets','Cupones','Landing de Venta','Workshops Lead','Eventos Online','Eventos Presenciales','Punto de Venta','Merchandising'],
  fidelizacion: ['Email Automation CRM','WhatsApp Fidelización','Programa Fidelización','Push Notifications','SMS Fidelización','Reviews / Reputación','Comunidad Propia','Customer Success','NPS y Feedback','Contenido Exclusivo'],
}

const PHASES = [
  { label:'Proyecto' },{ label:'Mercado' },{ label:'Target' },
  { label:'Estrategia' },{ label:'Tactico' },{ label:'Resumen' },
]

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
        <div style={{ fontSize:24, marginBottom:12 }}>Warning</div>
        <h3 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:10 }}>{title}</h3>
        <p style={{ fontSize:14, color:C.steel, lineHeight:1.6, marginBottom:24 }}>{body}</p>
        <button onClick={onClose} style={{ ...BTN_P, width:'100%' }}>{btn}</button>
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
        <input style={INP} type="text" placeholder="Ej: Plan Marketing Q3 2025" value={n} onChange={e=>setN(e.target.value)} autoFocus />
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <button onClick={onClose} style={BTN_S}>Cancelar</button>
          <button onClick={()=>n.trim()&&onSave(n)} style={{ ...BTN_P, flex:1 }} disabled={busy||!n.trim()}>
            {busy?'Guardando...':'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
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
        <div style={{ fontSize:32, marginBottom:12 }}>Star</div>
        <h3 style={{ fontSize:20, fontWeight:600, color:C.navy, marginBottom:8 }}>Funcion de plan Pro</h3>
        <p style={{ fontSize:14, color:C.steel, lineHeight:1.7, marginBottom:24 }}>Has alcanzado el limite de tu plan. Pasa a Pro para mas analisis con IA.</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:6, border:`1px solid ${C.steel1}`, background:'transparent', color:C.steel, cursor:'pointer', fontFamily:"'Geist',sans-serif" }}>Cancelar</button>
          <button onClick={goUpgrade} style={{ flex:2, padding:'11px', borderRadius:6, border:'none', background:C.navy, color:C.paper, fontWeight:600, cursor:'pointer', fontFamily:"'Geist',sans-serif" }}>Activar Pro</button>
        </div>
      </div>
    </div>
  )
}

function AiBtn({ label, used, max, onClick, disabled, small=false }: { label:string; used:number; max:number; onClick:()=>void; disabled?:boolean; small?:boolean }) {
  const remaining = Math.max(0, max - used)
  const isOut = remaining <= 0
  return (
    <button onClick={onClick} disabled={disabled||isOut} style={{ padding: small?'7px 12px':'9px 16px', borderRadius:6, border:`1px solid ${isOut?'#FECACA':C.steel1}`, background: isOut?'#FEF2F2':C.paper, color: isOut?'#B33A2E':C.steel, fontWeight:500, fontSize: small?11:12, cursor: isOut?'not-allowed':'pointer', fontFamily:"'Geist',sans-serif", display:'flex', alignItems:'center', gap:6, opacity:disabled&&!isOut?0.6:1 }}>
      <span style={{ color: isOut?'#B33A2E':C.accent }}>AI</span>
      {label}
      <span style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, padding:'2px 6px', borderRadius:4, background: isOut?'#FECACA':'#F0FDF4', color: isOut?'#B33A2E':C.success, fontWeight:600 }}>
        {remaining}/{max}
      </span>
    </button>
  )
}

function VideoBlock({ vimeoId, title }: { vimeoId: string; title: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border:`1px solid ${C.steel1}`, borderRadius:8, marginBottom:16, overflow:'hidden' }}>
      <button onClick={()=>setOpen(!open)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:C.paper, border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ width:28, height:28, borderRadius:6, background:C.navy, display:'flex', alignItems:'center', justifyContent:'center', color:C.paper, fontSize:12, flexShrink:0 }}>Play</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:500, color:C.navy }}>Formacion - {title}</div>
          <div style={{ fontSize:11, color:C.steel3 }}>Jaime explica esta fase en video</div>
        </div>
        <span style={{ color:C.steel3 }}>{open?'v':'^'}</span>
      </button>
      {open && (
        <div style={{ padding:'0 4px 4px' }}>
          <div style={{ position:'relative', paddingBottom:'56.25%', height:0 }}>
            <iframe src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none', borderRadius:6 }} allow="autoplay; fullscreen" allowFullScreen />
          </div>
        </div>
      )}
    </div>
  )
}

function EditField({ label, fkey, value, onChange, onRefine, multiline=true, small=false }: { label:string; fkey:string; value:string; onChange:(v:string)=>void; onRefine:(p:string)=>void; multiline?:boolean; small?:boolean }) {
  const [rp,setRp]=useState(''); const [show,setShow]=useState(false); const [alert30,setAlert30]=useState(false)
  const ref=useRef<HTMLTextAreaElement>(null)
  useEffect(()=>{ if(ref.current&&multiline){ref.current.style.height='auto'; ref.current.style.height=ref.current.scrollHeight+'px'} },[value])
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        {label&&<label style={{ fontSize:small?11:12, fontWeight:500, color:C.steel3, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'Geist Mono',monospace" }}>{label}</label>}
        <button onClick={()=>{ if(value.length < 30){ setAlert30(true) } else { setShow(!show) } }} style={{ fontSize:11, color:value.length < 30 ? C.steel2 : C.accent, background:'none', border:'none', cursor: value.length < 30 ? 'not-allowed' : 'pointer', fontWeight:500, marginLeft:'auto', fontFamily:"'Geist',sans-serif" }}>✨ Mejorar</button>
      </div>
      {multiline
        ? <textarea ref={ref} style={{ ...INP, minHeight:72, resize:'none', overflow:'hidden', fontSize:small?13:15 }} value={value} onChange={e=>{ onChange(e.target.value); if(ref.current){ref.current.style.height='auto'; ref.current.style.height=ref.current.scrollHeight+'px'} }} />
        : <input style={{ ...INP, fontSize:small?13:15 }} type="text" value={value} onChange={e=>onChange(e.target.value)} />
      }
      {show&&(
        <div style={{ background:C.paper2, border:`1px solid ${C.steel1}`, borderRadius:8, padding:12, marginTop:4, display:'flex', gap:8 }}>
          <input style={{ ...INP, marginBottom:0, flex:1, fontSize:13, background:C.white }} placeholder="Hazlo mas conciso, enfocalo en B2B..." value={rp} onChange={e=>setRp(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&rp.trim()){onRefine(rp);setRp('');setShow(false)} }} />
          <button onClick={()=>{ if(rp.trim()){onRefine(rp);setRp('');setShow(false)} }} style={{ ...BTN_SM, padding:'10px 14px', background:C.navy, color:C.paper, border:'none' }}>Enviar</button>
        </div>
      )}
    {alert30&&(
      <div style={{ position:'fixed', inset:0, background:'rgba(15,41,66,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ background:'#fff', borderRadius:12, padding:32, maxWidth:420, width:'100%', boxShadow:'0 24px 48px rgba(15,41,66,0.25)' }}>
          <div style={{ fontSize:24, marginBottom:12 }}>✏️</div>
          <h3 style={{ fontSize:18, fontWeight:600, color:'#0F2942', marginBottom:10 }}>Rellena el campo primero</h3>
          <p style={{ fontSize:14, color:'#4A6B8A', lineHeight:1.6, marginBottom:24 }}>Necesitas al menos 30 caracteres en el campo para poder mejorarlo con IA. Cuanta más información des, mejor será el resultado.</p>
          <button onClick={()=>setAlert30(false)} style={{ width:'100%', padding:'11px', borderRadius:6, background:'#0F2942', border:'none', color:'#F6F4EF', fontWeight:600, cursor:'pointer', fontFamily:"'Geist',sans-serif" }}>Entendido</button>
        </div>
      </div>
    )}
    </div>
  )
}

const TOOLS_DATA: Record<string,{name:string;url:string;desc:string}[]> = {
  macro:[{name:'Statista',url:'https://statista.com',desc:'Estadisticas globales'},{name:'DataCommons',url:'https://datacommons.org',desc:'Datos publicos Google'}],
  mercado:[{name:'Google Trends',url:'https://trends.google.com',desc:'Tendencias en tiempo real'},{name:'Exploding Topics',url:'https://explodingtopics.com',desc:'Tendencias emergentes'}],
  competencia:[{name:'SimilarWeb',url:'https://similarweb.com',desc:'Trafico y fuentes rivales'},{name:'SEMrush',url:'https://semrush.com',desc:'SEO y SEM de competidores'}],
  target:[{name:'Meta Audience Insights',url:'https://business.facebook.com/latest/insights/people',desc:'Audiencias FB/IG'},{name:'SparkToro',url:'https://sparktoro.com',desc:'Que lee tu target'}],
}

function ToolsBlock({ title, tools }: { title:string; tools:{name:string;url:string;desc:string}[] }) {
  const [open,setOpen]=useState(false)
  return (
    <div style={{ border:`1px solid ${C.steel1}`, borderRadius:8, marginTop:16 }}>
      <button onClick={()=>setOpen(!open)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 16px', background:'transparent', border:'none', cursor:'pointer', fontFamily:"'Geist',sans-serif" }}>
        <span style={{ fontSize:13, fontWeight:500, color:C.steel }}>Herramientas - {title}</span>
        <span style={{ color:C.steel3 }}>{open?'v':'^'}</span>
      </button>
      {open && <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8, padding:'0 12px 12px' }}>
        {tools.map((t,i)=>(
          <a key={i} href={t.url} target="_blank" rel="noopener noreferrer" style={{ background:C.paper, border:`1px solid ${C.steel1}`, borderRadius:6, padding:'10px 12px', textDecoration:'none' }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{t.name}</div>
            <div style={{ fontSize:11, color:C.steel }}>{t.desc}</div>
          </a>
        ))}
      </div>}
    </div>
  )
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
  const [channelsChanged, setChannelsChanged] = useState(false)
  const [competidorLoading, setCompetidorLoading] = useState(false)
  const [suggestedComps, setSuggestedComps] = useState<{nombre:string;descripcion:string;url:string}[]>([])
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [userPlan, setUserPlan] = useState('free')
  const [userAvatar, setUserAvatar] = useState('')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [usedPlans, setUsedPlans] = useState(0)
  const [usedMejoras, setUsedMejoras] = useState(0)
  const [usedAnalisis, setUsedAnalisis] = useState(0)
  const [savedPlanId, setSavedPlanId] = useState<string|null>(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [headerMenu, setHeaderMenu] = useState(false)
  const [plan, setPlan] = useState<PlanData>({
    projectName:'', pais:'Espana', sector:'', producto:'', web:'',
    tipo_negocio:'B2C', competidores:'', presupuesto:'', fase_negocio:'launch', usp:'',
    entorno:null, target:null, estrategia:null,
    edits:{}, completed:[], valueSteps:[],
    objectives:[{id:uid(),tipo:'Marketing',kpi:'',dato:'',tiempo:'año',mandatory:false}],
    selectedChannels:[],
  })
  const supabase = createClient()
  const router = useRouter()
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const planRef = useRef<PlanData|null>(null)
  const stepRef = useRef<number>(0)
  const searchParams = useSearchParams()

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const planKey = (user.user_metadata?.plan || 'free').toLowerCase()
        setUserPlan(planKey)
        setUserName(user.user_metadata?.full_name || '')
        setUserEmail(user.email || '')
        setUsedPlans(user.user_metadata?.used_plans || 0)
        setUsedMejoras(Number(user.user_metadata?.used_mejoras || 0))
        setUsedAnalisis(Number(user.user_metadata?.used_analisis || 0))
        if (user.user_metadata?.avatar_url) setUserAvatar(user.user_metadata.avatar_url)
        const planId = searchParams.get('plan_id')
        if (planId) {
          const { data: savedPlan } = await supabase.from('plans').select('*').eq('id', planId).eq('user_id', user.id).single()
          if (savedPlan) {
            setSavedPlanId(planId)
            setPlan(p => ({
              ...p,
              projectName: savedPlan.name || '',
              pais: savedPlan.pais || 'Espana',
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
              edits: savedPlan.edits || {},
              objectives: savedPlan.objectives || [{id:uid(),tipo:'Marketing',kpi:'',dato:'',tiempo:'año',mandatory:false}],
              valueSteps: savedPlan.value_steps || [],
              selectedChannels: savedPlan.selected_channels || [],
              completed: [
                ...(savedPlan.entorno ? [0, 1] : []),
                ...(savedPlan.estrategia ? [2, 3] : []),
              ],
            }))
            const savedStep = savedPlan.current_step || 0
            if (savedStep > 0) setStep(savedStep)
            else if (savedPlan.estrategia) setStep(4)
            else if (savedPlan.entorno) setStep(2)
            else setStep(1)
          }
        }
      } catch(e) {
        console.error('init error:', e)
        router.push('/login')
      }
    }
    init()
  }, [])

  useEffect(() => {
    function handleMsg(e: MessageEvent) {
      if (e.data?.type === 'mpc-height' && typeof e.data.height === 'number' && e.data.height > 200) {
        const iframe = document.getElementById('tactico-iframe') as HTMLIFrameElement
        if (iframe) iframe.style.height = e.data.height + 'px'
      }
      if (e.data?.type === 'mpc-upgrade') setShowUpgrade(true)
    }
    window.addEventListener('message', handleMsg)
    return () => window.removeEventListener('message', handleMsg)
  }, [])

  useEffect(() => { planRef.current = plan }, [plan])
  useEffect(() => { stepRef.current = step; if(step > 0) autoSaveFromRef() }, [step])
  const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free

  function canUseMejora(): boolean { if (usedMejoras >= limits.mejoras) { setShowUpgrade(true); return false } return true }
  function canUseAnalisis(): boolean { if (usedAnalisis >= limits.analisis) { setShowUpgrade(true); return false } return true }
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
  function se(k:string,v:string) {
    setPlan(p=>{
      const next = {...p,edits:{...p.edits,[k]:v}}
      planRef.current = next
      return next
    })
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => { autoSaveFromRef() }, 2000)
  }
  function ed(k:string,fb:string) { return plan.edits[k]!==undefined?plan.edits[k]:fb }
  function markDone(s:number) { setPlan(p=>({...p,completed:p.completed.includes(s)?p.completed:[...p.completed,s]})) }

  function ensureMandatoryObjectives() {
    const modelo = plan.tipo_negocio
    const mandatoryKPIs = modelo === 'B2B' ? ['Leads','Ventas (unidades)'] : ['Ventas (unidades)','Ticket Medio']
    setPlan(p => {
      const nonMandatory = p.objectives.filter(o => !o.mandatory)
      const newRows: ObjRow[] = mandatoryKPIs.map(kpi => ({ id:uid(), tipo:'Marketing', kpi, dato:'', tiempo:'año', mandatory:true }))
      const existing = p.objectives.filter(o => o.mandatory)
      if (existing.length === 2 && existing[0].kpi === mandatoryKPIs[0] && existing[1].kpi === mandatoryKPIs[1]) return p
      return { ...p, objectives: [...newRows, ...nonMandatory] }
    })
  }

  async function callAI(fase:string, extra?:Record<string,string>) {
    setBusy(true); setErr('')
    const msgs:Record<string,string> = {
      entorno:`Analizando mercado de ${plan.sector}...`,
      target:'Creando buyer persona y target...',
      estrategia:'Creando estrategia de canales...',
      refine:'Mejorando el texto...',
    }
    setAiModal(msgs[fase]||'Procesando...')
    try {
      const res = await fetch('/api/ai', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ fase, datos:{ pais:plan.pais, sector:plan.sector, producto:plan.producto, web:plan.web, tipo_negocio:plan.tipo_negocio, competidores:plan.competidores, presupuesto:plan.presupuesto, fase_negocio:plan.fase_negocio, usp:plan.usp, ...extra } })
      })
      if(res.status===402){ setShowUpgrade(true); return null }
      if(res.status===401){ router.push('/login'); return null }
      const json = await res.json()
      if(!json.success) throw new Error(json.error)
      // Sync credits from server response
      if(typeof json.remaining === 'number') {
        const creditType = ['refine'].includes(fase) ? 'mejoras' : 'analisis'
        if(creditType==='analisis') setUsedAnalisis(limits.analisis - json.remaining)
        else setUsedMejoras(limits.mejoras - json.remaining)
      }
      return json.data as Obj
    } catch { setErr('Error con la IA. Intentalo de nuevo.'); return null }
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
    setCompetidorLoading(true); setAiModal(`Buscando competidores de ${plan.sector}...`)
    try {
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fase:'competidores', datos:{ producto:plan.producto, pais:plan.pais, sector:plan.sector, web:plan.web } }) })
      const json = await res.json()
      if(json.success&&Array.isArray(json.data?.competidores)) {
        setSuggestedComps(json.data.competidores)
        const names = json.data.competidores.map((c: {nombre:string})=>c.nombre).join(', ')
        setPlan(p=>({...p,competidores:names}))
        trackAnalisis()
      }
    } catch { setErr('Error buscando competidores.') }
    finally { setCompetidorLoading(false); setAiModal('') }
  }

  async function s0next() {
    if(!plan.sector||!plan.producto) { setErr('Rellena sector y descripcion del producto'); return }
    if(!plan.presupuesto) { setErr('El presupuesto es obligatorio'); return }
    if(plan.entorno){markDone(0);setStep(1);return}
    if(userPlan==='free'){setPlan(p=>({...p,entorno:{} as Obj}));markDone(0);setStep(1);return}
    if(!canUseAnalisis()) return
    const r = await callAI('entorno')
    if(r){setPlan(p=>({...p,entorno:r}));markDone(0);setStep(1);trackAnalisis();autoSave({entorno:r as Obj})}
  }

  function s1next() {
    if(!ed('d_fo','').trim()){setAlert({title:'Fortalezas obligatorias',body:'Rellena tus Fortalezas antes de continuar.'});return}
    if(!ed('d_de','').trim()){setAlert({title:'Debilidades obligatorias',body:'Rellena tus Debilidades antes de continuar.'});return}
    markDone(1);setStep(2)
    autoSave({})
  }

  function s2next() {
    if(!ed('usp',plan.usp).trim()) { setAlert({title:'USP obligatoria',body:'Define tu Propuesta Unica de Valor antes de continuar.'}); return }
    if(!ed('t_cor',gn(plan.target,'core_target','descripcion')).trim()) { setAlert({title:'Core Target obligatorio',body:'Rellena la descripcion del Core Target antes de continuar.'}); return }

    ensureMandatoryObjectives()
    markDone(2);setStep(3);setShowStrategy(false)
    autoSave({usp:ed('usp',plan.usp)||plan.usp})
  }

  async function createStrategy() {
    setAiModal(`Analizando ${plan.sector} para crear tu estrategia...`)
    const objText = plan.objectives.map(o=>`${o.tipo}: ${o.kpi} = ${o.dato} al ano`).join(' | ')
    const escaleraText = plan.valueSteps.map((s,i)=>`Paso ${i+1} (${s.tipo}): ${s.accion}`).join(' | ')
    const targetDesc = ed('t_cor',gn(plan.target,'core_target','descripcion'))
    const r = await callAI('estrategia',{
      objetivos:objText,
      canales_seleccionados:plan.selectedChannels.join(', ')||'Sin seleccion',
      fortalezas:ed('d_fo',''),
      target_desc:targetDesc,
      escalera_valor:escaleraText,
      presupuesto:plan.presupuesto,
      competidores:plan.competidores,
    })
    if(r){
      const phases = ['notoriedad','interaccion','lead_venta','fidelizacion']
      const recommendedNames: string[] = []
      phases.forEach(ph=>{
        const chs = (r as Obj).canales_por_fase
        if(chs&&typeof chs==='object'&&!Array.isArray(chs)){
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
      const merged = Array.from(new Set(recommendedNames))
      setPlan(p=>({...p, estrategia:r as Obj, selectedChannels:merged}))
      setShowStrategy(true); setChannelsChanged(false)
      autoSave({estrategia:r as Obj})
    }
  }

  async function autoSaveFromRef() {
    const current = planRef.current
    console.log("autoSaveFromRef called, savedPlanId:", savedPlanId, "current edits:", current?.edits)
    if (!current) { console.log("no current plan"); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setAutoSaving(true)
    try {
      if (savedPlanId) {
        await supabase.from('plans').update({
          name: current.projectName || `Plan ${current.sector}`,
          pais: current.pais, sector: current.sector, producto: current.producto,
          web: current.web, presupuesto: current.presupuesto, competidores: current.competidores,
          tipo_negocio: current.tipo_negocio, fase_negocio: current.fase_negocio,
          usp: current.usp, entorno: current.entorno, target: current.target,
          estrategia: current.estrategia, edits: current.edits,
          objectives: current.objectives, value_steps: current.valueSteps,
          selected_channels: current.selectedChannels,
          status: 'in_progress', current_step: stepRef.current, updated_at: new Date().toISOString(),
        }).eq('id', savedPlanId)
      } else {
        const { data } = await supabase.from('plans').insert({
          user_id: user.id, name: current.projectName || `Plan ${current.sector || 'nuevo'}`,
          pais: current.pais, sector: current.sector, producto: current.producto,
          web: current.web, presupuesto: current.presupuesto, competidores: current.competidores,
          tipo_negocio: current.tipo_negocio, fase_negocio: current.fase_negocio,
          usp: current.usp, entorno: current.entorno, target: current.target,
          estrategia: current.estrategia, edits: current.edits,
          objectives: current.objectives, value_steps: current.valueSteps,
          selected_channels: current.selectedChannels,
          status: 'in_progress', current_step: stepRef.current,
        }).select('id').single()
        if (data?.id) setSavedPlanId(data.id)
      }
    } catch(e) { console.error('autoSave error:', e) }
    setAutoSaving(false)
  }

  async function autoSave(extra?: Partial<PlanData>) {
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
          web: current.web, presupuesto: current.presupuesto, competidores: current.competidores,
          usp: current.usp, entorno: current.entorno, target: current.target,
          estrategia: current.estrategia, edits: current.edits,
          objectives: current.objectives, value_steps: current.valueSteps,
          selected_channels: current.selectedChannels,
          status: 'in_progress', current_step: stepRef.current, updated_at: new Date().toISOString(),
        }).eq('id', savedPlanId)
      } else {
        const { data } = await supabase.from('plans').insert({
          user_id: user.id, name: current.projectName || `Plan ${current.sector || 'nuevo'}`,
          pais: current.pais, sector: current.sector, producto: current.producto,
          tipo_negocio: current.tipo_negocio, fase_negocio: current.fase_negocio,
          web: current.web, presupuesto: current.presupuesto, competidores: current.competidores,
          usp: current.usp, entorno: current.entorno, target: current.target,
          estrategia: current.estrategia, edits: current.edits,
          objectives: current.objectives, value_steps: current.valueSteps,
          selected_channels: current.selectedChannels,
          status: 'in_progress', current_step: stepRef.current,
        }).select('id').single()
        if (data?.id) setSavedPlanId(data.id)
      }
    } catch { /* silent */ }
    setAutoSaving(false)
  }

  async function handleSave(name: string) {
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    if (savedPlanId) {
      await supabase.from('plans').update({ name: name.trim(), pais: plan.pais, sector: plan.sector, producto: plan.producto, web: plan.web, presupuesto: plan.presupuesto, competidores: plan.competidores, tipo_negocio: plan.tipo_negocio, fase_negocio: plan.fase_negocio, usp: plan.usp, entorno: plan.entorno, target: plan.target, estrategia: plan.estrategia, edits: plan.edits, objectives: plan.objectives, value_steps: plan.valueSteps, selected_channels: plan.selectedChannels, status: 'completed', updated_at: new Date().toISOString() }).eq('id', savedPlanId)
    } else {
      await supabase.from('plans').insert({ user_id: user.id, name: name.trim(), pais: plan.pais, sector: plan.sector, producto: plan.producto, web: plan.web, presupuesto: plan.presupuesto, competidores: plan.competidores, tipo_negocio: plan.tipo_negocio, fase_negocio: plan.fase_negocio, usp: plan.usp, entorno: plan.entorno, target: plan.target, estrategia: plan.estrategia, edits: plan.edits, objectives: plan.objectives, value_steps: plan.valueSteps, selected_channels: plan.selectedChannels, status: 'completed' })
    }
    router.push('/dashboard?saved=true')
    setBusy(false)
  }

  function canNav(i:number) { return i===0||plan.completed.includes(i-1)||step>=i }

  function buildIframeSrc(): string {
    const budMap: Record<string,number> = {'1000_3000':2000,'3000_10000':6000,'10000_30000':20000,'30000_100000':60000,'mas_100000':150000}
    const bud = Object.entries(budMap).find(([k])=>plan.presupuesto.includes(k))?.[1] ?? 1000
    const sectorMap: Record<string,string> = {'Moda y Accesorios':'moda','Alimentacion':'alimentacion','Salud y Belleza':'salud','Tecnologia':'tecnologia','Servicios B2B':'servicios','Formacion y Educacion':'cursos','Viajes y Turismo':'viajes','Inmobiliario':'servicios','Deporte y Fitness':'deporte','Hogar y Decoracion':'hogar','Automocion':'automovil','Seguros y Finanzas':'seguros','Hosteleria y Restauracion':'alimentacion','Farmacia y Salud':'salud','Otros':'otros'}
    const sector = sectorMap[plan.sector] || ''
    const objVentas = plan.objectives.find(o=>o.kpi&&o.kpi.includes('unidades'))
    const objLeads  = plan.objectives.find(o=>o.kpi==='Leads')
    const objTicket = plan.objectives.find(o=>o.kpi==='Ticket Medio')
    const clients = objVentas?.dato || objLeads?.dato || ''
    const ticket  = objTicket?.dato || ''
    const mode = plan.tipo_negocio === 'B2B' ? 'B2B' : 'B2C'
    const ro = '0'
    let url = `/calculadora.html?channels=${encodeURIComponent(plan.selectedChannels.join(','))}&budget=${bud}&mode=${mode}&readonly=${ro}&noheader=1&sector=${sector}&phase=${plan.fase_negocio||'launch'}&plan=${userPlan}&usedAnalisis=${usedAnalisis}`
    if (clients) url += `&clients=${clients}`
    if (ticket)  url += `&ticket=${ticket}`
    return url
  }

  const phaseColors:Record<string,string>={notoriedad:C.warn,interaccion:'#1E40AF',lead_venta:C.success,fidelizacion:'#7E22CE'}
  const phaseLabels:Record<string,string>={notoriedad:'Notoriedad',interaccion:'Interaccion',lead_venta:'Lead / Venta',fidelizacion:'Fidelizacion'}

  return (
    <div style={{ minHeight:'100vh', background:C.paper }}>
      {aiModal&&<AiModal msg={aiModal}/>}
      {alert&&<AlertModal title={alert.title} body={alert.body} btn="Entendido" onClose={()=>setAlert(null)}/>}
      {saveModal&&<SaveModal onSave={handleSave} onClose={()=>setSaveModal(false)} busy={busy} defaultName={plan.projectName||`Plan ${plan.sector||'nuevo'}`}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)}/>}

      <AppHeader
        userEmail={userEmail}
        userName={userName}
        userAvatar={userAvatar}
        planKey={userPlan}
        usedPlans={usedPlans}
        usedAnalisis={usedAnalisis}
        usedMejoras={usedMejoras}
        projectName={plan.projectName || undefined}
        autoSaving={autoSaving}
        onSave={() => setSaveModal(true)}
        onLogout={async () => { await supabase.auth.signOut(); router.push('/login') }}
      >
        {PHASES.map((ph,i) => {
          const done=plan.completed.includes(i); const cur=step===i; const acc=canNav(i)
          return (
            <button key={i} onClick={()=>acc&&setStep(i)} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 14px', background:'transparent', border:'none', cursor:acc?'pointer':'not-allowed', opacity:acc?1:0.4, borderBottom:cur?`2px solid ${C.navy}`:'2px solid transparent' }}>
              <div style={{ width:20, height:20, borderRadius:4, background:done?C.navy:cur?C.navy:C.steel1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:done||cur?C.paper:C.steel3, fontWeight:600 }}>{done?'✓':i}</div>
              <span style={{ fontSize:10, fontWeight:cur?600:400, color:cur?C.navy:C.steel3, whiteSpace:'nowrap', marginTop:2 }}>{ph.label}</span>
            </button>
          )
        })}
      </AppHeader>

      {step===4&&(
        <div style={{ maxWidth:1040, margin:'0 auto', padding:'40px 24px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
            <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, letterSpacing:'-0.02em', margin:0 }}>Tactico & Presupuesto</h1>
            <span style={{ background:C.navy, color:C.paper, borderRadius:100, padding:'4px 14px', fontSize:13, fontWeight:700 }}>{plan.tipo_negocio}</span>
          </div>
          <p style={{ fontSize:14, color:C.steel, marginBottom:16 }}>{plan.sector} - {plan.pais}</p>
          <VideoBlock vimeoId="1103392013" title="Distribucion tactica de presupuesto" />

          <div style={{ position:'relative', marginBottom:32, width:'100%', overflow:'hidden' }}>
            <iframe id="tactico-iframe" key={plan.tipo_negocio} src={buildIframeSrc()} style={{ width:'100%', height:600, border:'none', display:'block', minHeight:600 }} scrolling="no" title="Calculadora" />

          </div>
          <div style={{ position:'sticky', bottom:0, background:C.paper, borderTop:`1px solid ${C.steel1}`, padding:'12px 0', display:'flex', justifyContent:'space-between', zIndex:10 }}>
            <button onClick={()=>setStep(3)} style={BTN_S}>Atras</button>
            <button onClick={()=>{markDone(4);setStep(5)}} style={{ ...BTN_P, padding:'12px 32px' }}>Ver Resumen</button>
          </div>
          <div style={{ height:24 }} />
        </div>
      )}

      {step!==4&&(
        <div style={{ maxWidth:1040, margin:'0 auto', padding:'40px 24px 80px' }}>
          {err&&<div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 16px', fontSize:14, color:'#B33A2E', marginBottom:16 }}>Error: {err}</div>}

          {step===0&&(
            <div>
              <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:6 }}>Datos del proyecto</h1>
              <p style={{ fontSize:15, color:C.steel, marginBottom:16 }}>La IA analizara tu mercado con esta informacion.</p>
              <VideoBlock vimeoId="1103392013" title="Como empezar tu Media Planning Canvas" />
              <div style={CARD}>
                <label style={LBL}>Nombre del proyecto *</label>
                <input style={INP} type="text" placeholder="Ej: Lanzamiento App Q3 2025" value={plan.projectName} onChange={e=>upd('projectName',e.target.value)} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <label style={LBL}>Pais *</label>
                    <select style={{ ...INP, cursor:'pointer' }} value={plan.pais} onChange={e=>upd('pais',e.target.value)}>
                      {['Espana','Mexico','Argentina','Colombia','Chile','Peru','Estados Unidos','United Kingdom','France','Germany'].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>Sector *</label>
                    <select style={{ ...INP, cursor:'pointer' }} value={plan.sector} onChange={e=>upd('sector',e.target.value)}>
                      <option value="">Selecciona</option>
                      {['Moda y Accesorios','Alimentacion','Salud y Belleza','Tecnologia','Servicios B2B','Formacion y Educacion','Viajes y Turismo','Inmobiliario','Deporte y Fitness','Hogar y Decoracion','Automocion','Seguros y Finanzas','Hosteleria y Restauracion','Farmacia y Salud','Otros'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <label style={LBL}>Descripcion del producto o servicio *</label>
                <textarea style={{ ...INP, minHeight:80, resize:'vertical' }} placeholder="Ej: Plataforma SaaS de gestion de redes sociales para pymes." value={plan.producto} onChange={e=>upd('producto',e.target.value)} />
                <label style={LBL}>Web del producto</label>
                <input style={INP} type="url" placeholder="https://www.tuempresa.com" value={plan.web} onChange={e=>upd('web',e.target.value)} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <label style={LBL}>Tipo de negocio</label>
                    <select style={{ ...INP, cursor:'pointer' }} value={plan.tipo_negocio} onChange={e=>upd('tipo_negocio',e.target.value)}>
                      <option value="B2C">B2C - Vendes a consumidores</option>
                      <option value="B2B">B2B - Vendes a empresas</option>
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
                    {suggestedComps.map((c,i)=>(
                      <div key={i} style={{ marginBottom:8 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:C.navy }}>{c.nombre}</span>
                        {c.url&&<a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.accent, marginLeft:8 }}>Ver</a>}
                        <div style={{ fontSize:12, color:C.steel }}>{c.descripcion}</div>
                      </div>
                    ))}
                  </div>
                )}
                <label style={LBL}>Presupuesto mensual estimado</label>
                <select style={{ ...INP, cursor:'pointer' }} value={plan.presupuesto} onChange={e=>upd('presupuesto',e.target.value)}>
                  <option value="" disabled>Selecciona presupuesto *</option>
                  <option value="menos_1000">Menos de 1.000 EUR/mes</option>
                  <option value="1000_3000">1.000 - 3.000 EUR/mes</option>
                  <option value="3000_10000">3.000 - 10.000 EUR/mes</option>
                  <option value="10000_30000">10.000 - 30.000 EUR/mes</option>
                  <option value="30000_100000">30.000 - 100.000 EUR/mes</option>
                  <option value="mas_100000">Mas de 100.000 EUR/mes</option>
                </select>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button onClick={s0next} disabled={busy} style={{ padding:"9px 18px", borderRadius:6, background:C.navy, border:"none", color:C.paper, fontWeight:600, fontSize:14, cursor:busy?"not-allowed":"pointer", fontFamily:"'Geist',sans-serif", opacity:busy?0.7:1 }}>{userPlan==="free" ? "Continuar →" : `✦ Analizar Mercado con IA (${Math.max(0,limits.analisis-usedAnalisis)} créditos)`}</button>
              </div>
            </div>
          )}

          {step===1&&plan.entorno&&(
            <div>
              <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:6 }}>Mercado</h1>
              <p style={{ fontSize:15, color:C.steel, marginBottom:24 }}>Edita cada campo. Usa AI para refinarlo.</p>
              <div style={CARD}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontSize:18, fontWeight:600, color:C.navy }}>Situacion del Pais</h2>
                  <AiBtn label="Analizar con IA" used={usedAnalisis} max={limits.analisis} onClick={async()=>{if(!canUseAnalisis())return;const r=await callAI('entorno');if(r){se('e_res',gn(r,'situacion_pais','resumen'));se('e_mac',gn(r,'situacion_pais','variables_macro'));trackAnalisis()}}} disabled={busy} small />
                </div>
                <VideoBlock vimeoId="1103392013" title="Situación del País y Entorno" />
                <EditField label="Resumen del entorno" fkey="e_res" value={ed('e_res',gn(plan.entorno,'situacion_pais','resumen'))} onChange={v=>se('e_res',v)} onRefine={p=>refine('e_res',ed('e_res',''),p)} />
                <EditField label="Variables macroeconomicas" fkey="e_mac" value={ed('e_mac',gn(plan.entorno,'situacion_pais','variables_macro'))} onChange={v=>se('e_mac',v)} onRefine={p=>refine('e_mac',ed('e_mac',''),p)} />
                <ToolsBlock title="Analisis Macro" tools={TOOLS_DATA.macro} />
              </div>
              <div style={CARD}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontSize:18, fontWeight:600, color:C.navy }}>Tu Mercado</h2>
                  <AiBtn label="Analizar con IA" used={usedAnalisis} max={limits.analisis} onClick={async()=>{if(!canUseAnalisis())return;const r=await callAI('entorno');if(r){se('e_mkt',gn(r,'mercado','descripcion'));se('e_siz',gn(r,'mercado','tamano_estimado'));trackAnalisis()}}} disabled={busy} small />
                </div>
                <VideoBlock vimeoId="1103392013" title="Análisis de Mercado" />
                <EditField label="Descripcion del mercado" fkey="e_mkt" value={ed('e_mkt',gn(plan.entorno,'mercado','descripcion'))} onChange={v=>se('e_mkt',v)} onRefine={p=>refine('e_mkt',ed('e_mkt',''),p)} />
                <EditField label="Tamano estimado y tendencia" fkey="e_siz" value={ed('e_siz',[gn(plan.entorno,'mercado','tamano_estimado'),gn(plan.entorno,'mercado','tendencia')].filter(Boolean).join(' - '))} onChange={v=>se('e_siz',v)} onRefine={p=>refine('e_siz',ed('e_siz',''),p)} />
                <ToolsBlock title="Analisis de Mercado" tools={TOOLS_DATA.mercado} />
              </div>
              <div style={CARD}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontSize:18, fontWeight:600, color:C.navy }}>Competencia</h2>
                  <AiBtn label="Analizar con IA" used={usedAnalisis} max={limits.analisis} onClick={async()=>{if(!canUseAnalisis())return;const r=await callAI('entorno');if(r){se('e_cmp',gn(r,'competencia','analisis'));trackAnalisis()}}} disabled={busy} small />
                </div>
                <VideoBlock vimeoId="1103392013" title="Análisis de Competencia" />
                <EditField label="Analisis de la competencia" fkey="e_cmp" value={ed('e_cmp',gn(plan.entorno,'competencia','analisis'))} onChange={v=>se('e_cmp',v)} onRefine={p=>refine('e_cmp',ed('e_cmp',''),p)} />
                <ToolsBlock title="Competencia en Medios" tools={TOOLS_DATA.competencia} />
              </div>
              <div style={CARD}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontSize:18, fontWeight:600, color:C.navy }}>DAFO</h2>
                  <AiBtn label="Analizar con IA" used={usedAnalisis} max={limits.analisis} onClick={async()=>{if(!canUseAnalisis())return;const r=await callAI('entorno');if(r){se('d_op',gn(r,'dafo','oportunidades'));se('d_am',gn(r,'dafo','amenazas'));trackAnalisis()}}} disabled={busy} small />
                </div>
                <VideoBlock vimeoId="1103392013" title="DAFO Estratégico" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    {k:'d_op',lb:'Oportunidades (IA)',src:gn(plan.entorno,'dafo','oportunidades'),bg:'#F0FDF4',col:C.success,ia:true},
                    {k:'d_am',lb:'Amenazas (IA)',src:gn(plan.entorno,'dafo','amenazas'),bg:'#FFFBEB',col:C.warn,ia:true},
                    {k:'d_fo',lb:'Fortalezas (tu) *',src:'',bg:'#EFF6FF',col:'#1E40AF',ia:false},
                    {k:'d_de',lb:'Debilidades (tu) *',src:'',bg:'#FDF4FF',col:'#7E22CE',ia:false},
                  ].map(item=>(
                    <div key={item.k} style={{ background:item.bg, borderRadius:8, padding:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:item.col, fontFamily:"'Geist Mono',monospace", textTransform:'uppercase' }}>{item.lb}</div>
                        <button onClick={()=>{
                          const val=ed(item.k,item.src)
                          if(val.trim().length<30){alert("Debes rellenar el campo con al menos 30 caracteres para poder mejorarlo con IA");return}
                          if(!canUseMejora())return
                          refine(item.k,val,"Mejora este texto")
                        }} style={{ fontSize:11, color:"#C75A3C", background:"none", border:"none", cursor:"pointer", fontWeight:500, fontFamily:"'Geist',sans-serif", display:"flex", alignItems:"center", gap:4 }}><span style={{fontSize:13}}>✨</span> Mejorar con IA</button>
                      </div>
                      <textarea style={{ ...INP, minHeight:80, background:C.white, fontSize:13, resize:'none' }} value={ed(item.k,item.src)} onChange={e=>se(item.k,e.target.value)} />
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:11, color:C.steel3, marginTop:10 }}>* Fortalezas y Debilidades son obligatorias para analizar el Target</p>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button onClick={()=>setStep(0)} style={BTN_S}>Atras</button>
                <button onClick={s1next} disabled={busy} style={{ padding:'11px 24px', borderRadius:6, background:C.navy, border:'none', color:C.paper, fontWeight:600, fontSize:14, cursor:busy?'not-allowed':'pointer', fontFamily:"'Geist',sans-serif", opacity:busy?0.7:1 }}>Continuar al Target →</button>
              </div>
            </div>
          )}

          {step===2&&(
            <div>
              <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:6 }}>Target & Buyer Persona</h1>
              <div style={CARD}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <h2 style={{ fontSize:18, fontWeight:600, color:C.navy }}>USP - Propuesta Unica de Valor *</h2>
                  <AiBtn label="Sugerir USP" used={usedAnalisis} max={limits.analisis} onClick={async()=>{
                    if(!canUseMejora()) return
                    const r = await callAI('suggest_usp',{producto:plan.producto,sector:plan.sector,tipo_negocio:plan.tipo_negocio})
                    if(r&&typeof r.refined_text==='string'){se('usp',r.refined_text);upd('usp',r.refined_text);trackAnalisis()}
                  }} disabled={busy} small />
                </div>
                <VideoBlock vimeoId="1103392013" title="Como crear tu Propuesta Unica de Valor" />
                <EditField label="" fkey="usp" value={ed('usp',plan.usp)} onChange={v=>{se('usp',v);upd('usp',v)}} onRefine={p=>refine('usp',ed('usp',plan.usp),p)} multiline={false} />
              </div>
              <div style={CARD}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <h2 style={{ fontSize:18, fontWeight:600, color:C.navy }}>Target</h2>
                  <AiBtn label="Sugerir Target con IA" used={usedAnalisis} max={limits.analisis} onClick={async()=>{
                    if(!canUseAnalisis()) return
                    setAiModal('Analizando tu mercado para sugerir el mejor target...')
                    const r = await callAI('suggest_target',{producto:plan.producto,sector:plan.sector,pais:plan.pais,tipo_negocio:plan.tipo_negocio,usp:ed('usp',plan.usp)})
                    if(r&&typeof r.refined_text==='string'){
                      try{ const d=JSON.parse(r.refined_text.replace(/```json|```/g,'').trim()); if(d.core_desc)se('t_cor',d.core_desc); if(d.core_volumen)se('t_vol',d.core_volumen); if(d.core_sociodem)se('t_soc',d.core_sociodem); if(d.broad_desc)se('t_bro',d.broad_desc); }catch{}
                      trackAnalisis()
                    }
                  }} disabled={busy||!ed('usp',plan.usp).trim()} small />
                </div>
                <VideoBlock vimeoId="1103392013" title="Como definir tu target" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div style={{ background:C.paper, borderRadius:8, padding:16, border:`1px solid ${C.steel1}` }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.navy, fontFamily:"'Geist Mono',monospace", textTransform:'uppercase', marginBottom:10 }}>Core Target</div>
                    <EditField label="Descripcion" fkey="t_cor" value={ed('t_cor',gn(plan.target,'core_target','descripcion'))} onChange={v=>se('t_cor',v)} onRefine={p=>refine('t_cor',ed('t_cor',''),p)} />
                    <EditField label="Volumen" fkey="t_vol" value={ed('t_vol',gn(plan.target,'core_target','volumen_estimado'))} onChange={v=>se('t_vol',v)} onRefine={p=>refine('t_vol',ed('t_vol',''),p)} multiline={false} small />
                    <EditField label="Sociodem" fkey="t_soc" value={ed('t_soc',gn(plan.target,'core_target','sociodemografico','edad'))} onChange={v=>se('t_soc',v)} onRefine={p=>refine('t_soc',ed('t_soc',''),p)} multiline={false} small />
                  </div>
                  <div style={{ background:C.paper, borderRadius:8, padding:16, border:`1px solid ${C.steel1}` }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.steel, fontFamily:"'Geist Mono',monospace", textTransform:'uppercase', marginBottom:10 }}>Broad Target</div>
                    <EditField label="Descripcion" fkey="t_bro" value={ed('t_bro',gn(plan.target,'broad_target','descripcion'))} onChange={v=>se('t_bro',v)} onRefine={p=>refine('t_bro',ed('t_bro',''),p)} />
                    <EditField label="Volumen" fkey="t_bvol" value={ed('t_bvol',gn(plan.target,'broad_target','volumen_estimado'))} onChange={v=>se('t_bvol',v)} onRefine={p=>refine('t_bvol',ed('t_bvol',''),p)} multiline={false} small />
                    <EditField label="Edad" fkey="t_bage" value={ed('t_bage',gn(plan.target,'broad_target','sociodemografico','edad'))} onChange={v=>se('t_bage',v)} onRefine={p=>refine('t_bage',ed('t_bage',''),p)} multiline={false} small />
                  </div>
                </div>
                <ToolsBlock title="Analisis de Audiencias" tools={TOOLS_DATA.target} />
              </div>
              <div style={CARD}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <h2 style={{ fontSize:18, fontWeight:600, color:C.navy }}>Buyer Persona</h2>
                  <AiBtn label="Sugerir Buyer Persona con IA" used={usedAnalisis} max={limits.analisis} onClick={async()=>{
                    if(!canUseAnalisis()) return
                    setAiModal('Creando tu Buyer Persona...')
                    const r = await callAI('suggest_buyer',{producto:plan.producto,sector:plan.sector,tipo_negocio:plan.tipo_negocio,usp:ed('usp',plan.usp)})
                    if(r&&typeof r.refined_text==='string'){
                      try{
                        const d=JSON.parse(r.refined_text.replace(/```json|```/g,'').trim())
                        const fmt = (v: string|string[]) => Array.isArray(v)?v.slice(0,3).map((x:string)=>'- '+x).join('\n'):String(v||'')
                        if(d.narrativa)se('bp_nar',fmt(d.narrativa)); if(d.momentos)se('bp_mom',fmt(d.momentos)); if(d.piensa)se('bp_pns',fmt(d.piensa)); if(d.informa)se('bp_inf',fmt(d.informa)); if(d.escucha)se('bp_esc',fmt(d.escucha)); if(d.dice)se('bp_dic',fmt(d.dice)); if(d.expectativas)se('bp_exp',fmt(d.expectativas)); if(d.barreras_compra)se('bp_bar',fmt(d.barreras_compra)); if(d.insight)se('bp_ins',fmt(d.insight))
                      }catch{}
                      trackAnalisis()
                    }
                  }} disabled={busy} small />
                </div>
                <VideoBlock vimeoId="1103392013" title="Como construir el Buyer Persona" />
                <EditField label="Descripcion narrativa" fkey="bp_nar" value={ed('bp_nar',gn(plan.target,'buyer_persona','descripcion_narrativa'))} onChange={v=>se('bp_nar',v)} onRefine={p=>refine('bp_nar',ed('bp_nar',''),p)} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    {k:'bp_mom',lb:'Momentos en que piensa en el producto',src:gn(plan.target,'buyer_persona','momentos_pensamiento')},
                    {k:'bp_pns',lb:'Que piensa de este tipo de productos',src:gn(plan.target,'buyer_persona','que_piensa_producto')},
                    {k:'bp_inf',lb:'Donde se informa',src:gn(plan.target,'buyer_persona','donde_se_informa')},
                    {k:'bp_esc',lb:'Que escucha en el mercado',src:gn(plan.target,'buyer_persona','que_escucha_mercado')},
                    {k:'bp_dic',lb:'Que dice',src:gn(plan.target,'buyer_persona','que_dice')},
                    {k:'bp_exp',lb:'Expectativas',src:gn(plan.target,'buyer_persona','expectativas')},
                    {k:'bp_bar',lb:'Barreras a la compra',src:gn(plan.target,'buyer_persona','barreras_compra')},
                    {k:'bp_cre',lb:'Barreras a la comunicacion',src:gn(plan.target,'buyer_persona','barreras_comunicacion')},
                  ].map(f=>(
                    <EditField key={f.k} label={f.lb} fkey={f.k} value={ed(f.k,f.src)} onChange={v=>se(f.k,v)} onRefine={p=>refine(f.k,ed(f.k,f.src),p)} small />
                  ))}
                </div>
                <EditField label="Consumer Insight" fkey="bp_ins" value={ed('bp_ins',gn(plan.target,'buyer_persona','consumer_insight'))} onChange={v=>se('bp_ins',v)} onRefine={p=>refine('bp_ins',ed('bp_ins',''),p)} />
              </div>
              <div style={CARD}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <div>
                    <h2 style={{ fontSize:18, fontWeight:600, color:C.navy }}>Escalera de Valor *</h2>
                    
                  </div>
                  <AiBtn label="Ideas de Escalera IA" used={usedAnalisis} max={limits.analisis} onClick={async()=>{
                    if(!canUseAnalisis()) return
                    const cur = plan.valueSteps.map(s=>`${s.tipo}: ${s.accion}`).join(' | ')
                    const r = await callAI('suggest_escalera',{producto:plan.producto,sector:plan.sector,pasos_actuales:cur})
                    if(r&&Array.isArray(r.nuevos_pasos)){
                      const newS:ValStep[] = (r.nuevos_pasos as Obj[]).map(s=>({id:uid(),tipo:ss(s.tipo)||'MOFU',accion:ss(s.accion)||'',objetivo:ss(s.objetivo)||''}))
                      setPlan(p=>({...p,valueSteps:[...p.valueSteps,...newS]})); trackAnalisis()
                    }
                  }} disabled={busy} small />
                </div>
                <VideoBlock vimeoId="1103392013" title="La Escalera de Valor" />
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {plan.valueSteps.map((s,i)=>{
                    const cols:Record<string,string>={TOFU:'#92400E',MOFU:'#1E40AF',BOFU:C.success,FIDELIZACION:'#7E22CE',RETENTION:'#831843'}
                    return(
                      <div key={s.id} style={{ background:C.paper, borderRadius:8, padding:14, display:'flex', gap:12, alignItems:'flex-start', border:`1px solid ${C.steel1}` }}>
                        <div style={{ width:4, borderRadius:2, background:cols[s.tipo]||C.steel2, alignSelf:'stretch', flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                            <select value={s.tipo} onChange={e=>setPlan(p=>({...p,valueSteps:p.valueSteps.map(vs=>vs.id===s.id?{...vs,tipo:e.target.value}:vs)}))} style={{ ...INP, marginBottom:0, width:'auto', fontSize:12, padding:'4px 8px', cursor:'pointer' }}>
                              {['TOFU','MOFU','BOFU','FIDELIZACION','RETENTION'].map(t=><option key={t}>{t}</option>)}
                            </select>
                            <span style={{ fontSize:11, color:C.steel3, alignSelf:'center' }}>Paso {i+1}</span>
                          </div>
                          <input style={{ ...INP, marginBottom:6, fontSize:14 }} placeholder="Accion concreta..." value={s.accion} onChange={e=>setPlan(p=>({...p,valueSteps:p.valueSteps.map(vs=>vs.id===s.id?{...vs,accion:e.target.value}:vs)}))} />
                          <input style={{ ...INP, marginBottom:0, fontSize:13 }} placeholder="Objetivo de este paso..." value={s.objetivo} onChange={e=>setPlan(p=>({...p,valueSteps:p.valueSteps.map(vs=>vs.id===s.id?{...vs,objetivo:e.target.value}:vs)}))} />
                        </div>
                        <button onClick={()=>setPlan(p=>({...p,valueSteps:p.valueSteps.filter(vs=>vs.id!==s.id)}))} style={{ ...BTN_SM, padding:'4px 8px', color:C.accent, borderColor:'#FECACA', background:'#FEF2F2' }}>X</button>
                      </div>
                    )
                  })}
                </div>
                <button onClick={()=>setPlan(p=>({...p,valueSteps:[...p.valueSteps,{id:uid(),tipo:'MOFU',accion:'',objetivo:''}]}))} style={{ ...BTN_SM, marginTop:10 }}>+ Anadir paso</button>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button onClick={()=>setStep(1)} style={BTN_S}>Atras</button>
                <button onClick={s2next} style={BTN_P}>Definir Objetivos</button>
              </div>
            </div>
          )}

          {step===3&&(
            <div>
              <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:6 }}>Objetivos & Estrategia</h1>
              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:6 }}>Objetivos del Plan Anual</h2>
                <VideoBlock vimeoId="1103392013" title="Como definir tus objetivos de marketing" />
                {plan.objectives.length>0&&(
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 120px auto', gap:8, marginBottom:6 }}>
                      {['Tipo','KPI','Dato (año)',''].map((h,i)=><div key={i} style={{ fontSize:10, fontWeight:600, color:C.steel3, textTransform:'uppercase', fontFamily:"'Geist Mono',monospace" }}>{h}</div>)}
                    </div>
                    {plan.objectives.map(r=>{
                      const kpiList = r.tipo==='Marketing' ? KPI_MKT : KPI_COM
                      const isMandatory = !!r.mandatory
                      return(
                        <div key={r.id} style={{ marginBottom:8 }}>
                          <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 120px auto', gap:8, alignItems:'center' }}>
                            <select value={r.tipo} disabled={isMandatory} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,tipo:e.target.value,kpi:''}:o)}))} style={{ ...INP, marginBottom:0, padding:'8px 10px', fontSize:13, cursor:isMandatory?'default':'pointer', borderColor:isMandatory?C.success:'' }}>
                              <option>Marketing</option><option>Comunicacion</option>
                            </select>
                            <select value={r.kpi} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,kpi:e.target.value}:o)}))} style={{ ...INP, marginBottom:0, padding:'8px 10px', fontSize:13, cursor:'pointer', borderColor:isMandatory?C.success:'' }}>
                              <option value="">KPI</option>
                              {kpiList.map(k=><option key={k}>{k}</option>)}
                            </select>
                            <input style={{ ...INP, marginBottom:0, fontSize:13, borderColor:isMandatory?C.success:'' }} placeholder="1.000" value={r.dato} onChange={e=>setPlan(p=>({...p,objectives:p.objectives.map(o=>o.id===r.id?{...o,dato:e.target.value}:o)}))} />
                            {isMandatory
                              ? <div style={{ width:38, textAlign:'center', color:C.success, fontSize:14 }} title="Obligatorio">🔒</div>
                              : <button onClick={()=>setPlan(p=>({...p,objectives:p.objectives.filter(o=>o.id!==r.id)}))} style={{ ...BTN_SM, padding:'8px 10px', color:C.accent, borderColor:'#FECACA', background:'#FEF2F2' }}>X</button>
                            }
                          </div>
                          {isMandatory&&<div style={{ fontSize:10, color:C.success, marginTop:3 }}>Obligatorio {plan.tipo_negocio}</div>}
                        </div>
                      )
                    })}
                  </div>
                )}
                <button onClick={()=>setPlan(p=>({...p,objectives:[...p.objectives,{id:uid(),tipo:'Marketing',kpi:'',dato:'',tiempo:'año',mandatory:false}]}))} style={BTN_SM}>+ Anadir objetivo</button>
              </div>

              <div style={{ background:'linear-gradient(135deg,#EFF6FF,#F0FDF4)', border:`1px solid ${C.steel1}`, borderRadius:12, padding:'20px 24px', marginBottom:24, textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:600, color:C.navy, marginBottom:6 }}>¿Cuáles son los mejores canales para tu proyecto?</div>
                <p style={{ fontSize:13, color:C.steel, marginBottom:16 }}>Con los datos de tu target, sector, presupuesto y objetivos, la IA recomendara el mix de medios mas adecuado.</p>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <AiBtn label={busy?'Analizando...':'Recomendar plan de medios'} used={usedAnalisis} max={limits.analisis}
                    onClick={()=>{ const mf=plan.objectives.filter(o=>o.mandatory&&!o.dato); if(mf.length>0){setAlert({title:'Completa los objetivos',body:`Rellena el dato de: ${mf.map(o=>o.kpi).join(', ')}`});return} createStrategy() }}
                    disabled={busy} />
                </div>
              </div>

              <div style={CARD}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <div>
                    <h2 style={{ fontSize:18, fontWeight:600, color:C.navy }}>Seleccion de Canales</h2>
                    <p style={{ fontSize:13, color:C.steel, marginTop:4 }}>Elige los canales. La IA creara la estrategia.</p>
                  </div>
                </div>
                <div style={{ background:C.paper, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:C.navy }}>
                  {plan.selectedChannels.length} canales seleccionados
                </div>
                {Object.entries(CH_OPTIONS).map(([phase,channels])=>(
                  <div key={phase} style={{ marginBottom:16 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:phaseColors[phase], fontFamily:"'Geist Mono',monospace", textTransform:'uppercase', marginBottom:8 }}>{phaseLabels[phase]}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {channels.map(ch=>{
                        const on=plan.selectedChannels.includes(ch)
                        return(
                          <button key={ch} onClick={()=>{setPlan(p=>({...p,selectedChannels:on?p.selectedChannels.filter(s=>s!==ch):[...p.selectedChannels,ch]}));if(showStrategy)setChannelsChanged(true)}} style={{ padding:'6px 12px', borderRadius:999, border:`1px solid ${on?phaseColors[phase]:C.steel1}`, background:on?phaseColors[phase]+'18':C.white, color:on?phaseColors[phase]:C.steel, fontWeight:on?600:400, fontSize:12, cursor:'pointer' }}>
                            {on?'ok ':''}{ch}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {showStrategy&&channelsChanged&&(
                <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'16px 20px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.warn }}>Has modificado los canales</div>
                    <div style={{ fontSize:13, color:C.steel }}>Puedes regenerar la estrategia con la nueva seleccion.</div>
                  </div>
                  <button onClick={()=>{setChannelsChanged(false);createStrategy()}} style={{ ...BTN_SM, borderColor:C.warn, color:C.warn }}>Actualizar estrategia</button>
                </div>
              )}

              <div style={{ background:`linear-gradient(135deg,${C.navy},#1a4a7a)`, borderRadius:14, padding:'32px 24px', marginBottom:24, textAlign:'center' }}>
                <div style={{ fontSize:13, color:'rgba(246,244,239,0.6)', fontFamily:"'Geist Mono',monospace", textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Estrategia de canales</div>
                <div style={{ fontSize:22, fontWeight:700, color:C.paper, marginBottom:10, letterSpacing:'-0.02em' }}>✦ Crear Estrategia de Marketing</div>
                <p style={{ fontSize:14, color:'rgba(246,244,239,0.75)', marginBottom:24, maxWidth:480, margin:'0 auto 24px', lineHeight:1.6 }}>Desarrollamos por ti el detalle de la estrategia en base a los canales seleccionados, tu target y objetivos del plan.</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:16 }}>
                  <button onClick={()=>{
                    if(plan.selectedChannels.length < 5){setAlert({title:'Selecciona al menos 5 canales',body:'Elige un mínimo de 5 canales antes de crear la estrategia.'});return}
                    if(!canUseAnalisis()) return
                    createStrategy(); trackAnalisis()
                  }} disabled={busy} style={{ padding:'14px 40px', borderRadius:8, background:C.accent, border:'none', color:C.paper, fontWeight:700, fontSize:15, cursor:busy?'not-allowed':'pointer', fontFamily:"'Geist',sans-serif", opacity:busy?0.7:1, boxShadow:'0 4px 14px rgba(199,90,60,0.4)' }}>
                    {busy ? 'Analizando canales...' : <><div>✦ Crear Estrategia</div><div style={{fontSize:11,fontWeight:400,opacity:0.6,marginTop:4,fontFamily:"'Geist Mono',monospace"}}>{Math.max(0,limits.analisis-usedAnalisis)}/{limits.analisis} Análisis IA</div></>}
                  </button>
                </div>
              </div>
              <div style={{ position:'sticky', bottom:0, background:C.paper, borderTop:`1px solid ${C.steel1}`, padding:'12px 0', display:'flex', justifyContent:'space-between', zIndex:10 }}>
                <button onClick={()=>setStep(2)} style={BTN_S}>← Atras</button>
                <button onClick={()=>{
                  if(plan.selectedChannels.length < 5){setAlert({title:'Selecciona al menos 5 canales',body:'Elige un mínimo de 5 canales para continuar al Plan Táctico.'});return}
                  const missingData2 = plan.objectives.filter(o=>o.mandatory&&!o.dato.trim())
                  if(missingData2.length>0){setAlert({title:'Datos obligatorios',body:`Rellena el dato anual de: ${missingData2.map(o=>o.kpi).join(', ')}`});return}
                  markDone(3);setStep(4);autoSave()
                }} style={{ ...BTN_P, padding:'12px 32px' }}>Plan Táctico →</button>
              </div>

              {showStrategy&&plan.estrategia&&(
                <div>
                  <h2 style={{ fontSize:20, fontWeight:600, color:C.navy, marginBottom:10, marginTop:8 }}>Descriptivo de Canales</h2>
                  <div style={{ ...CARD, background:'#F0F9FF', border:`1px solid #BAE6FD` }}>
                    <h2 style={{ fontSize:16, fontWeight:600, color:'#0369A1', marginBottom:10 }}>Estrategia Recomendada</h2>
                    <p style={{ fontSize:15, color:C.navy, lineHeight:1.7 }}>{gn(plan.estrategia,'estrategia_resumen')}</p>
                  </div>
                  {['notoriedad','interaccion','lead_venta','fidelizacion'].map(ph=>{
                    const channels=ga(plan.estrategia,'canales_por_fase',ph) as Obj[]
                    if(!channels||channels.length===0)return null
                    return(
                      <div key={ph} style={CARD}>
                        <h2 style={{ fontSize:16, fontWeight:600, color:phaseColors[ph], marginBottom:12 }}>{phaseLabels[ph]}</h2>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {channels.map((ch,i)=>(
                            <div key={i} style={{ background:C.paper, borderRadius:8, padding:'12px 14px', display:'flex', gap:12, border:`1px solid ${C.steel1}` }}>
                              <div style={{ width:3, background:phaseColors[ph], borderRadius:2, flexShrink:0, alignSelf:'stretch' }}/>
                              <div style={{ flex:1 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                  <span style={{ fontSize:15, fontWeight:600, color:C.navy }}>{ss(ch.canal)}</span>
                                  {ch.score_ia&&<div style={{ display:'flex', gap:2 }}>{[1,2,3,4,5].map(n=><div key={n} style={{ width:8, height:8, borderRadius:2, background:n<=Number(ch.score_ia)?phaseColors[ph]:C.steel1 }}/>)}<span style={{ fontSize:10, color:C.steel3, marginLeft:4 }}>{String(ch.score_ia)}/5</span></div>}
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
                  <div style={{ position:'sticky', bottom:0, background:C.paper, borderTop:`1px solid ${C.steel1}`, padding:'12px 0', display:'flex', justifyContent:'space-between', zIndex:10, marginTop:16 }}>
                    <button onClick={()=>setStep(2)} style={BTN_S}>← Atras</button>
                    <button onClick={()=>{
                      if(plan.selectedChannels.length < 5){setAlert({title:'Selecciona al menos 5 canales',body:'Elige un mínimo de 5 canales para continuar al Plan Táctico.'});return}
                      markDone(3);setStep(4);autoSave()
                    }} style={{ ...BTN_P, padding:'12px 32px' }}>Plan Táctico →</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step===5&&(
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <div>
                  <h1 style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:4 }}>Resumen Ejecutivo</h1>
                  <p style={{ fontSize:14, color:C.steel }}>Tu plan completo de marketing</p>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>setStep(4)} style={BTN_S}>Tactico</button>
                  <button onClick={()=>setSaveModal(true)} style={BTN_P}>Guardar Plan</button>
                </div>
              </div>
              <div style={CARD}>
                <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:16 }}>Datos del Proyecto</h2>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    {l:'Proyecto',v:plan.projectName},{l:'Pais',v:plan.pais},{l:'Sector',v:plan.sector},
                    {l:'Tipo',v:plan.tipo_negocio},{l:'Fase',v:plan.fase_negocio},{l:'Presupuesto',v:plan.presupuesto},
                  ].map(({l,v})=>(
                    <div key={l} style={{ background:C.paper, borderRadius:8, padding:'12px 16px' }}>
                      <div style={{ fontSize:10, fontWeight:600, color:C.steel3, textTransform:'uppercase', fontFamily:"'Geist Mono',monospace", marginBottom:4 }}>{l}</div>
                      <div style={{ fontSize:14, color:C.navy, fontWeight:500 }}>{v||'—'}</div>
                    </div>
                  ))}
                </div>
              </div>
              {plan.usp&&<div style={CARD}><h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:8 }}>USP</h2><p style={{ fontSize:15, color:C.navy, lineHeight:1.7 }}>{ed('usp',plan.usp)}</p></div>}
              {plan.objectives.length>0&&(
                <div style={CARD}>
                  <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:12 }}>Objetivos Anuales</h2>
                  {plan.objectives.filter(o=>o.kpi).map(o=>(
                    <div key={o.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${C.steel1}` }}>
                      <span style={{ fontSize:13, color:C.steel }}>{o.tipo}: {o.kpi}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:C.navy }}>{o.dato||'—'}</span>
                    </div>
                  ))}
                </div>
              )}
              {plan.selectedChannels.length>0&&(
                <div style={CARD}>
                  <h2 style={{ fontSize:18, fontWeight:600, color:C.navy, marginBottom:12 }}>Canales Seleccionados ({plan.selectedChannels.length})</h2>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {plan.selectedChannels.map(ch=>(
                      <span key={ch} style={{ padding:'4px 12px', borderRadius:999, background:C.paper, border:`1px solid ${C.steel1}`, fontSize:12, color:C.navy }}>{ch}</span>
                    ))}
                  </div>
                </div>
              )}
              {userPlan==='free'&&(
                <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13, color:C.warn }}>Con el plan gratuito no puedes guardar tu plan.</span>
                  <button onClick={()=>setShowUpgrade(true)} style={{ ...BTN_P, background:C.accent }}>Activar Pro</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
