import { Link } from "react-router-dom";
import { TopBar } from "../components/TopBar";

const LAST_UPDATED = "June 1, 2026";
const OPERATOR = "Chaitanya Prabuddha";

function LegalFooter() {
  return (
    <p className="legal-footer-links">
      <Link to="/">← Back to GrokParse</Link>
      {" · "}
      <a
        href="https://github.com/chayprabs/grok-pattern-playground/blob/main/docs/legal/TERMS.md"
        target="_blank"
        rel="noopener noreferrer"
      >
        View on GitHub
      </a>
    </p>
  );
}

export function PrivacyPage() {
  return (
    <div className="legal-page">
      <TopBar />
      <article className="legal-content">
        <h1>Privacy Policy</h1>
        <p>
          <strong>Last updated:</strong> {LAST_UPDATED} · <strong>Operator:</strong>{" "}
          {OPERATOR}
        </p>

        <h2>1. Scope</h2>
        <p>
          This policy describes GrokParse (“the Service”). The Service is{" "}
          <strong>browser-only</strong>: after the initial page load, your log samples,
          grok patterns, and match results are processed on your device. We do not
          operate a backend that receives, stores, or analyzes your log content.
        </p>

        <h2>2. What we do not collect</h2>
        <p>We do not intentionally collect, receive, or store:</p>
        <ul>
          <li>Log lines, patterns, corpora, or match results from the editor</li>
          <li>Filenames or file contents you paste into the browser</li>
          <li>Custom patterns (except locally on your device — see below)</li>
        </ul>
        <p>We do not sell personal information or use your inputs for advertising or model training.</p>

        <h2>3. Local storage</h2>
        <p>
          Custom patterns may be saved in your browser’s localStorage on your device
          only. Use “Clear custom patterns” or clear site data in your browser to
          remove them. You are responsible for data on devices you control.
        </p>

        <h2>4. Third-party hosting</h2>
        <p>
          Static hosts (e.g. GitHub Pages) may log IP address, user agent, and request
          metadata to deliver files. We do not receive your log content from those logs.
          Third-party sites linked in the header have their own policies.
        </p>

        <h2>5. Communications you send us</h2>
        <p>
          If you contact us via GitHub or email, we receive what you voluntarily send.
          Do not include confidential production logs unless necessary.
        </p>

        <h2>6. Children</h2>
        <p>
          The Service is not directed at children under 16. We do not knowingly collect
          children’s personal information.
        </p>

        <h2>7. International users</h2>
        <p>
          The Service may be used worldwide. Core tool inputs are not transferred to us.
          Rights regarding hosting logs or voluntary messages may apply under local law —
          contact us to exercise them where required.
        </p>

        <h2>8. Security and retention</h2>
        <p>
          No transmission method is 100% secure. We do not retain in-browser log content
          on our servers. See{" "}
          <a
            href="https://github.com/chayprabs/grok-pattern-playground/blob/main/SECURITY.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            SECURITY.md
          </a>{" "}
          for vulnerability reporting.
        </p>

        <h2>9. Changes</h2>
        <p>
          We may update this policy. Continued use after changes constitutes acceptance
          where permitted by law.
        </p>

        <h2>10. Relationship to Terms</h2>
        <p>
          Use of GrokParse is also governed by our{" "}
          <Link to="/terms">Terms and Conditions</Link>, including disclaimers and
          limitations of liability. Nothing in this policy expands our liability.
        </p>

        <p className="legal-notice">
          This policy is not legal advice. For organizational compliance, consult
          qualified counsel in your jurisdiction.
        </p>

        <LegalFooter />
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
        <p>
          <strong>Last updated:</strong> {LAST_UPDATED} · <strong>Operator:</strong>{" "}
          {OPERATOR}
        </p>

        <p className="legal-accept">
          <strong>
            By using GrokParse you agree to these Terms. If you do not agree, do not use
            the Service.
          </strong>
        </p>

        <h2>1. The Service</h2>
        <p>
          GrokParse is a free browser-based grok pattern playground for development and
          testing. Features include matching, field inference, ReDoS warnings,
          benchmarks, and exports. Outputs may be incorrect — validate before production.
        </p>

        <h2>2. License</h2>
        <p>
          Source code is under the{" "}
          <a
            href="https://github.com/chayprabs/grok-pattern-playground/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT License
          </a>
          . These Terms govern the hosted website and Service in addition to the license.
        </p>

        <h2>3. No professional advice</h2>
        <p>
          We do not provide legal, security, or compliance advice. Do not rely on match
          results, ReDoS warnings, or exported configs as the sole basis for production
          or regulatory decisions.
        </p>

        <h2>4. Your responsibilities</h2>
        <ul>
          <li>Use the Service lawfully and only with data you have the right to process</li>
          <li>Comply with applicable privacy, employment, and contractual obligations</li>
          <li>Independently validate all patterns and exports before deployment</li>
          <li>Do not misuse, attack, or disrupt the Service or its hosting</li>
        </ul>

        <h2>5. Disclaimer of warranties</h2>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED “AS
          IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
          INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT,
          AND ACCURACY. We do not warrant uninterrupted, secure, or error-free operation.
        </p>

        <h2>6. Limitation of liability</h2>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE OPERATOR AND
          CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
          REVENUE, DATA, GOODWILL, BUSINESS INTERRUPTION, SECURITY INCIDENTS, OR
          REGULATORY FINES, ARISING FROM USE OF THE SERVICE, WHETHER IN CONTRACT, TORT
          (INCLUDING NEGLIGENCE), OR OTHERWISE, EVEN IF ADVISED OF THE POSSIBILITY.
        </p>
        <p>
          OUR TOTAL LIABILITY FOR ALL CLAIMS SHALL NOT EXCEED THE GREATER OF USD $0 OR
          AMOUNTS YOU PAID US IN THE PRIOR 12 MONTHS (zero for the free Service). Some
          jurisdictions limit these exclusions; they apply to the maximum extent permitted.
        </p>

        <h2>7. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless the Operator and contributors
          from claims, damages, and expenses (including reasonable legal fees) arising
          from your use of the Service, your data, your exports, or your violation of
          these Terms or applicable law.
        </p>

        <h2>8. Assumption of risk</h2>
        <p>
          You assume all risks of use, including incorrect parsing, production ReDoS,
          data loss, and self-hosting security. To the extent permitted by law, you
          release the Operator from related claims except where release is prohibited.
        </p>

        <h2>9. Privacy and third parties</h2>
        <p>
          See our <Link to="/privacy">Privacy Policy</Link>. Third-party links and
          hosting are subject to their own terms. We are not responsible for third-party
          practices.
        </p>

        <h2>10. Changes and termination</h2>
        <p>
          We may modify or discontinue the Service at any time. Updated Terms are
          effective when posted. Continued use constitutes acceptance where permitted.
          Provisions that should survive (disclaimers, liability limits, indemnity,
          governing law) survive termination.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These Terms are governed by the laws of <strong>India</strong>, without regard
          to conflict-of-law rules. Subject to mandatory consumer rights in your country,
          courts in <strong>Bengaluru, Karnataka, India</strong> have exclusive
          jurisdiction. Contact us first to attempt informal resolution for 30 days.
        </p>

        <h2>12. Class actions</h2>
        <p>
          Where permitted by law, disputes are brought only in your individual capacity,
          not as a class or representative action.
        </p>

        <h2>13. Important notice</h2>
        <p>
          No legal document can guarantee that you will never face claims anywhere in
          the world. These Terms allocate risk to the extent permitted by law. Consult
          qualified counsel for your situation.
        </p>

        <LegalFooter />
      </article>
    </div>
  );
}
