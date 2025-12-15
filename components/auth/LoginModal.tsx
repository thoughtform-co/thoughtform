"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { signInWithEmail } from "@/lib/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmail(email, password);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-sm"
          >
            <div className="bg-surface-1 border border-dawn-08 p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="font-mono text-2xs uppercase tracking-widest text-gold mb-2">
                  {`// Authentication`}
                </div>
                <h2 className="font-mono text-xl text-dawn uppercase tracking-wide">
                  Sign In
                </h2>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-mono text-2xs uppercase tracking-widest text-dawn-50 mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={cn(
                      "w-full px-4 py-3 bg-void border border-dawn-15",
                      "font-mono text-sm text-dawn",
                      "placeholder:text-dawn-30",
                      "focus:outline-none focus:border-gold",
                      "transition-colors"
                    )}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="font-mono text-2xs uppercase tracking-widest text-dawn-50 mb-2 block">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={cn(
                      "w-full px-4 py-3 bg-void border border-dawn-15",
                      "font-mono text-sm text-dawn",
                      "placeholder:text-dawn-30",
                      "focus:outline-none focus:border-gold",
                      "transition-colors"
                    )}
                    placeholder="••••••••"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="text-sm text-red-400 font-mono">
                    {error}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                      "flex-1 px-4 py-3",
                      "font-mono text-2xs uppercase tracking-wider",
                      "bg-transparent border border-dawn-15 text-dawn-50",
                      "hover:border-dawn-30 hover:text-dawn",
                      "transition-colors"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      "flex-1 px-4 py-3",
                      "font-mono text-2xs uppercase tracking-wider",
                      "bg-gold border border-gold text-void",
                      "hover:bg-gold-70",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-colors"
                    )}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

