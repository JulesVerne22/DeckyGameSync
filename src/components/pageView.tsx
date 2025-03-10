import { PropsWithChildren } from "react";
import Container from "./container";
import { CSS_MAX_VIEWABLE_HEIGHT } from "../helpers/commonDefs";

interface pageViewProps {
  title: string;
  description?: string;
  titleItem?: React.ReactNode;
  fullPage: boolean;
}

export default function pageView({ title, description, titleItem, fullPage = true, children }: PropsWithChildren<pageViewProps>) {
  const baseStyles = {
    height: CSS_MAX_VIEWABLE_HEIGHT,
  };

  const styles = fullPage
    ? {
      ...baseStyles,
      padding: "40px 20px 40px 20px",
    }
    : {
      ...baseStyles,
      marginTop: "-24px",
      position: "fixed",
      paddingRight: "36px",
    };

  const HeadingTag = fullPage ? 'h1' : 'h2';

  return (
    <div style={styles}>
      <Container
        title={<HeadingTag style={{ margin: "0" }}>{title}</HeadingTag>}
        description={description}
        titleItem={titleItem}
      >
        {children}
      </Container>
    </div>
  );
}
