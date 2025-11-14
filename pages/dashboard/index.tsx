// Dashboard page
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
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
    calories: number;           // Total calories consumed by the user today
    burnedCalories: number;     // Total calories burned from workouts
    workoutLogged?: boolean;    // Determines whether a workout has been logged today
    updatedAt?: any;            // Timestamp of the last update
};

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null); // Holds the currently authenticated Firebase user (or null if not logged in)
    const [loading, setLoading] = useState(true);        // Tracks whether authentication check or data loading is still in progress

    // Stores the user’s daily fitness stats retrieved from Firestore
    const [stats, setStats] = useState<DayStats>({
        calories: 0,
        burnedCalories: 0,
        workoutLogged: false,
    });

    // Controls UI button states for logging workouts or saving data
    const [workoutActive, setWorkoutActive] = useState(false);
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

            // Redirect to login page if user is not authenticated
            if (!u) {
                router.replace("/login");
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
                        updatedAt: serverTimestamp(),
                    });
                    // Initialize local state with defaults
                    setStats({ calories: 0, burnedCalories: 0, workoutLogged: false });
                } else {
                    const data = snap.data() as DayStats; // If document exists, load its data into local state
                    setStats({
                        calories: data.calories ?? 0,
                        burnedCalories: data.burnedCalories ?? 0,
                        workoutLogged: data.workoutLogged ?? false,
                        updatedAt: data.updatedAt,
                    });
                }
            } catch (e) {
                console.error("Failed to load stats:", e); // Log any issues that occur while fetching or creating data
            }
        });

        return () => unsub();
    }, [db, router, todayKey]);

    //This builds a reference to user's id and we only create this if a user is logged in
    const todayDocRef = useMemo(
        () => (user ? doc(db, "users", user.uid, "daily", todayKey) : null),
        [db, user, todayKey]
    );

    // Goal
    const [goal, setGoal] = useState<number>(1800);

    //Goal progress
    const goalProgress = useMemo(() => {
        const g = Number(goal) || 0;
        if (g <= 0) return 0;
        const pct = Math.round(((stats.calories ?? 0) / g) * 100);
        return Math.min(100, Math.max(0, pct));
    }, [goal, stats.calories]);

    //Net calories
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

    // Resets today's stats back to zero and clears workout flag
    // Uses a backup of current stats so we can restore them on error
    const resetToday = async () => {
        // If no doc ref or a save is in progress, do nothing
        if (!todayDocRef || saving) return;

        setSaving(true);

        // Keep a copy of current stats so we can undo if Firestore fails
        const previous = stats;

        // Optimistic UI: immediately reset local state
        setStats({ calories: 0, burnedCalories: 0, workoutLogged: false });

        try {
            // Write the reset values to Firestore
            await setDoc(
                todayDocRef,
                {
                    calories: 0,
                    burnedCalories: 0,
                    workoutLogged: false,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (e) {
            console.error("Failed to reset:", e);

            // If Firestore write fails, restore previous stats
            setStats(previous);
        } finally {
            setSaving(false);
        }
    };

    // If we are still loading user data, show a simple loading message
    if (loading) return <p className="p-6">Loading…</p>;

    // If there is no user, we already redirected to /login, so render nothing
    if (!user) return null;

    // Main dashboard UI
    return (
        <>
            <Head>
                <title>Dashboard</title>
            </Head>

            <div className="min-h-screen flex bg-[#050814] text-white">
                {/* LEFT SIDEBAR */}
                <aside className="w-64 bg-[#050814] border-r border-white/10 flex flex-col justify-between py-6 px-5">
                    <div>
                        {/* Hello [Name]! */}
                        <div className="flex items-center gap-2 mb-10">
                            {/* Tiny logo box placeholder */}
                            <div className="h-8 w-8 rounded-lg bg-[#C5FF2F] flex items-center justify-center text-xs font-extrabold text-black">
                                HT
                            </div>
                            <p className="text-lg font-semibold">
                                Hello {user.displayName ?? "there"}!
                            </p>
                        </div>

                        {/* Nav buttons */}
                        <nav className="flex flex-col gap-3">
                            <button className="w-full rounded-full bg-[#46C5FF] text-black font-semibold py-2.5 px-6 text-left">
                                Dashboard
                            </button>
                            <button className="w-full rounded-full bg-transparent hover:bg-white/5 py-2.5 px-6 text-left text-sm text-gray-200">
                                Workouts
                            </button>
                            <button className="w-full rounded-full bg-transparent hover:bg-white/5 py-2.5 px-6 text-left text-sm text-gray-200">
                                Nutrition
                            </button>
                            <button className="w-full rounded-full bg-transparent hover:bg-white/5 py-2.5 px-6 text-left text-sm text-gray-200">
                                Goals
                            </button>
                            <button className="w-full rounded-full bg-transparent hover:bg-white/5 py-2.5 px-6 text-left text-sm text-gray-200">
                                Profile
                            </button>
                        </nav>
                    </div>

                    {/* Settings at the bottom */}
                    <button className="text-sm text-gray-300 text-left mt-10">
                        Settings
                    </button>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 bg-[#0B1526] px-10 py-6">
                    {/* Top bar: Current day + Logout */}
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">
                                Current Day: {todayInfo.dayName}
                            </h1>
                            <p className="text-gray-200 mt-1">
                                {todayInfo.fullDate}
                            </p>
                            {/* Small text showing the Firestore key if you want it for debugging */}
                            <p className="text-xs text-gray-500 mt-1">
                                (Doc key: {todayKey})
                            </p>
                        </div>

                        <button
                            className="px-6 py-2 rounded-full bg-[#C5FF2F] text-black font-semibold shadow-md hover:brightness-95"
                            onClick={() => {
                                // optional: add real logout later
                                router.push("/login");
                            }}
                        >
                            Logout
                        </button>
                    </div>

                    {/* GRID OF CARDS */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Today’s Summary */}
                        <section className="bg-[#1A5DA8] rounded-xl p-5 shadow-md col-span-1">
                            <h2 className="text-lg font-semibold mb-4">
                                Today&apos;s Summary
                            </h2>
                            <div className="flex justify-between mb-4">
                                <div>
                                    <p className="text-2xl font-bold">
                                        {stats.calories ?? 0}
                                    </p>
                                    <p className="text-sm">Calories</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {stats.burnedCalories ?? 0}
                                    </p>
                                    <p className="text-sm">Burned Calories</p>
                                </div>
                            </div>

                            {/* Your existing +/- buttons wired to Firestore */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className="px-3 py-1 rounded-md bg-white/90 text-[#1A5DA8] text-sm font-semibold disabled:opacity-50"
                                    onClick={() => addCalories(100)}
                                    disabled={saving}
                                >
                                    +100 cal
                                </button>
                                <button
                                    className="px-3 py-1 rounded-md bg-white/90 text-[#1A5DA8] text-sm font-semibold disabled:opacity-50"
                                    onClick={() => addCalories(-100)}
                                    disabled={
                                        saving || (stats.calories ?? 0) < 100
                                    }
                                >
                                    -100 cal
                                </button>
                                <button
                                    className="px-3 py-1 rounded-md bg-white/90 text-[#1A5DA8] text-sm font-semibold disabled:opacity-50"
                                    onClick={() => addBurnedCalories(50)}
                                    disabled={saving}
                                >
                                    +50 burned
                                </button>
                                <button
                                    className="px-3 py-1 rounded-md bg-white/90 text-[#1A5DA8] text-sm font-semibold disabled:opacity-50"
                                    onClick={() => addBurnedCalories(-50)}
                                    disabled={
                                        saving ||
                                        (stats.burnedCalories ?? 0) < 50
                                    }
                                >
                                    -50 burned
                                </button>
                            </div>
                        </section>

                        {/* Workout Progress */}
                        <section className="bg-[#1A5DA8] rounded-xl p-5 shadow-md">
                            <h2 className="text-lg font-semibold mb-3">
                                Workout Progress
                            </h2>
                            <p className="text-sm mb-4">
                                Upper Body
                                {stats.workoutLogged
                                    ? " (logged)"
                                    : " (not logged yet)"}
                            </p>
                            <button
                                className="px-4 py-2 rounded-md bg-[#C5FF2F] text-black font-semibold hover:brightness-95 disabled:opacity-50"
                                onClick={toggleWorkoutLogged}
                                disabled={saving}
                            >
                                {stats.workoutLogged
                                    ? "Mark as Not Done"
                                    : "Start / Log Workout"}
                            </button>
                        </section>

                        {/* Ask AI about your plan */}
                        <section className="bg-[#1A5DA8] rounded-xl p-5 shadow-md">
                            <h2 className="text-lg font-semibold mb-3">
                                Ask AI about your plan
                            </h2>
                            <div className="flex gap-2 mt-2">
                                <input
                                    type="text"
                                    placeholder="Ask anything..."
                                    className="flex-1 rounded-md px-3 py-2 text-black text-sm outline-none"
                                />
                                <button className="px-4 py-2 rounded-md bg-[#C5FF2F] text-black font-semibold hover:brightness-95">
                                    Ask
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Bottom row: Nutrition card */}
                    <div className="grid grid-cols-3 gap-6 mt-6">
                        <section className="bg-[#1A5DA8] rounded-xl p-5 shadow-md col-span-1">
                            <h2 className="text-lg font-semibold mb-4">
                                Nutrition
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm mb-1">Breakfast</p>
                                    <input
                                        className="w-full rounded-md px-3 py-2 text-black text-sm outline-none"
                                        placeholder="What did you eat?"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm mb-1">Lunch</p>
                                    <input
                                        className="w-full rounded-md px-3 py-2 text-black text-sm outline-none"
                                        placeholder="What did you eat?"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm mb-1">Dinner</p>
                                    <input
                                        className="w-full rounded-md px-3 py-2 text-black text-sm outline-none"
                                        placeholder="What did you eat?"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}