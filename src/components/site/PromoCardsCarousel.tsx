import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isVideoUrl } from "@/lib/media";

type PromoCard = { id: string; image_url: string; link_url: string | null; sort_order: number };

function PromoImage({ image }: { image: PromoCard }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      {!loaded && !failed && <span className="promo-card-skeleton" aria-hidden="true" />}
      {failed ? (
        <span className="promo-card-fallback" aria-label="Promo image unavailable" />
      ) : (
        <img
          src={image.image_url}
          alt="Store promotion"
          loading="lazy"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </>
  );
}

// Short looping muted video. Plays only while the card is visible, pauses when scrolled away.
function PromoVideo({ video }: { video: PromoCard }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || failed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [video.image_url, failed]);

  return (
    <>
      {!loaded && !failed && <span className="promo-card-skeleton" aria-hidden="true" />}
      {failed ? (
        <span className="promo-card-fallback" aria-label="Promo video unavailable" />
      ) : (
        <video
          ref={ref}
          src={`${video.image_url}#t=0.001`}
          aria-label="Promotional video"
          muted
          loop
          playsInline
          preload="metadata"
          draggable={false}
          disablePictureInPicture
          onLoadedData={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
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

  useEffect(() => {
    refresh();
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, [cards.length]);

  if (cards.length === 0) return null;

  const scrollByCards = (direction: -1 | 1) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>(".promo-card");
    if (el && card) {
      el.scrollBy({
        left: direction * (card.offsetWidth + 16) * 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    }
  };

  // Ends a mouse drag: re-enables scroll snapping so the row settles on the nearest card.
  const endDrag = (el: HTMLDivElement, didMove: boolean) => {
    el.style.scrollSnapType = "";
    if (didMove) {
      dragged.current = true;
      requestAnimationFrame(refresh);
      window.setTimeout(() => {
        dragged.current = false;
      }, 200);
    }
    drag.current = null;
  };

  return (
    <section className="home-promo-section" aria-label="Current promotions">
      <div className="home-promo-carousel">
        <Button
          className="promo-arrow promo-arrow-prev"
          variant="outline"
          size="icon"
          aria-label="Previous promo cards"
          disabled={!canPrev}
          onClick={() => scrollByCards(-1)}
        >
          <ChevronLeft />
        </Button>

        <div
          ref={track}
          className="promo-card-track no-scrollbar"
          onScroll={refresh}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            drag.current = { startX: e.clientX, scrollLeft: e.currentTarget.scrollLeft, moved: false };
          }}
          onMouseMove={(e) => {
            const d = drag.current;
            if (!d || !e.buttons) return;
            const dx = e.clientX - d.startX;
            if (Math.abs(dx) > 4) d.moved = true;
            if (d.moved) {
              // Turn snapping off while dragging so the row follows the mouse smoothly.
              e.currentTarget.style.scrollSnapType = "none";
              e.currentTarget.scrollLeft = d.scrollLeft - dx;
            }
          }}
          onMouseUp={(e) => endDrag(e.currentTarget, !!drag.current?.moved)}
          onMouseLeave={(e) => endDrag(e.currentTarget, !!drag.current?.moved)}
        >
          {cards.map((card) => {
            const content = isVideoUrl(card.image_url) ? <PromoVideo video={card} /> : <PromoImage image={card} />;
            return card.link_url ? (
              <a
                key={card.id}
                className="promo-card promo-card-link"
                href={card.link_url}
                draggable={false}
                onClick={(e) => {
                  if (dragged.current) e.preventDefault();
                }}
                onDragStart={(e) => e.preventDefault()}
              >
                {content}
              </a>
            ) : (
              <div key={card.id} className="promo-card" tabIndex={0} role="group" aria-label="Promotional offer">
                {content}
              </div>
            );
          })}
        </div>

        <Button
          className="promo-arrow promo-arrow-next"
          variant="outline"
          size="icon"
          aria-label="Next promo cards"
          disabled={!canNext}
          onClick={() => scrollByCards(1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </section>
  );
}
