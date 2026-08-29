import AppTabs from '@/components/app-tabs';

// The bottom tab bar (Home / Explore). Detail pages live outside this group
// and are pushed onto the root Stack (see app/_layout.tsx).
export default function TabsLayout() {
  return <AppTabs />;
}
