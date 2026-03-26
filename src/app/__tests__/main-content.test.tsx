import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div>{children}</div>,
  useFileSystem: vi.fn().mockReturnValue({
    getAllFiles: vi.fn().mockReturnValue(new Map()),
    refreshTrigger: 0,
  }),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
  useChat: vi.fn().mockReturnValue({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
  }),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Header Actions</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

afterEach(() => {
  cleanup();
});

test("shows preview by default", () => {
  render(<MainContent />);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});

test("switches to code view when Code tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTab);

  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.getByTestId("file-tree")).toBeDefined();
});

test("switches back to preview when Preview tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();

  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("can toggle multiple times", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // preview → code → preview → code
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();

  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();
});
