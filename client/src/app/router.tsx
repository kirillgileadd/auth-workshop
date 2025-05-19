import { createBrowserRouter, redirect } from "react-router-dom";
import LoginPage from "../modules/auth/LoginPage";
import RegisterPage from "../modules/auth/RegisterPage";
import TaskList from "../modules/tasks/TaskList";
import { App } from "./app";
// import { appSessionStore } from "@/shared/session-mobx-is-auth.ts";
import { appSessionStore } from "@/shared/session-mobx.ts";
import { reaction } from "mobx";
// import { reaction } from "mobx";

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
        loader: () => {
          if (appSessionStore.getSessionToken()) {
            return redirect("/tasks");
          }
          return null;
        },
        children: [
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
    ],
  },
]);

reaction(
  () => appSessionStore.updateSessionSteam.lastEvent,
  (newEvent) => {
    if (newEvent?.type === "remove") {
      router.navigate("/login");
    }
  },
);

// appSessionStore.updateSessionSteam.listen((event) => {
//   if (event.type === "remove") {
//     router.navigate("/login");
//   }
// });

// appSessionStore.updateSessionSteam.listen((event) => {
//   if (event.type === "remove") {
//     router.navigate("/login");
//   }
// });
