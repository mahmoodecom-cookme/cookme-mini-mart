import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PromoCard = { id: string; image_url: string; link_url: string | null; sort_order: number };

function PromoImage({ image }: { image: PromoCard }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      {!loaded && !failed && <span className="promo-card-skeleton" aria-hidden="true" />}
      {failed ? <span className="promo-card-fallback" aria-label="Promo image unavailable" /> : (
        <img src={image.image_url} alt="Store promotion" loading="lazy" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      )}
    </>
  );
}

export function PromoCardsCarousel({ cards }: { cards: PromoCard[] }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; scrollLeft: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const refresh = () => {
    const el = track.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };
  useEffect(() => { refresh(); window.addEventListener("resize", refresh); return () => window.removeEventListener("resize", refresh); }, [cards.length]);
  if (cards.length === 0) return null;
  const scrollByCards = (direction: -1 | 1) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>(".promo-card");
    if (el && card) el.scrollBy({ left: direction * (card.offsetWidth + 16) * 2, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return (
    <section className="home-promo-section" aria-label="Current promotions">
      <div className="home-promo-carousel">
        <Button className="promo-arrow promo-arrow-prev" variant="outline" size="icon" aria-label="Previous promo cards" disabled={!canPrev} onClick={() => scrollByCards(-1)}><ChevronLeft /></Button>
        <div ref={track} className="promo-card-track no-scrollbar" onScroll={refresh}
          onMouseDown={(e) => { if (e.button !== 0) return; drag.current = { startX: e.clientX, scrollLeft: e.currentTarget.scrollLeft, moved: false }; }}
          onMouseMove={(e) => { const d = drag.current; if (!d || !e.buttons) return; const dx = e.clientX - d.startX; if (Math.abs(dx) > 4) d.moved = true; if (d.moved) e.currentTarget.scrollLeft = d.scrollLeft - dx; }}
          onMouseUp={() => { if (drag.current?.moved) { dragged.current = true; requestAnimationFrame(refresh); window.setTimeout(() => { dragged.current = false; }, 200); } drag.current = null; }}
          onKeyDown={(e) => { if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return; e.preventDefault(); scrollByCards(e.key === "ArrowLeft" ? -1 : 1); }} onMouseLeave={() => { drag.current = null; }}>
          {cards.map((card) => {
            const content = <PromoImage image={card} />;
            return card.link_url ? <a key={card.id} className="promo-card promo-card-link" href={card.link_url} draggable={false} onClick={(e) => { if (dragged.current) e.preventDefault(); }} onDragStart={(e) => e.preventDefault()}>{content}</a>
              : <div key={card.id} className="promo-card" tabIndex={0} role="group" aria-label="Promotional offer">{content}</div>;
          })}
        </div>
        <Button className="promo-arrow promo-arrow-next" variant="outline" size="icon" aria-label="Next promo cards" disabled={!canNext} onClick={() => scrollByCards(1)}><ChevronRight /></Button>
      </div>
    </section>
  );
}