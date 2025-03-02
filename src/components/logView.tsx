import {
  useEffect,
  useState,
  useRef,
  PropsWithChildren
} from "react";
import Container from "./container";

interface LogViewProps {
  title: string;
  getLog: () => Promise<string>;
}

export default function LogView({ title, getLog, children }: PropsWithChildren<LogViewProps>) {
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
    <Container title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
        <div>
          <button
            onClick={async () => setLogContent(await getLog())}
          >
            Refresh
          </button>
          {children}
        </div>
        <pre
          ref={logPreRef}
          style={{
            overflowY: 'scroll',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: "smaller",
            width: "100vw",
            maxHeight: "300px"
          }}>
          {logContent}
        </pre>
      </div>
    </Container>
  );
}
