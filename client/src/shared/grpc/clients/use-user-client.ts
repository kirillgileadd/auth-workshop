import { useGrpcClient } from "../use-grpc-client.ts";
import { TasksServiceDefinition } from "@/shared/proto/tasks.ts";

export const useTasksClient = () => {
  return useGrpcClient(TasksServiceDefinition);
};
