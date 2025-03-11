import { Field, Focusable } from "@decky/ui";
import { PropsWithChildren } from "react";

interface ContainerProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  titleItem?: React.ReactNode;
}

export default function container({ title, description, titleItem, children }: PropsWithChildren<ContainerProps>) {
  return (
    <>
      <Field
        label={title}
        description={description && (<small>{description}</small>)}
        highlightOnFocus={false}>
        <Focusable
          style={{ display: "flex" }}
          children={
            <div style={{
              display: "flex",
              gap: "8px",
            }}>
              {titleItem}
            </div>} />
      </Field>
      <div style={{
        overflowY: "auto",
      }}>
        {children}
      </div>
    </>
  )
}
