import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      gap={6}
      toastOptions={{
        classNames: {
          toast: [
            "group toast",
            "!rounded-full !px-4 !py-2 !min-h-0",
            "!text-xs !font-medium !leading-none",
            "!shadow-md !border",
            "!bg-background !text-foreground !border-border",
            "flex items-center gap-2",
          ].join(" "),
          title: "!text-xs !font-medium",
          description: "hidden",
          icon: "!w-3.5 !h-3.5 shrink-0",
          closeButton: "hidden",
          success: [
            "!border-emerald-200 !bg-emerald-50 !text-emerald-800",
          ].join(" "),
          error: [
            "!border-red-200 !bg-red-50 !text-red-800",
          ].join(" "),
          warning: [
            "!border-amber-200 !bg-amber-50 !text-amber-800",
          ].join(" "),
          info: [
            "!border-blue-200 !bg-blue-50 !text-blue-800",
          ].join(" "),
          actionButton: "!text-xs !px-2 !py-1 !rounded-full !font-medium",
          cancelButton: "!text-xs !px-2 !py-1 !rounded-full",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

