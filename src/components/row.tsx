import { Field, Focusable } from "@decky/ui";
import { PropsWithChildren } from "react";

export default function row({ children }: PropsWithChildren) {
  return (
    <Field
      childrenContainerWidth="max"
      highlightOnFocus={false}
      bottomSeparator="none"
      padding="none"
    >
      <Focusable
        style={{
          display: "flex",
          marginBottom: "-12px",
        }}
        children={
          <div
            style={{
              width: "100%",
              display: "flex",
              gap: "8px",
            }}>
            {children}
          </div>} />
    </Field>
  )
}
