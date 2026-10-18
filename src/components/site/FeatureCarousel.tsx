import { useCallback, useEffect, useRef, useState } from 'react';
import { Truck, RotateCcw, ShieldCheck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { featureOffset, stepFeature } from '@/lib/feature-carousel';
import { money } from '@/lib/format';

export function FeatureCarousel({ threshold }: { threshold: number }) {
  const [center, setCenter] = useState(1);
  const root = useRef<HTMLDivElement>(null);
  const lockedUntil = useRef(0);
  const touch = useRef<{x:number;y:number}|null>(null);
  const move = useCallback((direction: -1 | 1) => {
    if (Date.now() < lockedUntil.current) return;
    lockedUntil.current = Date.now() + 400;
    setCenter(c => stepFeature(c, direction));
  }, []);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (Math.abs(e.deltaX) > 8) move(e.deltaX > 0 ? -1 : 1);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [move]);
  const cards = [
    { title: 'Karachi-wide delivery', description: `Free above ${money(threshold)}`, icon: Truck },
    { title: 'Easy returns', description: 'Hassle-free returns and refunds for eligible products.', icon: RotateCcw },
    { title: 'Cash on delivery', description: 'Pay when you receive', icon: ShieldCheck },
  ];
  return <div ref={root} className="feature-carousel" tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Shopping benefits"
    onKeyDown={e => { if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){e.preventDefault();move(e.key === 'ArrowLeft' ? -1 : 1);} }}
    onTouchStart={e => { const t=e.touches[0]; if(t) touch.current={x:t.clientX,y:t.clientY}; }}
    onTouchEnd={e => {const t=e.changedTouches[0], start=touch.current;touch.current=null;if(!t||!start)return;const dx=t.clientX-start.x,dy=t.clientY-start.y;if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy))move(dx<0?-1:1);}}>
    {[...cards, ...cards].map((card, slide) => {const offset=featureOffset(slide,center);return <Button key={slide} variant="ghost" className="benefit-slide" data-offset={offset} tabIndex={offset === 0 ? 0 : -1} aria-hidden={Math.abs(offset)>2} aria-label={offset === 0 ? card.title : `${offset < 0 ? 'Previous' : 'Next'} benefit: ${card.title}`} onClick={()=>{if(offset!==0)move(offset<0?-1:1);}}>
      <span className="benefit-heart" aria-hidden="true"><Heart size={12}/></span><span className="benefit-icon"><card.icon/></span><strong>{card.title}</strong><span>{card.description}</span>
    </Button>;})}
    <span className="sr-only" aria-live="polite">{cards[center % 3].title}</span>
  </div>;
}
