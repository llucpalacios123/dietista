/* eslint-disable */
// compras.jsx — Shopping lists list + photo upload + detection flow

const { useState: cS, useEffect: cE, useRef: cR } = React;

/* ──────────────── COMPRAS (main list) ──────────────── */
function ComprasScreen() {
  const [view, setView] = cS('list');  // list | upload | review | checklist

  if (view === 'upload') return <UploadFlow onClose={() => setView('list')} onDetected={() => setView('review')}/>;
  if (view === 'review') return <ReviewDetected onClose={() => setView('list')} onSave={() => setView('checklist')}/>;
  if (view === 'checklist') return <CategorizedChecklist onClose={() => setView('list')}/>;

  const pct = Math.round((ACTIVE_SHOPPING.totalEstimate / ACTIVE_SHOPPING.budget) * 100);

  return (
    <div className="screen-anim">
      <ScreenHeader
        title="Compras"
        sub="Tu despensa semanal"
        action={
          <button className="btn btn-brand" style={{ padding: '8px 12px', fontSize: 13 }}
            onClick={() => setView('upload')}>
            <Ico name="camera" size={14} stroke={2.2}/> Subir
          </button>
        }
      />

      <div className="screen-scroll">
        {/* Active list — hero card */}
        <div className="card card-elev" style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--brand-700)' }}>Semana actual</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginTop: 2, letterSpacing: '-0.015em' }}>
                  {ACTIVE_SHOPPING.planName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginTop: 3 }}>
                  Subida {ACTIVE_SHOPPING.uploadedAt}
                </div>
              </div>
              <span className="chip" style={{
                fontSize: 10, padding: '3px 8px',
                background: 'var(--brand-50)', color: 'var(--brand-700)', borderColor: 'transparent',
              }}>
                <Ico name="check" size={10} stroke={3}/> Revisada
              </span>
            </div>

            {/* Budget bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Estimado
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>
                  Presupuesto <span className="tnum" style={{ color: 'var(--text)', fontWeight: 700 }}>
                    ${ACTIVE_SHOPPING.budget.toLocaleString('es-AR')}
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span className="tnum" style={{ fontSize: 30, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>
                  ${ACTIVE_SHOPPING.totalEstimate.toLocaleString('es-AR')}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--brand-700)',
                  background: 'var(--brand-50)', padding: '2px 6px', borderRadius: 999,
                }} className="tnum">
                  {pct}% usado
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: 'linear-gradient(90deg, var(--brand-400), var(--brand-600))',
                  borderRadius: 999,
                }}/>
              </div>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4,
              padding: '10px 0', borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div className="tnum" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  {ACTIVE_SHOPPING.itemsTotal}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Items
                </div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid var(--hairline)', borderRight: '1px solid var(--hairline)' }}>
                <div className="tnum" style={{ fontSize: 17, fontWeight: 700, color: 'var(--success)', letterSpacing: '-0.02em' }}>
                  {ACTIVE_SHOPPING.itemsMatched}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Match
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="tnum" style={{ fontSize: 17, fontWeight: 700, color: 'var(--warning)', letterSpacing: '-0.02em' }}>
                  {ACTIVE_SHOPPING.itemsTotal - ACTIVE_SHOPPING.itemsMatched}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sin match
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setView('checklist')} className="btn btn-primary" style={{ flex: 1, padding: 12, fontSize: 13 }}>
                Abrir checklist
              </button>
              <button className="btn btn-ghost" style={{ padding: '12px 14px', fontSize: 13 }}>
                <Ico name="edit" size={14}/>
              </button>
            </div>
          </div>

          {/* Items preview */}
          <button onClick={() => setView('checklist')} style={{
            width: '100%', padding: '0 14px 14px', background: 'var(--surface)', textAlign: 'left',
          }}>
            <div className="eyebrow" style={{ padding: '8px 0' }}>Items detectados</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {ACTIVE_SHOPPING.items.slice(0, 5).map((it, i) => <ItemRow key={i} item={it}/>)}
              <div style={{
                padding: 10, fontSize: 12, color: 'var(--brand-700)', fontWeight: 700,
                textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                Ver checklist completa ({ACTIVE_SHOPPING.items.length}) <Ico name="chev" size={12} stroke={2.5}/>
              </div>
            </div>
          </button>
        </div>

        {/* Past lists */}
        <div style={{ marginTop: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Anteriores</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PAST_LISTS.map((l, i) => (
              <div key={i} className="card card-elev" style={{
                padding: 12, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--brand-50)', color: 'var(--brand-700)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ico name="check" size={18} stroke={2.5}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    Semana del {l.date}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }} className="tnum">
                    {l.items} items · ${l.total.toLocaleString('es-AR')}
                  </div>
                </div>
                <span className="chip muted" style={{ fontSize: 10 }}>Comprada</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bottom-nav-pad"/>
      </div>
    </div>
  );
}

/* ──────────────── ItemRow ──────────────── */
function ItemRow({ item }) {
  const confColor = item.confidence === 'high' ? 'var(--success)'
    : item.confidence === 'medium' ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 4px',
      borderBottom: '1px solid var(--hairline)',
    }}>
      {/* Checkbox */}
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        background: item.checked ? 'var(--brand-500)' : 'var(--surface)',
        border: item.checked ? 0 : '1.5px solid var(--border-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {item.checked && <Ico name="check" size={13} stroke={3} color="#fff"/>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text)',
            textDecoration: item.checked ? 'line-through' : 'none',
            opacity: item.checked ? 0.6 : 1,
          }}>
            {item.name}
          </span>
          {item.matched === false && (
            <span style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 4,
              background: 'var(--ring-fat-bg)', color: 'var(--ring-fat)',
              fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase',
            }}>extra</span>
          )}
        </div>
        <div className="tnum" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
          {item.qty}
        </div>
      </div>

      {/* Confidence dot */}
      <div title={`Confianza ${item.confidence}`} style={{
        width: 6, height: 6, borderRadius: 999, background: confColor, flexShrink: 0,
      }}/>

      <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 60, textAlign: 'right' }}>
        ${item.price.toLocaleString('es-AR')}
      </span>
    </div>
  );
}

