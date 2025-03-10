import React, { PropsWithChildren } from "react";

export default function deckyStoreButton({ icon, children }: PropsWithChildren<{ icon: React.ReactElement }>) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      {icon}
      <div>{children}</div>
    </div>
  );
}