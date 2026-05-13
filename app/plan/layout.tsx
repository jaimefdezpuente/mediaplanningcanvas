export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#F6F4EF', minHeight: '100vh', color: '#0B1B2C', fontFamily: "'Geist',-apple-system,system-ui,sans-serif" }}>
      <style>{`body{background:#F6F4EF!important}body::before{display:none!important}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {children}
    </div>
  )
}
