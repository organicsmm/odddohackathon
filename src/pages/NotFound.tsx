import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Plane, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card variant="aurora" className="w-full max-w-md p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-hero shadow-glow">
          <Plane className="h-7 w-7 text-primary-foreground" />
        </span>
        <h1 className="mt-5 font-display text-6xl font-extrabold tracking-tight text-gradient">404</h1>
        <p className="mt-2 text-lg font-medium">This page took a wrong turn</p>
        <p className="mt-1 text-sm text-muted-foreground">We couldn't find anything at <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{location.pathname}</code></p>
        <Button asChild variant="premium" size="lg" className="mt-6">
          <Link to="/"><ArrowLeft className="h-4 w-4" /> Return home</Link>
        </Button>
      </Card>
    </div>
  );
};

export default NotFound;
