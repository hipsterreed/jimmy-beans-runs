import { ArrowLeft, BookOpen, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import { isAdmin } from "../shared/lib/admin";
import "./admin.css";
import { ChaptersTab } from "./ChaptersTab";
import { UsersTab } from "./UsersTab";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Separator } from "./components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "./components/ui/sidebar";

type TabId = "chapters" | "users";

type TabDef = {
  id: TabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  render: () => React.ReactNode;
};

const TABS: TabDef[] = [
  {
    id: "chapters",
    label: "Chapters",
    description: "Themed monthly running quests.",
    icon: BookOpen,
    render: () => <ChaptersTab />,
  },
  {
    id: "users",
    label: "Users",
    description: "People who run, across chapters.",
    icon: UsersIcon,
    render: () => <UsersTab />,
  },
];

export default function AdminApp() {
  const [tabId, setTabId] = useState<TabId>("chapters");
  const tab = TABS.find((t) => t.id === tabId) ?? TABS[0];

  if (!isAdmin) {
    return (
      <div className="admin-root flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Add{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-xs">
                ?admin=true
              </code>{" "}
              to the URL to enable admin mode.
            </p>
            <Button asChild>
              <a href="?admin=true#admin">Open admin mode</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" tooltip="Jimmy Beans Runs">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-bold">
                    JB
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Jimmy Beans Runs</span>
                    <span className="text-muted-foreground truncate text-xs">
                      Admin
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Manage</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {TABS.map((t) => {
                    const Icon = t.icon;
                    return (
                      <SidebarMenuItem key={t.id}>
                        <SidebarMenuButton
                          isActive={t.id === tabId}
                          tooltip={t.label}
                          onClick={() => setTabId(t.id)}
                        >
                          <Icon />
                          <span>{t.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to landing">
                  <a href="#">
                    <ArrowLeft />
                    <span>Back to landing</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />
            <div className="flex flex-col">
              <h2 className="text-foreground text-sm font-semibold leading-tight">
                {tab.label}
              </h2>
              <p className="text-muted-foreground text-xs leading-tight">
                {tab.description}
              </p>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-6 sm:p-6 lg:p-8">
            {tab.render()}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
