import { logout } from "@/shared/api/auth";
import { useTransition } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { appSessionStore } from "@/shared/session-mobx-is-auth.ts";
import { appSessionStore } from "@/shared/session.ts";

export function Header() {
  const navigate = useNavigate();
  // const session = appSessionStore.useSession();
  const session = appSessionStore.getSession();
  // const token = appSessionStore.token;

  const [isTransitioning, startTransition] = useTransition();

  const handleLogout = () =>
    startTransition(async () => {
      await logout();
      navigate("/login");
    });

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                Task Manager
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {session ? (
              <>
                <span className="text-gray-700 mr-4">
                  Welcome, {session.username}!
                </span>
                <button
                  onClick={handleLogout}
                  disabled={isTransitioning}
                  className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-gray-900">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
