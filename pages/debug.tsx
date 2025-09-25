export default function MinimalTest() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f172a',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>CSS Debug Test</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <h2>1. Inline Styles (Should always work):</h2>
        <div style={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          padding: '1rem',
          borderRadius: '0.5rem',
          margin: '0.5rem 0'
        }}>
          This has inline gradient styling
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h2>2. Basic Tailwind Classes:</h2>
        <div className="bg-blue-500 text-white p-4 rounded mb-2">
          Blue background with Tailwind
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded mb-2">
          Tailwind gradient
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h2>3. Custom CSS Classes:</h2>
        <div className="glass text-white p-4 rounded mb-2">
          Glass morphism effect
        </div>
        <div className="gradient-text text-2xl font-bold mb-2">
          Gradient text effect
        </div>
      </div>

      <div>
        <h2>4. Advanced Effects:</h2>
        <div className="backdrop-blur-md bg-white/10 border border-white/20 p-4 rounded mb-2">
          Backdrop blur with transparency
        </div>
      </div>
    </div>
  );
}