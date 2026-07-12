import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  type JackieTask,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/jackie-tasks";

const STATUS_OPTIONS: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];
const PRIORITY_OPTIONS: TaskPriority[] = ["low", "medium", "high", "critical"];

const Tasks = () => {
  const [tasks, setTasks] = useState<JackieTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState("general");
  const [dueDate, setDueDate] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setTasks(await getTasks());
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    try {
      await createTask(title.trim(), description.trim(), priority, category.trim() || "general", dueDate || undefined);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setCategory("general");
      setDueDate("");
      toast.success("Task created");
      await load();
    } catch {
      toast.error("Failed to create task");
    }
  };

  const onStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await updateTask(id, { status });
      await load();
    } catch {
      toast.error("Failed to update task");
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteTask(id);
      toast.success("Task deleted");
      await load();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-secondary/20 p-3">
          <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">Task Command Center</h1>
          <div className="flex items-center gap-2">
            <Link className="px-2 py-1 font-mono text-[11px] text-primary hover:bg-secondary/60" to="/task-board">
              Board
            </Link>
            <Link className="px-2 py-1 font-mono text-[11px] text-primary hover:bg-secondary/60" to="/task-calendar">
              Calendar
            </Link>
            <Link className="px-2 py-1 font-mono text-[11px] text-primary hover:bg-secondary/60" to="/">
              Back to Chat
            </Link>
          </div>
        </div>

        <form onSubmit={onCreate} className="grid gap-2 border border-border bg-secondary/10 p-3 md:grid-cols-6">
          <input
            className="col-span-2 bg-background px-2 py-1 font-mono text-xs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
          />
          <input
            className="col-span-2 bg-background px-2 py-1 font-mono text-xs"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <select className="bg-background px-2 py-1 font-mono text-xs" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input className="bg-background px-2 py-1 font-mono text-xs" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
          <input className="bg-background px-2 py-1 font-mono text-xs" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <button className="bg-primary px-3 py-1 font-mono text-xs text-primary-foreground hover:opacity-90" type="submit">
            Add Task
          </button>
        </form>

        <div className="grid gap-2 border border-border bg-secondary/10 p-3 md:grid-cols-2">
          <select className="bg-background px-2 py-1 font-mono text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}>
            <option value="all">status: all</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                status: {option}
              </option>
            ))}
          </select>
          <select className="bg-background px-2 py-1 font-mono text-xs" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "all")}>
            <option value="all">priority: all</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                priority: {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="border border-border bg-secondary/10 p-6 text-center font-mono text-xs text-muted-foreground">Loading tasks…</div>
          ) : filtered.length === 0 ? (
            <div className="border border-border bg-secondary/10 p-6 text-center font-mono text-xs text-muted-foreground">No tasks found.</div>
          ) : (
            filtered.map((task) => (
              <div key={task.id} className="grid gap-2 border border-border bg-secondary/10 p-3 md:grid-cols-[1fr_auto_auto]">
                <div className="space-y-1">
                  <div className="font-mono text-xs text-foreground">{task.title}</div>
                  {task.description && <div className="font-mono text-[11px] text-muted-foreground">{task.description}</div>}
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {task.priority} · {task.category}
                    {task.due_date ? ` · due ${task.due_date}` : ""}
                  </div>
                </div>
                <select className="bg-background px-2 py-1 font-mono text-[11px]" value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button className="bg-destructive/80 px-2 py-1 font-mono text-[11px] text-destructive-foreground hover:opacity-90" onClick={() => void onDelete(task.id)}>
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
