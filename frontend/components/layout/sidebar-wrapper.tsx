import { auth } from "@/lib/auth";
import { Sidebar } from "./sidebar";

export async function SidebarWrapper() {
  const session = await auth();

  return (
    <Sidebar
      userRole={session?.user?.role}
      username={session?.user?.username}
    />
  );
}
