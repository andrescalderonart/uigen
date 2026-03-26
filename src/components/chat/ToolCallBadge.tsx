"use client";

import { Loader2, FilePlus, FilePen, FileSearch, Trash2, FolderInput } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  state: string;
  result?: unknown;
  args: Record<string, unknown>;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

function getFileName(path: unknown): string {
  if (typeof path !== "string" || !path) return "";
  return path.split("/").pop() ?? path;
}

function getLabel(toolName: string, args: Record<string, unknown>): { text: string; icon: React.ReactNode } {
  if (toolName === "str_replace_editor") {
    const command = args.command as string;
    const file = getFileName(args.path);
    switch (command) {
      case "create":
        return { text: `Creating ${file}`, icon: <FilePlus className="w-3 h-3" /> };
      case "str_replace":
      case "insert":
        return { text: `Editing ${file}`, icon: <FilePen className="w-3 h-3" /> };
      case "view":
        return { text: `Reading ${file}`, icon: <FileSearch className="w-3 h-3" /> };
      case "undo_edit":
        return { text: `Reverting ${file}`, icon: <FilePen className="w-3 h-3" /> };
    }
  }

  if (toolName === "file_manager") {
    const command = args.command as string;
    const file = getFileName(args.path);
    switch (command) {
      case "rename":
        return { text: `Renaming ${file}`, icon: <FolderInput className="w-3 h-3" /> };
      case "delete":
        return { text: `Deleting ${file}`, icon: <Trash2 className="w-3 h-3" /> };
    }
  }

  return { text: toolName, icon: null };
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const { toolName, state, result, args } = toolInvocation;
  const done = state === "result" && result != null;
  const { text, icon } = getLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
      )}
      {icon && <span className="text-neutral-500">{icon}</span>}
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
