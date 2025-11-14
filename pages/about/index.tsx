import React from "react";
import { title } from "../../components/primitives";
import DefaultLayout from "../../layouts/default";
import Link from "next/link";
import Image from "next/image";
import bannerImage from "../heathtracker banner.png";

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


      <section className="mx-auto max-w-6xl px-6 space-y-12">
        {/* Top row */}
        <div className="grid gap-8 md:grid-cols-2 items-start">
          {/* Left card */}
          <div className="rounded-2xl border p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Image src={bannerImage} alt="HealthTrackerAI logo" className="h-8 w-auto" priority />
              <span className="text-2xl font-semibold">HealthTrackerAI</span>
            </div>

            <h2 className="mt-6 text-2xl font-bold">About</h2>

            <p className="mt-4 leading-relaxed">
              HealthTrackerAI
              <br />
              <br />
              This site is made to have people create personalized diet and
              workout plans based on their body composition and information
              based on AI responses. Most online health sites miss some key
              factors like diet preferences and don’t accommodate to those with
              injuries that can not do certain workouts. This site makes it
              possible to be able to accommodate all your needs and preferences
              based on AI responses to help improve your health life.
            </p>
          </div>

          {/* Right card: large image tile */}
          <div className="rounded-2xl border p-6 md:p-8 flex items-center justify-center">
            <Image src={bannerImage} alt="HealthTrackerAI graphic" className="max-h-64 w-auto" />
          </div>
        </div>

        {/* Founders row */}
        <div className="grid gap-8 md:grid-cols-2 items-start">
          <div>
            <h3 className="text-2xl font-bold">Founders</h3>
            <ul className="mt-4 space-y-2 text-lg">
              <li>Emilia Mahmoodi</li>
              <li>Andy Moughalian</li>
              <li>Roee Palmon</li>
              <li>Christian Rusanovsky</li>
              <li>Novali Plascencia</li>
            </ul>
          </div>

          <div className="rounded-2xl border p-6 md:p-8">
            <p className="leading-relaxed">
              We wanted to create a site where choosing a diet contains only
              vegetarian or diet preferences, workout preferences with in mind
              previous and current injuries and how many days they can work out
              in a week to reach their goal. But the core idea is to create an
              area for personalized diets and workout plans based on AI.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12">
        <div className="mx-auto max-w-6xl px-6 py-10 text-center">
          <h4 className="text-xl font-extrabold">
            Ready to Transform Your Health?
          </h4>
          <p className="mt-2">
            Join thousands of people who have already started their fitness
            journey with HealthTrackerAI.
          </p>
          <div className="mt-6">
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center rounded-full border px-5 py-3 font-semibold"
            >
              Get Started Now <span aria-hidden className="ml-2">➜</span>
            </Link>
          </div>
        </div>
      </section>
    </DefaultLayout>
  );
}
