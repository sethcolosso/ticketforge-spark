import { QRCodeSVG } from "qrcode.react";

const QRTicket = ({ orderId, eventTitle }: { orderId: string; eventTitle: string }) => {
  const qrData = JSON.stringify({ orderId, t: Date.now() });

  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-background">
      <QRCodeSVG
        value={qrData}
        size={160}
        bgColor="transparent"
        fgColor="hsl(165, 80%, 48%)"
        level="M"
      />
      <p className="text-xs text-muted-foreground font-mono">{orderId.slice(0, 8).toUpperCase()}</p>
      <p className="text-xs text-muted-foreground">{eventTitle}</p>
    </div>
  );
};

export default QRTicket;
