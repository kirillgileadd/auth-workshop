import { createBrowserRouter, redirect } from "react-router-dom";
import LoginPage from "../modules/auth/LoginPage";
import RegisterPage from "../modules/auth/RegisterPage";
import TaskList from "../modules/tasks/TaskList";
import { App } from "./app";
import { appSessionStore } from "@/shared/session-mobx.ts";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        path: "/",
        loader: () => {
          return redirect("/tasks");
        },
      },
      {
        loader: () => {
          if (!appSessionStore.getSessionToken()) {
            return redirect("/login");
          }

          return null;
        },
        // private pages
        children: [
          {
            path: "/tasks",
            element: <TaskList />,
          },
        ],
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
    ],
  },
]);

appSessionStore.updateSessionSteam.listen((event) => {
  if (event.type === "remove") {
    router.navigate("/login");
  }
});
