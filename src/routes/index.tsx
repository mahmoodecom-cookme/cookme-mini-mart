import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Search, Truck, Wheat, Droplet, Flame, Bean, Coffee, FileText, Headphones, ShoppingBag } from 'lucide-react';
import { getStorefront } from '@/lib/catalog.functions';
import { SiteLayout } from '@/components/site/SiteLayout';
import { ProductCard } from '@/components/site/ProductCard';
import { FeatureCarousel } from '@/components/site/FeatureCarousel';
import { Button } from '@/components/ui/button';
import { settingsMap, num } from '@/lib/format';
import clipboard from '@/assets/list-clipboard.webp.asset.json';
import type { FeatureCard } from '@/lib/feature-cards';

export const storefrontQuery = queryOptions({ queryKey: ['storefront'], queryFn: () => getStorefront() });

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: () => ({ meta: [
    {title:'Cook Me Mini Mart — Online Grocery Delivery in Karachi'},
    {name:'description',content:'Shop groceries, snacks, spices and daily essentials at Cook Me Mini Mart. Cash on delivery across Karachi, fast dispatch and fresh stock.'},
    {property:'og:title',content:'Cook Me Mini Mart — Online Grocery Delivery in Karachi'},
    {property:'og:description',content:'Groceries and daily essentials delivered across Karachi. Cash on delivery only.'},
    {property:'og:type',content:'website'}, {name:'twitter:card',content:'summary_large_image'},
  ]}), component: Home,
});
/* eslint-disable @typescript-eslint/no-explicit-any */
function Home() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const {categories,products,settings,campaigns,features} = data as {categories:any[];products:any[];settings:{key:string;value:string|null}[];campaigns:any[];features:FeatureCard[]};
  const navigate = useNavigate();
  const s=settingsMap(settings), threshold=num(s.free_delivery_threshold,3000);
  const [q,setQ]=useState('');
  const [categoryPage,setCategoryPage]=useState(0);
  const categoryTrack=useRef<HTMLDivElement>(null);
  const featured=products.filter(p=>p.is_featured);
  const list=(featured.length?featured:products).slice(0,10);
  const icons=[Wheat,Droplet,Flame,Bean,Coffee];
  const scrollCategories=(direction:number)=>{ const el=categoryTrack.current;if(el)el.scrollBy({left:direction*el.clientWidth*0.7,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}); };
  return <SiteLayout><div className="home-design">
    <section className="home-hero">
      <picture className="home-hero-art"><source media="(max-width: 767px)" srcSet={s.hero_mobile_image || s.hero_image}/><img src={s.hero_image} alt="Cook Me Mini Mart — Made fresh, made for you. Premium everyday essentials." fetchPriority="high"/></picture>
      <h1 className="sr-only">Cook Me Mini Mart</h1><Link to="/products" className="home-hero-link" aria-label="Order now"/>
    </section>
    <form className="home-search" onSubmit={e=>{e.preventDefault();navigate({to:'/products',search:{q:q.trim()}});}}><Search size={20}/><input value={q} onChange={e=>setQ(e.target.value)} aria-label="Search products" placeholder="Search for products…"/><Button type="submit" variant="ghost" size="icon" aria-label="Search products"><ArrowRight/></Button></form>
    <FeatureCarousel cards={features}/>
    {categories.length>0 && <section className="home-section category-section"><div className="section-heading"><h2>Shop by category</h2><Link to="/products">View all <ChevronRight/></Link></div><div className="category-carousel"><Button className="category-arrow prev" size="icon" aria-label="Previous categories" onClick={()=>scrollCategories(-1)}><ChevronLeft/></Button><div ref={categoryTrack} className="category-track no-scrollbar" onScroll={e=>{const el=e.currentTarget;setCategoryPage(el.scrollLeft>el.scrollWidth-el.clientWidth-20?2:el.scrollLeft>20?1:0);}}>{categories.map((c,i)=>{const Icon=icons[i%5];return <Link to="/category/$slug" params={{slug:c.slug}} key={c.id} className="home-category"><div className="category-photo">{c.image_url?<img src={c.image_url} alt={c.name} loading="lazy"/>:<Icon/>}</div><div className="category-label"><span><Icon/></span><strong>{c.name}</strong><i/></div></Link>;})}</div><Button className="category-arrow next" size="icon" aria-label="Next categories" onClick={()=>scrollCategories(1)}><ChevronRight/></Button></div><div className="category-dots">{[0,1,2].map(i=><span key={i} data-active={categoryPage===i}/>)}</div></section>}
    {campaigns.length>0 && <section className="home-section home-promotions">{campaigns.map(c=><div key={c.id}><strong>{c.title}</strong>{c.description && <p>{c.description}</p>}{Number(c.discount_percent)>0 && <b>{Number(c.discount_percent)}% OFF</b>}</div>)}</section>}
    <section id="home-products" className="home-section"><div className="section-heading"><h2>Bestsellers & featured</h2><Link to="/products">See all <ChevronRight/></Link></div>{list.length?<div className="home-product-grid">{list.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<p className="py-10 text-center text-muted-foreground">Products are being added. Please check back shortly.</p>}</section>
    <section className="handwritten-banner"><div className="handwritten-copy"><h2>Have a<br/><span>handwritten list?</span></h2><p>Send us your list or upload a photo of it — we'll take care of the rest and confirm with you.</p><ol>{[{icon:FileText,title:'Send your list',detail:'Type your items or upload a photo'},{icon:Headphones,title:"We'll review & confirm",detail:'Our team will check and confirm with you'},{icon:ShoppingBag,title:'Get everything',detail:"We'll pack and deliver to your doorstep"}].map(step=><li key={step.title}><span><step.icon/></span><div><strong>{step.title}</strong><small>{step.detail}</small></div></li>)}</ol></div><img className="clipboard-art" src={clipboard.url} alt="Handwritten grocery list on a red clipboard"/><Button asChild className="design-red list-button"><Link to="/quick-order">Send us your order list <ArrowRight/></Link></Button></section>
  </div></SiteLayout>;
}
