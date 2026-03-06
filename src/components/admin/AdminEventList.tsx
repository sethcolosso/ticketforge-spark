import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DbEvent } from "@/types/database";

interface Props {
  events: DbEvent[];
  tab: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onToggleFeatured: (id: string, current: boolean) => void;
}

const AdminEventList = ({ events, tab, onApprove, onReject, onToggleFeatured }: Props) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-border rounded-lg bg-card mb-10">
        <p>No {tab} events.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-10">
      {events.map(evt => (
        <div key={evt.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {evt.image_url && (
              <img src={evt.image_url} alt={evt.title} className="w-full sm:w-32 h-24 object-cover rounded-md" />
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-semibold">{evt.title}</h3>
                <Badge variant="secondary" className="text-xs capitalize">{evt.status}</Badge>
                {evt.is_featured && <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{evt.venue}, {evt.location} · {new Date(evt.date).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">{evt.category} · {(evt.ticket_types || []).length} ticket types · Cap: {evt.capacity || '∞'}</p>
              {evt.description && <p className="text-xs text-muted-foreground line-clamp-2">{evt.description}</p>}
            </div>
            <div className="flex items-start gap-2 flex-shrink-0">
              {evt.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => onApprove(evt.id)} className="gap-1"><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => onReject(evt.id)} className="gap-1"><XCircle className="h-4 w-4" /> Reject</Button>
                </>
              )}
              {evt.status === 'rejected' && (
                <Button size="sm" variant="outline" onClick={() => onApprove(evt.id)}>Approve</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => onToggleFeatured(evt.id, evt.is_featured)}
                title={evt.is_featured ? 'Remove featured' : 'Mark as featured'}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminEventList;
