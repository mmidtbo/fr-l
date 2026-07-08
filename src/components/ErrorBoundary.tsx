import React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-svh flex items-center justify-center bg-muted/30">
          <div className="text-center space-y-4 max-w-md px-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-lg font-semibold">Terjadi Kesalahan</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "Terjadi kesalahan yang tidak terduga."}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
