/**
 * BookBridge
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { BackHandler, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { session } from './src/api';
import { TabBar } from './src/components';
import { colors } from './src/constants/theme';
import type { Nav, Route, Tab, User } from './src/types';
import { canOpen, homeTab, tabsFor } from './src/utils';
import { LoginScreen } from './src/screens/LoginScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { DonationsScreen } from './src/screens/DonationsScreen';
import { UsersScreen } from './src/screens/UsersScreen';
import { DrivesScreen } from './src/screens/DrivesScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { ScanScreen } from './src/screens/ScanScreen';

function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const TAB_ROOT: Record<Tab, Route> = {
  Home: { name: 'Home' },
  Inventory: { name: 'Inventory' },
  Add: { name: 'Scan' },
  Reports: { name: 'Reports' },
  Profile: { name: 'Profile' },
};

// Minimal tab + stack router so the app runs without extra native dependencies.
function AppContent() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    session.onUnauthorized(() => {
      session.set(null);
      setUser(null);
    });
  }, []);

  if (!user) {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <LoginScreen
          top={insets.top}
          bottom={insets.bottom}
          onSignedIn={(token, u) => {
            session.set(token);
            setUser(u);
          }}
        />
      </>
    );
  }
  return (
    <SignedIn
      user={user}
      onSignOut={() => {
        session.set(null);
        setUser(null);
      }}
    />
  );
}

function SignedIn({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const insets = useSafeAreaInsets();
  const tabs = tabsFor(user);
  const root = homeTab(user);
  const [activeTab, setActiveTab] = useState<Tab>(root);
  const [stack, setStack] = useState<Route[]>([TAB_ROOT[root]]);

  const nav: Nav = {
    push: r => {
      if (!canOpen(user, r.name)) {
        return;
      }
      setStack(st => [...st, r]);
    },
    back: () => setStack(st => (st.length > 1 ? st.slice(0, -1) : [TAB_ROOT[activeTab]])),
    tab: t => {
      if (!tabs.includes(t)) {
        return;
      }
      // "Add" opens the camera on top of the current tab rather than replacing it.
      if (t === 'Add') {
        setStack(st => [...st, TAB_ROOT.Add]);
        return;
      }
      setActiveTab(t);
      setStack([TAB_ROOT[t]]);
    },
  };

  // Android back button/gesture walks back through the stack, then to the role's home tab, before leaving the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        setStack(st => st.slice(0, -1));
        return true;
      }
      if (activeTab !== root) {
        setActiveTab(root);
        setStack([TAB_ROOT[root]]);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, activeTab, root]);

  const route = stack[stack.length - 1];
  useEffect(() => {
    if (!canOpen(user, route.name)) {
      setActiveTab(root);
      setStack([TAB_ROOT[root]]);
    }
  }, [route.name, user, root]);

  const showTabs = route.name === 'Home' || route.name === 'Inventory' || route.name === 'Reports' || route.name === 'Profile';
  const top = insets.top;
  const bottom = insets.bottom;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={route.name === 'Scan' ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {route.name === 'Home' && <HomeScreen nav={nav} user={user} top={top} />}
        {route.name === 'Profile' && <ProfileScreen nav={nav} user={user} onSignOut={onSignOut} top={top} />}
        {route.name === 'Inventory' && <InventoryScreen nav={nav} top={top} />}
        {route.name === 'Reports' && <ReportsScreen top={top} />}
        {route.name === 'Scan' && <ScanScreen nav={nav} top={top} bottom={bottom} />}
        {route.name === 'Review' && <ReviewScreen nav={nav} top={top} bottom={bottom} isbn={route.isbn} photo={route.photo} />}
        {route.name === 'Donations' && <DonationsScreen nav={nav} top={top} />}
        {route.name === 'Drives' && <DrivesScreen nav={nav} user={user} top={top} />}
        {route.name === 'DriveBooks' && <InventoryScreen nav={nav} top={top} drive={route.drive} />}
        {route.name === 'Users' && <UsersScreen nav={nav} me={user} top={top} />}
        {route.name === 'Detail' && <DetailScreen nav={nav} bookId={route.bookId} user={user} top={top} bottom={bottom} />}
      </View>
      {showTabs && <TabBar active={activeTab} onSelect={nav.tab} bottomInset={bottom} tabs={tabs} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});

export default App;
