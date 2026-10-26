import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';

export default function AuthGate({ children }) {

  const { user } = useAuth();

  const [authScreen, setAuthScreen] =
    useState('login');

  if (user) return children;

  const onSuccess = () => {};

  if (authScreen === 'register') {
    return (
      <RegisterPage
        onSwitch={setAuthScreen}
        onSuccess={onSuccess}
      />
    );
  }

  if (authScreen === 'forgot') {
    return (
      <ForgotPasswordPage
        onSwitch={setAuthScreen}
      />
    );
  }

  return (
    <LoginPage
      onSwitch={setAuthScreen}
      onSuccess={onSuccess}
    />
  );

}