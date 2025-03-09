import {
  useEffect,
  useState,
  useRef,
  PropsWithChildren
} from "react";
import { ButtonItem } from "@decky/ui";
import Container from "./container";

interface LogViewProps {
  title: string;
  fullPage?: boolean;
  getLog: () => Promise<string>;
}

export default function LogsView({ title, getLog, fullPage, children }: PropsWithChildren<LogViewProps>) {
  const [logContent, setLogContent] = useState('');
  const logPreRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    getLog().then(log => setLogContent(log));
  }, []);

  useEffect(() => {
    logPreRef.current?.scrollTo({
      top: logPreRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [logContent]);

  const content = (
    <Container
      title={title}
      titleItem={
        <>
          {children}
          <ButtonItem
            onClick={() => getLog().then(e => setLogContent(e))}>
            Refresh
          </ButtonItem>
        </>
      }
    >
      <pre
        ref={logPreRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1em',
          overflowY: 'scroll',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: "smaller",
          lineHeight: "1.2em",
          maxHeight: "calc(100% - 1px)",
          margin: "0",
        }}>
        {logContent}
      </pre>
    </Container>
  );

  return (fullPage ? (
    <div style={{
      padding: "40px 20px 40px 20px",
      height: "calc(100vh - 80px)",
    }}>
      {content}
    </div>
  ) :
    content
  );
}
