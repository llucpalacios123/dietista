/* eslint-disable */
// screens.jsx — Dietista screen views

const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR } = React;

/* ──────────────── Reusable header ──────────────── */
function ScreenHeader({ title, sub, action, badge }) {
  return (
    <div className="app-header">
      <div>
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {badge}
        {action}
      </div>
    </div>
  );
}

/* ──────────────── DASHBOARD ──────────────── */
function DashboardScreen({ onNavigate, ringStyle }) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buen día';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const remainingCal = TARGETS.cal - TODAY.cal;
  const sparkVals = WEIGHT_DATA.slice(-14).map(d => d.v);

  return (
    <div className="screen-anim">
      <div className="app-header">
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Mié, 24 may</div>
          <h1 style={{ fontSize: 26 }}>{greeting}, <span style={{ color: 'var(--brand-600)' }}>{PERSONA.name}</span></h1>
        </div>
        <div className="avatar">{PERSONA.initials}</div>
      </div>

      <div className="screen-scroll">
        {/* Hero macro card */}
        <div className="card card-elev" style={{ marginTop: 12, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div className="eyebrow">Hoy</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginTop: 2, letterSpacing: '-0.02em' }}>
                {remainingCal > 0 ? 'Vas bien' : 'Excediste la meta'}
              </div>
            </div>
            <button onClick={() => onNavigate('diario')} className="chip" style={{ background: 'var(--surface-2)' }}>
              Ver diario <Ico name="chev" size={12}/>
            </button>
          </div>
          <HeroMacroRing
            calories={TODAY.cal} calTarget={TARGETS.cal}
            protein={TODAY.pro} proTarget={TARGETS.pro}
            carbs={TODAY.carb} carbTarget={TARGETS.carb}
            fat={TODAY.fat} fatTarget={TARGETS.fat}
            size={200} style={ringStyle}
          />
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6, marginTop: 18,
          }}>
            {[
              { l: 'Calorías', v: TODAY.cal, t: TARGETS.cal, u: '', c: 'var(--ring-cal)' },
              { l: 'Proteína', v: TODAY.pro, t: TARGETS.pro, u: 'g', c: 'var(--ring-pro)' },
              { l: 'Carbs', v: TODAY.carb, t: TARGETS.carb, u: 'g', c: 'var(--ring-carb)' },
              { l: 'Grasas', v: TODAY.fat, t: TARGETS.fat, u: 'g', c: 'var(--ring-fat)' },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: 999, background: m.c }}/>
                <div className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.015em' }}>
                  {m.v}{m.u}
                </div>
                <div className="tnum" style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>
                  /{m.t}{m.u}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick log */}
        <button onClick={() => onNavigate('diario')} className="card card-elev"
          style={{
            marginTop: 12, padding: 14, width: '100%',
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
          }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--brand-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 4px 10px rgba(16,185,129,0.3)',
          }}>
            <Ico name="plus" size={20} stroke={2.5}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Registrar comida</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Escribí qué comiste, lo desglosamos por vos</div>
          </div>
          <Ico name="chev" size={16} color="var(--text-3)"/>
        </button>

        {/* Streak */}
        <div className="card card-elev" style={{ marginTop: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div className="eyebrow">Racha semanal</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginTop: 2 }}>
                <Ico name="flame" size={18} color="var(--ring-fat)"/>
                <span className="tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)' }}>4</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>días seguidos</span>
              </div>
            </div>
            <button onClick={() => onNavigate('objetivos')} className="chip">Ver objetivos</button>
          </div>
          <StreakWeek days={WEEK.map(d => ({ label: d.label, met: d.met, partial: d.partial }))}/>
        </div>

        {/* Weight trend mini */}
        <button onClick={() => onNavigate('progreso')} className="card card-elev"
          style={{
            marginTop: 12, padding: 16, width: '100%',
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
          }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Peso · últimos 14 días</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span className="tnum" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em' }}>
                {PERSONA.weight}<span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginLeft: 2 }}>kg</span>
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--success)',
                background: 'var(--brand-50)', padding: '2px 6px', borderRadius: 999,
              }} className="tnum">
                −1.4kg
              </span>
            </div>
          </div>
          <Sparkline values={sparkVals} width={120} height={40} color="var(--brand-500)" showDots/>
        </button>

        {/* Active plan */}
        <div className="card card-elev" style={{ marginTop: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="eyebrow">Plan activo</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 2, letterSpacing: '-0.015em', lineHeight: 1.3 }}>
                {PLAN.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>
                {PLAN.start} — {PLAN.end} · {PLAN.daysLogged}/7 días registrados
              </div>
            </div>
            <span className="chip brand" style={{ fontSize: 10 }}>Activo</span>
          </div>
          <div style={{
            marginTop: 12, padding: 12, borderRadius: 14,
            background: 'var(--surface-2)',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>
              Comidas de hoy
            </div>
            {PLAN.todayMeals.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, width: 30 }}>
                  {m.type === 'breakfast' ? 'Des' : m.type === 'lunch' ? 'Alm' : m.type === 'snack' ? 'Mer' : 'Cen'}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{m.name}</span>
                <span className="tnum" style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>{m.cal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progreso & Objetivos shortcuts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <button onClick={() => onNavigate('progreso')} className="card card-elev" style={{
            padding: 14, textAlign: 'left',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--brand-50)', color: 'var(--brand-700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <Ico name="trend" size={16}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Progreso</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              Peso, macros, adherencia
            </div>
          </button>
          <button onClick={() => onNavigate('objetivos')} className="card card-elev" style={{
            padding: 14, textAlign: 'left',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: '#fef3c7', color: '#92400e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <Ico name="target" size={16}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Objetivos</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              Metas y compromiso
            </div>
          </button>
        </div>

        <div className="bottom-nav-pad"/>
      </div>
    </div>
  );
}

/* ──────────────── DIARIO ──────────────── */
function DiarioScreen({ ringStyle }) {
  const [expandedMeal, setExpandedMeal] = useS(2);
  const [logInput, setLogInput] = useS('');
  const [selectedMealType, setSelectedMealType] = useS('snack');
  const [showInterpretation, setShowInterpretation] = useS(false);
  const [mode, setMode] = useS('day');  // day | week

  const mealTypes = [
    { id: 'breakfast', label: 'Desayuno' },
    { id: 'lunch', label: 'Almuerzo' },
    { id: 'snack', label: 'Merienda' },
    { id: 'dinner', label: 'Cena' },
  ];

  useE(() => {
    if (logInput.length > 10) {
      const t = setTimeout(() => setShowInterpretation(true), 600);
      return () => clearTimeout(t);
    } else {
      setShowInterpretation(false);
    }
  }, [logInput]);

  return (
    <div className="screen-anim">
      <ScreenHeader
        title="Diario"
        sub="Miércoles 24 de mayo"
        action={
          <div className="segmented" style={{ padding: 2 }}>
            <button className={mode === 'day' ? 'active' : ''}
              onClick={() => setMode('day')} style={{ padding: '5px 9px', fontSize: 11.5 }}>
              Día
            </button>
            <button className={mode === 'week' ? 'active' : ''}
              onClick={() => setMode('week')} style={{ padding: '5px 9px', fontSize: 11.5 }}>
              Semana
            </button>
          </div>
        }
      />

      <div className="screen-scroll">
        {mode === 'week' ? <DiarioSemanal/> : (<>
        {/* Week strip */}
        <div className="card card-flat" style={{
          marginTop: 8, padding: '8px 6px',
          display: 'flex', justifyContent: 'space-between',
        }}>
          {WEEK.map((d, i) => (
            <DayPill key={i} label={d.label} num={d.num} active={d.today} met={d.met}/>
          ))}
        </div>

        {/* Hero macro card */}
        <div className="card card-elev" style={{ marginTop: 12, padding: 18, paddingTop: 22 }}>
          <HeroMacroRing
            calories={TODAY.cal} calTarget={TARGETS.cal}
            protein={TODAY.pro} proTarget={TARGETS.pro}
            carbs={TODAY.carb} carbTarget={TARGETS.carb}
            fat={TODAY.fat} fatTarget={TARGETS.fat}
            size={220} style={ringStyle}
          />
          {/* Legend with bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            <MacroBar label="Proteínas" value={TODAY.pro} target={TARGETS.pro} color="var(--ring-pro)"/>
            <MacroBar label="Carbohidratos" value={TODAY.carb} target={TARGETS.carb} color="var(--ring-carb)"/>
            <MacroBar label="Grasas" value={TODAY.fat} target={TARGETS.fat} color="var(--ring-fat)"/>
          </div>
        </div>

        {/* Quick log */}
        <div className="card card-elev" style={{ marginTop: 12, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="eyebrow">Registrar comida</div>
            <span className="chip" style={{ fontSize: 10, padding: '3px 8px', background: 'var(--brand-50)', color: 'var(--brand-700)', borderColor: 'transparent' }}>
              <Ico name="sparkle" size={10}/> IA
            </span>
          </div>

          {/* Meal type chips */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }} className="scroll-hide">
            {mealTypes.map(m => (
              <button key={m.id} onClick={() => setSelectedMealType(m.id)}
                className={`chip ${selectedMealType === m.id ? 'active' : ''}`}
                style={{ whiteSpace: 'nowrap' }}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface-2)', borderRadius: 14,
            padding: '10px 12px',
            border: '1px solid var(--border)',
          }}>
            <input
              value={logInput}
              onChange={e => setLogInput(e.target.value)}
              placeholder="ej: 2 tostadas con palta y huevo"
              style={{
                flex: 1, border: 0, background: 'transparent',
                fontSize: 14, outline: 'none', color: 'var(--text)',
              }}
            />
            <button className="btn-icon" style={{ width: 30, height: 30 }}>
              <Ico name="mic" size={16}/>
            </button>
            <button className="btn-icon" style={{ width: 30, height: 30 }}>
              <Ico name="camera" size={16}/>
            </button>
          </div>

          {/* Interpretation preview */}
          {showInterpretation && (
            <div className="screen-anim" style={{
              marginTop: 10, padding: 12,
              background: 'var(--brand-50)',
              borderRadius: 12,
              border: '1px dashed var(--brand-300)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ico name="sparkle" size={12} color="var(--brand-700)"/>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-700)', letterSpacing: '0.02em' }}>
                  INTERPRETACIÓN
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { name: 'Pan de molde integral', q: '2 reb.', cal: 160, c: 0.92 },
                  { name: 'Palta', q: '½ u.', cal: 120, c: 0.88 },
                  { name: 'Huevo', q: '1 u.', cal: 78, c: 0.96 },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <Ico name="check" size={10} color="var(--brand-700)" stroke={3}/>
                    <span style={{ flex: 1, color: 'var(--text)', fontWeight: 500 }}>{f.name}</span>
                    <span style={{ color: 'var(--text-2)' }}>{f.q}</span>
                    <span className="tnum" style={{ color: 'var(--text)', fontWeight: 600, width: 50, textAlign: 'right' }}>{f.cal} kcal</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button className="btn btn-brand" style={{ flex: 1, padding: '8px 10px', fontSize: 13 }}>
                  Confirmar · 358 kcal
                </button>
                <button className="btn btn-ghost" style={{ padding: '8px 10px', fontSize: 13 }}>Editar</button>
              </div>
            </div>
          )}
        </div>

        {/* Today's meals */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 2px 10px' }}>
            <div className="eyebrow">Hoy · {TODAY.meals.length} comidas</div>
            <span className="tnum" style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
              {TODAY.cal} kcal
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TODAY.meals.map((m, i) => (
              <MealRow key={i} meal={m} expanded={expandedMeal === i}
                onToggle={() => setExpandedMeal(expandedMeal === i ? -1 : i)}/>
            ))}
          </div>
        </div>
        </>)}

        <div className="bottom-nav-pad"/>
      </div>
    </div>
  );
}

/* ──────────────── DIARIO SEMANAL ──────────────── */
function DiarioSemanal() {
  const weekTotals = {
    cal: Math.round(WEEK.reduce((s, d) => s + d.cal, 0) / WEEK.length),
    pro: Math.round(WEEK.reduce((s, d) => s + d.pro, 0) / WEEK.length),
    carb: Math.round(WEEK.reduce((s, d) => s + d.carb, 0) / WEEK.length),
    fat: Math.round(WEEK.reduce((s, d) => s + d.fat, 0) / WEEK.length),
  };
  const adherencePct = Math.round((WEEK.filter(d => d.met).length / WEEK.length) * 100);
  const maxCal = Math.max(...WEEK.map(d => d.cal), TARGETS.cal);

  const dayNames = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

  return (
    <div className="screen-anim">
      {/* Week header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 8, marginBottom: 12, padding: '0 2px',
      }}>
        <button className="btn-icon" style={{ width: 32, height: 32 }}>
          <Ico name="chevL" size={16}/>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow">Semana</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', marginTop: 2 }}>
            18 – 24 may
          </div>
        </div>
        <button className="btn-icon" style={{ width: 32, height: 32 }}>
          <Ico name="chev" size={16}/>
        </button>
      </div>

      {/* Adherence summary */}
      <div className="card card-elev" style={{
        padding: 16, marginBottom: 12,
        background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
        color: '#fff', border: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Adherencia esta semana
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
              <span className="tnum" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.035em' }}>{adherencePct}</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>%</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 500, marginTop: 2 }}>
              {WEEK.filter(d => d.met).length} de 7 días dentro del rango
            </div>
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: 999,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ico name="flame" size={28} color="#fff"/>
          </div>
        </div>
      </div>

      {/* Days list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {WEEK.map((d, i) => {
          const dayName = dayNames[i];
          const pct = (d.cal / maxCal) * 100;
          const within = d.cal >= TARGETS.cal * 0.9 && d.cal <= TARGETS.cal * 1.1;
          const slightly = !within && d.cal >= TARGETS.cal * 0.8 && d.cal <= TARGETS.cal * 1.2;
          const statusColor = within ? 'var(--success)' : slightly ? 'var(--warning)' : 'var(--danger)';

          return (
            <div key={i} className="card card-elev" style={{
              padding: 12,
              border: d.today ? '1.5px solid var(--brand-500)' : '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Day pill */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: d.today ? 'var(--brand-500)' : 'var(--surface-2)',
                  color: d.today ? '#fff' : 'var(--text)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>
                    {d.label}
                  </span>
                  <span className="tnum" style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {d.num}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{dayName}</span>
                    {d.today && (
                      <span className="chip brand" style={{ fontSize: 9, padding: '1px 5px' }}>HOY</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <span className="tnum" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.015em' }}>
                      {d.cal}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>kcal</span>
                  </div>
                </div>
                <div style={{
                  width: 10, height: 10, borderRadius: 999,
                  background: statusColor, flexShrink: 0,
                }} title={within ? 'En meta' : slightly ? 'Ligeramente fuera' : 'Fuera de meta'}/>
              </div>

              {/* Macro proportions */}
              <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', marginTop: 10 }}>
                <div style={{ width: `${(d.pro*4 / d.cal)*100}%`, background: 'var(--ring-pro)' }}/>
                <div style={{ width: `${(d.carb*4 / d.cal)*100}%`, background: 'var(--ring-carb)' }}/>
                <div style={{ width: `${(d.fat*9 / d.cal)*100}%`, background: 'var(--ring-fat)' }}/>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span className="tnum" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  P <b style={{ color: 'var(--ring-pro)' }}>{d.pro}g</b>
                </span>
                <span className="tnum" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  C <b style={{ color: 'var(--ring-carb)' }}>{d.carb}g</b>
                </span>
                <span className="tnum" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  G <b style={{ color: 'var(--ring-fat)' }}>{d.fat}g</b>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly average summary */}
      <div className="card card-elev" style={{ padding: 16, marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Promedio semanal</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            { l: 'Cal', v: weekTotals.cal, c: 'var(--ring-cal)', t: TARGETS.cal },
            { l: 'Prot', v: weekTotals.pro + 'g', c: 'var(--ring-pro)', t: TARGETS.pro + 'g' },
            { l: 'Carb', v: weekTotals.carb + 'g', c: 'var(--ring-carb)', t: TARGETS.carb + 'g' },
            { l: 'Gras', v: weekTotals.fat + 'g', c: 'var(--ring-fat)', t: TARGETS.fat + 'g' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '10px 4px', borderRadius: 10, background: 'var(--surface-2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{ width: 16, height: 3, borderRadius: 2, background: m.c, marginBottom: 6 }}/>
              <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {m.v}
              </div>
              <div className="tnum" style={{ fontSize: 9.5, color: 'var(--text-3)', fontWeight: 500, marginTop: 1 }}>
                /{m.t}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, marginTop: 2, textTransform: 'uppercase' }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
/* ──────────────── PROGRESO ──────────────── */
function ProgresoScreen() {
  const [tab, setTab] = useS('peso');
  const [period, setPeriod] = useS('30d');

  return (
    <div className="screen-anim">
      <ScreenHeader title="Progreso" sub="Tu evolución en el tiempo"/>

      <div className="screen-scroll">
        {/* Tab strip */}
        <div className="segmented" style={{ width: '100%', display: 'flex', marginTop: 8 }}>
          {[
            { id: 'peso', label: 'Peso' },
            { id: 'macros', label: 'Macros' },
            { id: 'adherencia', label: 'Adherencia' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={tab === t.id ? 'active' : ''}
              style={{ flex: 1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'peso' && <PesoTab period={period} setPeriod={setPeriod}/>}
        {tab === 'macros' && <MacrosTab period={period} setPeriod={setPeriod}/>}
        {tab === 'adherencia' && <AdherenciaTab/>}

        <div className="bottom-nav-pad"/>
      </div>
    </div>
  );
}

function PesoTab({ period, setPeriod }) {
  const current = PERSONA.weight;
  const start = PERSONA.startWeight;
  const target = PERSONA.targetWeight;
  const lost = (start - current).toFixed(1);
  const toGo = (current - target).toFixed(1);
  const progressPct = ((start - current) / (start - target)) * 100;

  return (
    <div className="screen-anim">
      {/* Stat row */}
      <div className="card card-elev" style={{ marginTop: 12, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="eyebrow">Peso actual</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <span className="tnum" style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text)' }}>{current}</span>
              <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 600 }}>kg</span>
              <span className="chip" style={{
                marginLeft: 6, background: 'var(--brand-50)', color: 'var(--brand-700)',
                borderColor: 'transparent', fontSize: 11, padding: '3px 8px',
              }}>
                <Ico name="chevD" size={10} stroke={3}/> {Math.abs(lost)} kg
              </span>
            </div>
          </div>
          <button className="btn btn-brand" style={{ padding: '8px 12px', fontSize: 13 }}>
            <Ico name="plus" size={14} stroke={2.5}/> Registrar
          </button>
        </div>

        {/* Progress bar to target */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10, fontWeight: 600, color: 'var(--text-3)',
          marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <span>Inicio {start}</span>
          <span>Meta {target}</span>
        </div>
        <div style={{
          height: 10, borderRadius: 999, background: 'var(--surface-2)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progressPct}%`,
            background: 'linear-gradient(90deg, var(--brand-400), var(--brand-600))',
            borderRadius: 999,
            transition: 'width 800ms cubic-bezier(.4,1.2,.5,1)',
          }}/>
          <div style={{
            position: 'absolute', left: `calc(${progressPct}% - 10px)`, top: -3,
            width: 16, height: 16, borderRadius: 999, background: 'var(--surface)',
            border: '3px solid var(--brand-600)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}/>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
          Te faltan <b className="tnum" style={{ color: 'var(--text)' }}>{toGo} kg</b> para llegar a tu meta
        </div>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 8, padding: '0 2px' }}>
        <div className="eyebrow">Evolución</div>
        <div className="segmented" style={{ padding: 2 }}>
          {[['7d','7d'],['30d','30d'],['90d','90d'],['todo','Todo']].map(([id, l]) => (
            <button key={id} onClick={() => setPeriod(id)} className={period === id ? 'active' : ''}
              style={{ padding: '4px 10px', fontSize: 11.5 }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card card-elev" style={{ padding: '16px 8px 8px' }}>
        <LineChart data={WEIGHT_DATA} width={336} height={210} goal={target} color="var(--brand-500)"/>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10, marginTop: 12,
      }}>
        {[
          { l: 'Esta semana', v: '−0.6', u: 'kg', s: 'down' },
          { l: 'Este mes', v: '−1.9', u: 'kg', s: 'down' },
          { l: 'Promedio/sem', v: '0.4', u: 'kg' },
          { l: 'IMC', v: '23.6', u: '', tag: 'Normal' },
        ].map((s, i) => (
          <div key={i} className="card card-elev" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
              <span className="tnum" style={{ fontSize: 22, fontWeight: 700, color: s.s === 'down' ? 'var(--success)' : 'var(--text)', letterSpacing: '-0.025em' }}>
                {s.v}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{s.u}</span>
              {s.tag && <span className="chip" style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 6px', background: 'var(--brand-50)', color: 'var(--brand-700)', borderColor: 'transparent' }}>{s.tag}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacrosTab({ period, setPeriod }) {
  return (
    <div className="screen-anim">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 8, padding: '0 2px' }}>
        <div className="eyebrow">Macros · últimos 14 días</div>
        <div className="segmented" style={{ padding: 2 }}>
          {[['7d','7d'],['30d','30d'],['90d','90d']].map(([id, l]) => (
            <button key={id} onClick={() => setPeriod(id)} className={period === id ? 'active' : ''}
              style={{ padding: '4px 10px', fontSize: 11.5 }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card card-elev" style={{ padding: '14px 8px 4px' }}>
        <StackedMacroChart data={MACRO_TREND} width={336} height={210}/>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, paddingTop: 10, paddingBottom: 8 }}>
          {[
            ['Proteína', 'var(--ring-pro)'],
            ['Carbs', 'var(--ring-carb)'],
            ['Grasas', 'var(--ring-fat)'],
          ].map(([l, c], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: c }}/>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Promedios diarios</div>
        <div className="card card-elev" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MacroBar label="Calorías" value={1668} target={TARGETS.cal} color="var(--ring-cal)" unit=" kcal"/>
          <MacroBar label="Proteínas" value={118} target={TARGETS.pro} color="var(--ring-pro)"/>
          <MacroBar label="Carbohidratos" value={162} target={TARGETS.carb} color="var(--ring-carb)"/>
          <MacroBar label="Grasas" value={58} target={TARGETS.fat} color="var(--ring-fat)"/>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Distribución promedio</div>
        <div className="card card-elev" style={{ padding: 18 }}>
          <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: '30%', background: 'var(--ring-pro)' }}/>
            <div style={{ width: '40%', background: 'var(--ring-carb)' }}/>
            <div style={{ width: '30%', background: 'var(--ring-fat)' }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            {[['Proteína','30%','var(--ring-pro)'],['Carbs','40%','var(--ring-carb)'],['Grasas','30%','var(--ring-fat)']].map(([l,p,c], i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: c }}/>
                  <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>{l}</span>
                </div>
                <span className="tnum" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdherenciaTab() {
  return (
    <div className="screen-anim">
      {/* Big stat */}
      <div className="card card-elev" style={{
        marginTop: 12, padding: 20,
        background: 'linear-gradient(140deg, var(--brand-500), var(--brand-700))',
        color: '#fff', border: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Adherencia este mes
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
              <span className="tnum" style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.035em' }}>78</span>
              <span style={{ fontSize: 18, fontWeight: 700 }}>%</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: 500 }}>
              18 de 23 días dentro del rango
            </div>
          </div>
          <div style={{
            width: 80, height: 80, borderRadius: 999,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <Ico name="target" size={42} color="#fff" stroke={1.5}/>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Últimas 13 semanas</div>
        <div className="card card-elev" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 1 }}>
              {['L','M','M','J','V','S','D'].map((d, i) => (
                <div key={i} style={{ height: 13, fontSize: 9, color: 'var(--text-3)', fontWeight: 600, lineHeight: '13px' }}>{d}</div>
              ))}
            </div>
            <div style={{ flex: 1, overflowX: 'auto' }} className="scroll-hide">
              <AdherenceHeatmap days={ADHERENCE}/>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
            {[
              ['Excelente', 'var(--brand-500)'],
              ['OK', 'var(--brand-300)'],
              ['Fuera', 'var(--ring-fat-bg)'],
              ['Sin datos', 'var(--surface-2)'],
            ].map(([l, c], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c, border: '1px solid var(--border)' }}/>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-2)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
        <div className="card card-elev" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ico name="flame" size={14} color="var(--ring-fat)"/>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mejor racha</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="tnum" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em' }}>11</span>
            <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>días</span>
          </div>
        </div>
        <div className="card card-elev" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ico name="check" size={14} color="var(--success)"/>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Días totales</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="tnum" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em' }}>47</span>
            <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>/ 91</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── OBJETIVOS ──────────────── */
function ObjetivosScreen() {
  const [auto, setAuto] = useS(true);

  return (
    <div className="screen-anim">
      <ScreenHeader title="Objetivos" sub="Tus metas y compromiso semanal"/>

      <div className="screen-scroll">
        {/* Goal card */}
        <div className="card card-elev" style={{ marginTop: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'var(--brand-50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ico name="target" size={22} color="var(--brand-700)"/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tu objetivo
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.015em' }}>
                Bajar de peso · 0.5 kg/sem
              </div>
            </div>
            <button className="btn-icon"><Ico name="edit" size={16}/></button>
          </div>

          {/* TDEE breakdown */}
          <div style={{
            background: 'var(--surface-2)', borderRadius: 14, padding: 14,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Tasa metabólica basal (TMB)</span>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>1.420</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>× Factor actividad <span style={{ color: 'var(--text-3)' }}>(1.55)</span></span>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>2.201</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>− Déficit calórico</span>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ring-fat)' }}>−551</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              paddingTop: 8, borderTop: '1px dashed var(--border-strong)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 700 }}>Meta diaria</span>
              <span className="tnum" style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-600)', letterSpacing: '-0.02em' }}>
                1.650 kcal
              </span>
            </div>
          </div>

          {/* Toggle calc/manual */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Cálculo automático</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Usar TDEE de tu perfil</div>
            </div>
            <button onClick={() => setAuto(!auto)} style={{
              width: 44, height: 26, borderRadius: 999,
              background: auto ? 'var(--brand-500)' : 'var(--border-strong)',
              position: 'relative', transition: 'background 200ms',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: auto ? 21 : 3,
                width: 20, height: 20, borderRadius: 999, background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 200ms',
              }}/>
            </button>
          </div>
        </div>

        {/* Macro targets */}
        <div style={{ marginTop: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Macros objetivo</div>
          <div className="card card-elev" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { l: 'Proteínas', v: TARGETS.pro, u: 'g', p: '30%', c: 'var(--ring-pro)', cal: TARGETS.pro * 4 },
              { l: 'Carbohidratos', v: TARGETS.carb, u: 'g', p: '40%', c: 'var(--ring-carb)', cal: TARGETS.carb * 4 },
              { l: 'Grasas', v: TARGETS.fat, u: 'g', p: '30%', c: 'var(--ring-fat)', cal: TARGETS.fat * 9 },
            ].map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: i < 2 ? '1px solid var(--hairline)' : 0,
              }}>
                <div style={{ width: 4, height: 28, background: m.c, borderRadius: 4 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.l}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.p} de calorías · {m.cal} kcal</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="tnum" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{m.v}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 2, fontWeight: 600 }}>{m.u}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly compliance bars */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div className="eyebrow">Cumplimiento semanal</div>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>
              <span className="tnum" style={{ color: 'var(--text)', fontWeight: 700 }}>5</span> / 7 días
            </span>
          </div>
          <div className="card card-elev" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80, marginBottom: 10 }}>
              {WEEK.map((d, i) => {
                const pct = Math.min(d.cal / TARGETS.cal, 1.2);
                const h = pct * 70;
                const onTarget = pct >= 0.9 && pct <= 1.1;
                const slight = pct >= 0.8 && pct < 0.9 || pct > 1.1 && pct <= 1.2;
                const color = onTarget ? 'var(--success)' : slight ? 'var(--warning)' : 'var(--danger)';
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%', height: h, background: color, borderRadius: '4px 4px 2px 2px',
                      opacity: d.today ? 1 : 0.85,
                      border: d.today ? `2px solid var(--text)` : 0,
                      transition: 'height 800ms cubic-bezier(.3,1.1,.4,1)',
                    }}/>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{d.label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--hairline)' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Promedio</div>
                <span className="tnum" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>1.640 kcal</span>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mejor día</div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Jueves</span>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Desvío</div>
                <span className="tnum" style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)', letterSpacing: '-0.02em' }}>−0.6%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="card card-elev" style={{
          marginTop: 16, padding: 18,
          background: 'linear-gradient(135deg, #ff8a4c, #f43f5e)',
          color: '#fff', border: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>🔥</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Racha actual</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                <span className="tnum" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.035em' }}>4</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>días seguidos</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4, fontWeight: 500 }}>
                ¡Tu mejor racha del mes son <b>11 días</b>!
              </div>
            </div>
          </div>
        </div>

        <div className="bottom-nav-pad"/>
      </div>
    </div>
  );
}

/* ──────────────── PERFIL ──────────────── */
function PerfilScreen({ darkMode, onToggleDark }) {
  return (
    <div className="screen-anim">
      <ScreenHeader title="Perfil"/>

      <div className="screen-scroll">
        {/* User card */}
        <div className="card card-elev" style={{
          padding: 18, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 19 }}>
            {PERSONA.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.015em' }}>
              {PERSONA.name} Castellano
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              sofia.castellano@email.com
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span className="chip" style={{ fontSize: 10, padding: '2px 7px' }}>{PERSONA.age} años</span>
              <span className="chip" style={{ fontSize: 10, padding: '2px 7px' }}>{PERSONA.height} cm</span>
              <span className="chip" style={{ fontSize: 10, padding: '2px 7px' }}>{PERSONA.diet}</span>
            </div>
          </div>
          <button className="btn-icon"><Ico name="edit" size={16}/></button>
        </div>

        {/* Sections */}
        <SectionCard title="Datos personales" icon="user">
          <Row label="Edad" value="28 años"/>
          <Row label="Altura" value="165 cm"/>
          <Row label="Peso actual" value="64.2 kg"/>
          <Row label="Sexo biológico" value="Femenino"/>
        </SectionCard>

        <SectionCard title="Objetivo" icon="target">
          <Row label="Meta" value="Bajar peso"/>
          <Row label="Peso objetivo" value="60 kg"/>
          <Row label="Nivel de actividad" value="Moderado"/>
          <Row label="Rutina" value="Pilates 3x/sem"/>
        </SectionCard>

        <SectionCard title="Macros objetivo" icon="plate"
          action={<button className="chip" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', borderColor: 'transparent' }}>
            <Ico name="sparkle" size={11}/> Recalcular
          </button>}>
          <Row label="Calorías" value="1.650 kcal" colorBar="var(--ring-cal)"/>
          <Row label="Proteínas" value="124 g" colorBar="var(--ring-pro)"/>
          <Row label="Carbohidratos" value="165 g" colorBar="var(--ring-carb)"/>
          <Row label="Grasas" value="55 g" colorBar="var(--ring-fat)"/>
        </SectionCard>

        <SectionCard title="Preferencias alimentarias" icon="apple">
          <Row label="Dieta" value="Omnívora"/>
          <Row label="Comidas por día" value="4"/>
          <Row label="Complejidad" value="Moderada"/>
          <Row label="Presupuesto semanal" value="$18.000"/>
          <Row label="Alergias" value="Ninguna" muted/>
        </SectionCard>

        {/* Appearance */}
        <SectionCard title="Apariencia" icon="settings">
          <button onClick={onToggleDark} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0', borderBottom: '1px solid var(--hairline)',
          }}>
            <Ico name={darkMode ? 'moon' : 'sun'} size={18} color="var(--text-2)"/>
            <span style={{ flex: 1, textAlign: 'left', fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>
              Modo {darkMode ? 'oscuro' : 'claro'}
            </span>
            <div style={{
              width: 40, height: 24, borderRadius: 999,
              background: darkMode ? 'var(--brand-500)' : 'var(--border-strong)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: darkMode ? 18 : 2,
                width: 20, height: 20, borderRadius: 999, background: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                transition: 'left 200ms',
              }}/>
            </div>
          </button>
          <Row label="Idioma" value="Español (AR)"/>
          <Row label="Unidades" value="Métrico (kg, cm)"/>
        </SectionCard>

        <button style={{
          width: '100%', padding: '14px', marginTop: 16,
          borderRadius: 14, background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--danger)', fontWeight: 600, fontSize: 14,
        }}>
          Cerrar sesión
        </button>

        <div className="bottom-nav-pad"/>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, action, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <Ico name={icon} size={14} color="var(--text-3)"/>}
          <span className="eyebrow">{title}</span>
        </div>
        {action}
      </div>
      <div className="card card-elev" style={{ padding: '4px 16px' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, muted, colorBar }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 0', borderBottom: '1px solid var(--hairline)',
    }}>
      {colorBar && <div style={{ width: 4, height: 18, borderRadius: 4, background: colorBar }}/>}
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{label}</span>
      <span className="tnum" style={{ fontSize: 14, color: muted ? 'var(--text-3)' : 'var(--text-2)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

Object.assign(window, {
  DashboardScreen, DiarioScreen, DiarioSemanal, ProgresoScreen, ObjetivosScreen, PerfilScreen,
});
