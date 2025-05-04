import { Outlet } from "react-router-dom";
import { Header } from "./header";

export function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="py-6">
        <Outlet />
      </main>
    </div>
  );
}