/* ──────────────── UPLOAD FLOW ──────────────── */
function UploadFlow({ onClose, onDetected }) {
  const [stage, setStage] = cS('idle');  // idle | uploading | processing | done
  const [progress, setProgress] = cS(0);

  const startUpload = () => {
    setStage('uploading');
    setProgress(0);
    const i = setInterval(() => {
      setProgress(p => {
        if (p >= 40) {
          clearInterval(i);
          setTimeout(() => {
            setStage('processing');
            const p2 = setInterval(() => {
              setProgress(pp => {
                if (pp >= 100) {
                  clearInterval(p2);
                  setStage('done');
                  setTimeout(onDetected, 700);
                  return 100;
                }
                return Math.min(pp + Math.random() * 3 + 2, 100);
              });
            }, 180);
          }, 300);
          return 40;
        }
        return p + 4;
      });
    }, 120);
  };

  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{
        padding: '54px 14px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button className="btn-icon" onClick={onClose}>
          <Ico name="x" size={18}/>
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Nueva lista</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginTop: 2 }}>
            Subí tu lista o ticket
          </div>
        </div>
      </div>

      <div className="screen-scroll">
        {stage === 'idle' && (
          <div className="screen-anim">
            {/* Upload area */}
            <button onClick={startUpload} style={{
              width: '100%', marginTop: 8,
              padding: '40px 20px',
              borderRadius: 24,
              background: 'var(--surface)',
              border: '2px dashed var(--brand-300)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: 'linear-gradient(135deg, var(--brand-400), var(--brand-700))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 6px 16px rgba(16,185,129,0.25)',
              }}>
                <Ico name="camera" size={28}/>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  Sacá una foto
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3, fontWeight: 500 }}>
                  De tu ticket o lista escrita a mano
                </div>
              </div>
            </button>

            {/* Alternative upload */}
            <button onClick={startUpload} className="card card-elev" style={{
              width: '100%', padding: 14, marginTop: 10,
              display: 'flex', alignItems: 'center', gap: 12,
              textAlign: 'left',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-2)',
              }}>
                <Ico name="plate" size={18}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Galería</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Elegí una imagen guardada</div>
              </div>
              <Ico name="chev" size={14} color="var(--text-3)"/>
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '16px 0 14px',
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                o escribí
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            </div>

            <button className="card card-elev" style={{
              width: '100%', padding: 14,
              display: 'flex', alignItems: 'center', gap: 12,
              textAlign: 'left',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-2)',
              }}>
                <Ico name="edit" size={18}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Crear lista vacía</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Agregá items manualmente</div>
              </div>
              <Ico name="chev" size={14} color="var(--text-3)"/>
            </button>

            {/* How it works */}
            <div className="card card-elev" style={{
              padding: 16, marginTop: 20,
              background: 'var(--surface-2)',
              border: '1px dashed var(--border-strong)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Ico name="sparkle" size={14} color="var(--brand-700)"/>
                <span className="eyebrow" style={{ color: 'var(--brand-700)' }}>Cómo funciona</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['1', 'Subís una foto del ticket o lista'],
                  ['2', 'La IA detecta cada alimento, cantidad y precio'],
                  ['3', 'Revisás y corregís si hace falta'],
                  ['4', 'Comparamos con tu plan y presupuesto'],
                ].map(([n, t], i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 999, flexShrink: 0,
                      background: 'var(--brand-500)', color: '#fff',
                      fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{n}</div>
                    <span style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500, lineHeight: 1.4 }}>
                      {t}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(stage === 'uploading' || stage === 'processing' || stage === 'done') && (
          <ProcessingState stage={stage} progress={progress}/>
        )}

        <div className="bottom-nav-pad"/>
      </div>
    </div>
  );
}

