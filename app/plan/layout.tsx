export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background:'#ffffff', minHeight:'100vh', color:'#0f172a', fontFamily:'"DM Sans","Inter",system-ui,sans-serif', position:'relative', zIndex:1 }}>
      <style>{`body{background:#ffffff!important}body::before{display:none!important}`}</style>
      {children}
    </div>
  )
}
