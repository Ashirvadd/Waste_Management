import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
      <div className="max-w-xl w-full px-6 py-12 bg-white/80 rounded-xl shadow-lg flex flex-col items-center">
        <h1 className="text-4xl font-bold text-green-700 mb-4 text-center">Waste Samaritin</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          AI-powered waste management for a cleaner, smarter city.<br />
          Classify, analyze, and manage waste efficiently with our full-stack platform.
        </p>
        <Link
          href="/login"
          className="px-8 py-3 rounded-lg bg-green-600 text-white font-semibold text-lg shadow hover:bg-green-700 transition"
        >
          Login
        </Link>
      </div>
      <footer className="mt-12 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Waste Samaritin. All rights reserved.
      </footer>
    </main>
  );
}
