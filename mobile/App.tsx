/**
 * BookBridge
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBar, type Tab } from './src/components';
import { session, type User } from './src/data';
import type { Nav, Route } from './src/nav';
import { LoginScreen } from './src/screens/LoginScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { colors } from './src/theme';

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
          onSignedIn={(token, u) => {
            session.set(token);
            setUser(u);
          }}
        />
      </>
    );
  }
  return <SignedIn />;
}

function SignedIn() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [stack, setStack] = useState<Route[]>([TAB_ROOT.Home]);

  const nav: Nav = {
    push: r => setStack(st => [...st, r]),
    back: () => setStack(st => (st.length > 1 ? st.slice(0, -1) : [TAB_ROOT[activeTab]])),
    tab: t => {
      // "Add" opens the camera on top of the current tab rather than replacing it.
      if (t === 'Add') {
        setStack(st => [...st, TAB_ROOT.Add]);
        return;
      }
      setActiveTab(t);
      setStack([TAB_ROOT[t]]);
    },
  };

  const route = stack[stack.length - 1];
  const showTabs = route.name === 'Home' || route.name === 'Inventory' || route.name === 'Reports';
  const top = insets.top;
  const bottom = insets.bottom;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={route.name === 'Scan' ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {route.name === 'Home' && <HomeScreen nav={nav} top={top} />}
        {route.name === 'Inventory' && <InventoryScreen nav={nav} top={top} />}
        {route.name === 'Reports' && <ReportsScreen top={top} />}
        {route.name === 'Scan' && <ScanScreen nav={nav} top={top} bottom={bottom} />}
        {route.name === 'Review' && <ReviewScreen nav={nav} top={top} bottom={bottom} />}
        {route.name === 'Detail' && <DetailScreen nav={nav} bookId={route.bookId} top={top} bottom={bottom} />}
      </View>
      {showTabs && <TabBar active={activeTab} onSelect={nav.tab} bottomInset={bottom} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});

export default App;
