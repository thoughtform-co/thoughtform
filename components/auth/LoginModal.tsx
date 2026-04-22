"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CelestialAuthShell } from "./CelestialAuthShell";
import "@/components/auth/celestial-auth.css";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(10, 9, 8, 0.85)", backdropFilter: "blur(4px)" }}
          />

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-1/2 left-1/2 z-[101] w-full max-w-[420px] px-4"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <CelestialAuthShell variant="compact" onSuccess={onSuccess} onCancel={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
