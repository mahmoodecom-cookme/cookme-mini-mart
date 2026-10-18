import { createFileRoute, Link } from '@tanstack/react-router';
import { Minus, Plus, Trash2, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { getSettings } from '@/lib/catalog.functions';
import { SiteLayout } from '@/components/site/SiteLayout';
import { Button } from '@/components/ui/button';
import { money, settingsMap, num } from '@/lib/format';
import { useCart } from '@/lib/cart';
import cartArt from '@/assets/empty-cart.webp.asset.json';
export const Route=createFileRoute('/cart')({loader:()=>getSettings(),head:()=>({meta:[{title:'Your Cart — Cook Me Mini Mart'},{name:'description',content:'Review your grocery order before checkout. Cash on delivery across Karachi.'},{property:'og:title',content:'Your Cart — Cook Me Mini Mart'},{property:'og:description',content:'Review your grocery order before checkout.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'},{name:'robots',content:'noindex'}]}),component:CartPage});
function CartPage(){
 const settings=settingsMap(Route.useLoaderData() as {key:string;value:string|null}[]);
 const {items,setQty,remove,subtotal}=useCart();
 const fee=num(settings.delivery_fee,150),threshold=num(settings.free_delivery_threshold,3000);
 const delivery=subtotal>=threshold||subtotal===0?0:fee;
 return <SiteLayout><div className="cart-design"><header className="cart-title"><Button asChild variant="ghost" size="icon" aria-label="Back to shopping"><Link to="/products"><ArrowLeft/></Link></Button><div><h1>Your Cart</h1>{items.length>0 && <p>Good food is just a tap away</p>}</div></header>
 {items.length===0?<section className="empty-cart"><img src={cartArt.url} alt="Red shopping cart"/><h2>Your cart is empty</h2><p>Looks like you haven't added anything yet. Explore our menu and find something you'll love!</p><Button asChild className="design-red"><Link to="/products">Explore Menu <ArrowRight/></Link></Button></section>:<><div className="cart-items">{items.map(i=><article className="cart-item" key={i.variantId}><div className="cart-photo">{i.image&&<img src={i.image} alt={i.name}/>}</div><div className="cart-item-copy"><Link to="/products/$slug" params={{slug:i.slug}}>{i.name}</Link><p>{i.variantLabel}</p><strong>{money(i.price*i.quantity)}</strong></div><Button variant="ghost" size="icon" className="cart-remove" aria-label={`Remove ${i.name}`} onClick={()=>remove(i.variantId)}><Trash2/></Button><div className="cart-stepper"><Button variant="ghost" size="icon" aria-label={`Decrease quantity of ${i.name}`} onClick={()=>setQty(i.variantId,i.quantity-1)}><Minus/></Button><span>{i.quantity}</span><Button variant="ghost" size="icon" aria-label={`Increase quantity of ${i.name}`} onClick={()=>setQty(i.variantId,i.quantity+1)}><Plus/></Button></div></article>)}</div><section className="cart-summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Delivery</span><strong>{delivery===0?'Free':money(delivery)}</strong></div><div><span>Taxes &amp; Charges <Info size={13}/></span><strong>{money(0)}</strong></div><div className="cart-total"><strong>Total</strong><strong>{money(subtotal+delivery)}</strong></div>{subtotal<threshold&&<p className="cart-delivery-note">Add {money(threshold-subtotal)} more for free delivery.</p>}</section><Button asChild className="design-red checkout-button"><Link to="/checkout">Proceed to Checkout <ArrowRight/></Link></Button></>}
 </div></SiteLayout>;
}
