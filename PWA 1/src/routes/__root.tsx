import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, useRef, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AdminAuthProvider } from "../lib/admin-auth";
import { AdminStoreProvider, useAdminStore } from "../lib/admin-store";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "KSR PMI UNHAS" },
      {
        name: "description",
        content:
          "Portal informasi & layanan respon cepat donor darah. Temukan pendonor, ikuti kegiatan, dan bantu sesama dengan satu tetes harapan.",
      },
      { property: "og:title", content: "KSR PMI UNHAS" },
      {
        property: "og:description",
        content:
          "Portal informasi & layanan respon cepat donor darah. Temukan pendonor, ikuti kegiatan, dan bantu sesama dengan satu tetes harapan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "KSR PMI UNHAS" },
      {
        name: "twitter:description",
        content:
          "Portal informasi & layanan respon cepat donor darah. Temukan pendonor, ikuti kegiatan, dan bantu sesama dengan satu tetes harapan.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cf0c02eb-9f57-4e97-be01-f5853e555ede/id-preview-bc4b2b78--bec18705-9c79-418c-b277-8d2c2536eb95.lovable.app-1781624961367.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cf0c02eb-9f57-4e97-be01-f5853e555ede/id-preview-bc4b2b78--bec18705-9c79-418c-b277-8d2c2536eb95.lovable.app-1781624961367.png",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Lexend:wght@300..800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppLoader({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAdminStore();
  const href = useRouterState({ select: (s) => s.location.href });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevHrefRef = useRef(href);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Cek apakah perpindahannya hanya muter-muter di dalam dashboard admin
    const isMovingWithinAdmin = prevHrefRef.current.startsWith('/admin') && href.startsWith('/admin');
    
    // Cegah trigger jika href sebenarnya tidak berubah
    if (prevHrefRef.current === href) return;
    
    // Cegah trigger jika hanya pindah anchor (hash) di halaman yang sama
    const prevPath = prevHrefRef.current.split(/[?#]/)[0];
    const currentPath = href.split(/[?#]/)[0];
    const isSamePageAnchor = prevPath === currentPath && href.includes('#');
    
    prevHrefRef.current = href;

    // Tampilkan loader setiap kali pindah halaman atau section, KECUALI jika hanya pindah tab/menu di dalam dashboard admin atau link anchor
    if (isLoaded && !isMovingWithinAdmin && !isSamePageAnchor) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // Durasi animasi fake loading (500ms)
      return () => clearTimeout(timer);
    }
  }, [href, isLoaded]); // Bergantung pada href (termasuk hash)
  
  if (!isLoaded || isTransitioning) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-background fixed inset-0 z-[9999]">
        {/* Kontainer ini digeser sedikit ke atas (-translate-y-8) agar secara visual pas di tengah layar HP */}
        <div className="flex flex-col items-center -translate-y-8 md:-translate-y-12">
          <div className="relative mb-6">
            <img 
              src="/logo.png" 
              alt="KSR PMI UNHAS" 
              className="h-20 md:h-24 w-auto object-contain animate-pulse"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary/20 rounded-full blur-sm"></div>
          </div>
          <p className="text-muted-foreground font-medium tracking-widest text-sm animate-pulse uppercase">Memuat...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AdminStoreProvider>
        <AdminAuthProvider>
          <AppLoader>
            <Outlet />
          </AppLoader>
          <Toaster position="top-center" offset={16} />
        </AdminAuthProvider>
      </AdminStoreProvider>
    </QueryClientProvider>
  );
}
