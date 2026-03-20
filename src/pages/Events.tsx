import { useState, useEffect } from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { DbEvent } from "@/types/database";
import EventCard from "@/components/EventCard";

interface Recommendation {
  slug: string;
  reason: string;
}

const Events = () => {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('events')
      .select('*, ticket_types(*)')
      .eq('status', 'approved')
      .order('date', { ascending: true });

    if (error) {
      setEvents([]);
      toast({
        title: "Unable to load events",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setEvents(data || []);
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    if (events.length === 0) return;
    setRecLoading(true);
    try {
      const eventsForAI = events.map(e => ({
        title: e.title,
        slug: e.slug,
        category: e.category,
        date: e.date,
        location: e.location,
        minPrice: (e.ticket_types || []).length > 0
          ? Math.min(...(e.ticket_types || []).map(t => Number(t.price)))
          : 0,
      }));

      let { data, error } = await supabase.functions.invoke('ai-recommend', {
        body: { events: eventsForAI, userQuery: search || undefined },
      });

      // Fallback for projects where the function is deployed under a custom slug.
      if (error?.message?.toLowerCase().includes('not found')) {
        const fallback = await supabase.functions.invoke('smooth-endpoint', {
          body: { events: eventsForAI, userQuery: search || undefined },
        });
        data = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;
      if (data?.recommendations) setRecommendations(data.recommendations);
    } catch (error) {
      toast({
        title: "Unable to load recommendations",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
    setRecLoading(false);
  };

  const categories = ["All", ...new Set(events.map(e => e.category))];

  const filtered = events
    .filter(e => category === "All" || e.category === category)
    .filter(e =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase()) ||
      (e.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(search.toLowerCase())
    );

  const recommendedEvents = recommendations
    .map(r => events.find(e => e.slug === r.slug))
    .filter(Boolean) as DbEvent[];

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">Explore Events</h1>
          <p className="text-muted-foreground">Find your next unforgettable experience.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search events, locations, descriptions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button variant="outline" size="sm" onClick={fetchRecommendations} disabled={recLoading || events.length === 0} className="gap-2 shrink-0">
            <Sparkles className="h-4 w-4" />
            {recLoading ? "Finding..." : "AI Recommendations"}
          </Button>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  category === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        {recommendedEvents.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-heading font-bold mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Recommended For You
            </h2>
            <p className="text-sm text-muted-foreground mb-4">AI-picked events based on your interests</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedEvents.map((event, i) => (
                <div key={event.id} className="relative">
                  <EventCard event={event} />
                  {recommendations[i]?.reason && (
                    <div className="mt-2 px-3 py-1.5 rounded-md bg-primary/5 border border-primary/20">
                      <p className="text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-primary inline mr-1" />
                        {recommendations[i].reason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading events...</div>
        ) : filtered.length > 0 ? (
          <>
            <h2 className="text-xl font-heading font-bold mb-4">
              {category === "All" ? "All Events" : category}
              <span className="text-sm font-normal text-muted-foreground ml-2">({filtered.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No events found{search ? " matching your search" : ""}.</p>
            <p className="text-sm mt-2">Check back soon — new events are posted daily!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
