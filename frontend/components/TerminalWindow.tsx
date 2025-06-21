"use client";
import React from "react";
import Resizable from "./Resizable";

interface TerminalWindowProps {
  children: React.ReactNode;
}

const TerminalWindow: React.FC<TerminalWindowProps> = ({ children }) => {
  return (
    <Resizable
      defaultSize={{ width: "80vw", height: "80vh" }}
      minWidth={300}
      minHeight={200}
      maxWidth="100vw"
      maxHeight="100vh"
      enable={{ top: true, right: true, bottom: true, left: true, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true }}
      className="bg-terminalBg text-terminalText font-mono text-base md:text-lg rounded-lg shadow-lg border border-terminalBorder flex flex-col p-0 resize overflow-auto hide-scrollbar"
      style={{ margin: "auto" }}
    >
      {/* ウィンドウヘッダー */}
      <div className="flex items-center justify-between bg-terminalBorder bg-opacity-30 px-3 py-1 rounded-t-lg border-b border-terminalBorder select-none">
        <span className="text-xs font-bold tracking-widest"></span>
        <div className="flex gap-2">
          <span className="w-7 h-7 rounded hover:bg-terminalBorder flex items-center justify-center text-lg text-white cursor-pointer transition" title="最小化">_</span>
          <span className="w-7 h-7 rounded hover:bg-terminalBorder flex items-center justify-center text-lg text-white cursor-pointer transition" title="ウィンドウ">□</span>
          <span className="w-7 h-7 rounded hover:bg-terminalBorder flex items-center justify-center text-lg text-white cursor-pointer transition" title="閉じる">×</span>
        </div>
      </div>
      {/* 一枚板のターミナル内容 */}
      <div className="flex-1 overflow-y-auto p-4 hide-scrollbar" style={{ overflowAnchor: 'none' }}>
        {children}
      </div>
    </Resizable>
  );
};

export default TerminalWindow;
