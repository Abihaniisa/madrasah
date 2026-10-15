import { CONFIG } from "../lib/config";
import { PublicLayout, I } from "../components/Layout";

export default function Builder() {
  const b = CONFIG.builder;
  const initials = (b.fullName ?? b.name).split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <PublicLayout>
      <section className="section">
        <div className="wrap-narrow">
          <div className="section-head">
            <span className="eyebrow">Built by</span>
            <h1 className="d1">{b.fullName ?? b.name}</h1>
            <p className="lede">{b.role}</p>
          </div>

          <div className="card pad-lg">
            <div style={{ display: "flex", gap: 22, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div className="pav builder-avatar">{initials}</div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 6 }}>
                  {b.bio}
                </p>
                <p className="sub" style={{ marginBottom: 16 }}>
                  Registration {b.regNo} · Madrasatus Sahaba Li Tahfizul Qur'an
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a className="btn btn-wa" href={`https://wa.me/${b.phone}?text=${encodeURIComponent("As-salamu alaykum Abihani. I saw the Madrasatus Sahaba website you built and I would like to discuss a project.")}`} target="_blank" rel="noopener noreferrer">
                    {I.whatsapp} WhatsApp
                  </a>
                  <a className="btn btn-secondary" href={`mailto:${b.email}`}>{b.email}</a>
                  <a className="btn btn-ghost" href={b.site} target="_blank" rel="noopener noreferrer">
                    {b.site.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="card pad mt4">
            <span className="eyebrow">Available</span>
            <p className="sub" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>
              This system is reusable. If you run a school and want a similar portal, message on WhatsApp.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
