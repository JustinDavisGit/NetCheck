export default function Terms() {
  return (
    <div className="min-h-screen nc-bg px-6 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <a href="/" className="text-emerald-500 text-sm font-medium hover:underline">← Back to NetCheck</a>
        <h1 className="text-3xl font-bold text-slate-800 mt-4">Terms of Use</h1>
        <p className="text-sm text-slate-500 mt-2">Last updated: April 22, 2026</p>
        <div className="mt-8 space-y-6 text-slate-600 leading-relaxed">
          <p>NetCheck provides estimated calculations and educational decision-support tools for homeowners.</p>
          <p>All numbers are estimates only and may differ from actual closing statements, tax outcomes, lender figures, title fees, and market conditions.</p>
          <p>You should consult licensed real estate, legal, tax, title, and financial professionals before making significant decisions.</p>
          <p>Use of NetCheck is at your own risk. We make no guarantees regarding completeness, accuracy, or fitness for a particular purpose.</p>
          <p>By using NetCheck, you agree not to misuse the service, interfere with the platform, or rely on it as a substitute for professional advice.</p>
          <p>If you have questions, contact <a className="text-emerald-600 hover:underline" href="mailto:support@getnetcheck.com">support@getnetcheck.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
