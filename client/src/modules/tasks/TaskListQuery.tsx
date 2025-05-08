import { useState } from "react";
import { useTasksClient } from "@/shared/grpc/clients/use-user-client.ts";
import { useQuery } from "@tanstack/react-query";

export default function TaskListQuery() {
  const { getTasks } = useTasksClient();
  const tasksQuery = useQuery({
    queryFn: async ({ signal }) => {
      const res = getTasks(signal);

      return res;
    },
    queryKey: ["tasks"],
  });
  const [newTaskTitle, setNewTaskTitle] = useState("");

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      {/*{tasksQuery.error && (*/}
      {/*  <div className="text-red-500 mb-4">{tasksQuery.error}</div>*/}
      {/*)}*/}

      <form className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter new task"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Task
          </button>
        </div>
      </form>

      <ul className="space-y-3">
        {tasksQuery.data?.tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 p-3 bg-white rounded-lg shadow"
          >
            <input
              type="checkbox"
              checked={task.completed}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span
              className={`flex-1 ${
                task.completed ? "line-through text-gray-500" : ""
              }`}
            >
              {task.title}
            </span>
            <button className="text-red-600 hover:text-red-800">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
