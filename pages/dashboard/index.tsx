// pages/dashboard/index.tsx
import Head from "next/head";
import { use, useEffect, useMemo, useState } from "react";
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

type DayStats = {
    calories: number;
    burnedCalories: number;
    workoutLogged?: boolean;
    updatedAt?: any;
};

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // today's stats
    const [stats, setStats] = useState<DayStats>({
        calories: 0,
        burnedCalories: 0,
        workoutLogged: false,
    });

    // button and save states
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

    // Load user + create/read Firestore doc
    useEffect(() => {
        const auth = getAuth();
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            setLoading(false);
            if (!u) {
                router.replace("/login");
                return;
            }

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
                    setStats({ calories: 0, burnedCalories: 0, workoutLogged: false });
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
}