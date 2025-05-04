import { authorizedApiClient } from "./client-axios.ts";

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
  createdAt: string;
}

export const getTasks = async (): Promise<Task[]> => {
  const response = await authorizedApiClient.get<Task[]>("/tasks");
  return response.data;
};

export const createTask = async (title: string): Promise<Task> => {
  return authorizedApiClient<Task>({
    url: "/tasks",
    method: "POST",
    json: { title },
  });
};

export const deleteTask = async (id: number): Promise<void> => {
  return authorizedApiClient({
    url: `/tasks/${id}`,
    method: "DELETE",
  });
};

export const toggleTask = async (
  id: number,
  completed: boolean,
): Promise<Task> => {
  return authorizedApiClient<Task>({
    url: `/tasks/${id}`,
    method: "PATCH",
    json: { completed },
  });
};
