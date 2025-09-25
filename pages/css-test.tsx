export default function CSSTest() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="max-w-md mx-auto p-8">
        <h1 className="text-4xl font-bold text-white mb-8">CSS Test Page</h1>

        {/* Test basic Tailwind */}
        <div className="bg-blue-500 text-white p-4 rounded-lg mb-4">
          Basic Tailwind Blue Box
        </div>

        {/* Test backdrop blur */}
        <div className="backdrop-blur-md bg-white/10 p-4 rounded-lg mb-4 text-white">
          Backdrop Blur Test
        </div>

        {/* Test gradient */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mb-4">
          Gradient Test
        </div>

        {/* Test custom CSS classes */}
        <div className="glass p-4 rounded-lg mb-4 text-white">
          Custom Glass Effect
        </div>

        <div className="gradient-text text-2xl font-bold mb-4">
          Custom Gradient Text
        </div>

        <div className="btn-ai-primary inline-block px-6 py-3 rounded-lg">
          Custom AI Button
        </div>
      </div>
    </div>
  );
}
