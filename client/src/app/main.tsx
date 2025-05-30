import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GrpcClientsProvider } from "@/shared/grpc/grpc-client-provider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <GrpcClientsProvider>
        <RouterProvider router={router} />
      </GrpcClientsProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
