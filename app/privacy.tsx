import { useRouter } from "expo-router";
import App from "../App";

const paths = {
  Home: "/",
  Discover: "/discover",
  Daily: "/daily",
  Connect: "/connect",
  Tools: "/tools",
  Profile: "/profile",
  Privacy: "/privacy",
} as const;

export default function PrivacyScreen() {
  const router = useRouter();
  return <App initialTab="Privacy" onNavigate={(next) => router.navigate(paths[next] as never)} />;
}