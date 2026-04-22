export default function Privacy() {
  return (
    <div className="min-h-screen nc-bg px-6 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <a href="/" className="text-emerald-500 text-sm font-medium hover:underline">← Back to NetCheck</a>
        <h1 className="text-3xl font-bold text-slate-800 mt-4">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mt-2">Last updated: April 22, 2026</p>
        <div className="mt-8 space-y-6 text-slate-600 leading-relaxed">
          <p>NetCheck is designed to provide homeowner decision support tools, including sale proceeds estimates and related planning tools.</p>
          <p>We may collect anonymous product usage data such as page views, feature usage, button clicks, quiz completion, and scenario interactions to improve the product experience.</p>
          <p>When you choose to share information with us, such as emailing yourself a report or requesting follow-up, we may collect the contact details you provide.</p>
          <p>We do not sell personal information. We may use service providers to host the app, analyze usage, and deliver product functionality.</p>
          <p>NetCheck provides estimates only and does not provide legal, tax, or financial advice.</p>
          <p>If you have privacy questions, contact us at <a className="text-emerald-600 hover:underline" href="mailto:support@getnetcheck.com">support@getnetcheck.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
