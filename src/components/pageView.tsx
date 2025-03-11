import { PropsWithChildren } from "react";
import { CSS_MAX_VIEWABLE_HEIGHT } from "../helpers/commonDefs";
import Container from "./container";

interface pageViewProps {
  title: string;
  description?: string;
  titleItem?: React.ReactNode;
  fullPage: boolean;
}

export default function pageView({ title, description, titleItem, fullPage = true, children }: PropsWithChildren<pageViewProps>) {
  const baseStyles = {
    height: "100%",
    maxHeight: CSS_MAX_VIEWABLE_HEIGHT,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  };

  const styles = fullPage
    ? {
      ...baseStyles,
      margin: "40px 20px",
    }
    : {
      ...baseStyles,
      width: "calc(100% - 36px)",
      marginTop: "-24px",
      position: "fixed",
      paddingRight: "36px",
    };

  const HeadingTag = fullPage ? 'h1' : 'h2';

  return (
    <div style={styles}>
      <Container
        title={<HeadingTag
          style={{
            margin: "0",
            minHeight: "28px",
            alignContent: "center",
          }}>
          {title}
        </HeadingTag>}
        description={description}
        titleItem={titleItem}
      >
        {children}
      </Container>
    </div>
  );
}
