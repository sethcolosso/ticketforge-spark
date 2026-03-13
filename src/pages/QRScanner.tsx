import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, QrCode, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";

interface ScanResult {
  success: boolean;
  message: string;
  order?: any;
}

const QRScanner = () => {
  const { user, loading: authLoading } = useAuth();
  const { isSeller, isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) { navigate("/login"); return; }
      if (!isSeller && !isAdmin) { navigate("/dashboard"); return; }
    }
  }, [authLoading, rolesLoading, user, isSeller, isAdmin, navigate]);

  const startScanner = async () => {
    setScanning(true);
    setResult(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (text: string) => {
          await scanner.stop();
          setScanning(false);
          await validateTicket(text);
        },
        () => {}
      );
    } catch {
      setScanning(false);
      setResult({ success: false, message: "Camera access denied or unavailable." });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
    }
    setScanning(false);
  };

  const validateTicket = async (qrText: string) => {
    try {
      let orderId: string;
      try {
        const parsed = JSON.parse(qrText);
        orderId = parsed.orderId;
      } catch {
        orderId = qrText.trim();
      }

      const { data: order, error } = await (supabase as any)
        .from("orders")
        .select("*, events(title, date, venue, seller_id), order_items(quantity, ticket_types(name))")
        .eq("id", orderId)
        .single();

      if (error || !order) {
        setResult({ success: false, message: "Ticket not found. Invalid QR code." });
        return;
      }

      // Check seller owns this event
      if (!isAdmin && order.events?.seller_id !== user?.id) {
        setResult({ success: false, message: "This ticket is not for one of your events." });
        return;
      }

      if (order.status === "cancelled") {
        setResult({ success: false, message: "This order has been cancelled.", order });
        return;
      }

      if (order.scanned_at) {
        setResult({ success: false, message: `Already scanned at ${new Date(order.scanned_at).toLocaleString()}`, order });
        return;
      }

      // Mark as scanned
      await (supabase as any)
        .from("orders")
        .update({ scanned_at: new Date().toISOString() })
        .eq("id", orderId);

      setResult({ success: true, message: "✓ Valid ticket! Entry approved.", order });
    } catch {
      setResult({ success: false, message: "Error validating ticket." });
    }
  };

  const handleManualCheck = () => {
    if (manualCode.trim()) validateTicket(manualCode.trim());
  };

  if (authLoading || rolesLoading) return <div className="py-24 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-lg">
        <h1 className="text-2xl font-heading font-bold mb-2 flex items-center gap-2">
          <QrCode className="h-6 w-6 text-primary" /> QR Ticket Scanner
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Scan attendee QR codes to validate entry</p>

        <div className="space-y-4">
          <div id="qr-reader" ref={containerRef} className="rounded-lg overflow-hidden border border-border bg-background" />

          <div className="flex gap-2">
            {!scanning ? (
              <Button onClick={startScanner} className="flex-1 gap-2">
                <Camera className="h-4 w-4" /> Start Scanner
              </Button>
            ) : (
              <Button onClick={stopScanner} variant="outline" className="flex-1">
                Stop Scanner
              </Button>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-2">Or enter order ID manually:</p>
            <div className="flex gap-2">
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Order ID..."
                onKeyDown={(e) => e.key === "Enter" && handleManualCheck()}
              />
              <Button onClick={handleManualCheck} variant="outline">Check</Button>
            </div>
          </div>

          {result && (
            <div className={`rounded-lg border p-4 ${result.success ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
                <span className="font-heading font-semibold">{result.success ? "Valid" : "Invalid"}</span>
              </div>
              <p className="text-sm">{result.message}</p>
              {result.order && (
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">{result.order.events?.title}</strong></p>
                  <p>{result.order.events?.venue} · {new Date(result.order.events?.date).toLocaleDateString()}</p>
                  <p>{(result.order.order_items || []).map((i: any) => `${i.quantity}x ${i.ticket_types?.name}`).join(", ")}</p>
                  <p>Total: {formatCurrency(Number(result.order.total_amount))}</p>
                  <Badge variant="secondary" className="capitalize">{result.order.status}</Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
