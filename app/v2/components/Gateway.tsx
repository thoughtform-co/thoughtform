export function Gateway() {
  return (
    <div className="gateway" aria-hidden="true">
      <div className="gateway__stage">
        <div className="gateway__deep">
          <svg className="gateway__svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="v2-gatewayGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#CAA554" stopOpacity="0.12" />
                <stop offset="40%" stopColor="#CAA554" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#CAA554" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="v2-gridFade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(236,227,214,0)" />
                <stop offset="50%" stopColor="rgba(236,227,214,0.06)" />
                <stop offset="100%" stopColor="rgba(236,227,214,0)" />
              </linearGradient>
            </defs>
            <g opacity="0.4" stroke="url(#v2-gridFade)" strokeWidth="0.5" fill="none">
              <path d="M0,400 L1200,400" />
              <path d="M600,0 L600,800" />
              <path d="M0,0 L600,400" />
              <path d="M1200,0 L600,400" />
              <path d="M0,800 L600,400" />
              <path d="M1200,800 L600,400" />
              <path d="M200,0 L600,400 L200,800" />
              <path d="M1000,0 L600,400 L1000,800" />
              <path d="M400,0 L600,400 L400,800" />
              <path d="M800,0 L600,400 L800,800" />
            </g>
            <circle cx="600" cy="400" r="400" fill="url(#v2-gatewayGlow)" />
          </svg>
        </div>
      </div>
      <div className="gateway__grain" />
    </div>
  );
}
