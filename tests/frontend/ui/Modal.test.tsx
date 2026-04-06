import { fireEvent, render, screen } from "@testing-library/react";

import Modal from "@/shared/ui/Modal";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={jest.fn()}>
        Body
      </Modal>
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders content and title when open", () => {
    render(
      <Modal isOpen onClose={jest.fn()} title="Test title">
        Body
      </Modal>
    );

    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Test title")).toBeInTheDocument();
  });

  it("calls onClose on Escape", () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        Body
      </Modal>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the overlay is clicked", () => {
    const onClose = jest.fn();
    const { container } = render(
      <Modal isOpen onClose={onClose}>
        Body
      </Modal>
    );

    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside the modal body", () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <div>Body</div>
      </Modal>
    );

    fireEvent.click(screen.getByText("Body"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
