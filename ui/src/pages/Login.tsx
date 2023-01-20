import React from "react";
import { ConnectionForm } from "../components/ConnectionForm/ConnectionForm";
import { ExtensionHeader } from "../components/ExtensionHeader/ExtensionHeader";

export const LoginPage = () => {
  return (
    <>
      <ExtensionHeader />
      <ConnectionForm />
    </>
  );
};
