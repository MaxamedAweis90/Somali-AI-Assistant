import { RootRouteShell } from "@/components/app/root-route-shell";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <RootRouteShell>{children}</RootRouteShell>;
}