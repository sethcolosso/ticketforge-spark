import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
}

const WaitlistModal = ({ open, onOpenChange, eventTitle }: WaitlistModalProps) => {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast({ title: "You're on the waitlist!", description: `We'll notify you when tickets for ${eventTitle} become available.` });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSubmitted(false); }}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <DialogTitle className="text-xl font-heading">You're on the list!</DialogTitle>
            <p className="text-sm text-muted-foreground">We'll email you when spots open up for <span className="text-foreground font-medium">{eventTitle}</span>.</p>
            <Button onClick={() => onOpenChange(false)} variant="outline">Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading">Join the Waitlist</DialogTitle>
              <DialogDescription>
                <span className="font-medium text-foreground">{eventTitle}</span> is sold out. Join the waitlist to be notified when tickets become available.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <Label htmlFor="wl-name">Full Name</Label>
                <Input id="wl-name" required placeholder="Jane Doe" />
              </div>
              <div>
                <Label htmlFor="wl-email">Email</Label>
                <Input id="wl-email" type="email" required placeholder="jane@example.com" />
              </div>
              <div>
                <Label htmlFor="wl-phone">Phone (optional)</Label>
                <Input id="wl-phone" type="tel" placeholder="+1 (555) 000-0000" />
              </div>
              <Button type="submit" className="w-full">Join Waitlist</Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistModal;
