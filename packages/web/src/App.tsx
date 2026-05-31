import { Route, Routes } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import { SeoBar } from "./components/SeoBar";
import { Playground } from "./components/Playground";
import { PrivacyPage, TermsPage } from "./pages/Legal";
import type { ExportTarget } from "@grokparse/core";

function HomePage() {
  return (
    <>
      <TopBar />
      <SeoBar />
      <Playground />
      <footer className="site-footer">
        <nav>
          <a href="/privacy">Privacy Policy</a>
          <span aria-hidden="true">·</span>
          <a href="/terms">Terms and Conditions</a>
        </nav>
      </footer>
    </>
  );
}

function SeoRoute({
  exportDefault,
}: {
  exportDefault?: ExportTarget;
}) {
  return (
    <>
      <TopBar />
      <SeoBar />
      <Playground defaultExport={exportDefault} />
      <footer className="site-footer">
        <nav>
          <a href="/privacy">Privacy Policy</a>
          <span aria-hidden="true">·</span>
          <a href="/terms">Terms and Conditions</a>
        </nav>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/grok-debugger" element={<SeoRoute />} />
      <Route path="/logstash-grok-tester" element={<SeoRoute />} />
      <Route path="/grok-to-vector" element={<SeoRoute exportDefault="vector" />} />
      <Route path="/grok-to-fluentbit" element={<SeoRoute exportDefault="fluentbit" />} />
      <Route path="/grok-pattern-library" element={<SeoRoute />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
    </Routes>
  );
}
