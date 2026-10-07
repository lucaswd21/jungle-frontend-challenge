import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({
  title,
  description,
  children,
  onCloseAutoFocus,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onCloseAutoFocus?: DialogPrimitive.DialogContentProps["onCloseAutoFocus"];
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/70" />
      <DialogPrimitive.Content
        onInteractOutside={(event) => {
          const target = event.detail.originalEvent.target;
          if (
            target instanceof Element &&
            target.closest("[data-notification]")
          )
            event.preventDefault();
        }}
        onCloseAutoFocus={onCloseAutoFocus}
        className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-surface-card p-6 shadow-2xl"
      >
        <DialogPrimitive.Title className="pr-10 text-2xl font-semibold">
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="mt-2 text-sm text-muted">
          {description}
        </DialogPrimitive.Description>
        <div className="mt-6">{children}</div>
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-surface-raised"
          aria-label="Fechar diálogo"
        >
          <img src="/assets/kurio/close.svg" alt="" width="20" height="20" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
