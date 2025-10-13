import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const SupabaseConnectionTest = () => {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking");
  const [carouselCount, setCarouselCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from("carousels")
        .select("*", { count: "exact" });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        console.error("Supabase error:", error);
      } else {
        setStatus("connected");
        setCarouselCount(data?.length || 0);
        console.log("✅ Supabase connected! Found", data?.length, "carousels");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      console.error("Connection error:", err);
    }
  };

  return (
    <Card className="max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle>Supabase Connection Status</CardTitle>
        <CardDescription>Testing connection to database</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Status:</span>
          {status === "checking" && <Badge variant="secondary">Checking...</Badge>}
          {status === "connected" && <Badge variant="default" className="bg-green-500">Connected ✓</Badge>}
          {status === "error" && <Badge variant="destructive">Error ✗</Badge>}
        </div>
        
        {status === "connected" && (
          <div className="flex items-center justify-between">
            <span>Carousels found:</span>
            <Badge variant="outline">{carouselCount}</Badge>
          </div>
        )}

        {status === "error" && (
          <div className="text-sm text-destructive">
            <p className="font-semibold">Error:</p>
            <p className="mt-2 p-2 bg-destructive/10 rounded">{errorMessage}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4">
          <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || "❌ NOT SET"}</p>
          <p className="mt-1">API Key: {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "✓ Set" : "❌ NOT SET"}</p>
        </div>
      </CardContent>
    </Card>
  );
};
