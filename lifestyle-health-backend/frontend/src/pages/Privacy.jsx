import { Link } from 'react-router-dom';

function Privacy() {
    return (
        <div className="auth-page">
            <main className="auth-panel">
                <article className="auth-card">
                    <div className="eyebrow">Privacy policy</div>
                    <h2>Your health data belongs to you.</h2>
                    <p>HealthSync AI uses your profile and daily check-ins only to provide your requested health-risk assessment and history.</p>
                    <div className="privacy-copy">
                        <h3>What we store</h3>
                        <p>Profile details, lifestyle check-ins, risk scores, and account details. Passwords are stored as hashes, never plain text.</p>
                        <h3>Who can access it</h3>
                        <p>Your records are returned only to your authenticated account. We do not expose health values in audit logs.</p>
                        <h3>How long we keep it</h3>
                        <p>Account and health data remain until you export or delete your account. Security audit records expire after two years.</p>
                        <h3>Your controls</h3>
                        <p>You can export your records or permanently delete your account from your Profile page at any time.</p>
                    </div>
                    <Link className="auth-footer" to="/login">Return to sign in</Link>
                </article>
            </main>
        </div>
    );
}

export default Privacy;
