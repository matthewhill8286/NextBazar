import DashboardShell from "./dashboard-shell";

export const metadata = {
  title: "Dashboard — NextBazar",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
