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
  getLog: () => Promise<string>;
}

export default function LogsView({ title, getLog, children }: PropsWithChildren<LogViewProps>) {
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

  return (
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
          maxHeight: "calc(100vh - 160px)",
          margin: "0",
        }}>
        {logContent}
      </pre>
    </Container>
  );
}
