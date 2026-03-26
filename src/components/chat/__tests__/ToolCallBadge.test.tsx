import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- str_replace_editor ---

test("shows 'Creating' for str_replace_editor create command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        state: "result",
        result: "ok",
        args: { command: "create", path: "src/components/Card.jsx" },
      }}
    />
  );
  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor str_replace command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        state: "result",
        result: "ok",
        args: { command: "str_replace", path: "src/App.jsx" },
      }}
    />
  );
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor insert command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        state: "result",
        result: "ok",
        args: { command: "insert", path: "src/App.jsx" },
      }}
    />
  );
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("shows 'Reading' for str_replace_editor view command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        state: "result",
        result: "ok",
        args: { command: "view", path: "src/index.js" },
      }}
    />
  );
  expect(screen.getByText("Reading index.js")).toBeDefined();
});

test("shows 'Reverting' for str_replace_editor undo_edit command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        state: "result",
        result: "ok",
        args: { command: "undo_edit", path: "src/App.jsx" },
      }}
    />
  );
  expect(screen.getByText("Reverting App.jsx")).toBeDefined();
});

// --- file_manager ---

test("shows 'Renaming' for file_manager rename command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "file_manager",
        state: "result",
        result: "ok",
        args: { command: "rename", path: "src/OldName.jsx", new_path: "src/NewName.jsx" },
      }}
    />
  );
  expect(screen.getByText("Renaming OldName.jsx")).toBeDefined();
});

test("shows 'Deleting' for file_manager delete command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "file_manager",
        state: "result",
        result: "ok",
        args: { command: "delete", path: "src/Unused.jsx" },
      }}
    />
  );
  expect(screen.getByText("Deleting Unused.jsx")).toBeDefined();
});

// --- states ---

test("shows green dot when state is result with a result", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        state: "result",
        result: "ok",
        args: { command: "create", path: "Card.jsx" },
      }}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("shows spinner when state is not result", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        state: "call",
        args: { command: "create", path: "Card.jsx" },
      }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("falls back to tool name for unknown tools", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "unknown_tool",
        state: "result",
        result: "ok",
        args: {},
      }}
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});
