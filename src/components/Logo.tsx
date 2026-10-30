import { Fish } from "lucide-react";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${size === "lg" ? "text-2xl" : "text-lg"}`}>
      <Fish className="text-brand" size={size === "lg" ? 28 : 22} aria-hidden />
      PhishCatch
    </span>
  );
}
