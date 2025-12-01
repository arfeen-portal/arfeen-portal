// src/components/ClientErrorBoundary.tsx
"use client";
import React from "react";

type State = { hasError: boolean; msg?: string };

export default class ClientErrorBoundary extends React.Component<
  React.PropsWithChildren,
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, msg: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // TODO: optional: send to /api/bug-report
    console.error("ClientErrorBoundary", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h3>Something went wrong.</h3>
          <p>{this.state.msg}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
