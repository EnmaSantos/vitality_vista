// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Timer from "./Timer";

describe("Timer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts and pauses through the controls a user can discover", async () => {
    const user = userEvent.setup();

    render(<Timer duration={5} onFinish={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /start timer/i }));

    expect(
      screen.getByRole("button", { name: /pause timer/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /pause timer/i }));

    expect(
      screen.getByRole("button", { name: /start timer/i }),
    ).toBeInTheDocument();
  });

  it("counts down, pauses, resumes, and calls the completion handler", () => {
    vi.useFakeTimers();
    const handleFinish = vi.fn();

    render(<Timer duration={5} onFinish={handleFinish} />);

    expect(screen.getByText("0:05")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start timer/i }));

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByText("0:03")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /pause timer/i }));
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByText("0:03")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start timer/i }));
    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.getByText("0:00")).toBeInTheDocument();
    expect(handleFinish).toHaveBeenCalledOnce();
  });

  it("resets the displayed time when the duration changes", () => {
    const { rerender } = render(
      <Timer duration={30} onFinish={vi.fn()} />,
    );

    expect(screen.getByText("0:30")).toBeInTheDocument();

    rerender(<Timer duration={90} onFinish={vi.fn()} />);

    expect(screen.getByText("1:30")).toBeInTheDocument();
  });
});
