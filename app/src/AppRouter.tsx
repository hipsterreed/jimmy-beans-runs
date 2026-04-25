import { lazy, Suspense, useEffect, useState } from "react";
import Landing from "./landing/Landing";

const Chapter1 = lazy(() => import("./chapter_1/App"));
const Chapter2 = lazy(() => import("./chapter_2/App"));
const AdminApp = lazy(() => import("./admin/AdminApp"));

function readRoute(): string {
  return window.location.hash.replace(/^#/, "");
}

export default function AppRouter() {
  const [route, setRoute] = useState(readRoute());

  useEffect(() => {
    const handler = () => setRoute(readRoute());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  if (route === "chapter-1") {
    return (
      <Suspense fallback={null}>
        <Chapter1 />
      </Suspense>
    );
  }
  if (route === "chapter-2") {
    return (
      <Suspense fallback={null}>
        <Chapter2 />
      </Suspense>
    );
  }
  if (route === "admin") {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    );
  }
  return <Landing />;
}
