import { Field } from "@decky/ui";
import { PropsWithChildren } from "react";

interface ContainerProps {
  title: string;
  description?: string;
  titleItem?: React.ReactNode;
}

export default function Container({ title, description, titleItem, children }: PropsWithChildren<ContainerProps>) {
  return (
    <>
      <Field
        label={<h1 style={{ margin: "0" }}>{title}</h1>}
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
