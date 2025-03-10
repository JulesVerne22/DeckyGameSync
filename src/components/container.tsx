import { Field } from "@decky/ui";
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
        {titleItem}
      </Field>
      <div style={{
        height: "calc(100% - 80px)",
      }}>
        {children}
      </div>
    </>
  )
}
