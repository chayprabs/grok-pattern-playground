import { Link } from "react-router-dom";
import { TopBar } from "../components/TopBar";

export function PrivacyPage() {
  return (
    <div className="legal-page">
      <TopBar />
      <article className="legal-content">
        <h1>Privacy Policy</h1>
        <p>Last updated: May 31, 2026</p>
        <p>
          GrokParse (“we”, “the tool”) is a browser-only application. Your log
          samples, grok patterns, and custom pattern definitions are processed
          entirely on your device. We do not operate a backend that receives,
          stores, or analyzes your input.
        </p>
        <h2>Data we do not collect</h2>
        <ul>
          <li>Log lines, patterns, or match results from your session</li>
          <li>Filenames or file contents you paste into the editor</li>
          <li>Personal identifiers beyond what your browser sends to static hosting (if any)</li>
        </ul>
        <h2>Local storage</h2>
        <p>
          Custom grok patterns may be saved in your browser’s localStorage on
          your device only. You can clear them with the “Clear custom patterns”
          control in the app.
        </p>
        <h2>Third-party links</h2>
        <p>
          The header may link to GitHub, social media, or the author’s personal
          site. Those destinations have their own privacy policies.
        </p>
        <h2>Disclaimer</h2>
        <p>
          THE TOOL IS PROVIDED “AS IS” WITHOUT WARRANTY OF ANY KIND. USE AT YOUR
          OWN RISK. WE ARE NOT LIABLE FOR ANY DAMAGES ARISING FROM USE OF THIS
          SOFTWARE, INCLUDING BUT NOT LIMITED TO DATA LOSS, SERVICE INTERRUPTION,
          OR PARSING ERRORS IN PRODUCTION PIPELINES.
        </p>
        <p>
          <Link to="/">← Back to GrokParse</Link>
        </p>
      </article>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="legal-page">
      <TopBar />
      <article className="legal-content">
        <h1>Terms and Conditions</h1>
        <p>Last updated: May 31, 2026</p>
        <p>
          By using GrokParse you agree to these terms. If you do not agree, do
          not use the tool.
        </p>
        <h2>License</h2>
        <p>
          GrokParse is open source under the MIT License. See the repository for
          full license text.
        </p>
        <h2>Acceptable use</h2>
        <p>
          You may use the tool for lawful purposes only. You are responsible for
          ensuring that log data you paste complies with your organization’s
          policies and applicable law.
        </p>
        <h2>No professional advice</h2>
        <p>
          Outputs (including ReDoS warnings and export configs) are for
          development and testing only. They are not guaranteed to be correct,
          secure, or suitable for production. Always validate patterns in your
          own environment before deployment.
        </p>
        <h2>Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE AUTHORS AND CONTRIBUTORS
          SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR
          GOODWILL, ARISING FROM YOUR USE OF GROKPARSE, EVEN IF ADVISED OF THE
          POSSIBILITY OF SUCH DAMAGES.
        </p>
        <h2>Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless the project contributors from
          claims arising from your use of the tool or violation of these terms.
        </p>
        <h2>Changes</h2>
        <p>
          We may update these terms. Continued use after changes constitutes
          acceptance.
        </p>
        <p>
          <Link to="/">← Back to GrokParse</Link>
        </p>
      </article>
    </div>
  );
}