function ProcessingState({ stage, progress }) {
  return (
    <div className="screen-anim" style={{ paddingTop: 8 }}>
      {/* Faux photo preview */}
      <div style={{
        width: '100%', height: 240, borderRadius: 20,
        background: 'linear-gradient(135deg, #fdf6e3, #f4e4bc 40%, #ddd0a1 80%, #c9b27e)',
        position: 'relative', overflow: 'hidden',
        marginBottom: 16,
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.05)',
      }}>
        {/* Simulated receipt lines */}
        <div style={{ position: 'absolute', inset: 18, color: '#5b5240', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, lineHeight: 1.5 }}>
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            SUPERMERCADO COTO
          </div>
          {[
            'POLLO PECHUGA 1KG......1850',
            'ARROZ INTEGRAL 1KG.....720',
            'ATUN LATA x3...........980',
            'HUEVOS DOC.............1240',
            'BANANA 1KG.............450',
            'BROCOLI................380',
            'ACEITE OLIVA 500ML.....1850',
            'PAN INTEGRAL...........620',
            '──────────────────────────',
            'TOTAL...............$8090',
          ].map((l, i) => <div key={i}>{l}</div>)}
        </div>
        {/* Scanning overlay */}
        {stage !== 'done' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.18) 50%, transparent 100%)',
            animation: 'scanline 1.8s linear infinite',
          }}/>
        )}
        {stage === 'done' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 999,
              background: 'var(--brand-500)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16,185,129,0.45)',
            }}>
              <Ico name="check" size={28} stroke={3}/>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>

      {/* Status */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.015em' }}>
          {stage === 'uploading' && 'Subiendo foto…'}
          {stage === 'processing' && 'Detectando alimentos…'}
          {stage === 'done' && '¡Listo!'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, fontWeight: 500 }}>
          {stage === 'uploading' && 'Preparando la imagen para análisis'}
          {stage === 'processing' && 'IA leyendo los items uno por uno'}
          {stage === 'done' && '8 alimentos detectados'}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 6, borderRadius: 999, background: 'var(--surface-2)',
        overflow: 'hidden', marginBottom: 20,
      }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--brand-400), var(--brand-600))',
          borderRadius: 999, transition: 'width 200ms ease',
        }}/>
      </div>

      {/* Tip */}
      {stage === 'processing' && (
        <div style={{
          padding: 14, borderRadius: 14,
          background: 'var(--brand-50)',
          border: '1px solid var(--brand-200)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Ico name="sparkle" size={16} color="var(--brand-700)"/>
          <span style={{ fontSize: 12.5, color: 'var(--brand-700)', fontWeight: 600, lineHeight: 1.4 }}>
            Cruzando con tu plan del 17 al 23 may para encontrar coincidencias
          </span>
        </div>
      )}
    </div>
  );
}

