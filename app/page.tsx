import Link from 'next/link';
import { ChevronRight, QrCode, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const customerEntryPoints = [
  { table: 'Table 4', path: '/table/table-4/menu' },
  { table: 'Table 7', path: '/table/table-7/menu' },
  { table: 'Table 12', path: '/table/table-12/menu' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6 lg:justify-center">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              PROTOTYPE DEMO
            </p>
            <h1 className="text-2xl font-semibold text-foreground mb-3">
              Bistro Aurora — in-restaurant assistant
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Scan a QR code to enter a table as a customer, or open the staff dashboard to handle live requests. All data is mocked.
            </p>
          </div>

          {/* Customer view section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">Customer view (mobile)</h2>
            </div>

            <div className="space-y-3">
              {customerEntryPoints.map((item) => (
                <Link key={item.table} href={item.path}>
                  <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-card-foreground">{item.table}</h3>
                          <p className="text-xs text-muted-foreground">Simulate QR scan</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Staff & manager section */}
          <div>
            <h2 className="text-sm font-medium text-foreground mb-4">Staff & manager views</h2>

            <div className="space-y-3">
              <Link href="/dashboard">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-12 text-sm font-medium">
                  Open staff dashboard →
                </Button>
              </Link>

              <Link href="/menu/admin">
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground rounded-full h-12 text-sm font-medium hover:bg-secondary"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Menu admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
