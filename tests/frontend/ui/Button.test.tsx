import { fireEvent, render, screen } from "@testing-library/react";

import Button from "@/shared/ui/Button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Press me</Button>);
    expect(screen.getByRole("button", { name: "Press me" })).toBeInTheDocument();
  });

  it("fires onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Press me</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Press me" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows a spinner and disables the button when loading", () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole("button", { name: "Loading" });

    expect(button).toBeDisabled();
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument();
  });

  it("prevents clicks when disabled", () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    fireEvent.click(screen.getByRole("button", { name: "Disabled" }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders all variants and matches snapshots", () => {
    const { container, rerender } = render(<Button variant="primary">Primary</Button>);
    expect(container.firstChild).toMatchSnapshot();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(container.firstChild).toMatchSnapshot();

    rerender(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
