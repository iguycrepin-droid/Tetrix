import { useNavigate } from 'react-router-dom'

const LAST_UPDATED = 'May 2026'
const CONTACT_EMAIL = 'tigersoulfx@gmail.com' // replace with your email
const APP_NAME = 'TETRIX'
const COMPANY = 'TigerSoulFX' // replace with your name or company

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700,
        color: '#c084fc', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase',
      }}>{title}</div>
      <div style={{ fontSize: 13, color: 'rgba(180,140,255,0.75)', lineHeight: 1.9 }}>
        {children}
      </div>
    </div>
  )
}

export function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh', padding: '20px 16px 40px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(120,80,255,0.07) 0%, transparent 60%)',
      maxWidth: 600, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: 'rgba(180,140,255,0.6)',
          fontFamily: "'Orbitron',sans-serif", fontSize: 11, cursor: 'pointer', letterSpacing: 1,
        }}>← BACK</button>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: '#c084fc', letterSpacing: 2 }}>
          PRIVACY POLICY
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(120,80,255,0.2)',
        borderRadius: 12, padding: '24px 20px',
      }}>
        <p style={{ fontSize: 11, color: 'rgba(180,140,255,0.4)', marginBottom: 24, letterSpacing: 1 }}>
          Last updated: {LAST_UPDATED}
        </p>

        <Section title="1. Introduction">
          {APP_NAME} ("we", "our", or "us"), operated by {COMPANY}, respects your privacy.
          This Privacy Policy explains how we collect, use, and protect your information when
          you use the {APP_NAME} mobile game and related services.
          <br /><br />
          By using {APP_NAME}, you agree to the collection and use of information in accordance
          with this policy.
        </Section>

        <Section title="2. Information We Collect">
          <strong style={{ color: '#e0e0ff' }}>Information you provide:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Email address (for account registration)</li>
            <li>Username (chosen by you)</li>
            <li>Google account information (if you use Google Sign-In)</li>
          </ul>
          <br />
          <strong style={{ color: '#e0e0ff' }}>Information collected automatically:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Game scores, levels reached, and lines cleared</li>
            <li>Gameplay duration and session data</li>
            <li>Device type and operating system version</li>
            <li>In-app purchase records</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          We use collected information to:
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Provide and operate the game and leaderboard</li>
            <li>Authenticate your account and sync data across devices</li>
            <li>Process and verify in-app purchases</li>
            <li>Display personalised advertisements (with your consent)</li>
            <li>Improve game performance and fix bugs</li>
            <li>Respond to support requests</li>
          </ul>
        </Section>

        <Section title="4. Third-Party Services">
          {APP_NAME} uses the following third-party services, each with their own privacy policies:
          <br /><br />
          <strong style={{ color: '#e0e0ff' }}>Supabase</strong> — Authentication and database hosting.
          Data is stored on servers in the EU/US. Privacy policy: supabase.com/privacy
          <br /><br />
          <strong style={{ color: '#e0e0ff' }}>Google AdMob</strong> — Advertising network (shown with your consent).
          May collect advertising ID and usage data. Privacy policy: policies.google.com/privacy
          <br /><br />
          <strong style={{ color: '#e0e0ff' }}>Google Play</strong> — App distribution and in-app billing.
          Privacy policy: policies.google.com/privacy
          <br /><br />
          <strong style={{ color: '#e0e0ff' }}>Google Sign-In</strong> — Optional authentication.
          Only your name and email are accessed. Privacy policy: policies.google.com/privacy
        </Section>

        <Section title="5. Advertising">
          With your consent, we show advertisements via Google AdMob. AdMob may use your
          advertising ID to show personalised ads. You can opt out of personalised ads at any
          time through your device settings (Google Settings → Ads → Opt out of Ads Personalisation).
          <br /><br />
          You can permanently remove all ads by purchasing "Remove Ads" from the in-app store.
        </Section>

        <Section title="6. Data Retention">
          We retain your account data for as long as your account is active. Game scores and
          leaderboard entries are kept indefinitely to maintain the competitive leaderboard.
          You may request deletion of your account and all associated data at any time by
          contacting us at {CONTACT_EMAIL}.
        </Section>

        <Section title="7. Your Rights (GDPR)">
          If you are in the European Economic Area (EEA), you have the right to:
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data ("right to be forgotten")</li>
            <li>Object to processing of your data</li>
            <li>Withdraw consent at any time</li>
            <li>Lodge a complaint with your local data protection authority</li>
          </ul>
          <br />
          To exercise these rights, contact us at {CONTACT_EMAIL}.
        </Section>

        <Section title="8. Children's Privacy">
          {APP_NAME} is not directed at children under 13. We do not knowingly collect personal
          information from children under 13. If you believe a child has provided us with
          personal information, please contact us and we will delete it.
        </Section>

        <Section title="9. Data Security">
          We implement appropriate technical and organisational measures to protect your
          information, including encrypted database storage, secure HTTPS connections, and
          Row-Level Security policies in our database. No method of transmission over the
          internet is 100% secure; we cannot guarantee absolute security.
        </Section>

        <Section title="10. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of significant
          changes by updating the "Last updated" date at the top of this page. Continued use
          of {APP_NAME} after changes constitutes acceptance of the revised policy.
        </Section>

        <Section title="11. California Privacy Rights (CCPA)">
          If you are a California resident, you have the following rights under the California
          Consumer Privacy Act (CCPA):
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>The right to know what personal information we collect, use, disclose, and sell</li>
            <li>The right to request deletion of your personal information</li>
            <li>The right to opt out of the "sale" of your personal information</li>
            <li>The right to non-discrimination for exercising your CCPA rights</li>
          </ul>
          <br />
          <strong style={{ color: '#e0e0ff' }}>Do Not Sell My Personal Information:</strong>{' '}
          TETRIX does not sell your personal information. However, our advertising partner Google AdMob
          may share data with third parties for advertising purposes, which may be considered a "sale"
          under CCPA. You can opt out by visiting{' '}
          <span style={{ color: '#c084fc' }}>Settings → Manage Privacy Consent</span> and selecting
          "Essential Only", or through your device's Google Settings → Ads → Opt out of Ads
          Personalisation.
          <br /><br />
          To exercise any of your rights, contact us at {CONTACT_EMAIL}.
        </Section>

        <Section title="12. Contact Us">
          If you have questions about this Privacy Policy, please contact us at:
          <br /><br />
          📧 {CONTACT_EMAIL}
          <br />
          {COMPANY}
        </Section>
      </div>
    </div>
  )
}
