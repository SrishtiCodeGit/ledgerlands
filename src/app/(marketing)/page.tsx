import type { CSSProperties } from "react";
import LandingEffects from "./landing-effects";
import "./landing.css";

// The public landing page. Markup carried over from the static site; the 3D world,
// the Steward bot and the scroll effects attach in LandingEffects once it mounts.
export default function LandingPage() {
  return (
    <>
      <div id="world" aria-hidden="true"></div>
      <div className="scrim" aria-hidden="true"></div>
      <nav className="dots" aria-label="Sections">
        <a href="#top" className="on"><span>Home</span></a>
        <a href="#why"><span>Why</span></a>
        <a href="#how"><span>How it works</span></a>
        <a href="#steward"><span>Steward</span></a>
        <a href="#plan"><span>Planning</span></a>
        <a href="#early-access"><span>Early access</span></a>
      </nav>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="mk-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0f3a2c"/><stop offset="1" stopColor="#06201a"/></linearGradient>
          <linearGradient id="mk-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe08a"/><stop offset="1" stopColor="#e0a92a"/></linearGradient>
          <symbol id="steward-mark" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="31" fill="url(#mk-bg)" stroke="#2ee6a6" strokeOpacity="0.6" strokeWidth="1.5"/>
            <path d="M17 40 L14.5 23 L24 31 L32 18 L40 31 L49.5 23 L47 40 Z" fill="url(#mk-gold)"/>
            <rect x="17" y="42" width="30" height="5" rx="2" fill="url(#mk-gold)"/>
            <circle cx="14.5" cy="22" r="2.4" fill="#ffe08a"/><circle cx="32" cy="16.5" r="2.6" fill="#ffe08a"/><circle cx="49.5" cy="22" r="2.4" fill="#ffe08a"/>
          </symbol>
        </defs>
      </svg>

      <header>
        <a className="brand" href="#top" aria-label="Ledgerlands home">
          <svg width="30" height="32" viewBox="0 0 64 66" aria-hidden="true">
            <path d="M32 37 L58 50 L32 63 L6 50 Z" fill="#0a2219" stroke="#f5c542" strokeWidth="2.4" strokeLinejoin="round"></path>
            <rect x="15.5" y="40" width="7" height="10" rx="1" fill="#2ee6a6"></rect>
            <rect x="28.5" y="31" width="7" height="19" rx="1" fill="#e9f7f0"></rect>
            <rect x="41.5" y="20" width="7" height="30" rx="1" fill="#f5c542"></rect>
            <path d="M45 20 V8" stroke="#f5c542" strokeWidth="2" strokeLinecap="round"></path>
            <path d="M45 8 L55 11 L45 14 Z" fill="#f5c542"></path>
          </svg>
          Ledgerlands
        </a>
        <nav aria-label="Main">
          <a className="link" href="#why">Why</a>
          <a className="link" href="#how">How it works</a>
          <a className="link" href="#steward">Steward</a>
          <button type="button" className="icon-btn" id="themeBtn" aria-label="Switch between day and night" title="Day / night">
            <svg className="moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"></path></svg>
            <svg className="sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"></circle><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"></path></svg>
          </button>
          <a className="link keep" href="/sign-in">Sign in</a>
          <a className="btn primary small" href="#early-access">Early access</a>
        </nav>
      </header>

      <main>
        <section id="top" className="sky">
          <span className="eyebrow rise">Finance, made easy to see</span>
          <h1 data-split>Money is confusing. <span className="grad">Your kingdom isn&apos;t.</span></h1>
          <p className="lede rise" style={{ '--d': '700ms' } as CSSProperties}>Ledgerlands turns your investments into a living kingdom. One look tells you what&apos;s growing, what needs care, and what to do next.</p>
          <div className="row rise" style={{ '--d': '900ms' } as CSSProperties}>
            <a className="btn primary" href="#early-access">Build your kingdom</a>
            <a className="btn ghost" href="#why">Why Ledgerlands</a>
          </div>
          <a className="scroll-cue rise" style={{ '--d': '1400ms' } as CSSProperties} href="#why">
            Scroll to fly over the kingdom
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>
          </a>
        </section>

        <section id="why" className="sky">
          <span className="eyebrow rise">Why we built it</span>
          <h2 data-split>If you can read a map, you can read your money.</h2>
          <p className="lede rise" style={{ '--d': '500ms' } as CSSProperties}>Investing shouldn&apos;t need a finance degree. So we drew your portfolio as a place you already understand.</p>
          <div className="trio rise" style={{ '--d': '700ms' } as CSSProperties}>
            <div><i className="i1"></i><b>See it, don&apos;t decode it</b><span>Taller means bigger. Glowing means up. Smoke means it slipped.</span></div>
            <div><i className="i2"></i><b>Calm, not noisy</b><span>No flashing tickers. Your kingdom changes gently, like real wealth.</span></div>
            <div><i className="i3"></i><b>A guide on call</b><span>Ask questions in plain words and get answers about your own money.</span></div>
          </div>
        </section>

        <section id="how" className="sky">
          <span className="eyebrow rise">How it works</span>
          <h2 data-split>As easy as building a castle.</h2>
          <div className="trio rise" style={{ '--d': '500ms' } as CSSProperties}>
            <div><span className="num">01</span><b>Add what you own</b><span>Search a stock, fund or coin. A building rises in its district.</span></div>
            <div><span className="num">02</span><b>Watch it grow</b><span>Buildings grow with their value. Every change tells a story.</span></div>
            <div><span className="num">03</span><b>Plan ahead</b><span>Set a goal and a mix. You&apos;ll know the moment you drift.</span></div>
          </div>
        </section>

        <section id="steward" className="sky">
          <span className="eyebrow rise">Steward · your AI guide</span>
          <h2 data-split>Ask anything. Get it in plain words.</h2>
          <div className="chat">
            <div className="bub q rise" style={{ '--d': '500ms' } as CSSProperties}>Why is my bond vault dark?</div>
            <div className="bub a rise" style={{ '--d': '1100ms' } as CSSProperties}>
              <svg width="30" height="30" viewBox="0 0 64 64" role="img" aria-label="Steward"><use href="#steward-mark"/></svg>
              <span>Your bond fund dipped a little since you added it. Bond prices usually fall when interest rates rise.<small>Example answer · guidance, not financial advice</small></span>
            </div>
          </div>
        </section>

        <section id="plan" className="sky">
          <span className="eyebrow rise">Planning</span>
          <h2 data-split>Your plan, written in the sky.</h2>
          <div className="plan rise" style={{ '--d': '500ms' } as CSSProperties}>
            <div className="ring-wrap">
              <svg width="84" height="84" viewBox="0 0 76 76" aria-hidden="true"><defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe08a"/><stop offset="1" stopColor="#f5c542"/></linearGradient></defs><circle cx="38" cy="38" r="31" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="7"></circle><circle cx="38" cy="38" r="31" fill="none" stroke="url(#ring)" strokeWidth="7" strokeLinecap="round" strokeDasharray="154 195" transform="rotate(-90 38 38)"></circle></svg>
              <span><b>79%</b>to your goal · example</span>
            </div>
            <div className="bars">
              <div><span>Stocks</span><em><b style={{ width: '24%', background: 'var(--down)' }}></b><i style={{ left: '40%' }}></i></em><span>24/40%</span></div>
              <div><span>Funds</span><em><b style={{ width: '59%', background: 'var(--down)' }}></b><i style={{ left: '40%' }}></i></em><span>59/40%</span></div>
              <div><span>Gold</span><em><b style={{ width: '17%', background: 'var(--up)' }}></b><i style={{ left: '20%' }}></i></em><span>17/20%</span></div>
            </div>
          </div>
        </section>

        <section id="early-access" className="sky">
          <span className="eyebrow rise">Opening soon</span>
          <h2 data-split>Your first building is one search away.</h2>
          <p className="lede rise" style={{ '--d': '500ms' } as CSSProperties}>Ledgerlands opens its gates soon, starting with a small group.</p>
          <div className="row rise" style={{ '--d': '700ms' } as CSSProperties}><a className="btn primary" href="#top">Back to the top</a></div>
        </section>
      </main>

      <div className="bot-launch" id="botLaunch">
        <button type="button" className="bot-btn" id="botBtn" aria-label="Chat with the Steward about early access" aria-expanded="false" aria-controls="bot">
          <svg width="62" height="62" viewBox="0 0 64 64" aria-hidden="true"><use href="#steward-mark"/></svg>
          <span className="ping" aria-hidden="true"></span>
        </button>
        <div className="bot-tease" id="botTease">Hi! Want early access to Ledgerlands?</div>
      </div>

      <section className="bot" id="bot" hidden role="dialog" aria-label="Steward chat about early access">
        <div className="bot-head">
          <svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true"><use href="#steward-mark"/></svg>
          <div><b>Steward</b><span>Here to help you get in early</span></div>
          <button type="button" className="bot-x" id="botClose" aria-label="Close chat">×</button>
        </div>
        <div className="bot-log" id="botLog" aria-live="polite"></div>
        <div className="bot-act" id="botAct"></div>
      </section>

      <footer>
        <span>© 2026 Ledgerlands</span>
        <span>Guidance and education, not financial advice.</span>
      </footer>

      <LandingEffects />
    </>
  );
}
