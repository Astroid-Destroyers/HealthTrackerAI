import DefaultLayout from "@/layouts/default";

export default function PrivacyPage() {
    return (
        <DefaultLayout
            title="Privacy Policy | HealthTrackerAI"
            description="Learn how HealthTrackerAI collects, stores, and protects your data."
        >
            <main className="min-h-[calc(100vh-8rem)] px-4 py-16 md:px-8 text-slate-100">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-semibold mb-4">
                        Privacy Policy
                    </h1>

                    <p className="text-slate-400 mb-10 text-sm">
                        Last updated: November 2025
                    </p>

                    <section className="space-y-8 text-sm md:text-base leading-relaxed">
                        <p>
                            At <strong>HealthTrackerAI</strong>, your privacy and data
                            security are extremely important to us. This Privacy Policy
                            explains how we collect, store, and use your information when you
                            use our application. This page is intended for academic and
                            demonstration purposes for our senior project.
                        </p>

                        {/* 1. Data we collect */}
                        <div>
                            <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
                            <ul className="list-disc pl-6 space-y-2 text-slate-300">
                                <li>
                                    <strong>Account Information:</strong> Your email address and
                                    login details used for authentication.
                                </li>
                                <li>
                                    <strong>Health Data You Enter:</strong> Calories, workouts,
                                    goals, or any information you manually log within the app.
                                </li>
                                <li>
                                    <strong>Device & Usage Data:</strong> Basic analytics about
                                    how the app is being used (page visits, feature usage, etc.)
                                    to improve user experience.
                                </li>
                            </ul>
                        </div>

                        {/* 2. How we store data */}
                        <div>
                            <h2 className="text-xl font-semibold mb-2">2. How Your Data is Stored</h2>
                            <p className="text-slate-300">
                                We use <strong>Firebase Authentication</strong> and{" "}
                                <strong>Firestore Database</strong> to securely store user
                                accounts and health-related data. Firestore uses industry-grade
                                security practices and encrypted storage.
                            </p>
                        </div>

                        {/* 3. AI usage */}
                        <div>
                            <h2 className="text-xl font-semibold mb-2">
                                3. How AI Features Use Your Information
                            </h2>
                            <p className="text-slate-300">
                                Some AI features (such as generating health plans or
                                personalized suggestions) may send limited, relevant input data
                                to third-party AI providers such as OpenAI. We only send the
                                minimum information necessary for the feature to function.
                            </p>
                        </div>

                        {/* 4. What we DON'T do */}
                        <div>
                            <h2 className="text-xl font-semibold mb-2">4. What We Do NOT Do</h2>
                            <ul className="list-disc pl-6 space-y-2 text-slate-300">
                                <li>We **do not** sell personal data.</li>
                                <li>
                                    We **do not** share your information with advertisers or
                                    external marketing services.
                                </li>
                                <li>
                                    We **do not** use your health data for purposes unrelated to
                                    the function of the app.
                                </li>
                            </ul>
                        </div>

                        {/* 5. Your control */}
                        <div>
                            <h2 className="text-xl font-semibold mb-2">5. Your Data Rights</h2>
                            <p className="text-slate-300">
                                You may request to review, update, or delete your account data
                                at any time by contacting the project team. Future versions of
                                the app will include in-app data export and deletion options.
                            </p>
                        </div>

                        {/* 6. Contact */}
                        <div>
                            <h2 className="text-xl font-semibold mb-2">6. Contact Us</h2>
                            <p className="text-slate-300">
                                For questions regarding privacy or your data, contact the
                                project team at:
                                <br />
                                <strong>healthtrackerai-team@example.com</strong>
                            </p>
                        </div>

                        <p className="text-xs text-slate-500 mt-12">
                            Note: This Privacy Policy is for educational coursework and does
                            not constitute a legally binding agreement. Real-world
                            applications require a legally reviewed privacy policy.
                        </p>
                    </section>
                </div>
            </main>
        </DefaultLayout>
    );
}