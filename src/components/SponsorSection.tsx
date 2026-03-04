const sponsors = [
  { name: "VOLT", style: "font-heading font-bold text-2xl tracking-widest" },
  { name: "NØVA", style: "font-heading font-bold text-2xl italic" },
  { name: "PRISM", style: "font-mono font-semibold text-xl tracking-[0.3em]" },
  { name: "AXIOM", style: "font-heading font-bold text-2xl" },
  { name: "ECHO", style: "font-mono font-bold text-xl tracking-widest" },
  { name: "FLUX", style: "font-heading font-bold text-2xl italic tracking-wide" },
];

const SponsorSection = () => (
  <section className="py-16 border-t border-border">
    <div className="container mx-auto px-4">
      <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-8">
        Proudly Partnered With
      </p>
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
        {sponsors.map((s) => (
          <span
            key={s.name}
            className={`${s.style} text-muted-foreground/40 hover:text-primary/60 transition-colors cursor-default select-none`}
          >
            {s.name}
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default SponsorSection;
