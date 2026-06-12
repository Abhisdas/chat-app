import React, { createContext, useContext, useState } from "react";
import * as RealClerk from "@clerk/clerk-react";

// Determine if Clerk keys are configured
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isMockMode = !PUBLISHABLE_KEY || PUBLISHABLE_KEY.startsWith("your_");

const MockAuthContext = createContext(null);

export const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("talenthunt_mock_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (name, email) => {
    const clerkId = "mock_user_" + Math.random().toString(36).substring(2, 9);
    const mockUser = {
      id: clerkId,
      clerkId: clerkId,
      firstName: name.split(" ")[0] || "Guest",
      lastName: name.split(" ").slice(1).join(" ") || "User",
      fullName: name,
      email: email,
      primaryEmailAddress: { emailAddress: email },
      imageUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
    };
    localStorage.setItem("talenthunt_mock_user", JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem("talenthunt_mock_user");
    setUser(null);
  };

  return (
    <MockAuthContext.Provider value={{ user, login, logout, isSignedIn: !!user }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const ClerkProvider = ({ children, ...props }) => {
  if (isMockMode) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }
  return <RealClerk.ClerkProvider {...props}>{children}</RealClerk.ClerkProvider>;
};

export const useUser = () => {
  if (isMockMode) {
    const context = useContext(MockAuthContext);
    if (!context) return { isLoaded: true, isSignedIn: false, user: null };
    return {
      isLoaded: true,
      isSignedIn: context.isSignedIn,
      user: context.user,
    };
  }
  return RealClerk.useUser();
};

export const useAuth = () => {
  if (isMockMode) {
    const context = useContext(MockAuthContext);
    if (!context) return { isLoaded: true, isSignedIn: false, userId: null, getToken: async () => "" };
    return {
      isLoaded: true,
      isSignedIn: context.isSignedIn,
      userId: context.user?.id || null,
      getToken: async () => "mock-token",
    };
  }
  return RealClerk.useAuth();
};

export const SignInButton = ({ children, mode }) => {
  if (isMockMode) {
    const { login } = useContext(MockAuthContext);
    const handleClick = () => {
      const name = prompt("Enter your name to sign in to Talent Hunt (Mock Mode):", "Developer One");
      if (name && name.trim()) {
        login(name.trim(), `${name.trim().toLowerCase().replace(/\s+/g, "")}@example.com`);
      }
    };
    if (React.isValidElement(children)) {
      return React.cloneElement(children, { onClick: handleClick });
    }
    return <button onClick={handleClick} className="btn btn-primary">Sign In</button>;
  }
  return <RealClerk.SignInButton mode={mode}>{children}</RealClerk.SignInButton>;
};

export const SignUpButton = ({ children, mode }) => {
  if (isMockMode) {
    return <SignInButton mode={mode}>{children}</SignInButton>;
  }
  return <RealClerk.SignUpButton mode={mode}>{children}</RealClerk.SignUpButton>;
};

export const UserButton = () => {
  if (isMockMode) {
    const { user, logout } = useContext(MockAuthContext);
    if (!user) return null;
    return (
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar border border-primary/20">
          <div className="w-10 rounded-full">
            <img alt="User Avatar" src={user.imageUrl} />
          </div>
        </div>
        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[50] p-3 shadow-lg bg-base-100 rounded-2xl w-60 border border-base-200">
          <li className="px-4 py-2 flex flex-col items-start gap-0.5">
            <span className="font-bold text-base text-base-content">{user.fullName}</span>
            <span className="text-xs text-base-content/60 font-medium">{user.primaryEmailAddress.emailAddress}</span>
          </li>
          <div className="divider my-1"></div>
          <li>
            <button onClick={logout} className="text-error font-medium hover:bg-error/10 hover:text-error py-2.5 rounded-xl">
              Sign Out
            </button>
          </li>
        </ul>
      </div>
    );
  }
  return <RealClerk.UserButton />;
};
