// Dashboard page
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/router";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    increment,
    serverTimestamp,
} from "firebase/firestore";
import { app } from "@/lib/firebase";

// Defines the structure of daily statistics stored in Firestore
type DayStats = {
    calories: number;        // Total calories consumed by the user today
    burnedCalories: number;  // Total calories burned from workouts
    workoutLogged?: boolean; // Determines whether a workout has been logged today
    updatedAt?: any;         // Timestamp of the last update
};

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null); // currently authenticated user
    const [loading, setLoading] = useState(true);        // auth / data loading state

    // Daily stats from Firestore
    const [stats, setStats] = useState<DayStats>({
        calories: 0,
        burnedCalories: 0,
        workoutLogged: false,
    });

    // general saving flag for Firestore writes
    const [saving, setSaving] = useState(false);

    // Firestore instance
    const db = useMemo(() => getFirestore(app), []);

    // YYYY-MM-DD for today's Firestore doc key
    const todayKey = useMemo(() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    // Pretty labels for header
    const todayInfo = useMemo(() => {
        const now = new Date();
        return {
            dayName: now.toLocaleDateString("en-US", { weekday: "long" }),
            fullDate: now.toLocaleDateString("en-US"),
        };
    }, []);

    // Load user + today's stats
    useEffect(() => {
        const auth = getAuth();

        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            setLoading(false);

            // if not logged in, go back to landing page
            if (!u) {
                router.replace("/");
                return;
            }

            try {
                const docRef = doc(db, "users", u.uid, "daily", todayKey);
                const snap = await getDoc(docRef);

                if (!snap.exists()) {
                    // create default doc for today
                    await setDoc(docRef, {
                        calories: 0,
                        burnedCalories: 0,
                        workoutLogged: false,
                        updatedAt: serverTimestamp(),
                    });

                    setStats({
                        calories: 0,
                        burnedCalories: 0,
                        workoutLogged: false,
                    });
                } else {
                    const data = snap.data() as DayStats;
                    setStats({
                        calories: data.calories ?? 0,
                        burnedCalories: data.burnedCalories ?? 0,
                        workoutLogged: data.workoutLogged ?? false,
                        updatedAt: data.updatedAt,
                    });
                }
            } catch (e) {
                console.error("Failed to load stats:", e);
            }
        });

        return () => unsub();
    }, [db, router, todayKey]);

    // Reference to today's doc (only if we have a user)
    const todayDocRef = useMemo(
        () => (user ? doc(db, "users", user.uid, "daily", todayKey) : null),
        [db, user, todayKey]
    );

    // Add / subtract calories (e.g. +100, -100)
    const addCalories = async (amount: number) => {
        if (!todayDocRef || saving) return;

        setSaving(true);

        // optimistic local update
        setStats((prev) => ({
            ...prev,
            calories: Math.max(0, (prev.calories ?? 0) + amount),
        }));

        try {
            await setDoc(
                todayDocRef,
                {
                    calories: increment(amount),
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (e) {
            console.error("Failed to update calories:", e);
            // revert local state on error
            setStats((prev) => ({
                ...prev,
                calories: Math.max(0, (prev.calories ?? 0) - amount),
            }));
        } finally {
            setSaving(false);
        }
    };

    // Add / subtract burned calories (e.g. +50, -50)
    const addBurnedCalories = async (amount: number) => {
        if (!todayDocRef || saving) return;

        setSaving(true);

        setStats((prev) => ({
            ...prev,
            burnedCalories: Math.max(0, (prev.burnedCalories ?? 0) + amount),
        }));

        try {
            await setDoc(
                todayDocRef,
                {
                    burnedCalories: increment(amount),
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (e) {
            console.error("Failed to update burned calories:", e);
            setStats((prev) => ({
                ...prev,
                burnedCalories: Math.max(
                    0,
                    (prev.burnedCalories ?? 0) - amount
                ),
            }));
        } finally {
            setSaving(false);
        }
    };

    // Toggle workout logged flag
    const toggleWorkoutLogged = async () => {
        if (!todayDocRef || saving) return;

        setSaving(true);
        const next = !(stats.workoutLogged ?? false);

        // optimistic toggle
        setStats((prev) => ({ ...prev, workoutLogged: next }));

        try {
            await setDoc(
                todayDocRef,
                {
                    workoutLogged: next,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (e) {
            console.error("Failed to toggle workout:", e);
            // revert
            setStats((prev) => ({ ...prev, workoutLogged: !next }));
        } finally {
            setSaving(false);
        }
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            router.replace("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const currentDayLabel = todayInfo.dayName;
    const todayString = todayInfo.fullDate;
    const docKey = todayKey;
    const workoutLabel = stats.workoutLogged
        ? "Workout logged ✅"
        : "Upper Body (not logged yet)";

    if (loading) return <p className="p-6 text-white">Loading…</p>;
    if (!user) return null;

    return (
        <>
            <Head>
                <title>Dashboard | HealthTrackerAI</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-[#0f1c2f] via-[#1c2950] to-[#301f4a] text-gray-100">
                <div className="flex min-h-screen">
                    {/* ========== SIDEBAR ========== */}
                    <aside className="w-64 bg-[#141c2c]/95 border-r border-white/5 flex flex-col">
                        {/* Profile / greeting */}
                        <div className="px-6 pt-6 pb-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-lime-400 text-[#141c2c] font-bold flex items-center justify-center">
                                {user?.displayName?.[0]?.toUpperCase() ??
                                    user?.email?.[0]?.toUpperCase() ??
                                    "E"}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-wide text-gray-400">
                                    Hello
                                </span>
                                <span className="font-semibold">
                                    {user?.displayName ?? "Emilia Mahmoodi"}
                                </span>
                            </div>
                        </div>

                        {/* Nav items */}
                        <nav className="mt-2 flex-1 px-3 space-y-1 text-sm">
                            <button className="w-full text-left px-3 py-2 rounded-lg bg白/10 text-white font-medium bg-white/10">
                                Dashboard
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5">
                                Workouts
                            </button>
                            <button
                                onClick={() => router.push("/nutrition")}
                                className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5"
                            >
                                Nutrition
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg白/5">
                                Goals
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg白/5">
                                Profile
                            </button>
                        </nav>

                        {/* Settings / bottom */}
                        <div className="px-4 py-4 border-t border-white/5 text-xs text-gray-400">
                            Settings
                        </div>
                    </aside>

                    {/* ========== MAIN CONTENT ========== */}
                    <main className="flex-1 flex flex-col">
                        {/* Top bar */}
                        <header className="flex items-center justify-between px-8 pt-6 pb-4">
                            <button
                                onClick={() => router.push("/")}
                                className="flex items-center gap-2 text-gray-300 hover:text-white text-sm mb-2"
                            >
                                <span className="text-lg">‹</span>
                                <span className="uppercase tracking-wide text-xs">Back</span>
                            </button>

                            <div className="text-center">
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                                    Current Day
                                </p>
                                <h1 className="text-2xl sm:text-3xl font-semibold">
                                    {currentDayLabel ?? "Today"}
                                </h1>
                                <p className="text-xs text-gray-400 mt-1">
                                    {todayString} • (Doc key: {docKey})
                                </p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="rounded-full bg-[#f6ff6b] hover:bg-[#e4f256] text-black font-semibold px-4 py-2 text-sm shadow-md"
                            >
                                Logout
                            </button>
                        </header>

                        {/* Main grid */}
                        <section className="flex-1 px-8 pb-10">
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                                {/* Today's Summary */}
                                <div className="bg-[#2d3748]/80 border border-white/10 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-md p-6">
                                    <h2 className="text-lg font-semibold mb-1">
                                        Today&apos;s Summary
                                    </h2>
                                    <p className="text-xs text-gray-400 mb-4">
                                        Quick view of your calories in &amp; out.
                                    </p>

                                    <div className="flex items-center gap-8 mb-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                                Calories
                                            </p>
                                            <p className="text-2xl font-semibold">
                                                {stats.calories ?? 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                                Burned Calories
                                            </p>
                                            <p className="text-2xl font-semibold">
                                                {stats.burnedCalories ?? 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Increment buttons */}
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <button
                                            onClick={() => addCalories(100)}
                                            disabled={saving}
                                            className="px-3 py-1.5 rounded-full bg-[#ff4ec7] hover:bg-[#d63eab] disabled:opacity-60 text-white font-medium"
                                        >
                                            +100 cal
                                        </button>
                                        <button
                                            onClick={() => addCalories(-100)}
                                            disabled={saving}
                                            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-60 text-gray-100"
                                        >
                                            -100 cal
                                        </button>
                                        <button
                                            onClick={() => addBurnedCalories(50)}
                                            disabled={saving}
                                            className="px-3 py-1.5 rounded-full bg-[#ff4ec7] hover:bg-[#d63eab] disabled:opacity-60 text-white font-medium"
                                        >
                                            +50 burned
                                        </button>
                                        <button
                                            onClick={() => addBurnedCalories(-50)}
                                            disabled={saving}
                                            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg白/15 disabled:opacity-60 text-gray-100"
                                        >
                                            -50 burned
                                        </button>
                                    </div>
                                </div>

                                {/* Workout Progress */}
                                <div className="bg-[#2d3748]/80 border border-white/10 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-md p-6">
                                    <h2 className="text-lg font-semibold mb-1">
                                        Workout Progress
                                    </h2>
                                    <p className="text-xs text-gray-400 mb-4">{workoutLabel}</p>

                                    <button
                                        onClick={toggleWorkoutLogged}
                                        disabled={saving}
                                        className="mt-auto inline-flex items-center justify-center rounded-full bg-[#ff4ec7] hover:bg-[#d63eab] disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white shadow-md"
                                    >
                                        {stats.workoutLogged ? "Undo workout" : "Start / Log Workout"}
                                    </button>
                                </div>

                                {/* Ask AI */}
                                <div className="bg-[#2d3748]/80 border border-white/10 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-md p-6">
                                    <h2 className="text-lg font-semibold mb-1">
                                        Ask AI about your plan
                                    </h2>
                                    <p className="text-xs text-gray-400 mb-3">
                                        Ask anything about your meals, workouts, or goals.
                                    </p>

                                    <div className="flex flex-col gap-3">
                                        <textarea
                                            className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4ec7]/70"
                                            rows={3}
                                            placeholder="Ask anything..."
                                        />
                                        <div className="flex justify-end">
                                            <button className="rounded-full bg-[#f6ff6b] hover:bg-[#e4f256] text-black font-semibold px-4 py-2 text-sm shadow-md">
                                                Ask
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </>
    );
}