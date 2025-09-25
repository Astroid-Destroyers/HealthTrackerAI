import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function BlogPage() {
  return (
    <DefaultLayout
      description="Latest insights on AI-powered healthcare, health analytics trends, and innovations in digital wellness. Stay updated with our research findings and industry analysis."
      image="/api/og?type=blog"
      title="Health AI Blog - Latest Insights & Trends | HealthTracker AI"
      url="/blog"
    >
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Blog</h1>
        </div>
      </section>
    </DefaultLayout>
  );
}
