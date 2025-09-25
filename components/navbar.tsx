"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { Tooltip } from "@heroui/tooltip";
import NextLink from "next/link";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "../lib/firebase";
import { useAuth } from "../providers/AuthProvider";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  GithubIcon,
  SearchIcon,
  Logo,
  MenuIcon,
  CloseIcon,
} from "@/components/icons";
import MultiStepSignup from "@/components/MultiStepSignup";

interface NavbarProps {
  // props are now optional; real auth comes from context
  loggedIn?: boolean;
  setLoggedIn?: (loggedIn: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, loading } = useAuth(); // <-- live auth state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showMultiStepSignup, setShowMultiStepSignup] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ui state
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErr(null);
    setSubmitting(false);
  };

  const handleMultiStepSuccess = () => {
    setShowMultiStepSignup(false);
    setIsLoginOpen(false);
    resetForm();
  };

  const openMultiStepSignup = () => {
    setShowMultiStepSignup(true);
    setIsLoginOpen(false);
  };

  const closeMultiStepSignup = () => {
    setShowMultiStepSignup(false);
    setIsLoginOpen(true);
  };

  const [loggingOut, setLoggingOut] = useState(false);

  const handlePrimary = useCallback(async () => {
    setErr(null);
    setSubmitting(true);
    try {
      if (activeTab === "login") {
        if (!email || !password)
          throw new Error("Please enter email and password.");
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!email || !password)
          throw new Error("Please enter email and password.");
        if (password.length < 6)
          throw new Error("Password must be at least 6 characters.");
        if (password !== confirmPassword)
          throw new Error("Passwords do not match.");
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setIsLoginOpen(false);
      resetForm();
    } catch (e: any) {
      // friendly messages for common Firebase errors
      const code = e?.code || "";
      const map: Record<string, string> = {
        "auth/invalid-email": "Invalid email address.",
        "auth/user-disabled": "This user is disabled.",
        "auth/user-not-found": "No account with that email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/email-already-in-use": "Email already in use.",
        "auth/weak-password": "Password is too weak.",
      };

      setErr(
        map[code] || e?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [activeTab, email, password, confirmPassword]);

  const handleGoogleSignIn = useCallback(async () => {
    setErr(null);
    setSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);
      setIsLoginOpen(false);
      resetForm();
    } catch (e: any) {
      const code = e?.code || "";
      const map: Record<string, string> = {
        "auth/popup-closed-by-user": "Sign-in cancelled.",
        "auth/popup-blocked": "Popup blocked by browser.",
        "auth/cancelled-popup-request": "Sign-in was cancelled.",
      };

      setErr(
        map[code] || e?.message || "Google sign-in failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth); // end Firebase session
      router.refresh(); // force re-render of server/components using auth
    } catch {
      // optional: toast or console.error(e);
    } finally {
      setLoggingOut(false);
    }
  };

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
    <HeroUINavbar
      isBordered
      className={clsx(
        "backdrop-blur-xl bg-white/5 border-b border-white/10 transition-all duration-300 z-50 fixed top-0 left-0 right-0",
      )}
      classNames={{
        item: [
          "flex",
          "relative",
          "h-full",
          "items-center",
          "data-[active=true]:after:content-['']",
          "data-[active=true]:after:absolute",
          "data-[active=true]:after:bottom-0",
          "data-[active=true]:after:left-0",
          "data-[active=true]:after:right-0",
          "data-[active=true]:after:h-[2px]",
          "data-[active=true]:after:rounded-[2px]",
          "data-[active=true]:after:bg-primary",
        ],
        menu: [
          "fixed",
          "inset-0",
          "z-[60]",
          "w-screen",
          "h-screen",
          "backdrop-blur-xl",
          "bg-black/40",
        ],
        menuItem: ["w-full"],
      }}
      height="64px"
      isMenuOpen={isMenuOpen}
      maxWidth="full"
      position="sticky"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-2 sm:gap-3 max-w-fit">
          <NextLink
            className="flex justify-start items-center gap-2 group"
            href="/"
          >
            <div className="relative">
              <Logo className="w-6 h-6 sm:w-8 sm:h-8" />
              <div className="absolute inset-0 bg-ai-gradient rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <p className="font-bold text-white text-sm sm:text-lg gradient-text">
                HealthTrackerAI
              </p>
              <p className="text-xs text-gray-400 hidden sm:block">
                AI-Powered Healthcare
              </p>
            </div>
          </NextLink>
        </NavbarBrand>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex gap-6 justify-start ml-8">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  "text-gray-300 hover:text-white transition-all duration-300 font-medium relative group",
                  "hover:scale-105 px-2 py-1 rounded-lg hover:bg-white/10",
                )}
                href={item.href}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-ai-gradient transition-all duration-300 group-hover:w-full" />
              </NextLink>
            </NavbarItem>
          ))}
          {/* Admin link - only visible to admin user */}
          {user && user.email === "new.roeepalmon@gmail.com" && (
            <NavbarItem>
              <NextLink
                className={clsx(
                  "text-gray-300 hover:text-white transition-all duration-300 font-medium relative group",
                  "hover:scale-105 px-2 py-1 rounded-lg hover:bg-white/10",
                )}
                href="/admin"
              >
                Admin
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-ai-gradient-accent transition-all duration-300 group-hover:w-full" />
              </NextLink>
            </NavbarItem>
          )}
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden md:flex gap-3">
          <Link
            isExternal
            className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 p-2 rounded-lg hover:bg-white/10"
            href={siteConfig.links.github}
            title="GitHub"
          >
            <GithubIcon className="w-5 h-5" />
          </Link>
          <ThemeSwitch />
        </NavbarItem>

        {/* Right side auth controls */}
        {!loading && !user ? (
          <NavbarItem>
            <Button
              className="btn-ai-primary text-sm px-4 sm:px-6 py-2 font-medium min-h-[36px] sm:min-h-[40px]"
              size="sm"
              onPress={() => setIsLoginOpen(true)}
            >
              <span className="hidden sm:inline">Login / Signup</span>
              <span className="sm:hidden">Login</span>
            </Button>
          </NavbarItem>
        ) : (
          <NavbarItem>
            {user && (
              <Tooltip
                className="backdrop-blur-xl bg-white/10 border border-white/20 p-0 shadow-2xl"
                content={
                  <div className="flex flex-col gap-0 p-4 min-w-[200px]">
                    <div className="text-center mb-3 pb-3 border-b border-white/10">
                      <p className="font-semibold text-white text-sm">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        className="justify-start bg-transparent hover:bg-white/10 text-white text-sm h-8"
                        size="sm"
                        variant="light"
                        onPress={() => router.push("/profile")}
                      >
                        Edit Profile
                      </Button>
                      <Button
                        className="justify-start bg-transparent hover:bg-red-500/20 text-red-400 text-sm h-8"
                        color="danger"
                        isDisabled={loggingOut}
                        isLoading={loggingOut}
                        size="sm"
                        variant="light"
                        onPress={handleLogout}
                      >
                        {loggingOut ? "Logging out..." : "Logout"}
                      </Button>
                    </div>
                  </div>
                }
                placement="bottom-end"
              >
                <div
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-ai-gradient text-white font-semibold cursor-pointer hover:scale-105 transition-all duration-300 animate-glow"
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push("/profile")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push("/profile");
                    }
                  }}
                >
                  {/* display user avatar */}
                  <span
                    aria-label={`${(user.displayName || user.email || "U")
                      .charAt(0)
                      .toUpperCase()} avatar`}
                    className="text-sm font-bold"
                    role="img"
                  >
                    {(user.displayName || user.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              </Tooltip>
            )}
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <div className="flex items-center gap-3">
          <ThemeSwitch />
          <button
            aria-label={
              isMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            className="text-white hover:bg-white/10 rounded-lg p-2 transition-colors w-10 h-10 flex items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </NavbarContent>

      <NavbarMenu className="fixed inset-0 z-[60] w-screen h-screen backdrop-blur-xl bg-black/80 pt-4 pb-6 overflow-y-auto">
        {/* Mobile Header with branding */}
        <div className="flex items-center justify-between mx-4 mb-8 pb-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Logo className="w-8 h-8" />
              <div className="absolute inset-0 bg-ai-gradient rounded-full blur-lg opacity-30" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg gradient-text">
                HealthTrackerAI
              </span>
              <span className="text-gray-400 text-xs">
                AI-Powered Healthcare
              </span>
            </div>
          </div>
          <button
            aria-label="Close navigation menu"
            className="text-white hover:bg-white/10 rounded-lg p-2 transition-colors w-10 h-10 flex items-center justify-center"
            onClick={() => setIsMenuOpen(false)}
          >
            <CloseIcon size={24} />
          </button>
        </div>

        {/* Mobile Search */}
        <div className="mx-4 mb-8">{searchInput}</div>

        {/* Mobile User Profile Section */}
        {user && (
          <div className="mx-4 mb-6">
            <div className="flex items-center gap-3 p-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-ai-gradient text-white font-bold text-lg">
                {(
                  user?.displayName?.[0] ||
                  user?.email?.[0] ||
                  "?"
                ).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-white font-semibold text-sm truncate">
                  {user?.displayName || "User"}
                </span>
                <span className="text-gray-400 text-xs truncate">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="mx-4 flex flex-col gap-1">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <NextLink
                className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 text-base font-medium py-3 px-4 rounded-xl w-full block"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarMenuItem>
          ))}
          {/* Admin link - only visible to admin user in mobile menu */}
          {user && user.email === "new.roeepalmon@gmail.com" && (
            <NavbarMenuItem>
              <NextLink
                className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 text-base font-medium py-3 px-4 rounded-xl w-full block"
                href="/admin"
              >
                Admin
              </NextLink>
            </NavbarMenuItem>
          )}
        </div>

        {/* Action Buttons Section */}
        <div className="border-t border-white/10 mt-6 pt-6 mx-4">
          {/* Social Links */}
          <div className="mb-6">
            <Link
              isExternal
              className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 py-3 px-4 rounded-xl"
              href={siteConfig.links.github}
            >
              <GithubIcon className="w-5 h-5" />
              <span className="text-base font-medium">GitHub</span>
            </Link>
          </div>

          {/* Auth Buttons */}
          {!loading && !user ? (
            <div className="space-y-3">
              <Button
                className="btn-ai-primary w-full text-base font-medium py-4 h-12"
                onPress={() => setIsLoginOpen(true)}
              >
                Login / Signup
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button
                className="backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 w-full h-12 text-base"
                variant="bordered"
                onPress={() => router.push("/profile")}
              >
                View Profile
              </Button>
              <Button
                className="backdrop-blur-xl bg-red-500/10 border border-red-400/30 text-red-400 hover:bg-red-500/20 w-full h-12 text-base"
                isDisabled={loggingOut}
                isLoading={loggingOut}
                variant="bordered"
                onPress={handleLogout}
              >
                {loggingOut ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          )}
        </div>
      </NavbarMenu>

      {/* Auth modal */}
      <Modal
        classNames={{
          base: "backdrop-blur-2xl bg-slate-900/95 border border-white/20 shadow-2xl",
          body: "py-8 px-6",
          header: "border-b border-white/10 pb-6 px-6",
          footer: "border-t border-white/10 pt-6 px-6",
          backdrop: "bg-black/60 backdrop-blur-sm",
        }}
        isOpen={isLoginOpen}
        placement="center"
        size="lg"
        onOpenChange={(o) => {
          setIsLoginOpen(o);
          if (!o) resetForm();
        }}
      >
        <ModalContent className="text-white">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600 bg-clip-text text-transparent">
                  {activeTab === "login"
                    ? "Welcome Back"
                    : "Join HealthTrackerAI"}
                </h2>
                <p className="text-gray-400 font-normal leading-relaxed">
                  {activeTab === "login"
                    ? "Sign in to access your personalized AI health dashboard and continue your wellness journey"
                    : "Create your account to unlock AI-powered health insights and personalized recommendations"}
                </p>
              </ModalHeader>
              <ModalBody>
                <Tabs
                  aria-label="Login/Signup tabs"
                  classNames={{
                    tabList:
                      "backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 w-full shadow-lg relative overflow-hidden",
                    cursor:
                      "bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 shadow-2xl rounded-xl border-2 border-white/30 transition-all duration-500 ease-out transform",
                    tab: "text-gray-400 hover:text-gray-200 transition-all duration-300 px-8 py-4 rounded-xl font-medium relative z-10 border-2 border-transparent hover:border-white/20",
                    tabContent:
                      "group-data-[selected=true]:text-white group-data-[selected=true]:font-bold group-data-[selected=true]:drop-shadow-lg group-data-[selected=true]:scale-105 transition-all duration-500 ease-out relative z-20",
                  }}
                  selectedKey={activeTab}
                  variant="solid"
                  onSelectionChange={(key) =>
                    setActiveTab(key as "login" | "signup")
                  }
                >
                  <Tab key="login" title="Sign In">
                    <div className="flex flex-col gap-6 mt-6">
                      <Input
                        isRequired
                        classNames={{
                          base: "text-white",
                          input:
                            "text-white placeholder:text-gray-400 text-base px-4",
                          inputWrapper:
                            "backdrop-blur-xl bg-white/5 border border-white/20 hover:border-indigo-400/50 group-data-[focused=true]:border-indigo-500 transition-all duration-200 h-12",
                        }}
                        placeholder="Enter your email address"
                        type="email"
                        value={email}
                        variant="bordered"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Input
                        isRequired
                        classNames={{
                          base: "text-white",
                          input:
                            "text-white placeholder:text-gray-400 text-base px-4",
                          inputWrapper:
                            "backdrop-blur-xl bg-white/5 border border-white/20 hover:border-indigo-400/50 group-data-[focused=true]:border-indigo-500 transition-all duration-200 h-12",
                        }}
                        placeholder="Enter your password"
                        type="password"
                        value={password}
                        variant="bordered"
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </Tab>
                  <Tab key="signup" title="Create Account">
                    <div className="flex flex-col gap-6 mt-6 text-center">
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">
                          Get Personalized Health Insights
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          Create your profile with health metrics to unlock
                          AI-powered recommendations tailored just for you.
                        </p>
                      </div>

                      <Button
                        className="btn-ai-primary h-14 text-lg font-semibold"
                        size="lg"
                        onPress={openMultiStepSignup}
                      >
                        Create Your Health Profile
                      </Button>

                      <div className="text-xs text-gray-500">
                        Takes less than 2 minutes • Secure & Private
                      </div>
                    </div>
                  </Tab>
                </Tabs>

                <div className="flex flex-col gap-4 mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-transparent px-2 text-gray-400">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <Button
                    className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium h-14 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg"
                    isDisabled={submitting}
                    isLoading={submitting}
                    size="lg"
                    startContent={
                      <div className="bg-white rounded-full p-1">
                        <svg
                          className="w-5 h-5 text-gray-700"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      </div>
                    }
                    variant="bordered"
                    onPress={handleGoogleSignIn}
                  >
                    <span className="text-base">Continue with Google</span>
                  </Button>
                </div>

                {err && (
                  <div className="glass-strong border-red-400/30 bg-red-500/10 p-3 rounded-xl mt-4">
                    <p className="text-red-400 text-sm">{err}</p>
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="px-8 pb-8 pt-4">
                <Button
                  className="backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium h-12 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                  size="lg"
                  variant="bordered"
                  onPress={() => {
                    onClose();
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold h-12 rounded-xl shadow-xl transition-all duration-200 hover:scale-[1.02] border-0"
                  isDisabled={submitting}
                  isLoading={submitting}
                  size="lg"
                  onPress={handlePrimary}
                >
                  {activeTab === "login" ? "Sign In" : "Create Account"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Multi-Step Signup Modal */}
      <Modal
        hideCloseButton
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          wrapper: "items-center justify-center p-4",
        }}
        isOpen={showMultiStepSignup}
        placement="center"
        onOpenChange={setShowMultiStepSignup}
      >
        <ModalContent className="bg-transparent shadow-none border-0 max-w-lg w-full">
          <MultiStepSignup
            onClose={closeMultiStepSignup}
            onSuccess={handleMultiStepSuccess}
          />
        </ModalContent>
      </Modal>
    </HeroUINavbar>
  );
};
