//Profile Set up from dashboard
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { auth, db } from "@/lib/firebase";

type FitnessLevel = "" | "beginner" | "moderate" | "intermediate";
type PrimaryGoal = "" | "lose-weight" | "gain-weight" | "maintain-weight";
type HeightUnit = "imperial" | "metric";
type WeightUnit = "imperial" | "metric";

interface ProfileData {
    name: string;
    email: string;
    dateOfBirth: string; // YYYY-MM-DD
    gender: string;
    heightUnit: HeightUnit;
    heightFeet: string;
    heightInches: string;
    heightCm: string;
    weightUnit: WeightUnit;
    weightPounds: string;
    weightKg: string;
    fitnessLevel: FitnessLevel;
    primaryGoal: PrimaryGoal;
}

const initialProfile: ProfileData = {
    name: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    heightUnit: "imperial",
    heightFeet: "",
    heightInches: "",
    heightCm: "",
    weightUnit: "imperial",
    weightPounds: "",
    weightKg: "",
    fitnessLevel: "",
    primaryGoal: "",
};

function isAtLeast18(dobString: string): boolean {
    if (!dobString) return false;
    const dob = new Date(dobString);
    if (Number.isNaN(dob.getTime())) return false;

    const today = new Date();
    const eighteen = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate(),
    );

    return dob <= eighteen;
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileData>(initialProfile);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [maxDob, setMaxDob] = useState("");

    // latest allowed DOB (today - 18 years)
    useEffect(() => {
        const today = new Date();
        const eighteen = new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate(),
        );
        setMaxDob(eighteen.toISOString().split("T")[0]);
    }, []);

    // Auth + load profile
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setLoadingUser(false);
                return;
            }

            setUser(firebaseUser);

            try {
                const ref = doc(db, "users", firebaseUser.uid);
                const snap = await getDoc(ref);

                if (snap.exists()) {
                    const data = snap.data() as any;

                    setProfile({
                        name: data.name || firebaseUser.displayName || "",
                        email: data.email || firebaseUser.email || "",
                        dateOfBirth: data.dateOfBirth || "",
                        gender: data.gender || "",
                        heightUnit: (data.height?.unit || "imperial") as HeightUnit,
                        heightFeet: data.height?.feet || "",
                        heightInches: data.height?.inches || "",
                        heightCm: data.height?.cm || "",
                        weightUnit: (data.weight?.unit || "imperial") as WeightUnit,
                        weightPounds: data.weight?.pounds || "",
                        weightKg: data.weight?.kg || "",
                        fitnessLevel: (data.fitnessLevel || "") as FitnessLevel,
                        primaryGoal:
                            (data.primaryGoal || data.goal || "") as PrimaryGoal,
                    });
                } else {
                    setProfile((prev) => ({
                        ...prev,
                        name: firebaseUser.displayName || "",
                        email: firebaseUser.email || "",
                    }));
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load profile information.");
            } finally {
                setLoadingUser(false);
            }
        });

        return () => unsub();
    }, []);

    const currentDayLabel = useMemo(() => {
        const d = new Date();
        const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
        const formatted = d.toLocaleDateString(undefined, {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        });
        return { weekday, formatted };
    }, []);

    const handleChange = (field: keyof ProfileData, value: string) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
        setError("");
        setSuccess("");
    };

    const canSave = useMemo(() => {
        if (!profile.name.trim()) return false;
        if (!profile.email.trim()) return false;
        if (!profile.gender) return false;
        if (!profile.dateOfBirth || !isAtLeast18(profile.dateOfBirth)) return false;

        if (profile.heightUnit === "imperial") {
            if (!profile.heightFeet || !profile.heightInches) return false;
        } else {
            if (!profile.heightCm) return false;
        }

        if (profile.weightUnit === "imperial") {
            if (!profile.weightPounds) return false;
        } else {
            if (!profile.weightKg) return false;
        }

        if (!profile.fitnessLevel) return false;
        if (!profile.primaryGoal) return false;
        return true;
    }, [profile]);

    const handleSave = async () => {
        if (!user) return;
        if (!canSave) {
            setError("Please fill out all fields correctly before saving.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const ref = doc(db, "users", user.uid);

            await setDoc(
                ref,
                {
                    name: profile.name.trim(),
                    email: profile.email.trim(),
                    dateOfBirth: profile.dateOfBirth,
                    gender: profile.gender,
                    height: {
                        feet: profile.heightFeet,
                        inches: profile.heightInches,
                        cm: profile.heightCm,
                        unit: profile.heightUnit,
                    },
                    weight: {
                        pounds: profile.weightPounds,
                        kg: profile.weightKg,
                        unit: profile.weightUnit,
                    },
                    fitnessLevel: profile.fitnessLevel,
                    primaryGoal: profile.primaryGoal,
                    goal: profile.primaryGoal, // keep compatibility with old "goal" field
                    updatedAt: serverTimestamp(),
                },
                { merge: true },
            );

            setSuccess("Profile updated successfully ✨");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loadingUser) {
        return (
            <>
                <Head />
                    <title>Profile | HealthTrackerAI</title>
                </Head>
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
                    Loading profile...
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Head />
                    <title>Profile | HealthTrackerAI</title>
                </Head>
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
                    <div className="text-center space-y-4">
                        <p className="text-lg">
                            You need to be logged in to view this page.
                        </p>
                        <Link
                            href="/"
                            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
                        >
                            Go to Home
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head />
                <title>Profile | HealthTrackerAI</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex">
                {/* LEFT SIDEBAR */}
                <aside className="w-64 bg-gradient-to-b from-slate-950 to-slate-900 border-r border-white/10 p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-full bg-lime-400 flex items-center justify-center font-bold text-slate-900">
                            {user.displayName?.[0]?.toUpperCase() ||
                                user.email?.[0]?.toUpperCase() ||
                                "U"}
                        </div>
                        <div className="leading-tight">
                            <div className="text-xs text-gray-400">HELLO</div>
                            <div className="font-semibold">
                                {user.displayName || profile.name || "User"}
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-2 flex-1">
                        {[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Workouts", href: "/workouts" },
                            { label: "Nutrition", href: "/nutrition" },
                            { label: "Goals", href: "/goals" },
                            { label: "Profile", href: "/profile" },
                        ].map((item) => {
                            const active = item.href === "/profile";
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`block w-full text-left px-4 py-3 rounded-2xl text-sm font-medium transition ${active
                                            ? "bg-slate-100 text-slate-900 shadow-lg"
                                            : "text-gray-200 hover:bg-white/10"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-8 text-xs text-gray-500">Settings</div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 p-8 flex flex-col gap-6">
                    {/* Top bar */}
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-2xl font-bold">
                                Current Day: {currentDayLabel.weekday}
                            </h1>
                            <p className="text-sm text-gray-400">
                                {currentDayLabel.formatted}
                            </p>
                        </div>

                        <Button
                            className="bg-lime-400 text-slate-900 font-semibold rounded-full px-6"
                            onClick={() => auth.signOut()}
                        >
                            Logout
                        </Button>
                    </div>

                    {/* Profile Card */}
                    <div className="max-w-3xl">
                        <Card className="glass-strong bg-white/5 border border-white/15 shadow-2xl">
                            <CardHeader className="pb-0">
                                <h2 className="text-xl font-semibold">Personal Information</h2>
                            </CardHeader>
                            <CardBody className="space-y-5 pt-4">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">Name</label>
                                    <Input
                                        variant="bordered"
                                        size="lg"
                                        classNames={{
                                            inputWrapper:
                                                "bg-white/5 border-white/15 text-white h-12",
                                            input: "text-white",
                                        }}
                                        value={profile.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        placeholder="Your full name"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">Email</label>
                                    <Input
                                        isReadOnly
                                        variant="bordered"
                                        size="lg"
                                        classNames={{
                                            inputWrapper:
                                                "bg-white/5 border-white/15 text-gray-300 h-12",
                                            input: "text-gray-300",
                                        }}
                                        value={profile.email}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Email is linked to your account and cannot be changed here.
                                    </p>
                                </div>

                                {/* DOB */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">
                                        Date of Birth (18+ required)
                                    </label>
                                    <Input
                                        type="date"
                                        variant="bordered"
                                        size="lg"
                                        classNames={{
                                            inputWrapper:
                                                "bg-white/5 border-white/15 text-white h-12",
                                            input: "text-white",
                                        }}
                                        value={profile.dateOfBirth}
                                        max={maxDob || undefined}
                                        onChange={(e) =>
                                            handleChange("dateOfBirth", e.target.value)
                                        }
                                    />
                                    {!profile.dateOfBirth ? (
                                        <p className="text-xs text-gray-500">
                                            Please select your birthday.
                                        </p>
                                    ) : !isAtLeast18(profile.dateOfBirth) ? (
                                        <p className="text-xs text-red-400">
                                            You must be at least 18 years old to use this app.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-green-400">Age verified ✅</p>
                                    )}
                                </div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">Gender</label>
                                    <select
                                        className="w-full h-12 rounded-xl bg-white/5 border border-white/15 px-3 text-sm text-white outline-none focus:border-indigo-500"
                                        value={profile.gender}
                                        onChange={(e) => handleChange("gender", e.target.value)}
                                    >
                                        <option value="" className="bg-slate-900 text-gray-400">
                                            Select gender
                                        </option>
                                        <option value="male" className="bg-slate-900 text-white">
                                            Male
                                        </option>
                                        <option value="female" className="bg-slate-900 text-white">
                                            Female
                                        </option>
                                        <option
                                            value="prefer-not-to-say"
                                            className="bg-slate-900 text-white"
                                        >
                                            Prefer not to say
                                        </option>
                                    </select>
                                </div>

                                {/* Height */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-gray-300">Height</label>
                                        <div className="flex gap-1 p-1 bg-white/5 rounded-xl text-xs">
                                            <button
                                                type="button"
                                                className={`px-2 py-1 rounded-lg ${profile.heightUnit === "imperial"
                                                        ? "bg-indigo-500 text-white"
                                                        : "text-gray-300"
                                                    }`}
                                                onClick={() =>
                                                    handleChange("heightUnit", "imperial" as HeightUnit)
                                                }
                                            >
                                                ft / in
                                            </button>
                                            <button
                                                type="button"
                                                className={`px-2 py-1 rounded-lg ${profile.heightUnit === "metric"
                                                        ? "bg-indigo-500 text-white"
                                                        : "text-gray-300"
                                                    }`}
                                                onClick={() =>
                                                    handleChange("heightUnit", "metric" as HeightUnit)
                                                }
                                            >
                                                cm
                                            </button>
                                        </div>
                                    </div>

                                    {profile.heightUnit === "imperial" ? (
                                        <div className="flex gap-3">
                                            <Input
                                                type="number"
                                                placeholder="5"
                                                variant="bordered"
                                                size="lg"
                                                classNames={{
                                                    inputWrapper:
                                                        "bg-white/5 border-white/15 text-white h-12",
                                                    input: "text-white text-center",
                                                }}
                                                startContent={
                                                    <span className="text-gray-400 text-xs">ft</span>
                                                }
                                                value={profile.heightFeet}
                                                onChange={(e) =>
                                                    handleChange("heightFeet", e.target.value)
                                                }
                                            />
                                            <Input
                                                type="number"
                                                placeholder="4"
                                                variant="bordered"
                                                size="lg"
                                                classNames={{
                                                    inputWrapper:
                                                        "bg-white/5 border-white/15 text-white h-12",
                                                    input: "text-white text-center",
                                                }}
                                                startContent={
                                                    <span className="text-gray-400 text-xs">in</span>
                                                }
                                                value={profile.heightInches}
                                                onChange={(e) =>
                                                    handleChange("heightInches", e.target.value)
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <Input
                                            type="number"
                                            placeholder="165"
                                            variant="bordered"
                                            size="lg"
                                            classNames={{
                                                inputWrapper:
                                                    "bg-white/5 border-white/15 text-white h-12",
                                                input: "text-white text-center",
                                            }}
                                            startContent={
                                                <span className="text-gray-400 text-xs">cm</span>
                                            }
                                            value={profile.heightCm}
                                            onChange={(e) =>
                                                handleChange("heightCm", e.target.value)
                                            }
                                        />
                                    )}
                                </div>

                                {/* Weight */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-gray-300">Weight</label>
                                        <div className="flex gap-1 p-1 bg-white/5 rounded-xl text-xs">
                                            <button
                                                type="button"
                                                className={`px-2 py-1 rounded-lg ${profile.weightUnit === "imperial"
                                                        ? "bg-indigo-500 text-white"
                                                        : "text-gray-300"
                                                    }`}
                                                onClick={() =>
                                                    handleChange("weightUnit", "imperial" as WeightUnit)
                                                }
                                            >
                                                lbs
                                            </button>
                                            <button
                                                type="button"
                                                className={`px-2 py-1 rounded-lg ${profile.weightUnit === "metric"
                                                        ? "bg-indigo-500 text-white"
                                                        : "text-gray-300"
                                                    }
                        `}
                                                onClick={() =>
                                                    handleChange("weightUnit", "metric" as WeightUnit)
                                                }
                                            >
                                                kg
                                            </button>
                                        </div>
                                    </div>

                                    {profile.weightUnit === "imperial" ? (
                                        <Input
                                            type="number"
                                            placeholder="140"
                                            variant="bordered"
                                            size="lg"
                                            classNames={{
                                                inputWrapper:
                                                    "bg-white/5 border-white/15 text-white h-12",
                                                input: "text-white text-center",
                                            }}
                                            startContent={
                                                <span className="text-gray-400 text-xs">lbs</span>
                                            }
                                            value={profile.weightPounds}
                                            onChange={(e) =>
                                                handleChange("weightPounds", e.target.value)
                                            }
                                        />
                                    ) : (
                                        <Input
                                            type="number"
                                            placeholder="63"
                                            variant="bordered"
                                            size="lg"
                                            classNames={{
                                                inputWrapper:
                                                    "bg-white/5 border-white/15 text-white h-12",
                                                input: "text-white text-center",
                                            }}
                                            startContent={
                                                <span className="text-gray-400 text-xs">kg</span>
                                            }
                                            value={profile.weightKg}
                                            onChange={(e) =>
                                                handleChange("weightKg", e.target.value)
                                            }
                                        />
                                    )}
                                </div>

                                {/* Fitness Level */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">
                                        Fitness Level
                                    </label>
                                    <select
                                        className="w-full h-12 rounded-xl bg-white/5 border border-white/15 px-3 text-sm text-white outline-none focus:border-indigo-500"
                                        value={profile.fitnessLevel}
                                        onChange={(e) =>
                                            handleChange(
                                                "fitnessLevel",
                                                e.target.value as FitnessLevel,
                                            )
                                        }
                                    >
                                        <option value="" className="bg-slate-900 text-gray-400">
                                            Select level
                                        </option>
                                        <option
                                            value="beginner"
                                            className="bg-slate-900 text-white"
                                        >
                                            Beginner
                                        </option>
                                        <option
                                            value="moderate"
                                            className="bg-slate-900 text-white"
                                        >
                                            Moderate
                                        </option>
                                        <option
                                            value="intermediate"
                                            className="bg-slate-900 text-white"
                                        >
                                            Intermediate
                                        </option>
                                    </select>
                                </div>

                                {/* Primary Goal */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">
                                        Primary Goal
                                    </label>
                                    <select
                                        className="w-full h-12 rounded-xl bg-white/5 border border-white/15 px-3 text-sm text-white outline-none focus:border-indigo-500"
                                        value={profile.primaryGoal}
                                        onChange={(e) =>
                                            handleChange(
                                                "primaryGoal",
                                                e.target.value as PrimaryGoal,
                                            )
                                        }
                                    >
                                        <option value="" className="bg-slate-900 text-gray-400">
                                            Select goal
                                        </option>
                                        <option
                                            value="lose-weight"
                                            className="bg-slate-900 text-white"
                                        >
                                            Lose weight
                                        </option>
                                        <option
                                            value="gain-weight"
                                            className="bg-slate-900 text-white"
                                        >
                                            Gain weight
                                        </option>
                                        <option
                                            value="maintain-weight"
                                            className="bg-slate-900 text-white"
                                        >
                                            Maintain weight
                                        </option>
                                    </select>
                                </div>

                                {/* Messages */}
                                {error && (
                                    <div className="rounded-lg bg-red-500/15 border border-red-400/40 px-4 py-3 text-sm text-red-300">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/40 px-4 py-3 text-sm text-emerald-300">
                                        {success}
                                    </div>
                                )}

                                {/* Save */}
                                <div className="pt-2 flex justify-end">
                                    <Button
                                        className={`btn-ai-primary px-8 font-semibold h-11 ${!canSave ? "opacity-60 cursor-not-allowed" : ""
                                            }`}
                                        disabled={saving || !canSave}
                                        isLoading={saving}
                                        onClick={handleSave}
                                    >
                                        Save Profile
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </main>
            </div>
        </>
    );
}