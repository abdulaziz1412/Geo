import WaitlistForm from "./WaitlistForm";
import LangSwitcher from "./LangSwitcher";
import { getLocale, getDict } from "@/lib/i18n";

export default async function Home() {
  const locale = await getLocale();
  const t = getDict(locale);
  return (
    <main>
      <header className="nav">
        <div className="wrap nav-in">
          <span className="brand font-display">{t.brand}</span>
          <nav className="nav-links">
            <a href="#how">{t.nav.how}</a>
            <a href="#features">{t.nav.features}</a>
            <a href="/pricing">{t.nav.pricing}</a>
            <a href="/login">{t.nav.login}</a>
            <a href="/signup" className="btn btn-primary btn-sm">{t.nav.signup}</a>
            <LangSwitcher label={t.langLabel} />
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <span className="eyebrow">{t.hero.eyebrow}</span>
            <h1 className="font-display hero-title">
              {t.hero.titleA} <span className="mark">{t.hero.titleMark}</span>
            </h1>
            <p className="hero-sub">{t.hero.sub}</p>
            <div id="cta" className="hero-form">
              <WaitlistForm t={t.waitlist} />
            </div>
          </div>

          <aside className="answer" aria-hidden="true">
            <div className="answer-head">
              <span className="dot" />
              <span>{t.answer.head}</span>
            </div>
            <p className="answer-q">{t.answer.q}</p>
            <div className="answer-body">
              {t.answer.bodyA} <span className="mark">{t.answer.bodyMark}</span> {t.answer.bodyB}
            </div>
            <div className="answer-cite">
              <span className="cite-chip">{t.answer.cite}</span>
            </div>
          </aside>
        </div>

        <div className="wrap engines">
          <span className="engines-label">{t.engines.label}</span>
          <ul className="engines-list">
            <li>ChatGPT</li>
            <li>Perplexity</li>
            <li>Gemini</li>
            <li>AI Overviews</li>
            <li className="ar-engine">{t.engines.ar}</li>
          </ul>
        </div>
      </section>

      <section id="how" className="section">
        <div className="wrap">
          <span className="kicker">{t.how.kicker}</span>
          <h2 className="font-display section-title">{t.how.title}</h2>
          <ol className="steps">
            <li className="step">
              <span className="step-n">{t.how.n1}</span>
              <h3>{t.how.s1h}</h3>
              <p>{t.how.s1p}</p>
            </li>
            <li className="step">
              <span className="step-n">{t.how.n2}</span>
              <h3>{t.how.s2h}</h3>
              <p>{t.how.s2p}</p>
            </li>
            <li className="step">
              <span className="step-n">{t.how.n3}</span>
              <h3>{t.how.s3h}</h3>
              <p>{t.how.s3p}</p>
            </li>
          </ol>
        </div>
      </section>

      <section id="features" className="section section-alt">
        <div className="wrap">
          <span className="kicker">{t.features.kicker}</span>
          <h2 className="font-display section-title">{t.features.title}</h2>
          <div className="features">
            <div className="feature"><h3>{t.features.f1h}</h3><p>{t.features.f1p}</p></div>
            <div className="feature"><h3>{t.features.f2h}</h3><p>{t.features.f2p}</p></div>
            <div className="feature"><h3>{t.features.f3h}</h3><p>{t.features.f3p}</p></div>
            <div className="feature"><h3>{t.features.f4h}</h3><p>{t.features.f4p}</p></div>
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="wrap closing-in">
          <h2 className="font-display closing-title">{t.closing.title}</h2>
          <p className="closing-sub">{t.closing.sub}</p>
          <a href="#cta" className="btn btn-primary btn-lg">{t.closing.cta}</a>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap foot-in">
          <span className="brand font-display">{t.brand}</span>
          <nav className="foot-links">
            <a href="/privacy">{t.foot.privacy}</a> <a href="/terms">{t.foot.terms}</a> <a href="/refund">{t.foot.refund}</a> <a href="/contact">{t.foot.contact}</a>
          </nav>
          <span className="foot-note">{t.foot.note}</span>
        </div>
      </footer>
    </main>
  );
}
