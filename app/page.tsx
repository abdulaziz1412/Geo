import WaitlistForm from "./WaitlistForm";

export default function Home() {
  return (
    <main>
      <header className="nav">
        <div className="wrap nav-in">
          <span className="brand font-display">ذِكر</span>
          <nav className="nav-links">
            <a href="#how">كيف يعمل</a>
            <a href="#features">المزايا</a>
            <a href="#cta" className="btn btn-ghost btn-sm">التقرير المجاني</a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <span className="eyebrow">تحسين الظهور في محرّكات الذكاء الاصطناعي</span>
            <h1 className="font-display hero-title">
              اجعل علامتك التجارية هي <span className="mark">الإجابة</span>
            </h1>
            <p className="hero-sub">
              عملاؤك صاروا يسألون ChatGPT وPerplexity وGemini بدل البحث في جوجل. ذِكر
              يقيس ظهور علامتك داخل إجاباتها بالعربية، ويُريك بالضبط كيف تصبح الاسم
              الذي تُوصي به.
            </p>
            <div id="cta" className="hero-form">
              <WaitlistForm />
            </div>
          </div>

          <aside className="answer" aria-hidden="true">
            <div className="answer-head">
              <span className="dot" />
              <span>إجابة الذكاء الاصطناعي</span>
            </div>
            <p className="answer-q">«ما أفضل شركة تأمين سيارات في السعودية؟»</p>
            <div className="answer-body">
              من بين الخيارات الموثوقة، تبرز <span className="mark">شركتك</span> بتقييمات
              مرتفعة وتغطية مرنة وأسعار تنافسية، إضافةً إلى…
            </div>
            <div className="answer-cite">
              <span className="cite-chip">١ مصدر: yourbrand.com</span>
            </div>
          </aside>
        </div>

        <div className="wrap engines">
          <span className="engines-label">نراقب ظهورك في:</span>
          <ul className="engines-list">
            <li>ChatGPT</li>
            <li>Perplexity</li>
            <li>Gemini</li>
            <li>AI Overviews</li>
            <li className="ar-engine">Jais · النماذج العربية</li>
          </ul>
        </div>
      </section>

      <section id="how" className="section">
        <div className="wrap">
          <span className="kicker">كيف يعمل</span>
          <h2 className="font-display section-title">من «غير ظاهر» إلى «الإجابة المُوصى بها»</h2>
          <ol className="steps">
            <li className="step">
              <span className="step-n">١</span>
              <h3>نقيس ظهورك</h3>
              <p>نسأل المحرّكات أسئلة عملائك الحقيقية، ونرصد متى تُذكر علامتك ومتى تُذكر المنافسة.</p>
            </li>
            <li className="step">
              <span className="step-n">٢</span>
              <h3>نشخّص الفجوة</h3>
              <p>نُظهر حصّتك من الإجابات مقابل المنافسين، والمصادر التي تستشهد بها المحرّكات.</p>
            </li>
            <li className="step">
              <span className="step-n">٣</span>
              <h3>نرفع حضورك</h3>
              <p>نقترح ونصيغ المحتوى العربي الذي يجعل المحرّكات تذكرك وتستشهد بموقعك.</p>
            </li>
          </ol>
        </div>
      </section>

      <section id="features" className="section section-alt">
        <div className="wrap">
          <span className="kicker">المزايا</span>
          <h2 className="font-display section-title">مبنيٌّ للسوق العربي، لا مترجَمٌ إليه</h2>
          <div className="features">
            <div className="feature">
              <h3>عربيٌّ أولاً</h3>
              <p>نفهم اللهجات وصياغة الأسئلة كما يكتبها عملاؤك فعلاً، لا ترجمة حرفية.</p>
            </div>
            <div className="feature">
              <h3>كل المحرّكات في مكانٍ واحد</h3>
              <p>تتبّعٌ موحّد عبر ChatGPT وPerplexity وGemini ونتائج جوجل التوليدية.</p>
            </div>
            <div className="feature">
              <h3>حصّتك من الصوت</h3>
              <p>اعرف نسبة ظهورك مقابل كل منافس، وتابع تغيّرها أسبوعاً بأسبوع.</p>
            </div>
            <div className="feature">
              <h3>النماذج الإقليمية</h3>
              <p>نراقب نماذج عربية مثل Jais وFalcon التي تتجاهلها الأدوات العالمية.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="wrap closing-in">
          <h2 className="font-display closing-title">اعرف ظهورك اليوم — مجاناً</h2>
          <p className="closing-sub">سنحلّل علامتك عبر المحرّكات ونرسل لك تقريراً واضحاً بأول الخطوات.</p>
          <a href="#cta" className="btn btn-primary btn-lg">احصل على تقريري المجاني</a>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap foot-in">
          <span className="brand font-display">ذِكر</span>
          <nav className="foot-links"><a href="/privacy">سياسة الخصوصية</a> <a href="/terms">الشروط والأحكام</a> <a href="/refund">الاسترجاع والاستبدال</a> <a href="/contact">اتصل بنا</a></nav>
          <span className="foot-note">© ٢٠٢٦ ذِكر — تحسين الظهور في محرّكات الذكاء الاصطناعي</span>
        </div>
      </footer>
    </main>
  );
}
