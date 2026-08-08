import { Component } from "react";

// Without this, any runtime error thrown while rendering the dashboard (a bad
// API shape, a null field, a charting edge case, etc.) unmounts the entire
// React tree and leaves a blank white page with no on-screen indication of
// what happened - which is exactly what "the dashboard won't open" looks like
// to a user, even though the login itself succeeded.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030712",
          color: "#e2e8f0",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              Something went wrong loading the dashboard
            </h1>
            <p style={{ color: "#94a3b8", marginBottom: 16, fontSize: 14 }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                background: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
