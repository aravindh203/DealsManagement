
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// Enhanced debugging for SharePoint Embedded components
window.addEventListener('error', (e) => {
  if (e.error && e.message && (
    e.message.includes('chatodsp') || 
    e.message.includes('sharepoint') || 
    e.message.includes('search') ||
    e.message.includes('ContainerTypeId') ||
    e.message.includes('Cannot read properties of undefined')
  )) {
    // Prevent default browser error handling for these specific errors
    e.preventDefault();
  } else {
  }
});

// Also catch unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && (
    (e.reason.message && (
      e.reason.message.includes('sharepointembedded') ||
      e.reason.message.includes('search') ||
      e.reason.message.includes('ContainerTypeId')
    )) ||
    (e.reason.toString && e.reason.toString().includes('SharePoint'))
  )) {
    // Prevent default browser error handling
    e.preventDefault();
  } else {
  }
});

const root = createRoot(rootElement);
root.render(<App />);

