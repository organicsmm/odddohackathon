import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";

// Code-split every non-landing route so the initial bundle stays tiny.
const Auth = lazy(() => import("./pages/Auth"));
const AppLayout = lazy(() => import("./layouts/AppLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyTrips = lazy(() => import("./pages/MyTrips"));
const CreateTrip = lazy(() => import("./pages/CreateTrip"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const SharedTrip = lazy(() => import("./pages/SharedTrip"));
const Friends = lazy(() => import("./pages/Friends"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Showcase = lazy(() => import("./pages/Showcase"));
const TypographyPreview = lazy(() => import("./pages/TypographyPreview"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminTrips = lazy(() => import("./pages/admin/AdminTrips"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen bg-background" aria-hidden />
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/signup" element={<Auth mode="signup" />} />
              <Route path="/share/:shareId" element={<SharedTrip />} />
              <Route path="/invite/:token" element={<AcceptInvite />} />
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="trips" element={<MyTrips />} />
                <Route path="trips/:id" element={<TripDetail />} />
                <Route path="new" element={<CreateTrip />} />
                <Route path="friends" element={<Friends />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="trips" element={<AdminTrips />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              <Route path="/showcase" element={<Showcase />} />
              <Route path="/typography" element={<TypographyPreview />} />
              <Route path="/dashboard" element={<Navigate to="/app" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
