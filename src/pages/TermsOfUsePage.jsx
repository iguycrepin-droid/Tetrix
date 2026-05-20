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

export function TermsOfUsePage() {
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
          TERMS OF USE
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(120,80,255,0.2)',
        borderRadius: 12, padding: '24px 20px',
      }}>
        <p style={{ fontSize: 11, color: 'rgba(180,140,255,0.4)', marginBottom: 24, letterSpacing: 1 }}>
          Last updated: {LAST_UPDATED}
        </p>

        <Section title="1. Acceptance of Terms">
          By downloading, installing, or playing {APP_NAME}, you agree to be bound by these
          Terms of Use. If you do not agree, do not use the app. These terms constitute a
          legally binding agreement between you and {COMPANY}.
        </Section>

        <Section title="2. Licence to Use">
          We grant you a limited, non-exclusive, non-transferable, revocable licence to use
          {APP_NAME} for personal, non-commercial purposes on your personal device, subject
          to these Terms. You may not copy, modify, distribute, sell, or lease any part of
          the app or its content.
        </Section>

        <Section title="3. User Accounts">
          You may create an account to access features such as leaderboards and score saving.
          You are responsible for:
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activity that occurs under your account</li>
            <li>Providing accurate and current information</li>
            <li>Notifying us immediately of any unauthorised account access</li>
          </ul>
          <br />
          We reserve the right to suspend or terminate accounts that violate these Terms.
        </Section>

        <Section title="4. In-App Purchases">
          {APP_NAME} offers optional in-app purchases, including "Remove Ads."
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>All purchases are processed through Google Play and subject to Google Play's terms</li>
            <li>Purchases are non-refundable except as required by applicable law</li>
            <li>"Remove Ads" is a one-time purchase tied to your Google Play account</li>
            <li>Purchases can be restored on new devices by logging in with the same account</li>
            <li>We reserve the right to modify pricing with reasonable notice</li>
          </ul>
        </Section>

        <Section title="5. Acceptable Use">
          You agree not to:
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Use cheats, exploits, automation software, bots, or hacks</li>
            <li>Manipulate scores or leaderboard rankings through unfair means</li>
            <li>Attempt to reverse-engineer or decompile the app</li>
            <li>Use the app for any commercial purpose</li>
            <li>Create multiple accounts to gain unfair leaderboard advantage</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
          <br />
          Violations may result in account suspension and removal from leaderboards without notice.
        </Section>

        <Section title="6. Leaderboard">
          The global leaderboard is a shared competitive feature. We reserve the right to:
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Remove scores we reasonably believe were obtained by cheating</li>
            <li>Reset the weekly leaderboard on a regular schedule</li>
            <li>Modify, suspend, or discontinue the leaderboard at any time</li>
          </ul>
          Leaderboard participation does not create any contractual obligation on our part.
        </Section>

        <Section title="7. Intellectual Property">
          {APP_NAME}, including its name, logo, game mechanics, graphics, sounds, and code,
          is the intellectual property of {COMPANY}. All rights are reserved.
          <br /><br />
          User-generated content (username, avatar choice) remains yours. By creating a username
          you grant us a non-exclusive licence to display it within the app and leaderboard.
        </Section>

        <Section title="8. Disclaimers">
          {APP_NAME} is provided "as is" without warranties of any kind, express or implied.
          We do not guarantee that the app will be uninterrupted, error-free, or that defects
          will be corrected. We are not liable for any loss of data, scores, or progress.
          <br /><br />
          Virtual in-game currency, scores, and items have no real-world monetary value and
          cannot be exchanged for cash.
        </Section>

        <Section title="9. Limitation of Liability">
          To the maximum extent permitted by law, {COMPANY} shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages arising from your
          use of, or inability to use, {APP_NAME}. Our total liability shall not exceed the
          amount you paid for in-app purchases in the 12 months preceding the claim.
        </Section>

        <Section title="10. Termination">
          We reserve the right to terminate or suspend your access to {APP_NAME} at any time,
          with or without cause, with or without notice. Upon termination, your licence to use
          the app immediately ceases. Provisions relating to intellectual property, disclaimers,
          and limitation of liability shall survive termination.
        </Section>

        <Section title="11. Governing Law">
          These Terms are governed by and construed in accordance with the laws of the
          jurisdiction in which {COMPANY} is registered, without regard to its conflict of
          law provisions. You consent to the exclusive jurisdiction of the courts in that
          jurisdiction.
        </Section>

        <Section title="12. Changes to Terms">
          We may update these Terms from time to time. Continued use of {APP_NAME} after
          changes constitutes your acceptance of the revised Terms. We will update the
          "Last updated" date when changes are made.
        </Section>

        <Section title="13. Contact Us">
          For questions about these Terms, please contact us at:
          <br /><br />
          📧 {CONTACT_EMAIL}
          <br />
          {COMPANY}
        </Section>
      </div>
    </div>
  )
}
