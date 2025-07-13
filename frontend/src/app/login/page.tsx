import LoginForm from '../../components/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
      <div className="max-w-md w-full px-6 py-10 bg-white/90 rounded-xl shadow-lg flex flex-col items-center">
        <h2 className="text-2xl font-bold text-green-700 mb-6">Login to Waste Samaritin</h2>
        <LoginForm />
      </div>
    </main>
  );
} 