/* ──────────────── REVIEW DETECTED ──────────────── */
function ReviewDetected({ onClose, onSave }) {
  const [items, setItems] = cS(DETECTED_ITEMS.map((it, i) => ({ ...it, id: i, checked: it.confidence !== 'low' })));

  const toggle = id => setItems(its => its.map(it => it.id === id ? { ...it, checked: !it.checked } : it));
  const remove = id => setItems(its => its.filter(it => it.id !== id));

  const total = items.filter(it => it.checked).reduce((sum, it) => sum + it.price, 0);
  const budget = 18000;
  const pct = Math.round((total / budget) * 100);

  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '54px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn-icon" onClick={onClose}>
          <Ico name="chevL" size={18}/>
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">8 items detectados</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginTop: 2 }}>
            Revisá la lista
          </div>
        </div>
      </div>

      <div className="screen-scroll" style={{ paddingTop: 4 }}>
        {/* Sticky summary */}
        <div className="card card-elev" style={{
          padding: 14, marginTop: 6, marginBottom: 14,
          background: 'linear-gradient(135deg, var(--surface), var(--brand-50))',
          border: '1px solid var(--brand-200)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--brand-700)' }}>Total estimado</div>
              <div className="tnum" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginTop: 2 }}>
                ${total.toLocaleString('es-AR')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Presupuesto
              </div>
              <div className="tnum" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', marginTop: 2 }}>
                ${budget.toLocaleString('es-AR')}
              </div>
              <div className="tnum" style={{ fontSize: 10, color: pct > 100 ? 'var(--danger)' : 'var(--brand-700)', fontWeight: 700, marginTop: 2 }}>
                {pct}% usado
              </div>
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', marginTop: 12 }}>
            <div style={{
              height: '100%', width: `${Math.min(pct, 100)}%`,
              background: 'linear-gradient(90deg, var(--brand-400), var(--brand-600))',
              borderRadius: 999, transition: 'width 400ms ease',
            }}/>
          </div>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {items.map(it => (
            <div key={it.id} className="card card-elev" style={{
              padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: it.checked ? 1 : 0.55,
              transition: 'opacity 200ms',
            }}>
              <button onClick={() => toggle(it.id)} style={{
                width: 22, height: 22, borderRadius: 6,
                background: it.checked ? 'var(--brand-500)' : 'var(--surface)',
                border: it.checked ? 0 : '1.5px solid var(--border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {it.checked && <Ico name="check" size={13} stroke={3} color="#fff"/>}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{it.name}</div>
                <div className="tnum" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                  {it.qty}
                </div>
              </div>
              {/* Confidence */}
              <span style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 999, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.02em',
                background:
                  it.confidence === 'high' ? 'var(--brand-50)' :
                  it.confidence === 'medium' ? '#fef3c7' : '#fee2e2',
                color:
                  it.confidence === 'high' ? 'var(--brand-700)' :
                  it.confidence === 'medium' ? '#92400e' : '#991b1b',
              }}>
                {it.confidence === 'high' ? '●●●' : it.confidence === 'medium' ? '●●' : '●'}
              </span>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 56, textAlign: 'right' }}>
                ${it.price.toLocaleString('es-AR')}
              </span>
              <button onClick={() => remove(it.id)} style={{
                width: 24, height: 24, color: 'var(--text-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ico name="x" size={14}/>
              </button>
            </div>
          ))}

          <button className="card card-flat" style={{
            padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            border: '1.5px dashed var(--border-strong)', color: 'var(--text-2)',
            fontSize: 13, fontWeight: 600,
            background: 'transparent',
          }}>
            <Ico name="plus" size={14} stroke={2.5}/>
            Agregar item manualmente
          </button>
        </div>

        {/* Match info */}
        <div className="card card-elev" style={{
          padding: 12, marginBottom: 14,
          background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'var(--brand-500)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ico name="check" size={16} stroke={2.5}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
              6 de 8 ítems coinciden con tu plan
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
              Te falta: <b style={{ color: 'var(--ring-fat)' }}>salmón</b>, <b style={{ color: 'var(--ring-fat)' }}>palta</b>
            </div>
          </div>
        </div>

        <div className="bottom-nav-pad"/>
      </div>

      {/* Footer CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '14px 16px 110px',
        background: 'linear-gradient(0deg, var(--bg) 70%, transparent)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
          <button className="btn btn-ghost" style={{ flex: 1, padding: 14, fontSize: 13 }}>
            Agregar al diario
          </button>
          <button onClick={onSave} className="btn btn-brand" style={{
            flex: 1, padding: 14, fontSize: 14,
            boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
          }}>
            Guardar lista
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ComprasScreen, CategorizedChecklist });

/* ──────────────── CATEGORIZED CHECKLIST ──────────────── */
function CategorizedChecklist({ onClose }) {
  const [items, setItems] = cS(ACTIVE_SHOPPING.items.map((it, i) => ({ ...it, id: i })));
  const [collapsed, setCollapsed] = cS(new Set());
  const [filter, setFilter] = cS('all');  // all | pending | done

  const toggleItem = id => setItems(its => its.map(it => it.id === id ? { ...it, checked: !it.checked } : it));
  const toggleCat = cid => {
    setCollapsed(s => {
      const next = new Set(s);
      if (next.has(cid)) next.delete(cid); else next.add(cid);
      return next;
    });
  };
  const checkAllInCat = (cid, check) => {
    setItems(its => its.map(it => it.category === cid ? { ...it, checked: check } : it));
  };

  // Group items by category
  const byCategory = CATEGORIES.map(cat => {
    const catItems = items.filter(it => it.category === cat.id);
    if (catItems.length === 0) return null;
    const filtered = filter === 'pending' ? catItems.filter(it => !it.checked)
                   : filter === 'done' ? catItems.filter(it => it.checked)
                   : catItems;
    if (filtered.length === 0) return null;
    return { ...cat, items: filtered, allItems: catItems };
  }).filter(Boolean);

  const totalChecked = items.filter(it => it.checked).length;
  const totalItems = items.length;
  const totalSpent = items.filter(it => it.checked).reduce((s, it) => s + it.price, 0);
  const totalRemaining = items.filter(it => !it.checked).reduce((s, it) => s + it.price, 0);
  const progressPct = (totalChecked / totalItems) * 100;
  const allDone = totalChecked === totalItems;

  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: '54px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn-icon" onClick={onClose}>
          <Ico name="chevL" size={18}/>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">Lista de compras</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ACTIVE_SHOPPING.planName}
          </div>
        </div>
        <button className="btn-icon"><Ico name="settings" size={16}/></button>
      </div>

      {/* Progress hero */}
      <div style={{ padding: '4px 16px 8px' }}>
        <div className="card card-elev" style={{
          padding: 14,
          background: allDone
            ? 'linear-gradient(135deg, var(--brand-500), var(--brand-700))'
            : 'var(--surface)',
          color: allDone ? '#fff' : 'var(--text)',
          border: allDone ? 0 : '1px solid var(--border)',
          transition: 'background 400ms',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                color: allDone ? 'rgba(255,255,255,0.85)' : 'var(--text-3)',
              }}>
                {allDone ? '¡Compra completa!' : 'Tu progreso'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span className="tnum" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>
                  {totalChecked}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, opacity: 0.7 }}>
                  /{totalItems}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4, opacity: 0.8 }}>
                  items
                </span>
              </div>
            </div>
            <div style={{
              width: 52, height: 52, borderRadius: 999,
              background: allDone ? 'rgba(255,255,255,0.2)' : 'var(--brand-50)',
              border: allDone ? '1.5px solid rgba(255,255,255,0.3)' : 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: allDone ? '#fff' : 'var(--brand-700)',
            }}>
              {allDone
                ? <Ico name="check" size={26} stroke={3}/>
                : <span className="tnum" style={{ fontSize: 14, fontWeight: 800 }}>
                    {Math.round(progressPct)}%
                  </span>}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 8, borderRadius: 999,
            background: allDone ? 'rgba(255,255,255,0.2)' : 'var(--surface-2)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: allDone
                ? '#fff'
                : 'linear-gradient(90deg, var(--brand-400), var(--brand-600))',
              borderRadius: 999,
              transition: 'width 500ms cubic-bezier(.4,1.2,.5,1)',
            }}/>
          </div>

          {/* Stats below */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 12, paddingTop: 10,
            borderTop: allDone ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--hairline)',
          }}>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                En carrito
              </div>
              <div className="tnum" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.015em', marginTop: 2 }}>
                ${totalSpent.toLocaleString('es-AR')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Falta
              </div>
              <div className="tnum" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.015em', marginTop: 2 }}>
                ${totalRemaining.toLocaleString('es-AR')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total
              </div>
              <div className="tnum" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.015em', marginTop: 2 }}>
                ${(totalSpent + totalRemaining).toLocaleString('es-AR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{
        padding: '0 16px 10px',
        display: 'flex', gap: 6, overflowX: 'auto',
      }} className="scroll-hide">
        {[
          { id: 'all', label: `Todos · ${totalItems}` },
          { id: 'pending', label: `Faltan · ${totalItems - totalChecked}` },
          { id: 'done', label: `Listos · ${totalChecked}` },
        ].map(f => (
          <button key={f.id}
            onClick={() => setFilter(f.id)}
            className={`chip ${filter === f.id ? 'active' : ''}`}
            style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="screen-scroll" style={{ paddingTop: 0 }}>
        {byCategory.length === 0 ? (
          <EmptyChecklistState filter={filter}/>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byCategory.map(cat => (
              <CategoryGroup
                key={cat.id}
                category={cat}
                collapsed={collapsed.has(cat.id)}
                onToggleCollapse={() => toggleCat(cat.id)}
                onToggleItem={toggleItem}
                onCheckAll={(check) => checkAllInCat(cat.id, check)}
              />
            ))}
          </div>
        )}

        <div className="bottom-nav-pad"/>
      </div>

      {/* Footer CTA */}
      {!allDone && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '12px 16px 110px',
          background: 'linear-gradient(0deg, var(--bg) 70%, transparent)',
          pointerEvents: 'none',
        }}>
          <button className="btn btn-brand" style={{
            width: '100%', padding: 14, fontSize: 14,
            pointerEvents: 'auto',
            boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
          }}>
            <Ico name="check" size={16} stroke={2.5}/>
            Marcar todo como comprado
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryGroup({ category, collapsed, onToggleCollapse, onToggleItem, onCheckAll }) {
  const checked = category.allItems.filter(it => it.checked).length;
  const total = category.allItems.length;
  const allDone = checked === total;
  const subtotal = category.allItems.reduce((s, it) => s + it.price, 0);

  return (
    <div className="card card-elev" style={{
      padding: 0, overflow: 'hidden',
      opacity: allDone ? 0.75 : 1,
      transition: 'opacity 300ms',
    }}>
      {/* Category header */}
      <button onClick={onToggleCollapse} style={{
        width: '100%', padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        textAlign: 'left',
        background: allDone ? 'var(--surface-2)' : 'var(--surface)',
        transition: 'background 200ms',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: `${category.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
          position: 'relative',
        }}>
          <span>{category.icon}</span>
          {allDone && (
            <div style={{
              position: 'absolute', top: -3, right: -3,
              width: 16, height: 16, borderRadius: 999,
              background: 'var(--brand-500)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--surface)',
            }}>
              <Ico name="check" size={9} stroke={3.5}/>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 6,
          }}>
            <span style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text)',
              letterSpacing: '-0.01em',
              textDecoration: allDone ? 'line-through' : 'none',
              textDecorationColor: 'var(--text-3)',
            }}>
              {category.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span className="tnum" style={{
              fontSize: 11, fontWeight: 600,
              color: allDone ? 'var(--success)' : 'var(--text-3)',
            }}>
              {checked}/{total}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>·</span>
            <span className="tnum" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>
              ${subtotal.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* Mini progress */}
        <div style={{
          width: 36, height: 36, borderRadius: 999,
          position: 'relative',
          flexShrink: 0,
        }}>
          <svg width={36} height={36} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={18} cy={18} r={15} fill="none" stroke="var(--surface-2)" strokeWidth={3}/>
            <circle cx={18} cy={18} r={15} fill="none"
              stroke={category.color} strokeWidth={3} strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 15}
              strokeDashoffset={2 * Math.PI * 15 * (1 - checked / total)}
              style={{ transition: 'stroke-dashoffset 400ms ease' }}/>
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-3)',
            transform: collapsed ? 'rotate(0)' : 'rotate(180deg)',
            transition: 'transform 200ms',
          }}>
            <Ico name="chevD" size={14}/>
          </div>
        </div>
      </button>

      {/* Items */}
      {!collapsed && (
        <div className="screen-anim" style={{
          borderTop: '1px solid var(--hairline)',
          background: 'var(--surface)',
        }}>
          {category.items.map((it, i) => (
            <ChecklistRow
              key={it.id}
              item={it}
              isLast={i === category.items.length - 1}
              onToggle={() => onToggleItem(it.id)}
            />
          ))}
          {/* Category footer actions */}
          <div style={{
            padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px solid var(--hairline)',
            background: 'var(--surface-2)',
          }}>
            <button onClick={() => onCheckAll(!allDone)} style={{
              fontSize: 11.5, fontWeight: 600, color: 'var(--brand-700)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Ico name={allDone ? 'x' : 'check'} size={12} stroke={2.5}/>
              {allDone ? 'Desmarcar todo' : 'Marcar todo'}
            </button>
            <button style={{
              fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Ico name="plus" size={12} stroke={2.5}/>
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistRow({ item, isLast, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: '100%', padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      textAlign: 'left',
      borderBottom: isLast ? 0 : '1px solid var(--hairline)',
      transition: 'background 120ms',
    }}>
      {/* Checkbox */}
      <div style={{
        width: 24, height: 24, borderRadius: 7,
        background: item.checked ? 'var(--brand-500)' : 'var(--surface)',
        border: item.checked ? 0 : '1.5px solid var(--border-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 200ms',
        boxShadow: item.checked ? '0 1px 3px rgba(16,185,129,0.3)' : 'none',
      }}>
        {item.checked && <Ico name="check" size={14} stroke={3} color="#fff"/>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 14, fontWeight: 600, color: 'var(--text)',
            textDecoration: item.checked ? 'line-through' : 'none',
            textDecorationColor: 'var(--text-3)',
            opacity: item.checked ? 0.5 : 1,
            transition: 'opacity 200ms',
          }}>
            {item.name}
          </span>
          {item.matched === false && (
            <span style={{
              fontSize: 8.5, padding: '1.5px 5px', borderRadius: 4,
              background: 'var(--ring-fat-bg)', color: 'var(--ring-fat)',
              fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              flexShrink: 0,
            }}>extra</span>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 2,
          opacity: item.checked ? 0.5 : 1,
          transition: 'opacity 200ms',
        }}>
          <span className="tnum" style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>
            {item.qty}
          </span>
          {item.confidence !== 'high' && (
            <>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>·</span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: item.confidence === 'medium' ? 'var(--warning)' : 'var(--danger)',
              }}>
                Confianza {item.confidence === 'medium' ? 'media' : 'baja'}
              </span>
            </>
          )}
        </div>
      </div>

      <span className="tnum" style={{
        fontSize: 13, fontWeight: 700, color: 'var(--text)',
        opacity: item.checked ? 0.5 : 1,
        flexShrink: 0,
      }}>
        ${item.price.toLocaleString('es-AR')}
      </span>
    </button>
  );
}

function EmptyChecklistState({ filter }) {
  return (
    <div style={{
      padding: '60px 30px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'var(--brand-50)', color: 'var(--brand-700)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Ico name="check" size={32} stroke={2}/>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
          {filter === 'pending' ? '¡Compraste todo!' : 'Aún no marcaste nada'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>
          {filter === 'pending'
            ? 'No te queda nada por comprar'
            : 'Volvé a "Todos" o empezá a tildar items'}
        </div>
      </div>
    </div>
  );
}
