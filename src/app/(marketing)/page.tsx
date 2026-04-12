import Link from 'next/link'

// ── Phone mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div className="relative flex justify-center items-center">
      {/* Glow */}
      <div className="absolute w-80 h-80 bg-brand-glow rounded-full blur-3xl pointer-events-none" />
      {/* Frame */}
      <div className="relative w-[260px] h-[520px] bg-surface-2 rounded-[40px] border border-edge-light shadow-2xl overflow-hidden flex flex-col">
        {/* Notch */}
        <div className="h-9 flex items-center justify-center shrink-0">
          <div className="w-16 h-4 bg-base rounded-full" />
        </div>
        {/* Chat header */}
        <div className="px-4 py-2.5 bg-surface border-b border-edge flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-sm shrink-0">💈</div>
          <div>
            <p className="text-white text-xs font-bold">CitasWassap Bot</p>
            <p className="text-[10px] text-green-400">● En línea</p>
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 p-3 space-y-2.5 overflow-hidden bg-base/40">
          <div className="bg-surface rounded-2xl rounded-tl-none px-3 py-2 max-w-[85%]">
            <p className="text-white text-[11px] leading-relaxed">¡Hola! 👋 Bienvenido a la Barbería. ¿En qué puedo ayudarte hoy?</p>
          </div>
          <div className="bg-brand rounded-2xl rounded-tr-none px-3 py-2 max-w-[80%] ml-auto">
            <p className="text-white text-[11px] leading-relaxed">Quiero reservar para mañana</p>
          </div>
          <div className="bg-surface rounded-2xl rounded-tl-none px-3 py-2 max-w-[90%]">
            <p className="text-white text-[11px] leading-relaxed mb-2">¡Excelente! ¿Qué servicio deseas?</p>
            <div className="space-y-1">
              <div className="border border-edge-light rounded-lg px-2 py-1.5 text-[10px] text-brand font-semibold">✂️ Corte Estándar — $25</div>
              <div className="border border-edge-light rounded-lg px-2 py-1.5 text-[10px] text-brand font-semibold">✂️ Corte + Barba — $40</div>
              <div className="border border-edge-light rounded-lg px-2 py-1.5 text-[10px] text-brand font-semibold">💈 Tratamiento VIP — $60</div>
            </div>
          </div>
        </div>
        {/* Input */}
        <div className="px-3 py-2.5 bg-surface border-t border-edge flex items-center gap-2 shrink-0">
          <div className="flex-1 bg-base rounded-full px-3 py-1.5 text-[10px] text-muted">Escribe un mensaje...</div>
          <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold">→</div>
        </div>
      </div>
    </div>
  )
}

// ── Feature card ──────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-surface border border-edge rounded-2xl p-6 hover:border-edge-light transition-colors">
      <div className="w-10 h-10 bg-surface-3 rounded-xl flex items-center justify-center text-xl mb-4">{icon}</div>
      <h3 className="text-white font-bold text-base mb-2">{title}</h3>
      <p className="text-muted-light text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({
  name, price, period, features, cta, highlight,
}: {
  name: string; price: string; period?: string; features: string[]; cta: string; highlight?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl p-6 flex flex-col ${
      highlight
        ? 'bg-brand-dim border border-brand'
        : 'bg-surface border border-edge'
    }`}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
          Popular
        </div>
      )}
      <div className="mb-6">
        <p className="text-muted-light text-sm font-semibold mb-3">{name}</p>
        <div className="flex items-end gap-1">
          <span className="text-white text-4xl font-black">{price}</span>
          {period && <span className="text-muted text-sm mb-1">{period}</span>}
        </div>
      </div>
      <ul className="space-y-2.5 flex-1 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-muted-light">
            <span className="text-green-400 mt-0.5 shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/login"
        className={`block text-center py-3 rounded-xl text-sm font-bold transition-colors ${
          highlight
            ? 'bg-brand hover:bg-brand-hover text-white'
            : 'border border-edge hover:border-edge-light text-white'
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-base text-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center w-full">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-surface border border-edge rounded-full px-4 py-1.5 text-xs text-muted-light mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Intelligent AI Booking Now Live
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6">
              Automatiza tu barbería{' '}
              <span className="text-brand">por WhatsApp</span>
            </h1>

            <p className="text-muted-light text-lg leading-relaxed mb-10 max-w-lg">
              Elimina las llamadas y gestiona citas 24/7 con nuestro asistente inteligente.
              El flujo más sofisticado para salones modernos que valoran la experiencia del cliente.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-6 py-3 rounded-2xl transition-colors"
              >
                Empieza Gratis →
              </Link>
              <Link
                href="/showcase"
                className="inline-flex items-center gap-2 border border-edge hover:border-edge-light text-white font-semibold px-6 py-3 rounded-2xl transition-colors"
              >
                <span className="w-5 h-5 border border-white/30 rounded-full flex items-center justify-center text-[10px]">▶</span>
                Ver Demo
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 border-t border-edge">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
              Diseñado para la eficiencia
            </h2>
            <p className="text-muted-light text-lg">
              Tecnología de punta aplicada al día a día de tu negocio.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard
              icon="🤖"
              title="IA Conversacional"
              desc="Nuestro bot entiende lenguaje natural y gestiona cancelaciones, reprogramaciones y dudas frecuentes sin intervención humana."
            />
            <FeatureCard
              icon="💬"
              title="WhatsApp Direct"
              desc="Sin descargar apps. Todo ocurre desde donde tus clientes ya están."
            />
            <FeatureCard
              icon="📊"
              title="Analítica Premium"
              desc="Métricas de ocupación y recurrencia en tiempo real para tomar mejores decisiones."
            />
            <FeatureCard
              icon="🔄"
              title="Sincronización Total"
              desc="Integración bidireccional con Google Calendar y Outlook para evitar inconsistencias."
            />
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 border-t border-edge">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
              Planes Transparentes
            </h2>
            <p className="text-muted-light text-lg">
              Escala tu negocio con el poder de la automatización.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PlanCard
              name="Barbería Lite"
              price="$29"
              period="/mes"
              cta="Elegir Plan"
              features={['500 Citas Mensuales', 'Soporte vía WhatsApp', 'Dashboard Básico']}
            />
            <PlanCard
              name="Business Elite"
              price="$59"
              period="/mes"
              cta="Empezar Ahora"
              highlight
              features={['Citas Ilimitadas', 'IA Avanzada Personalizada', 'Multibarbero', 'Analítica Completa']}
            />
            <PlanCard
              name="Cadenas / Franchise"
              price="Custom"
              cta="Contactar Ventas"
              features={['Multi-sede Centralizado', 'API Acceso', 'Gerente de Cuenta']}
            />
          </div>
        </div>
      </section>

    </div>
  )
}