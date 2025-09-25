import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function DocsPage() {
  return (
    <DefaultLayout
      description="Comprehensive documentation for HealthTracker AI. Learn how to integrate our API, understand health data formats, and implement AI-powered health analytics in your applications."
      image="/api/og?type=docs"
      title="Documentation - HealthTracker AI API & Integration Guide"
      url="/docs"
    >
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Docs</h1>
        </div>
      </section>
    </DefaultLayout>
  );
}
