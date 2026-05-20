/* eslint-disable */
// planes.jsx — Planes list + 4-step wizard

const { useState: pS, useEffect: pE, useRef: pR } = React;

/* ──────────────── PLANES (list view) ──────────────── */
function PlanesScreen({ onNavigate }) {
  const [view, setView] = pS('list');   // list | wizard
  const [planView, setPlanView] = pS('week');  // when looking at active plan

  if (view === 'wizard') {
    return <PlanWizard onClose={() => setView('list')} onDone={() => setView('list')}/>;
  }

  return (
    <div className="screen-anim">
      <ScreenHeader
        title="Planes"
        sub="Tus planes alimenticios"
        action={
          <button className="btn btn-brand" style={{ padding: '8px 12px', fontSize: 13 }}
            onClick={() => setView('wizard')}>
            <Ico name="plus" size={14} stroke={2.5}/> Nuevo
          </button>
        }
      />

      <div className="screen-scroll">
        {/* Active plan — large */}
        <div className="card card-elev" style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 16px 14px',
            background: 'linear-gradient(135deg, var(--brand-600), var(--brand-800))',
            color: '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Plan activo
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4, letterSpacing: '-0.015em', lineHeight: 1.25 }}>
                  {PLAN.name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4, fontWeight: 500 }}>
                  {PLAN.start} — {PLAN.end}
                </div>
              </div>
              <span style={{
                background: 'rgba(255,255,255,0.18)', borderRadius: 999,
                padding: '4px 10px', fontSize: 10, fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.25)',
              }}>
                ACTIVO
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn" style={{
                flex: 1, padding: '10px', background: '#fff', color: 'var(--brand-700)',
                fontWeight: 700, fontSize: 13,
              }} onClick={() => onNavigate && onNavigate('diario')}>
                Plan de hoy
              </button>
              <button className="btn" style={{
                padding: '10px 14px', background: 'rgba(255,255,255,0.15)', color: '#fff',
                fontSize: 13,
              }}>
                <Ico name="edit" size={14}/>
              </button>
            </div>
          </div>

          {/* Day strip */}
          <div style={{ padding: '14px 8px 4px', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 8px 10px' }}>
              <div className="eyebrow">Semana</div>
              <div className="segmented" style={{ padding: 2 }}>
                <button className={planView === 'day' ? 'active' : ''}
                  onClick={() => setPlanView('day')} style={{ padding: '3px 10px', fontSize: 11 }}>
                  Día
                </button>
                <button className={planView === 'week' ? 'active' : ''}
                  onClick={() => setPlanView('week')} style={{ padding: '3px 10px', fontSize: 11 }}>
                  Semana
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px 12px' }}>
              {WEEK.map((d, i) => (
                <DayPill key={i} label={d.label} num={d.num} active={d.today} met={d.met}/>
              ))}
            </div>
          </div>

          {/* Today's meals */}
          <div style={{ padding: '0 14px 14px', background: 'var(--surface)' }}>
            <div className="eyebrow" style={{ padding: '4px 0 8px' }}>Hoy · miércoles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PLAN.todayMeals.map((m, i) => {
                const mealLabels = { breakfast: 'Desayuno', lunch: 'Almuerzo', snack: 'Merienda', dinner: 'Cena', mid_morning: 'Media mañana' };
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    background: 'var(--surface-2)', borderRadius: 12,
                  }}>
                    <div style={{
                      width: 5, height: 32, borderRadius: 5,
                      background: i === 0 ? 'var(--ring-cal)' : i === 1 ? 'var(--ring-pro)' : i === 2 ? 'var(--ring-carb)' : 'var(--ring-fat)',
                    }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {mealLabels[m.type]}
                      </div>
                      <div style={{
                        fontSize: 13, color: 'var(--text)', fontWeight: 600, marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {m.name}
                      </div>
                    </div>
                    <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>
                      {m.cal}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Past plans */}
        <div style={{ marginTop: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Anteriores</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PAST_PLANS.map((p, i) => (
              <div key={i} className="card card-elev" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginTop: 3 }}>
                      {p.start} — {p.end}
                    </div>
                  </div>
                  <span className="chip muted" style={{ fontSize: 10, padding: '2px 8px' }}>Completado</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginTop: 12,
                  paddingTop: 10, borderTop: '1px solid var(--hairline)',
                }}>
                  <Stat label="Cal. prom." value={p.avgCal} className="tnum"/>
                  <Stat label="Adherencia" value={`${p.adherence}%`} color={p.adherence > 80 ? 'var(--success)' : 'var(--warning)'}/>
                  <Stat label="Duración" value="7 días"/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bottom-nav-pad"/>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span className="tnum" style={{ fontSize: 14, fontWeight: 700, color: color || 'var(--text)', letterSpacing: '-0.015em', marginTop: 2 }}>
        {value}
      </span>
    </div>
  );
}

/* ──────────────── WIZARD ──────────────── */
function PlanWizard({ onClose, onDone }) {
  const [step, setStep] = pS(0);   // 0=Perfil, 1=Preferencias, 2=Generando, 3=Plan
  const steps = [
    { label: 'Perfil', icon: 'user' },
    { label: 'Preferencias', icon: 'plate' },
    { label: 'Generando', icon: 'sparkle' },
    { label: 'Listo', icon: 'check' },
  ];

  const next = () => setStep(s => Math.min(s + 1, 3));
  const back = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Wizard header */}
      <div style={{
        padding: '54px 14px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg)',
        position: 'relative', zIndex: 2,
      }}>
        <button className="btn-icon" onClick={step === 0 ? onClose : back}>
          <Ico name={step === 0 ? 'x' : 'chevL'} size={18}/>
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Generar plan · Paso {step + 1} de 4</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginTop: 2 }}>
            {step === 0 && 'Confirmá tu perfil'}
            {step === 1 && 'Tus preferencias'}
            {step === 2 && 'Generando tu plan'}
            {step === 3 && '¡Tu plan está listo!'}
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ padding: '4px 16px 14px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {steps.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'current' : 'upcoming';
            return (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: '0 0 auto' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 999,
                    background: state === 'done' ? 'var(--brand-500)' : state === 'current' ? 'var(--text)' : 'var(--surface-2)',
                    color: state === 'upcoming' ? 'var(--text-3)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    border: state === 'upcoming' ? '1px solid var(--border)' : 0,
                    transition: 'background 200ms',
                  }}>
                    {state === 'done' ? <Ico name="check" size={13} stroke={3}/> : i + 1}
                  </div>
                  <span style={{
                    fontSize: 9.5, fontWeight: 600,
                    color: state === 'current' ? 'var(--text)' : 'var(--text-3)',
                  }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, borderRadius: 2, marginBottom: 18,
                    background: i < step ? 'var(--brand-500)' : 'var(--border-strong)',
                    transition: 'background 200ms',
                  }}/>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="screen-scroll" style={{ padding: '4px 16px 100px' }}>
        {step === 0 && <Step1Perfil/>}
        {step === 1 && <Step2Preferencias/>}
        {step === 2 && <Step3Generando onComplete={next}/>}
        {step === 3 && <Step4Plan/>}
      </div>

      {/* Footer CTA */}
      {step !== 2 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '14px 16px 110px',
          background: 'linear-gradient(0deg, var(--bg) 60%, transparent)',
          pointerEvents: 'none',
        }}>
          <button
            className="btn btn-brand"
            style={{
              width: '100%', padding: 14, fontSize: 14, borderRadius: 14,
              pointerEvents: 'auto',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}
            onClick={step === 3 ? onDone : next}>
            {step === 0 && <>Continuar a preferencias <Ico name="chev" size={14} stroke={2.5}/></>}
            {step === 1 && <><Ico name="sparkle" size={14} stroke={2.5}/> Generar mi plan</>}
            {step === 3 && <>Ver mi plan completo</>}
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────── Step 1: Perfil ──────── */
function Step1Perfil() {
  const [editing, setEditing] = pS(false);

  return (
    <div className="screen-anim">
      <div className="card card-elev" style={{ padding: 16, marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="eyebrow">Datos personales</div>
          <button className="chip" onClick={() => setEditing(!editing)}>
            <Ico name="edit" size={11}/> {editing ? 'Listo' : 'Editar'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <KV label="Peso" value="64.2 kg" editing={editing}/>
          <KV label="Altura" value="165 cm" editing={editing}/>
          <KV label="Edad" value="28 años" editing={editing}/>
          <KV label="Sexo" value="Femenino" editing={editing}/>
        </div>
      </div>

      <div className="card card-elev" style={{ padding: 16, marginTop: 12 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Objetivo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {[
            { v: 'lose', l: 'Bajar', i: 'chevD' },
            { v: 'maintain', l: 'Mantener', i: 'check' },
            { v: 'gain', l: 'Subir', i: 'chevU' },
          ].map(g => {
            const active = g.v === 'lose';
            return (
              <button key={g.v} style={{
                padding: '12px 6px', borderRadius: 12,
                background: active ? 'var(--brand-50)' : 'var(--surface-2)',
                border: active ? '1.5px solid var(--brand-500)' : '1.5px solid transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                color: active ? 'var(--brand-700)' : 'var(--text-2)',
                fontWeight: 600,
              }}>
                <Ico name={g.i} size={18} stroke={2.5}/>
                <span style={{ fontSize: 12 }}>{g.l}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card card-elev" style={{ padding: 16, marginTop: 12 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Nivel de actividad</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { v: 'sedentary', l: 'Sedentario', d: 'Poco o nada de ejercicio' },
            { v: 'light', l: 'Liviano', d: '1-3 días por semana' },
            { v: 'moderate', l: 'Moderado', d: '3-5 días por semana', active: true },
            { v: 'active', l: 'Activo', d: '6-7 días por semana' },
          ].map(a => (
            <button key={a.v} style={{
              padding: '10px 12px', borderRadius: 12, textAlign: 'left',
              background: a.active ? 'var(--brand-50)' : 'var(--surface-2)',
              border: a.active ? '1.5px solid var(--brand-500)' : '1.5px solid transparent',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 999,
                border: '1.5px solid', borderColor: a.active ? 'var(--brand-500)' : 'var(--border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {a.active && <div style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--brand-500)' }}/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.l}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.d}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Calculated macros preview */}
      <div className="card card-elev" style={{
        padding: 16, marginTop: 12,
        background: 'linear-gradient(135deg, var(--brand-50), var(--surface))',
        border: '1px solid var(--brand-200)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--brand-700)' }}>Calculado por IA</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
              Tus macros sugeridos
            </div>
          </div>
          <Ico name="sparkle" size={20} color="var(--brand-600)"/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { l: 'Cal', v: '1650', u: '', c: 'var(--ring-cal)' },
            { l: 'Prot', v: '124', u: 'g', c: 'var(--ring-pro)' },
            { l: 'Carb', v: '165', u: 'g', c: 'var(--ring-carb)' },
            { l: 'Gras', v: '55', u: 'g', c: 'var(--ring-fat)' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '10px 4px', borderRadius: 10, background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{ width: 18, height: 3, borderRadius: 2, background: m.c, marginBottom: 6 }}/>
              <div className="tnum" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {m.v}<span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{m.u}</span>
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontWeight: 600, marginTop: 1 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 80 }}/>
    </div>
  );
}

function KV({ label, value, editing }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      {editing ? (
        <input defaultValue={value} style={{
          width: '100%', marginTop: 4, padding: '6px 8px',
          fontSize: 14, fontWeight: 600, color: 'var(--text)',
          background: 'var(--surface-2)', borderRadius: 8,
          border: '1.5px solid var(--brand-500)', outline: 'none',
        }}/>
      ) : (
        <div className="tnum" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.015em', marginTop: 4 }}>
          {value}
        </div>
      )}
    </div>
  );
}

/* ──────── Step 2: Preferencias (collapsible sections) ──────── */
function Step2Preferencias() {
  const [open, setOpen] = pS('alimentacion');

  const sections = [
    {
      id: 'alimentacion', icon: 'plate', title: 'Alimentación',
      summary: 'Omnívora · 4 comidas · con snacks',
      content: (
        <>
          <Choice label="Tipo de dieta" options={['Omnívora','Vegetariana','Vegana','Pescetariana']} value="Omnívora"/>
          <NumberRow label="Comidas por día" value={4} min={2} max={6}/>
          <ToggleRow label="Incluir snacks" value={true}/>
        </>
      ),
    },
    {
      id: 'restricciones', icon: 'x', title: 'Restricciones',
      summary: 'Sin alergias · 1 alimento excluido',
      content: (
        <>
          <div style={{ marginBottom: 14 }}>
            <Label>Alergias</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              <span className="chip muted" style={{ fontSize: 11 }}>Ninguna</span>
              <button className="chip" style={{ fontSize: 11, borderStyle: 'dashed' }}>
                <Ico name="plus" size={11} stroke={2.5}/> Agregar
              </button>
            </div>
          </div>
          <div>
            <Label>Comidas a evitar</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              <span className="chip" style={{ fontSize: 11, background: 'var(--ring-fat-bg)', color: 'var(--ring-fat)', borderColor: 'transparent' }}>
                Vísceras <Ico name="x" size={10} stroke={2.5}/>
              </span>
              <button className="chip" style={{ fontSize: 11, borderStyle: 'dashed' }}>
                <Ico name="plus" size={11} stroke={2.5}/> Agregar
              </button>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'estilo', icon: 'cal', title: 'Estilo de vida',
      summary: '$18.000/sem · Moderada · 30 min',
      content: (
        <>
          <NumberRow label="Presupuesto semanal" value={18000} unit="$" min={0}/>
          <Choice label="Complejidad" options={['Simple','Moderada','Avanzada']} value="Moderada"/>
          <NumberRow label="Tiempo para cocinar" value={30} unit=" min"/>
          <Choice label="Comer afuera" options={['Nunca','Pocas veces','A veces','Seguido']} value="Pocas veces"/>
        </>
      ),
    },
    {
      id: 'gustos', icon: 'sparkle', title: 'Gustos',
      summary: 'Variedad media · 4 favoritos',
      content: (
        <>
          <Choice label="Variedad" options={['Baja','Media','Alta']} value="Media"/>
          <div>
            <Label>Comidas favoritas</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {['Salmón','Palta','Quinoa','Yogur griego'].map(f => (
                <span key={f} className="chip" style={{
                  fontSize: 11, background: 'var(--brand-50)', color: 'var(--brand-700)',
                  borderColor: 'transparent',
                }}>
                  {f} <Ico name="x" size={10} stroke={2.5}/>
                </span>
              ))}
              <button className="chip" style={{ fontSize: 11, borderStyle: 'dashed' }}>
                <Ico name="plus" size={11} stroke={2.5}/> Agregar
              </button>
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="screen-anim">
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px 12px' }}>
        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
          <span className="tnum" style={{ color: 'var(--text)', fontWeight: 700 }}>4</span> de 4 secciones completas
        </span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 18, height: 3, borderRadius: 2, background: 'var(--brand-500)' }}/>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map(s => {
          const isOpen = open === s.id;
          return (
            <div key={s.id} className="card card-elev" style={{ padding: 0, overflow: 'hidden' }}>
              <button onClick={() => setOpen(isOpen ? null : s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 14px', width: '100%', textAlign: 'left',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: isOpen ? 'var(--brand-500)' : 'var(--surface-2)',
                  color: isOpen ? '#fff' : 'var(--text-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 200ms',
                }}>
                  <Ico name={s.icon} size={16}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                    {s.title}
                  </div>
                  {!isOpen && (
                    <div style={{
                      fontSize: 11.5, color: 'var(--text-3)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {s.summary}
                    </div>
                  )}
                </div>
                <Ico name="check" size={14} color="var(--success)" stroke={3}/>
                <Ico name={isOpen ? 'chevU' : 'chevD'} size={14} color="var(--text-3)"/>
              </button>
              {isOpen && (
                <div className="screen-anim" style={{
                  padding: '4px 14px 16px',
                  borderTop: '1px solid var(--hairline)',
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}>
                  {s.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ height: 80 }}/>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</div>;
}

function Choice({ label, options, value }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
        {options.map(o => (
          <button key={o} className={`chip ${o === value ? 'active' : ''}`} style={{ fontSize: 11 }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberRow({ label, value, unit = '', min = 0, max = 999 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Label>{label}</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="btn-icon" style={{ width: 28, height: 28, borderRadius: 8 }}>−</button>
        <span className="tnum" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', minWidth: 48, textAlign: 'center' }}>
          {unit === '$' ? `$${value.toLocaleString('es-AR')}` : `${value}${unit}`}
        </span>
        <button className="btn-icon" style={{ width: 28, height: 28, borderRadius: 8 }}>+</button>
      </div>
    </div>
  );
}

function ToggleRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Label>{label}</Label>
      <div style={{
        width: 40, height: 24, borderRadius: 999,
        background: value ? 'var(--brand-500)' : 'var(--border-strong)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 18 : 2,
          width: 20, height: 20, borderRadius: 999, background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          transition: 'left 200ms',
        }}/>
      </div>
    </div>
  );
}

/* ──────── Step 3: Generando ──────── */
function Step3Generando({ onComplete }) {
  const [progress, setProgress] = pS(0);
  const [tipIdx, setTipIdx] = pS(0);

  const tips = [
    { icon: 'sparkle', text: 'Buscando recetas con tus favoritos…' },
    { icon: 'plate',   text: 'Balanceando proteínas para tu objetivo…' },
    { icon: 'x',       text: 'Verificando que no haya alérgenos…' },
    { icon: 'cal',     text: 'Distribuyendo macros en 4 comidas…' },
    { icon: 'check',   text: '¡Casi listo! Armando la semana completa…' },
  ];

  pE(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete && onComplete(), 600);
          return 100;
        }
        return Math.min(p + Math.random() * 4 + 1, 100);
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  pE(() => {
    const tipInterval = setInterval(() => {
      setTipIdx(i => (i + 1) % tips.length);
    }, 1800);
    return () => clearInterval(tipInterval);
  }, []);

  return (
    <div className="screen-anim" style={{ paddingTop: 20 }}>
      {/* Big circular progress */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <svg width={200} height={200} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={100} cy={100} r={90} fill="none" stroke="var(--surface-2)" strokeWidth={10}/>
            <circle cx={100} cy={100} r={90} fill="none"
              stroke="url(#gradStep3)" strokeWidth={10} strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 90}
              strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
              style={{ transition: 'stroke-dashoffset 250ms ease' }}
            />
            <defs>
              <linearGradient id="gradStep3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--brand-400)"/>
                <stop offset="1" stopColor="var(--brand-700)"/>
              </linearGradient>
            </defs>
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="tnum" style={{ fontSize: 44, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.035em' }}>
              {Math.round(progress)}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, marginTop: 4 }}>
              %
            </span>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div style={{ marginTop: 32, padding: '0 12px', textAlign: 'center' }}>
        <div key={tipIdx} className="screen-anim" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 999,
          background: 'var(--brand-50)',
          border: '1px solid var(--brand-200)',
        }}>
          <Ico name={tips[tipIdx].icon} size={14} color="var(--brand-700)"/>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--brand-700)' }}>
            {tips[tipIdx].text}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Tiempo estimado
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, marginTop: 4 }}>
          15-30 segundos
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 110, padding: '0 16px' }}>
        <button className="btn btn-ghost" style={{ width: '100%', padding: 14, fontSize: 14 }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ──────── Step 4: Plan ──────── */
function Step4Plan() {
  return (
    <div className="screen-anim" style={{ paddingTop: 4 }}>
      {/* Success card */}
      <div className="card card-elev" style={{
        padding: 22, marginTop: 4,
        background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
        color: '#fff', border: 0, textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 999,
          background: 'rgba(255,255,255,0.2)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 10,
          border: '2px solid rgba(255,255,255,0.4)',
        }}>
          <Ico name="check" size={28} color="#fff" stroke={3}/>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em' }}>
          ¡Listo, Sofía!
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 500, marginTop: 4 }}>
          Tu plan del <b>24 al 30 de mayo</b>
        </div>
      </div>

      {/* Avg macros */}
      <div className="card card-elev" style={{ padding: 14, marginTop: 12 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Promedio diario</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            { l: 'Cal', v: '1648', c: 'var(--ring-cal)' },
            { l: 'Prot', v: '128g', c: 'var(--ring-pro)' },
            { l: 'Carb', v: '162g', c: 'var(--ring-carb)' },
            { l: 'Gras', v: '54g', c: 'var(--ring-fat)' },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--surface-2)', borderRadius: 10 }}>
              <div style={{ width: 16, height: 3, borderRadius: 2, background: m.c, margin: '0 auto 4px' }}/>
              <div className="tnum" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{m.v}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginTop: 1 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview meals */}
      <div style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Comidas del lunes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {WEEK_PLAN[0].meals.slice(0, 4).map((m, i) => (
            <div key={i} className="card card-elev" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                {m.type === 'breakfast' ? '☀️' : m.type === 'lunch' ? '🥗' : m.type === 'snack' ? '🍪' : m.type === 'dinner' ? '🍽️' : '🍎'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {m.name}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                  <span className="tnum" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    P <b style={{ color: 'var(--ring-pro)' }}>{m.p}</b>
                  </span>
                  <span className="tnum" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    C <b style={{ color: 'var(--ring-carb)' }}>{m.c}</b>
                  </span>
                  <span className="tnum" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    G <b style={{ color: 'var(--ring-fat)' }}>{m.f}</b>
                  </span>
                </div>
              </div>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>
                {m.cal}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-elev" style={{
        padding: 14, marginTop: 16,
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--surface-2)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--brand-500)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ico name="camera" size={18}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Lista de compras lista</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)' }}>Subí una foto y la generamos sola</div>
        </div>
        <Ico name="chev" size={16} color="var(--text-3)"/>
      </div>

      <div style={{ height: 80 }}/>
    </div>
  );
}

Object.assign(window, { PlanesScreen });
