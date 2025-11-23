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
    calories: number; // Total calories consumed by the user today
    burnedCalories: number; // Total calories burned from workouts
    workoutLogged?: boolean; // Determines whether a workout has been logged today
    updatedAt?: any; // Timestamp of the last update
    breakfast?: string; // What the user ate for breakfast
    lunch?: string; // What the user ate for lunch
    dinner?: string; // What the user ate for dinner
};

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null); // Holds the currently authenticated Firebase user (or null if not logged in)
    const [loading, setLoading] = useState(true); // Tracks whether authentication check or data loading is still in progress

    // Stores the user’s daily fitness stats retrieved from Firestore
    const [stats, setStats] = useState<DayStats>({
        calories: 0,
        burnedCalories: 0,
        workoutLogged: false,
        breakfast: "",
        lunch: "",
        dinner: "",
    });

    // Separate local draft for the Nutrition textareas
    const [mealDraft, setMealDraft] = useState({
        breakfast: "",
        lunch: "",
        dinner: "",
    });

    // Controls UI button states for logging workouts or saving data
    const [saving, setSaving] = useState(false);

    const db = useMemo(() => getFirestore(app), []);

    // YYYY-MM-DD for today's Firestore doc
    const todayKey = useMemo(() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    // Pretty version of today's day + date for the UI header
    const todayInfo = useMemo(() => {
        const now = new Date();
        return {
            dayName: now.toLocaleDateString("en-US", { weekday: "long" }),
            fullDate: now.toLocaleDateString("en-US"),
        };
    }, []);

    // Load user + create/read Firestore doc
    useEffect(() => {
        const auth = getAuth();

        // Looks out for changes to the user's authentication state
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            setLoading(false);

            // Redirect to home page if user is not authenticated
            if (!u) {
                router.replace("/");
                return;
            }

            /* Reference the user's daily stats document in Firestore.
               If no record for today, create a new document with default values */
            try {
                const docRef = doc(db, "users", u.uid, "daily", todayKey);
                const snap = await getDoc(docRef);

                if (!snap.exists()) {
                    await setDoc(docRef, {
                        calories: 0,
                        burnedCalories: 0,
                        workoutLogged: false,
                        breakfast: "",
                        lunch: "",
                        dinner: "",
                        updatedAt: serverTimestamp(),
                    });
                    // Initialize local state with defaults
                    setStats({
                        calories: 0,
                        burnedCalories: 0,
                        workoutLogged: false,
                        breakfast: "",
                        lunch: "",
                        dinner: "",
                    });
                } else {
                    const data = snap.data() as DayStats; // If document exists, load its data into local state
                    setStats({
                        calories: data.calories ?? 0,
                        burnedCalories: data.burnedCalories ?? 0,
                        workoutLogged: data.workoutLogged ?? false,
                        updatedAt: data.updatedAt,
                        breakfast: data.breakfast ?? "",
                        lunch: data.lunch ?? "",
                        dinner: data.dinner ?? "",
                    });
                }
            } catch (e) {
                console.error("Failed to load stats:", e); // Log any issues that occur while fetching or creating data
            }
        });

        return () => unsub();
    }, [db, router, todayKey]);

    // Keep the textareas (mealDraft) in sync whenever stats change
    useEffect(() => {
        setMealDraft({
            breakfast: stats.breakfast ?? "",
            lunch: stats.lunch ?? "",
            dinner: stats.dinner ?? "",
        });
    }, [stats.breakfast, stats.lunch, stats.dinner]);

    // This builds a reference to user's id and we only create this if a user is logged in
    const todayDocRef = useMemo(
        () => (user ? doc(db, "users", user.uid, "daily", todayKey) : null),
        [db, user, todayKey]
    );

    // Goal
    const [goal, setGoal] = useState<number>(1800);

    // Goal progress
    const goalProgress = useMemo(() => {
        const g = Number(goal) || 0;
        if (g <= 0) return 0;
        const pct = Math.round(((stats.calories ?? 0) / g) * 100);
        return Math.min(100, Math.max(0, pct));
    }, [goal, stats.calories]);

    // Net calories
    const netCalories = useMemo(
        () => (stats.calories ?? 0) - (stats.burnedCalories ?? 0),
        [stats.calories, stats.burnedCalories]
    );

    // Updates today's "calories" by the given amount (e.g., +100 or -100)
    // Uses optimistic UI (update screen first), then saves to Firestore.
    const addCalories = async (amount: number) => {
        // If we don't have today's document OR we are already saving, do nothing
        if (!todayDocRef || saving) return;

        // Mark that a save is in progress
        setSaving(true);

        // Optimistic UI update: immediately update local state
        setStats((prev) => ({
            ...prev,
            calories: Math.max(0, (prev.calories ?? 0) + amount),
        }));

        try {
            // Update Firestore: increment the existing calories field
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

            // If Firestore fails, revert the local change
            setStats((prev) => ({
                ...prev,
                calories: Math.max(0, (prev.calories ?? 0) - amount),
            }));
        } finally {
            // Done saving (success or failure)
            setSaving(false);
        }
    };

    // Updates today's "burnedCalories" by the given amount (e.g., +50 or -50)
    // Same optimistic UI pattern as addCalories
    const addBurnedCalories = async (amount: number) => {
        // If no doc ref or a save is already happening, do nothing
        if (!todayDocRef || saving) return;

        setSaving(true);

        // Optimistic UI update for burned calories
        setStats((prev) => ({
            ...prev,
            burnedCalories: Math.max(0, (prev.burnedCalories ?? 0) + amount),
        }));

        try {
            // Update Firestore burnedCalories field
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

            // Revert local state if Firestore fails
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

    // Flips the "workoutLogged" flag for today (true ↔ false)
    // Stores the value in Firestore and updates local UI optimistically
    const toggleWorkoutLogged = async () => {
        // If we can't save right now, just exit
        if (!todayDocRef || saving) return;

        setSaving(true);

        // Next value = opposite of current (default to false if undefined)
        const next = !(stats.workoutLogged ?? false);

        // Optimistic UI: update local state first
        setStats((prev) => ({ ...prev, workoutLogged: next }));

        try {
            // Save the new value to Firestore
            await setDoc(
                todayDocRef,
                {
                    workoutLogged: next,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (e) {
            console.error("Failed to toggle workout flag:", e);

            // If Firestore fails, revert the toggle
            setStats((prev) => ({ ...prev, workoutLogged: !next }));
        } finally {
            setSaving(false);
        }
    };

    // Resets today's stats back to zero and clears workout flag + meals
    // Uses a backup of current stats so we can restore them on error
    const resetToday = async () => {
        // If no doc ref or a save is in progress, do nothing
        if (!todayDocRef || saving) return;

        setSaving(true);

        // Keep a copy of current stats so we can undo if Firestore fails
        const previous = stats;

        // Optimistic UI: immediately reset local state
        setStats({
            calories: 0,
            burnedCalories: 0,
            workoutLogged: false,
            breakfast: "",
            lunch: "",
            dinner: "",
        });
        setMealDraft({
            breakfast: "",
            lunch: "",
            dinner: "",
        });

        try {
            // Write the reset values to Firestore
            await setDoc(
                todayDocRef,
                {
                    calories: 0,
                    burnedCalories: 0,
                    workoutLogged: false,
                    breakfast: "",
                    lunch: "",
                    dinner: "",
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (e) {
            console.error("Failed to reset:", e);

            // If Firestore write fails, restore previous stats
            setStats(previous);
            setMealDraft({
                breakfast: previous.breakfast ?? "",
                lunch: previous.lunch ?? "",
                dinner: previous.dinner ?? "",
            });
        } finally {
            setSaving(false);
        }
    };

    // Save nutrition notes (breakfast, lunch, dinner) to Firestore
    const saveMeals = async () => {
        if (!todayDocRef || saving) return;

        setSaving(true);
        try {
            await setDoc(
                todayDocRef,
                {
                    breakfast: mealDraft.breakfast,
                    lunch: mealDraft.lunch,
                    dinner: mealDraft.dinner,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );

            // Also update local stats so everything stays in sync
            setStats((prev) => ({
                ...prev,
                breakfast: mealDraft.breakfast,
                lunch: mealDraft.lunch,
                dinner: mealDraft.dinner,
            }));
        } catch (e) {
            console.error("Failed to save meals:", e);
        } finally {
            setSaving(false);
        }
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);

            // send user to homepage after logout
            router.replace("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // Derived labels for header & workout
    const currentDayLabel = todayInfo.dayName;
    const todayString = todayInfo.fullDate;
    const docKey = todayKey;
    const workoutLabel = stats.workoutLogged
        ? "Workout logged ✅"
        : "Upper Body (not logged yet)";

    // If we are still loading user data, show a simple loading message
    if (loading) return <p className="p-6 text-white">Loading…</p>;

    // If there is no user, we already redirected to /, so render nothing
    if (!user) return null;

    // Main dashboard UI
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
                                {user?.displayName?.[0] ?? "E"}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-wide text-gray-400">
                                    Hello
                                </span>
                                <span className="font-semibold">
                                    {user?.displayName ?? "Emilia Mahmoodi!"}
                                </span>
                            </div>
                        </div>

                        {/* Nav items */}
                        <nav className="mt-2 flex-1 px-3 space-y-1 text-sm">
                            <button className="w-full text-left px-3 py-2 rounded-lg bg-white/10 text-white font-medium">
                                Dashboard
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5">
                                Workouts
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5">
                                Nutrition
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5">
                                Goals
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5">
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
                            <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                                    Current Day
                                </p>
                                <h1 className="text-2xl sm:text-3xl font-semibold">
                                    {currentDayLabel ?? "Friday"}
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
                                                {stats?.calories ?? 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                                Burned Calories
                                            </p>
                                            <p className="text-2xl font-semibold">
                                                {stats?.burnedCalories ?? 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Increment buttons wired to handlers */}
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
                                            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-60 text-gray-100"
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
                                    <p className="text-xs text-gray-400 mb-4">
                                        {workoutLabel}
                                    </p>

                                    <button
                                        onClick={toggleWorkoutLogged}
                                        disabled={saving}
                                        className="mt-auto inline-flex items-center justify-center rounded-full bg-[#ff4ec7] hover:bg-[#d63eab] disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white shadow-md"
                                    >
                                        {stats.workoutLogged
                                            ? "Undo workout"
                                            : "Start / Log Workout"}
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

                            {/* Nutrition card */}
                            <div className="bg-[#2d3748]/80 border border-white/10 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-md p-6 mt-8">
                                <h2 className="text-lg font-semibold mb-1">Nutrition</h2>
                                <p className="text-xs text-gray-400 mb-4">
                                    Track what you ate today.
                                </p>

                                <div className="grid gap-4 md:grid-cols-3 text-sm">
                                    {/* Breakfast */}
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                                            Breakfast
                                        </p>
                                        <textarea
                                            className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-gray-100 text-xs placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4ec7]/70"
                                            rows={2}
                                            placeholder="What did you eat?"
                                            value={mealDraft.breakfast}
                                            onChange={(e) =>
                                                setMealDraft((prev) => ({
                                                    ...prev,
                                                    breakfast: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>

                                    {/* Lunch */}
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                                            Lunch
                                        </p>
                                        <textarea
                                            className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-gray-100 text-xs placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4ec7]/70"
                                            rows={2}
                                            placeholder="What did you eat?"
                                            value={mealDraft.lunch}
                                            onChange={(e) =>
                                                setMealDraft((prev) => ({
                                                    ...prev,
                                                    lunch: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>

                                    {/* Dinner */}
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                                            Dinner
                                        </p>
                                        <textarea
                                            className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-gray-100 text-xs placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4ec7]/70"
                                            rows={2}
                                            placeholder="What did you eat?"
                                            value={mealDraft.dinner}
                                            onChange={(e) =>
                                                setMealDraft((prev) => ({
                                                    ...prev,
                                                    dinner: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Save button */}
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={saveMeals}
                                        disabled={saving}
                                        className="rounded-full bg-[#f6ff6b] hover:bg-[#e4f256] disabled:opacity-60 text-black font-semibold px-4 py-2 text-sm shadow-md"
                                    >
                                        {saving ? "Saving..." : "Save meals"}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </>
    );
}