import { ButtonItem } from "@decky/ui";
import React, { PropsWithChildren } from "react";

interface ButtonWithIconProps {
  icon: React.ReactElement;
  disabled?: boolean;
  onClick?: () => void;
}

export default function buttonWithIcon({ icon, disabled, onClick, children }: PropsWithChildren<ButtonWithIconProps>) {
  return (
    <ButtonItem
      layout="below"
      disabled={disabled}
      onClick={onClick}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {icon}
        <div>
          {children}
        </div>
      </div>
    </ButtonItem>
  );
}
