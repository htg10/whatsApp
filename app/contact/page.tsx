export default function ContactUs() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif", lineHeight: 1.7, color: "#333" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Contact Us</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>We&apos;d love to hear from you</p>

      <div style={{ background: "#f9fafb", borderRadius: 12, padding: "24px 28px", marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Get in touch</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>Email</p>
            <p style={{ color: "#2563eb" }}>heltogtechnologies@gmail.com</p>
          </div>

          <div>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>Phone</p>
            <p>+91 97582 85929</p>
          </div>

          <div>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>Business hours</p>
            <p>Monday – Saturday, 10:00 AM – 7:00 PM IST</p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>Company details</h2>
      <p><strong>Heltog Technologies Pvt Ltd</strong></p>
      <p>CIN: (registered under MCA, India)</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>Support</h2>
      <p>For technical support, billing inquiries, or account issues, email us at <strong>heltogtechnologies@gmail.com</strong>. We aim to respond within 24 hours on business days.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>Feedback</h2>
      <p>Have a suggestion or feature request? We welcome your feedback. Write to us at the email above and let us know how we can improve Pizi for your business.</p>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #e5e7eb", fontSize: 14, color: "#666" }}>
        <p><a href="/about" style={{ color: "#2563eb", marginRight: 16 }}>About Us</a> <a href="/privacy" style={{ color: "#2563eb", marginRight: 16 }}>Privacy Policy</a> <a href="/terms" style={{ color: "#2563eb", marginRight: 16 }}>Terms</a> <a href="/pricing-policy" style={{ color: "#2563eb" }}>Pricing</a></p>
      </div>
    </div>
  );
}
