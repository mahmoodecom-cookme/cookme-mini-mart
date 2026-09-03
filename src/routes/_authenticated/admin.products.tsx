import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import readXlsxFile from "read-excel-file/browser";
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
import { ImageManager } from "@/components/admin/ImageManager";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { bulkImportProducts, deleteCategory, deleteProduct, getAdminCatalog, saveCategory, saveProduct } from "@/lib/admin.functions";
import { money, slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: ProductsPage });

type Variant = {
  id?: string | null;
  label: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  sort_order: number;
};

type Draft = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  brand: string;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  variants: Variant[];
};

const emptyDraft: Draft = {
  id: null,
  name: "",
  slug: "",
  description: "",
  category_id: "",
  brand: "",
  images: [],
  is_featured: false,
  is_active: true,
  sort_order: 0,
  variants: [{ label: "1 kg", price: 0, compare_at_price: null, stock: 0, sku: null, sort_order: 0 }],
};

function ProductsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "catalog"], queryFn: () => getAdminCatalog() });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [catDraft, setCatDraft] = useState<{ id: string | null; name: string; slug: string; image_url: string; sort_order: number; is_active: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const save = useMutation({
    mutationFn: (d: Draft) =>
      saveProduct({
        data: {
          id: d.id,
          name: d.name,
          slug: d.slug || slugify(d.name),
          description: d.description,
          category_id: d.category_id || null,
          brand: d.brand,
          images: d.images,
          is_featured: d.is_featured,
          is_active: d.is_active,
          sort_order: Number(d.sort_order) || 0,
          variants: d.variants.map((v, i) => ({
            id: v.id ?? null,
            label: v.label,
            price: Number(v.price) || 0,
            compare_at_price: v.compare_at_price === null ? null : Number(v.compare_at_price),
            stock: Number(v.stock) || 0,
            sku: v.sku || null,
            sort_order: i,
          })),
        },
      }),
    onSuccess: () => {
      toast.success("Product saved");
      setDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Could not save the product"),
  });

  const removeProduct = useMutation({
    mutationFn: (id: string) => deleteProduct({ data: { id } }),
    onSuccess: () => {
      toast.success("Product deleted");
      invalidate();
    },
  });

  const saveCat = useMutation({
    mutationFn: (c: NonNullable<typeof catDraft>) =>
      saveCategory({ data: { id: c.id, name: c.name, slug: c.slug || slugify(c.name), image_url: c.image_url, sort_order: Number(c.sort_order) || 0, is_active: c.is_active } }),
    onSuccess: () => {
      toast.success("Category saved");
      setCatDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCat = useMutation({
    mutationFn: (id: string) => deleteCategory({ data: { id } }),
    onSuccess: () => {
      toast.success("Category deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const sheet = (await readXlsxFile(file)) as unknown as unknown[][];
      const header = (sheet[0] ?? []).map((h) => String(h ?? "").trim().toLowerCase());
      const idx = (n: string) => header.indexOf(n);
      const rows = sheet.slice(1).filter((r) => r?.[idx("name")]);
      const parsed = rows.map((r) => ({
        name: String(r[idx("name")] ?? "").trim(),
        slug: idx("slug") > -1 ? String(r[idx("slug")] ?? "").trim() : "",
        category: idx("category") > -1 ? String(r[idx("category")] ?? "").trim() : "",
        brand: idx("brand") > -1 ? String(r[idx("brand")] ?? "").trim() : "",
        description: idx("description") > -1 ? String(r[idx("description")] ?? "").trim() : "",
        image: idx("image") > -1 ? String(r[idx("image")] ?? "").trim() : "",
        variant: idx("variant") > -1 ? String(r[idx("variant")] ?? "Standard").trim() || "Standard" : "Standard",
        price: Number(r[idx("price")] ?? 0),
        compare_at_price: idx("compare_at_price") > -1 && r[idx("compare_at_price")] ? Number(r[idx("compare_at_price")]) : null,
        stock: idx("stock") > -1 ? Number(r[idx("stock")] ?? 0) : 0,
      }));
      if (!parsed.length) throw new Error("No rows found. Check the column headers.");
      const res = await bulkImportProducts({ data: { rows: parsed } });
      toast.success(`${res.created} added, ${res.updated} updated`);
      if (res.errors.length) toast.error(res.errors.slice(0, 3).join(" | "));
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  if (isLoading || !data) return <p className="text-muted-foreground">Loading products…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Product management</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={onExcel} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload className="mr-2 h-4 w-4" /> {importing ? "Importing…" : "Bulk Excel upload"}
          </Button>
          <Button onClick={() => setDraft({ ...emptyDraft })}>
            <Plus className="mr-2 h-4 w-4" /> New product
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Excel columns: name, slug, category, brand, description, image, variant, price, compare_at_price, stock. One row per size —
        repeat the name for extra sizes.
      </p>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products ({data.products.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({data.categories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-3 pt-4">
          {data.products.map((p) => {
            const variants = (p.product_variants ?? []) as Variant[];
            return (
              <Card key={p.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <img
                    src={(Array.isArray(p.images) ? (p.images[0] as string) : "") || "/placeholder.svg"}
                    alt={p.name}
                    className="h-16 w-16 rounded-lg border object-cover"
                  />
                  <div className="min-w-40 flex-1">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {variants.length} size{variants.length === 1 ? "" : "s"} ·{" "}
                      {variants.map((v) => `${v.label} ${money(v.price)}`).join(" · ")}
                    </p>
                  </div>
                  {p.is_featured && <Badge>Featured</Badge>}
                  <Badge variant={p.is_active ? "secondary" : "outline"}>{p.is_active ? "Live" : "Hidden"}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDraft({
                        id: p.id,
                        name: p.name,
                        slug: p.slug,
                        description: p.description ?? "",
                        category_id: p.category_id ?? "",
                        brand: p.brand ?? "",
                        images: Array.isArray(p.images) ? (p.images as string[]) : [],
                        is_featured: p.is_featured,
                        is_active: p.is_active,
                        sort_order: p.sort_order,
                        variants: variants
                          .slice()
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((v) => ({
                            id: v.id,
                            label: v.label,
                            price: Number(v.price),
                            compare_at_price: v.compare_at_price === null ? null : Number(v.compare_at_price),
                            stock: v.stock,
                            sku: v.sku ?? null,
                            sort_order: v.sort_order,
                          })),
                      })
                    }
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeProduct.mutate(p.id)} aria-label="Delete product">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="categories" className="space-y-3 pt-4">
          <Button size="sm" onClick={() => setCatDraft({ id: null, name: "", slug: "", image_url: "", sort_order: 0, is_active: true })}>
            <Plus className="mr-2 h-4 w-4" /> New category
          </Button>
          {data.categories.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="flex-1 font-medium">{c.name}</span>
                <Badge variant="outline">{c.slug}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCatDraft({ id: c.id, name: c.name, slug: c.slug, image_url: c.image_url ?? "", sort_order: c.sort_order, is_active: c.is_active })
                  }
                >
                  Edit
                </Button>
                <Button variant="ghost" size="icon" onClick={() => removeCat.mutate(c.id)} aria-label="Delete category">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Product editor */}
      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit product" : "New product"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>URL slug</Label>
                  <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={draft.category_id} onValueChange={(v) => setDraft({ ...draft, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                    <SelectContent>
                      {data.categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Brand</Label>
                  <Input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label>Photos (crop + optional background removal)</Label>
                <ImageManager images={draft.images} onChange={(images) => setDraft({ ...draft, images })} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Sizes &amp; prices</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        variants: [...draft.variants, { label: "", price: 0, compare_at_price: null, stock: 0, sku: null, sort_order: draft.variants.length }],
                      })
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add size
                  </Button>
                </div>
                {draft.variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-5">
                    <Input
                      placeholder="Size (1 kg)"
                      value={v.label}
                      onChange={(e) => {
                        const next = [...draft.variants];
                        next[i] = { ...v, label: e.target.value };
                        setDraft({ ...draft, variants: next });
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={v.price}
                      onChange={(e) => {
                        const next = [...draft.variants];
                        next[i] = { ...v, price: Number(e.target.value) };
                        setDraft({ ...draft, variants: next });
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Was price"
                      value={v.compare_at_price ?? ""}
                      onChange={(e) => {
                        const next = [...draft.variants];
                        next[i] = { ...v, compare_at_price: e.target.value === "" ? null : Number(e.target.value) };
                        setDraft({ ...draft, variants: next });
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Stock"
                      value={v.stock}
                      onChange={(e) => {
                        const next = [...draft.variants];
                        next[i] = { ...v, stock: Number(e.target.value) };
                        setDraft({ ...draft, variants: next });
                      }}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="SKU"
                        value={v.sku ?? ""}
                        onChange={(e) => {
                          const next = [...draft.variants];
                          next[i] = { ...v, sku: e.target.value };
                          setDraft({ ...draft, variants: next });
                        }}
                      />
                      {draft.variants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, idx) => idx !== i) })}
                          aria-label="Remove size"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} /> Visible in store
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={draft.is_featured} onCheckedChange={(v) => setDraft({ ...draft, is_featured: v })} /> Featured
                </label>
                <div className="flex items-center gap-2 text-sm">
                  Sort
                  <Input
                    type="number"
                    className="w-20"
                    value={draft.sort_order}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
            <Button onClick={() => draft && save.mutate(draft)} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category editor */}
      <Dialog open={!!catDraft} onOpenChange={(o) => !o && setCatDraft(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{catDraft?.id ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          {catDraft && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={catDraft.name} onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value, slug: catDraft.id ? catDraft.slug : slugify(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={catDraft.slug} onChange={(e) => setCatDraft({ ...catDraft, slug: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Category image</Label>
                <MediaUpload value={catDraft.image_url} onChange={(url) => setCatDraft({ ...catDraft, image_url: url })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={catDraft.is_active} onCheckedChange={(v) => setCatDraft({ ...catDraft, is_active: v })} /> Visible
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCatDraft(null)}>Cancel</Button>
            <Button onClick={() => catDraft && saveCat.mutate(catDraft)} disabled={saveCat.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
