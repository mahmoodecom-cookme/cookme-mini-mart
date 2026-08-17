import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bot,
  ChevronDown,
  Image as ImageIcon,
  LayoutPanelLeft,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Store,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import logo from "@/assets/cookme-logo.png";

const shopItems = [
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/promotions", label: "Promotions", icon: ImageIcon },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const shopOpen = shopItems.some((i) => pathname.startsWith(i.to));

  const itemClass = (active: boolean) =>
    active
      ? "bg-white text-[oklch(0.5_0.22_28.5)] font-semibold hover:bg-white hover:text-[oklch(0.5_0.22_28.5)]"
      : "text-white/85 hover:bg-white/15 hover:text-white";

  return (
    <Sidebar collapsible="icon" className="border-none">
      <div className="flex h-full flex-col bg-[oklch(0.55_0.235_28.5)] text-white">
        <SidebarHeader className="border-b border-white/15 p-3">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white">
              <img src={logo} alt="Cook Me Mini Mart" className="h-8 w-auto" />
            </span>
            {!collapsed && (
              <span className="text-sm font-bold leading-tight">
                Cook Me
                <span className="block text-[11px] font-medium text-white/75">Owner Dashboard</span>
              </span>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="pt-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className={itemClass(pathname === "/admin")} tooltip="Dashboard">
                    <Link to="/admin">
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-white/60">Shop management</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {collapsed ? (
                  shopItems.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild className={itemClass(pathname.startsWith(item.to))} tooltip={item.label}>
                        <Link to={item.to}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <Collapsible defaultOpen={shopOpen} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={itemClass(false)}>
                          <LayoutPanelLeft className="h-4 w-4" />
                          <span>Shop management</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="border-white/20">
                          {shopItems.map((item) => (
                            <SidebarMenuSubItem key={item.to}>
                              <SidebarMenuSubButton asChild className={itemClass(pathname.startsWith(item.to))}>
                                <Link to={item.to}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-white/60">Website</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  { to: "/admin/store", label: "Store Settings", icon: Store },
                  { to: "/admin/settings", label: "Settings", icon: Settings },
                  { to: "/admin/assistant", label: "AI Assistant", icon: Bot },
                ].map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild className={itemClass(pathname.startsWith(item.to))} tooltip={item.label}>
                      <Link to={item.to}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
