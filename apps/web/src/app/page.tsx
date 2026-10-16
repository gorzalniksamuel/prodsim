import { SystemStatus } from "@/features/system/system-status";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <SystemStatus />
    </main>
  );
}
