/* eslint-disable */
// app.jsx — Main shell

const { useState: uS, useEffect: uE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "darkMode": false,
  "density": "comfortable",
  "accent": "emerald",
  "ringStyle": "concentric",
  "startScreen": "diario"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = uS(tweaks.startScreen || 'diario');

  // Apply theme classes to root
  const wrapperClass = [
    tweaks.darkMode ? 'dark' : '',
    `density-${tweaks.density}`,
    `accent-${tweaks.accent}`,
  ].filter(Boolean).join(' ');

  const screenFor = (s) => {
    if (s === 'dashboard') return <DashboardScreen onNavigate={setScreen} ringStyle={tweaks.ringStyle}/>;
    if (s === 'diario') return <DiarioScreen ringStyle={tweaks.ringStyle}/>;
    if (s === 'planes') return <PlanesScreen onNavigate={setScreen}/>;
    if (s === 'compras') return <ComprasScreen/>;
    if (s === 'progreso') return <ProgresoScreen/>;
    if (s === 'objetivos') return <ObjetivosScreen/>;
    if (s === 'perfil') return <PerfilScreen darkMode={tweaks.darkMode}
      onToggleDark={() => setTweak('darkMode', !tweaks.darkMode)}/>;
    return null;
  };

  return (
    <div className="phone-stage">
      <div className="phone-shell">
        <IOSDevice dark={tweaks.darkMode} width={402} height={874}>
          <div className={wrapperClass} style={{ position: 'absolute', inset: 0 }}>
            <div className="screen-wrap" key={screen}>
              {screenFor(screen)}
            </div>
            <BottomNav active={screen} onChange={setScreen} dark={tweaks.darkMode}/>
          </div>
        </IOSDevice>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Navegación">
          <TweakSelect label="Pantalla" value={screen}
            onChange={v => { setScreen(v); setTweak('startScreen', v); }}
            options={[
              { label: 'Inicio', value: 'dashboard' },
              { label: 'Diario', value: 'diario' },
              { label: 'Planes', value: 'planes' },
              { label: 'Compras', value: 'compras' },
              { label: 'Progreso', value: 'progreso' },
              { label: 'Objetivos', value: 'objetivos' },
              { label: 'Perfil', value: 'perfil' },
            ]}/>
        </TweakSection>

        <TweakSection label="Apariencia">
          <TweakToggle label="Modo oscuro" value={tweaks.darkMode}
            onChange={v => setTweak('darkMode', v)}/>
          <TweakRadio label="Acento" value={tweaks.accent}
            onChange={v => setTweak('accent', v)}
            options={[
              { label: 'Emerald', value: 'emerald' },
              { label: 'Forest', value: 'forest' },
              { label: 'Lime', value: 'lime' },
              { label: 'Teal', value: 'teal' },
            ]}/>
        </TweakSection>

        <TweakSection label="Layout">
          <TweakRadio label="Densidad" value={tweaks.density}
            onChange={v => setTweak('density', v)}
            options={[
              { label: 'Cozy', value: 'cozy' },
              { label: 'Comfort', value: 'comfortable' },
              { label: 'Compact', value: 'compact' },
            ]}/>
          <TweakRadio label="Macro rings" value={tweaks.ringStyle}
            onChange={v => setTweak('ringStyle', v)}
            options={[
              { label: 'Concéntrico', value: 'concentric' },
              { label: 'Minimal', value: 'minimal' },
            ]}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

/* ──────────────── Bottom navigation ──────────────── */
function BottomNav({ active, onChange, dark }) {
  const items = [
    { id: 'dashboard', label: 'Inicio', icon: 'home' },
    { id: 'diario', label: 'Diario', icon: 'book' },
    { id: 'planes', label: 'Planes', icon: 'plate' },
    { id: 'compras', label: 'Compras', icon: 'camera' },
    { id: 'perfil', label: 'Perfil', icon: 'user' },
  ];
  return (
    <div className="bottom-nav">
      {items.map(it => (
        <button key={it.id}
          className={`nav-btn ${active === it.id ? 'active' : ''}`}
          onClick={() => onChange(it.id)}>
          <Ico name={it.icon} size={22} stroke={active === it.id ? 2.2 : 1.7}/>
          <span className="label">{it.label}</span>
          <span className="dot"/>
        </button>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
