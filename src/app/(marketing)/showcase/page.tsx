import Link from 'next/link'

function StepBadge({ n }: { n: number }) {
  return (
    <div className="w-8 h-8 rounded-full border border-edge-light flex items-center justify-center text-sm font-bold text-white shrink-0">
      {n}
    </div>
  )
}

function ChatBubble({ from, children }: { from: 'bot' | 'user'; children: React.ReactNode }) {
  return (
    <div className={`flex ${from === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-[11px] leading-relaxed ${
          from === 'user'
            ? 'bg-brand text-white rounded-tr-none'
            : 'bg-surface text-white rounded-tl-none'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export default function ShowcasePage() {
  return (
    <div className="bg-base text-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <div>
            <p className="text-xs font-bold text-brand uppercase tracking-widest mb-6">
              The Flow Experience
            </p>
            <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6">
              Intelligent<br />
              <span className="text-brand">Conversations.</span>
            </h1>
            <p className="text-muted-light text-lg leading-relaxed mb-10 max-w-lg">
              Transform your booking experience with an AI that understands intent,
              manages availability, and confirms with a pulse.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <StepBadge n={1} />
                <div>
                  <p className="text-white font-bold mb-1">Saludo</p>
                  <p className="text-muted-light text-sm leading-relaxed">
                    The bot greets your client with your brand's personality,
                    immediately establishing a professional connection.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <StepBadge n={2} />
                <div>
                  <p className="text-white font-bold mb-1">Selección</p>
                  <p className="text-muted-light text-sm leading-relaxed">
                    Interactive lists allow clients to pick services and time slots
                    without leaving the chat interface.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <StepBadge n={3} />
                <div>
                  <p className="text-white font-bold mb-1">Confirmación</p>
                  <p className="text-muted-light text-sm leading-relaxed">
                    Real-time sync with your calendar ensures zero overlaps
                    and instant confirmation messages.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: chat mockup */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-brand/20 blur-3xl rounded-full pointer-events-none" />

              {/* Phone */}
              <div className="relative w-[280px] bg-surface-2 rounded-[36px] border border-edge shadow-2xl overflow-hidden">
                {/* Status bar */}
                <div className="h-8 flex items-center justify-center bg-surface-2">
                  <div className="w-14 h-3.5 bg-base rounded-full" />
                </div>

                {/* Chat header */}
                <div className="px-4 py-3 bg-surface border-b border-edge flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-base shrink-0">💈</div>
                  <div className="flex-1">
                    <p className="text-white text-xs font-bold">Bella Studio Bot</p>
                    <p className="text-[10px] text-green-400">● Instant Response · Under 2.5s</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-3 space-y-2.5 bg-base/50">
                  <ChatBubble from="bot">
                    ¡Hola! 👋 Bienvenido a Bella Studio. Soy tu asistente virtual. ¿En qué puedo ayudarte?
                  </ChatBubble>
                  <ChatBubble from="user">
                    Hola, me gustaría agendar un corte de pelo para mañana
                  </ChatBubble>
                  <ChatBubble from="bot">
                    <p className="mb-2">¡Excelente elección! Tenemos disponibilidad. Por favor seleccione el tipo de servicio:</p>
                    <div className="space-y-1">
                      <div className="border border-edge-light rounded-lg px-2 py-1.5 text-brand font-semibold">Corte Estándar <span className="text-muted-light font-normal">$25</span></div>
                      <div className="border border-brand/60 bg-brand/10 rounded-lg px-2 py-1.5 text-brand font-semibold">Corte + Barba <span className="text-muted-light font-normal">$40</span></div>
                      <div className="border border-edge-light rounded-lg px-2 py-1.5 text-brand font-semibold">Tratamiento VIP <span className="text-muted-light font-normal">$60</span></div>
                    </div>
                  </ChatBubble>
                </div>

                {/* Calendar sync badge */}
                <div className="mx-3 mb-3 bg-surface border border-edge rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <div>
                    <p className="text-white text-[10px] font-bold">Calendar Sync</p>
                    <div className="flex gap-1 mt-1">
                      {['SAB', 'TUE', 'WED'].map((d) => (
                        <span key={d} className="text-[9px] bg-surface-3 rounded px-1.5 py-0.5 text-muted-light font-bold">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Input */}
                <div className="px-3 pb-4 flex items-center gap-2">
                  <div className="flex-1 bg-surface border border-edge rounded-full px-3 py-2 text-[10px] text-muted">Escribe un mensaje...</div>
                  <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold">→</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-edge text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-4">
            Listo para automatizar?
          </h2>
          <p className="text-muted-light mb-8">
            Únete a cientos de salones que ya gestionan sus citas con IA.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-8 py-4 rounded-2xl transition-colors text-lg"
          >
            Empieza Gratis →
          </Link>
        </div>
      </section>

    </div>
  )
}