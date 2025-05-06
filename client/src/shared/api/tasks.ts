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
  const response = await authorizedApiClient.post<Task>("/tasks", { title });
  return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  return authorizedApiClient.delete(`/tasks/${id}`);
};

export const toggleTask = async (
  id: number,
  completed: boolean,
): Promise<Task> => {
  const response = await authorizedApiClient.patch<Task>(`/tasks/${id}`, {
    completed,
  });
  return response.data;
};
