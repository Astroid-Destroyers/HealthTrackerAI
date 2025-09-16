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
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../providers/AuthProvider";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../lib/firebase";

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
    const router = useRouter();


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
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">HealthTrackerAI</p>
          </NextLink>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
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
       {/* Right side auth controls */}
{!loading && !user ? (
  <NavbarItem>
    <Button color="primary" variant="flat" onPress={() => setIsLoginOpen(true)}>
      Login / Signup
    </Button>
  </NavbarItem>
) : (
  <NavbarItem className="flex items-center gap-2">
    <Button
      color="danger"
      variant="flat"
      isLoading={loggingOut}
      isDisabled={loggingOut}
      onPress={handleLogout}
    >
      Logout
    </Button>
    {user && (
      <Tooltip content={user.displayName || user.email || "User"} placement="bottom">
        <div
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white font-semibold cursor-pointer hover:opacity-80 transition-opacity"
        >
          {(user.displayName?.[0] || user.email?.[0] || "?").toUpperCase()}
        </div>
      </Tooltip>
    )}
  </NavbarItem>
)}

      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {searchInput}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={
                  index === 2
                    ? "primary"
                    : index === siteConfig.navItems.length - 1
                    ? "danger"
                    : "foreground"
                }
                href={item.href}
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
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
