import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import MyTrips from "./pages/MyTrips";
import CreateTrip from "./pages/CreateTrip";
import TripDetail from "./pages/TripDetail";
import Profile from "./pages/Profile";
import SharedTrip from "./pages/SharedTrip";
import Friends from "./pages/Friends";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound.tsx";
import Showcase from "./pages/Showcase";
import TypographyPreview from "./pages/TypographyPreview";
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTrips from "./pages/admin/AdminTrips";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
