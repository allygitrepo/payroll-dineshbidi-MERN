import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/index';
import { ToastProvider } from './shared/components';

function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

export default App;
