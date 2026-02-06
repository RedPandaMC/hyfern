import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ExamplePage() {
  return (
    <DashboardShell pageTitle="Example Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome to HyFern</h2>
            <p className="text-muted-foreground">
              This is an example page showing the layout components in action.
            </p>
          </div>
          <Button>Get Started</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Server Status</CardTitle>
              <CardDescription>Current server information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge>Online</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
              <CardDescription>Active player count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5 / 20</div>
              <p className="text-xs text-muted-foreground">players online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>Server TPS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">19.8</div>
              <p className="text-xs text-muted-foreground">ticks per second</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
