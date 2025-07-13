import Link from 'next/link';
import { FaRecycle, FaLeaf, FaChartLine, FaShieldAlt } from 'react-icons/fa';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 py-4">
        <div className="flex items-center space-x-2">
          <span className="text-3xl text-green-600"><FaRecycle size={32} color="#16a34a" /></span>
          <span className="text-2xl font-bold text-green-700">Waste Samaritan</span>
        </div>
        <div className="flex space-x-4">
          <Link href="/login" className="px-4 py-2 text-green-700 hover:text-green-800 font-medium transition">
            Login
          </Link>
          <Link href="/signup" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Smart Waste
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> Management</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
            Revolutionizing waste collection with AI-powered classification, real-time analytics, 
            and intelligent routing for a cleaner, more sustainable future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Get Started Free
            </Link>
            <a
              href="https://www.youtube.com/watch?v=fTPDKMaKyaU"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-green-600 text-green-600 font-semibold text-lg rounded-xl hover:bg-green-600 hover:text-white transition-all duration-300"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">
            Why Choose Waste Samaritan?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <span className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><FaRecycle size={32} color="#16a34a" /></span>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">AI Classification</h3>
              <p className="text-gray-600">
                Advanced machine learning algorithms automatically classify waste types with 95% accuracy.
              </p>
            </div>
            <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <span className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><FaChartLine size={32} color="#2563eb" /></span>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Real-time Analytics</h3>
              <p className="text-gray-600">
                Monitor collection efficiency, track trends, and optimize routes with live data insights.
              </p>
            </div>
            <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <span className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><FaLeaf size={32} color="#059669" /></span>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Eco-Friendly</h3>
              <p className="text-gray-600">
                Reduce carbon footprint with optimized collection routes and better waste segregation.
              </p>
            </div>
            <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <span className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><FaShieldAlt size={32} color="#7c3aed" /></span>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Secure & Reliable</h3>
              <p className="text-gray-600">
                Enterprise-grade security with encrypted data transmission and secure cloud storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">10K+</div>
              <div className="text-gray-600">Tons of Waste Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-600">Classification Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">500+</div>
              <div className="text-gray-600">Happy Collectors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-2xl text-green-400"><FaRecycle size={24} color="#16e34a" /></span>
            <span className="text-xl font-bold">Waste Samaritan</span>
          </div>
          <div className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Waste Samaritan. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
