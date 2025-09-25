import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

export default function TestStyles() {
  return (
    <DefaultLayout>
      <div className="min-h-screen bg-neural-900 p-8">
        <div className="container mx-auto max-w-4xl space-y-8">
          <h1 className="text-4xl font-bold gradient-text mb-8">Style Test Page</h1>
          
          {/* Test glass effects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass">
              <CardBody className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Glass Effect Test</h2>
                <p className="text-gray-300">
                  This card should have a glassmorphism effect with backdrop blur.
                </p>
              </CardBody>
            </Card>

            <Card className="glass-strong">
              <CardBody className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Strong Glass Effect</h2>
                <p className="text-gray-300">
                  This card should have a stronger glassmorphism effect.
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Test AI card styles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="ai-card">
              <h2 className="text-2xl font-bold text-white mb-4">AI Card Test</h2>
              <p className="text-gray-300">
                This should be a modern AI-themed card with hover effects.
              </p>
            </div>

            <div className="ai-card-premium">
              <h2 className="text-2xl font-bold mb-4">Premium AI Card</h2>
              <p className="text-white/90">
                This should be a premium AI card with gradient background.
              </p>
            </div>
          </div>

          {/* Test buttons */}
          <div className="flex flex-wrap gap-4">
            <Button className="btn-ai-primary">
              AI Primary Button
            </Button>
            
            <Button className="glass border-white/20 text-white hover:bg-white/10">
              Glass Button
            </Button>
          </div>

          {/* Test gradient text */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold gradient-text">Gradient Text Test</h2>
            <h2 className="text-3xl font-bold gradient-text-secondary">Secondary Gradient Text</h2>
          </div>

          {/* Test neural background */}
          <div className="neural-bg p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Neural Background Test</h2>
            <p className="text-gray-300">
              This section should have a neural network pattern background.
            </p>
          </div>

          {/* Test animations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-xl animate-float">
              <h3 className="text-white font-bold">Float Animation</h3>
            </div>
            
            <div className="glass p-6 rounded-xl animate-neural-pulse">
              <h3 className="text-white font-bold">Neural Pulse</h3>
            </div>
            
            <div className="glass p-6 rounded-xl animate-glow">
              <h3 className="text-white font-bold">Glow Animation</h3>
            </div>
          </div>

          {/* Test background gradients */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-ai-gradient p-6 rounded-xl">
              <h3 className="text-white font-bold">AI Gradient</h3>
            </div>
            
            <div className="bg-ai-gradient-secondary p-6 rounded-xl">
              <h3 className="text-white font-bold">Secondary Gradient</h3>
            </div>
            
            <div className="bg-ai-gradient-accent p-6 rounded-xl">
              <h3 className="text-white font-bold">Accent Gradient</h3>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}