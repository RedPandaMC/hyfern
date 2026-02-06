import { auth } from "@/lib/auth";
import { Header } from "./header";

interface HeaderWrapperProps {
  pageTitle?: string;
}

export async function HeaderWrapper({ pageTitle }: HeaderWrapperProps) {
  const session = await auth();

  // TODO: Fetch server status and stats from API
  const serverStatus = "online" as const;
  const playersOnline = 5;
  const maxPlayers = 20;
  const tps = 19.8;

  return (
    <Header
      pageTitle={pageTitle}
      serverStatus={serverStatus}
      playersOnline={playersOnline}
      maxPlayers={maxPlayers}
      tps={tps}
      username={session?.user?.username}
    />
  );
}
