"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { Tooltip } from "@heroui/tooltip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

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
import { GithubIcon, SearchIcon, Logo } from "@/components/icons";

interface NavbarProps {
  // props are now optional; real auth comes from context
  loggedIn?: boolean;
  setLoggedIn?: (loggedIn: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, loading } = useAuth(); // <-- live auth state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const [loggingOut, setLoggingOut] = useState(false);

  // Handle mobile navigation - close menu after navigation
  const handleMobileNavigation = (href: string) => {
    setIsMenuOpen(false);
    router.push(href);
  };


  const handlePrimary = useCallback(async () => {
    setErr(null);
    setSubmitting(true);
    try {
      if (activeTab === "login") {
        if (!email || !password) throw new Error("Please enter email and password.");
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!email || !password) throw new Error("Please enter email and password.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
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
      setErr(map[code] || e?.message || "Something went wrong. Please try again.");
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
      setErr(map[code] || e?.message || "Google sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);        // end Firebase session
      router.refresh();           // force re-render of server/components using auth
    } catch (e) {
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
      startContent={<SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />}
      type="search"
    />
  );

  return (
    <HeroUINavbar maxWidth="xl" position="sticky" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2" href="/">
            <Logo />
            <span className="font-extrabold text-lg tracking-tight text-primary">HealthTrackerAI</span>
          </NextLink>
        </NavbarBrand>
        <div className="hidden lg:flex gap-6 justify-start ml-4 items-center">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "hover:text-primary transition-colors font-semibold text-base px-2 py-1 rounded-md"
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
          {/* Admin dropdown - only visible to admin user */}
          {user && user.email === "new.roeepalmon@gmail.com" && (
            <NavbarItem className="flex gap-2 items-center">
              <Button
                color="primary"
                variant="solid"
                className="font-bold text-base px-4 py-2 rounded-md shadow-sm hover:bg-primary/80 transition-colors"
                startContent={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
                onPress={() => router.push("/admin")}
              >
                Admin Panel
              </Button>
              <div
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
                className="relative"
              >
                <Dropdown 
                  showArrow 
                  isOpen={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                  placement="bottom-start"
                  className="min-w-[220px] shadow-lg rounded-lg border border-default-200 bg-background"
                >
                  <DropdownTrigger>
                    <Button
                      variant="light"
                      className={clsx(
                        linkStyles({ color: "foreground" }),
                        "flex items-center gap-2 px-4 py-2 h-auto min-w-0 font-bold text-base rounded-md hover:bg-default-100 transition-colors"
                      )}
                      endContent={
                        <svg 
                          className={clsx(
                            "w-5 h-5 transition-transform duration-200",
                            isDropdownOpen && "rotate-180"
                          )}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      }
                    >
                      More
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu 
                    aria-label="Admin actions"
                    className="w-[220px]"
                    itemClasses={{
                      base: "gap-2 text-base font-medium",
                    }}
                  >
                    <DropdownItem 
                      key="tickets" 
                      onPress={() => router.push("/admin/tickets")}
                      startContent={
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      }
                    >
                      Support Tickets
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </NavbarItem>
          )}
        </div>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
        <NavbarItem className="hidden sm:flex gap-2">
          <Link isExternal href={siteConfig.links.github} title="GitHub">
            <GithubIcon className="text-default-500" />
          </Link>
          <ThemeSwitch />
        </NavbarItem>

        {/* Right side auth controls */}
        {!loading && !user ? (
          <NavbarItem>
            <Button color="primary" variant="flat" onPress={() => setIsLoginOpen(true)}>
              Login / Signup
            </Button>
          </NavbarItem>
        ) : (
          <NavbarItem>
            {user && (
              <Tooltip
                content={
                  <div className="flex flex-col gap-3 p-3 min-w-[180px] text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-base text-primary">
                        {user.displayName || "User"}
                      </span>
                      <span className="text-xs text-default-500 break-all">
                        {user.email ? user.email.replace(/'/g, "&apos;") : ""}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <Button
                        className="justify-center font-semibold"
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => router.push("/profile")}
                      >
                        Edit Profile
                      </Button>
                      <Button
                        className="justify-center font-semibold"
                        color="danger"
                        isDisabled={loggingOut}
                        isLoading={loggingOut}
                        size="sm"
                        variant="flat"
                        onPress={handleLogout}
                      >
                        {loggingOut ? "Logging out..." : "Logout"}
                      </Button>
                    </div>
                  </div>
                }
                placement="bottom"
              >
                <div
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white font-extrabold text-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-primary/30 shadow-sm"
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
                    className="text-lg font-extrabold"
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
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="hidden md:block mb-4">
          {searchInput}
        </div>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <button
                className={clsx(
                  linkStyles({
                    color: index === 2
                      ? "primary"
                      : index === siteConfig.navItems.length - 1
                      ? "danger"
                      : "foreground"
                  }),
                  "text-lg w-full text-left",
                )}
                onClick={() => handleMobileNavigation(item.href)}
              >
                {item.label}
              </button>
            </NavbarMenuItem>
          ))}
          {/* Admin menu items - only visible to admin user in mobile menu */}
          {user && user.email === "new.roeepalmon@gmail.com" && (
            <>
              <NavbarMenuItem>
                <div className="flex items-center gap-2 px-2 py-1 text-sm font-semibold text-default-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admin Panel
                </div>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <button
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "text-lg w-full text-left flex items-center gap-3 pl-6",
                  )}
                  onClick={() => handleMobileNavigation("/admin/tickets")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Support Tickets
                </button>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <button
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "text-lg w-full text-left flex items-center gap-3 pl-6",
                  )}
                  onClick={() => handleMobileNavigation("/admin/users")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  Manage Users
                </button>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <button
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "text-lg w-full text-left flex items-center gap-3 pl-6",
                  )}
                  onClick={() => handleMobileNavigation("/admin/analytics")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </button>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <button
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "text-lg w-full text-left flex items-center gap-3 pl-6",
                  )}
                  onClick={() => handleMobileNavigation("/admin/settings")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
              </NavbarMenuItem>
            </>
          )}
          
          {/* Mobile Auth Controls */}
          <div className="border-t border-default-200 mt-4 pt-4">
            <NavbarMenuItem className="mb-2">
              <Link 
                isExternal 
                href={siteConfig.links.github}
                className="flex items-center gap-2"
              >
                <GithubIcon className="text-default-500" />
                GitHub
              </Link>
            </NavbarMenuItem>
            
            {!loading && !user ? (
              <NavbarMenuItem>
                <Button 
                  color="primary" 
                  variant="flat" 
                  className="w-full" 
                  onPress={() => setIsLoginOpen(true)}
                >
                  Login / Signup
                </Button>
              </NavbarMenuItem>
            ) : (
              <div className="flex flex-col gap-2">
                <NavbarMenuItem>
                  <div className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white font-semibold">
                      {(user?.displayName?.[0] || user?.email?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user?.displayName || "User"}
                      </span>
                      <span className="text-xs text-default-500">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </NavbarMenuItem>
                <NavbarMenuItem>
                  <Button
                    color="primary"
                    variant="flat"
                    className="w-full"
                    onPress={() => handleMobileNavigation("/profile")}
                  >
                    View Profile
                  </Button>
                </NavbarMenuItem>
                <NavbarMenuItem>
                  <Button
                    color="danger"
                    variant="flat"
                    className="w-full"
                    isDisabled={loggingOut}
                    isLoading={loggingOut}
                    onPress={handleLogout}
                  >
                    Logout
                  </Button>
                </NavbarMenuItem>
              </div>
            )}
          </div>
        </div>
      </NavbarMenu>

      {/* Auth modal */}
      <Modal isOpen={isLoginOpen} onOpenChange={(o) => { setIsLoginOpen(o); if (!o) resetForm(); }}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {activeTab === "login" ? "Log in" : "Sign up"}
              </ModalHeader>
              <ModalBody>
                <Tabs
                  aria-label="Login/Signup tabs"
                  className="flex justify-center"
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(key as "login" | "signup")}
                  variant="solid"
                >
                  <Tab key="login" title="Login">
                    <div className="flex flex-col gap-4">
                      <Input
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        variant="bordered"
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        isRequired
                      />
                      <Input
                        label="Password"
                        placeholder="Enter your password"
                        type="password"
                        value={password}
                        variant="bordered"
                        onChange={(e) => setPassword(e.target.value)}
                        isRequired
                      />
                    </div>
                  </Tab>
                  <Tab key="signup" title="Sign Up">
                    <div className="flex flex-col gap-4">
                      <Input
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        variant="bordered"
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        isRequired
                      />
                      <Input
                        label="Password"
                        placeholder="Enter your password (min 6 chars)"
                        type="password"
                        value={password}
                        variant="bordered"
                        onChange={(e) => setPassword(e.target.value)}
                        isRequired
                      />
                      <Input
                        label="Confirm Password"
                        placeholder="Confirm your password"
                        type="password"
                        value={confirmPassword}
                        variant="bordered"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        isRequired
                      />
                    </div>
                  </Tab>
                </Tabs>

                <div className="flex flex-col gap-3 mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <Button
                    variant="bordered"
                    onPress={handleGoogleSignIn}
                    isDisabled={submitting}
                    isLoading={submitting}
                    className="w-full"
                    startContent={
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    }
                  >
                    Continue with Google
                  </Button>
                </div>

                {err && <p className="text-danger text-sm mt-2">{err}</p>}
              </ModalBody>

              <ModalFooter>
                <Button color="default" variant="flat" onPress={() => { onClose(); resetForm(); }}>
                  Close
                </Button>
                <Button
                  color="primary"
                  isDisabled={submitting}
                  isLoading={submitting}
                  onPress={handlePrimary}
                >
                  {activeTab === "login" ? "Sign in" : "Register"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </HeroUINavbar>
  );
};
