import { NativeTabs } from "expo-router/native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs tintColor="#A996FF" labelStyle={{ fontSize: 11, fontWeight: "600" }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="explore" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="daily">
        <NativeTabs.Trigger.Label>Daily</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "calendar", selected: "calendar" }} md="today" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="connect">
        <NativeTabs.Trigger.Label>Connect</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }} md="forum" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
