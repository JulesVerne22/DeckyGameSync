import { Field } from "@decky/ui";
import { PropsWithChildren } from "react";

interface ContainerProps {
  title: string;
  description?: string;
  titleItem?: React.ReactNode;
}

export default function Container({ title, description, titleItem, children }: PropsWithChildren<ContainerProps>) {
  return (
    <div style={{
      padding: "40px 20px 40px 20px",
      maxHeight: "calc(100vh - 80px)",
    }}>
      <Field
        label={<h1 style={{ margin: "0" }}>{title}</h1>}
        description={description && (<small>{description}</small>)}
        highlightOnFocus={false}>
        {titleItem}
      </Field>
      <div>{children}</div>
    </div>
  );
}
