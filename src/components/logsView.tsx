import {
  useEffect,
  useState,
  useRef,
  PropsWithChildren
} from "react";
import { ButtonItem } from "@decky/ui";
import PageView from "./pageView";

interface LogsViewProps {
  title: string;
  getLog: () => Promise<string>;
  fullPage: boolean;
}

export default function LogsView({ title, getLog, fullPage = true, children }: PropsWithChildren<LogsViewProps>) {
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
    <PageView
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
      fullPage={fullPage}
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
    </PageView>
  );
}
