import { useRouter } from "expo-router";
import App from "../../App";

const paths = {
  Home: "/",
  Discover: "/discover",
  Daily: "/daily",
  Connect: "/connect",
  Tools: "/tools",
  Privacy: "/privacy",
  Profile: "/profile",
} as const;

export default function Screen() {
  const router = useRouter();
  return <App initialTab="Connect" onNavigate={(next) => router.navigate(paths[next] as never)} />;
}
