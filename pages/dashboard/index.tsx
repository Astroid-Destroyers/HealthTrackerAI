// pages/dashboard/index.tsx
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/router";
import {
    getFirestore,
    doc,
    getDoc,
    increment,
    serverTimestamp,
} from "firebase/firestore";
import { app } from "@/lib/firebase"; 