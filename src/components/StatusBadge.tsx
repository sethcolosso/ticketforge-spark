import { Badge } from "@/components/ui/badge";

const statusConfig = {
  available: { label: "Available", className: "bg-primary/20 text-primary border-primary/30" },
  limited: { label: "Limited Tickets", className: "bg-[hsl(25,95%,55%)]/20 text-[hsl(25,95%,55%)] border-[hsl(25,95%,55%)]/30" },
  "sold-out": { label: "Sold Out", className: "bg-destructive/20 text-destructive border-destructive/30" },
  waitlist: { label: "Waitlist Open", className: "bg-accent/20 text-accent border-accent/30" },
};

const StatusBadge = ({ status }: { status: keyof typeof statusConfig }) => {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`text-[10px] font-semibold ${config.className}`}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
