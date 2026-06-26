import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

const STAR_PATH =
  "M100,10 L118.6,55 L163.6,36.4 L145,81.4 L190,100 L145,118.6 L163.6,163.6 L118.6,145 L100,190 L81.4,145 L36.4,163.6 L55,118.6 L10,100 L55,81.4 L36.4,36.4 L81.4,55 Z";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#622b14" />
        <Meta />
        <Links />
      </head>
      <body>
        <div
          className="fixed inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <svg className="w-[100vmin] animate-spin-slow" viewBox="3 3 194 194" fill="none">
            <circle
              cx="100"
              cy="100"
              r="97"
              stroke="var(--primary)"
              strokeWidth="0.3"
              opacity="0.06"
            />
            <path d={STAR_PATH} stroke="var(--primary)" strokeWidth="0.5" opacity="0.1" />
            <circle
              cx="100"
              cy="100"
              r="78"
              stroke="var(--primary)"
              strokeWidth="0.3"
              opacity="0.07"
            />
            <path
              d="M100,28 L114,65 L149,52 L134,87 L171,100 L134,113 L149,148 L114,135 L100,172 L86,135 L51,148 L66,113 L29,100 L66,87 L51,52 L86,65 Z"
              stroke="var(--primary)"
              strokeWidth="0.4"
              opacity="0.08"
            />
            <circle
              cx="100"
              cy="100"
              r="58"
              stroke="var(--primary)"
              strokeWidth="0.3"
              opacity="0.06"
            />
            <path
              d="M100,47 L109,73 L135,63 L125,89 L151,100 L125,111 L135,137 L109,127 L100,153 L91,127 L65,137 L75,111 L49,100 L75,89 L65,63 L91,73 Z"
              stroke="var(--primary)"
              strokeWidth="0.4"
              opacity="0.07"
            />
            <circle
              cx="100"
              cy="100"
              r="38"
              stroke="var(--primary)"
              strokeWidth="0.3"
              opacity="0.05"
            />
            <circle
              cx="100"
              cy="100"
              r="2"
              stroke="var(--primary)"
              strokeWidth="0.5"
              opacity="0.08"
            />
            <line
              x1="100"
              y1="3"
              x2="100"
              y2="197"
              stroke="var(--primary)"
              strokeWidth="0.25"
              opacity="0.05"
            />
            <line
              x1="3"
              y1="100"
              x2="197"
              y2="100"
              stroke="var(--primary)"
              strokeWidth="0.25"
              opacity="0.05"
            />
            <line
              x1="31"
              y1="31"
              x2="169"
              y2="169"
              stroke="var(--primary)"
              strokeWidth="0.25"
              opacity="0.05"
            />
            <line
              x1="169"
              y1="31"
              x2="31"
              y2="169"
              stroke="var(--primary)"
              strokeWidth="0.25"
              opacity="0.05"
            />
          </svg>
        </div>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import { Toaster } from "~/components/ui/sonner";

export default function App() {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" richColors />
    </>
  );
}

import { NotFoundContent } from "./routes/not-found";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <Layout>
        <NotFoundContent />
      </Layout>
    );
  }

  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
