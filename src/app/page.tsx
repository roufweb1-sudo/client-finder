"use client";

import FindLeads from "@/components/FindLeads";
import Landing from "@/components/Landing";
import { useAuth } from "@/lib/storage";

/** Visitors see the landing page; logged-in users get the lead finder. */
export default function HomePage() {
  const { session } = useAuth();
  return session ? <FindLeads /> : <Landing />;
}
