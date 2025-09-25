import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function AboutPage() {
  return (
    <DefaultLayout
      description="Learn about HealthTracker AI's mission to revolutionize healthcare through artificial intelligence. Discover our team, values, and commitment to privacy-first health analytics."
      image="/api/og?type=about"
      title="About Us - Mission, Team & Values | HealthTracker AI"
      url="/about"
    >
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>About</h1>
        </div>
      </section>
    </DefaultLayout>
  );
}
