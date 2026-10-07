import React, { Component } from 'react';
import { Result, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by error boundary:', error, errorInfo);
  }

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#f5f5f5'
        }}>
          <Result
            status="500"
            title="Oops!"
            subTitle="Sorry, something went wrong. Please try again later."
            extra={
              <Button 
                type="primary" 
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
              >
                Back Home
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
