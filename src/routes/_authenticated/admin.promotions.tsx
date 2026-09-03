import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deletePromo, getAdminPromotions, saveBanner, saveCampaign, saveCoupon } from "@/lib/admin.functions";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/promotions")({ component: PromotionsPage });

type BannerDraft = { id: string | null; title: string; subtitle: string; badge: string; image_url: string; link_url: string; sort_order: number; is_active: boolean };
type CampaignDraft = { id: string | null; title: string; description: string; discount_percent: number; starts_at: string; ends_at: string; sort_order: number; is_active: boolean };
type CouponDraft = { id: string | null; code: string; discount_type: "percent" | "fixed"; discount_value: number; min_order: number; expires_at: string; is_active: boolean };

function PromotionsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "promotions"], queryFn: () => getAdminPromotions() });
  const [banner, setBanner] = useState<BannerDraft | null>(null);
  const [campaign, setCampaign] = useState<CampaignDraft | null>(null);
  const [coupon, setCoupon] = useState<CouponDraft | null>(null);

  const done = (msg: string, close: () => void) => () => {
    toast.success(msg);
    close();
    qc.invalidateQueries({ queryKey: ["admin"] });
  };
  const fail = (e: Error) => toast.error(e.message || "Could not save");

  const mBanner = useMutation({ mutationFn: (d: BannerDraft) => saveBanner({ data: { ...d, sort_order: Number(d.sort_order) || 0 } }), onSuccess: done("Banner saved", () => setBanner(null)), onError: fail });
  const mCampaign = useMutation({
    mutationFn: (d: CampaignDraft) =>
      saveCampaign({ data: { ...d, discount_percent: Number(d.discount_percent) || 0, sort_order: Number(d.sort_order) || 0, starts_at: d.starts_at || null, ends_at: d.ends_at || null } }),
    onSuccess: done("Campaign saved", () => setCampaign(null)),
    onError: fail,
  });
  const mCoupon = useMutation({
    mutationFn: (d: CouponDraft) =>
      saveCoupon({ data: { ...d, discount_value: Number(d.discount_value) || 0, min_order: Number(d.min_order) || 0, expires_at: d.expires_at || null } }),
    onSuccess: done("Coupon saved", () => setCoupon(null)),
    onError: fail,
  });
  const mDelete = useMutation({
    mutationFn: (v: { table: "banners" | "campaigns" | "coupons"; id: string }) => deletePromo({ data: v }),
    onSuccess: done("Deleted", () => {}),
    onError: fail,
  });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading promotions…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Promotions</h1>
      <Tabs defaultValue="banners">
        <TabsList>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-3 pt-4">
          <Button size="sm" onClick={() => setBanner({ id: null, title: "", subtitle: "", badge: "", image_url: "", link_url: "", sort_order: 0, is_active: true })}>
            <Plus className="mr-2 h-4 w-4" /> New banner
          </Button>
          {data.banners.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-40 flex-1">
                  <p className="font-medium">{b.title}</p>
                  <p className="text-sm text-muted-foreground">{b.subtitle}</p>
                </div>
                {b.badge && <Badge>{b.badge}</Badge>}
                <Badge variant={b.is_active ? "secondary" : "outline"}>{b.is_active ? "Live" : "Hidden"}</Badge>
                <Button variant="outline" size="sm" onClick={() => setBanner({ id: b.id, title: b.title, subtitle: b.subtitle ?? "", badge: b.badge ?? "", image_url: b.image_url ?? "", link_url: b.link_url ?? "", sort_order: b.sort_order, is_active: b.is_active })}>Edit</Button>
                <Button variant="ghost" size="icon" onClick={() => mDelete.mutate({ table: "banners", id: b.id })} aria-label="Delete banner">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-3 pt-4">
          <Button size="sm" onClick={() => setCampaign({ id: null, title: "", description: "", discount_percent: 0, starts_at: "", ends_at: "", sort_order: 0, is_active: true })}>
            <Plus className="mr-2 h-4 w-4" /> New campaign
          </Button>
          {data.campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-40 flex-1">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                </div>
                <Badge>{Number(c.discount_percent)}% off</Badge>
                <Badge variant={c.is_active ? "secondary" : "outline"}>{c.is_active ? "Live" : "Hidden"}</Badge>
                <Button variant="outline" size="sm" onClick={() => setCampaign({ id: c.id, title: c.title, description: c.description ?? "", discount_percent: Number(c.discount_percent), starts_at: c.starts_at?.slice(0, 10) ?? "", ends_at: c.ends_at?.slice(0, 10) ?? "", sort_order: c.sort_order, is_active: c.is_active })}>Edit</Button>
                <Button variant="ghost" size="icon" onClick={() => mDelete.mutate({ table: "campaigns", id: c.id })} aria-label="Delete campaign">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="coupons" className="space-y-3 pt-4">
          <Button size="sm" onClick={() => setCoupon({ id: null, code: "", discount_type: "percent", discount_value: 0, min_order: 0, expires_at: "", is_active: true })}>
            <Plus className="mr-2 h-4 w-4" /> New coupon
          </Button>
          {data.coupons.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <span className="flex-1 font-mono font-semibold">{c.code}</span>
                <Badge>{c.discount_type === "percent" ? `${Number(c.discount_value)}%` : money(c.discount_value)}</Badge>
                <span className="text-sm text-muted-foreground">Min {money(c.min_order)}</span>
                <Badge variant={c.is_active ? "secondary" : "outline"}>{c.is_active ? "Active" : "Off"}</Badge>
                <Button variant="outline" size="sm" onClick={() => setCoupon({ id: c.id, code: c.code, discount_type: c.discount_type === "fixed" ? "fixed" : "percent", discount_value: Number(c.discount_value), min_order: Number(c.min_order), expires_at: c.expires_at?.slice(0, 10) ?? "", is_active: c.is_active })}>Edit</Button>
                <Button variant="ghost" size="icon" onClick={() => mDelete.mutate({ table: "coupons", id: c.id })} aria-label="Delete coupon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!banner} onOpenChange={(o) => !o && setBanner(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{banner?.id ? "Edit banner" : "New banner"}</DialogTitle></DialogHeader>
          {banner && (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={banner.title} onChange={(e) => setBanner({ ...banner, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Subtitle</Label><Input value={banner.subtitle} onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Badge</Label><Input value={banner.badge} onChange={(e) => setBanner({ ...banner, badge: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Banner image or video</Label>
                <MediaUpload allowVideo value={banner.image_url} onChange={(url) => setBanner({ ...banner, image_url: url })} />
              </div>
              <div className="space-y-1.5"><Label>Link</Label><Input value={banner.link_url} onChange={(e) => setBanner({ ...banner, link_url: e.target.value })} placeholder="/products" /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={banner.is_active} onCheckedChange={(v) => setBanner({ ...banner, is_active: v })} /> Live</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBanner(null)}>Cancel</Button>
            <Button onClick={() => banner && mBanner.mutate(banner)} disabled={mBanner.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!campaign} onOpenChange={(o) => !o && setCampaign(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{campaign?.id ? "Edit campaign" : "New campaign"}</DialogTitle></DialogHeader>
          {campaign && (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={campaign.title} onChange={(e) => setCampaign({ ...campaign, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={campaign.description} onChange={(e) => setCampaign({ ...campaign, description: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Discount %</Label><Input type="number" value={campaign.discount_percent} onChange={(e) => setCampaign({ ...campaign, discount_percent: Number(e.target.value) })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Starts</Label><Input type="date" value={campaign.starts_at} onChange={(e) => setCampaign({ ...campaign, starts_at: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Ends</Label><Input type="date" value={campaign.ends_at} onChange={(e) => setCampaign({ ...campaign, ends_at: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={campaign.is_active} onCheckedChange={(v) => setCampaign({ ...campaign, is_active: v })} /> Live</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCampaign(null)}>Cancel</Button>
            <Button onClick={() => campaign && mCampaign.mutate(campaign)} disabled={mCampaign.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!coupon} onOpenChange={(o) => !o && setCoupon(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{coupon?.id ? "Edit coupon" : "New coupon"}</DialogTitle></DialogHeader>
          {coupon && (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Code</Label><Input value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} /></div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={coupon.discount_type} onValueChange={(v) => setCoupon({ ...coupon, discount_type: v as "percent" | "fixed" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent off</SelectItem>
                    <SelectItem value="fixed">Fixed amount off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Value</Label><Input type="number" value={coupon.discount_value} onChange={(e) => setCoupon({ ...coupon, discount_value: Number(e.target.value) })} /></div>
                <div className="space-y-1.5"><Label>Min order</Label><Input type="number" value={coupon.min_order} onChange={(e) => setCoupon({ ...coupon, min_order: Number(e.target.value) })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Expires</Label><Input type="date" value={coupon.expires_at} onChange={(e) => setCoupon({ ...coupon, expires_at: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={coupon.is_active} onCheckedChange={(v) => setCoupon({ ...coupon, is_active: v })} /> Active</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCoupon(null)}>Cancel</Button>
            <Button onClick={() => coupon && mCoupon.mutate(coupon)} disabled={mCoupon.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
