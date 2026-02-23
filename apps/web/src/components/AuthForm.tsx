import { useSearchParams } from "next/navigation";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import { FaGoogle } from "react-icons/fa";

import { authClient } from "@kan/auth/client";

import Button from "~/components/Button";

interface AuthProps {
  setIsMagicLinkSent: (value: boolean, recipient: string) => void;
  isSignUp?: boolean;
}

export function Auth({ setIsMagicLinkSent: _setIsMagicLinkSent }: AuthProps) {
  const [isPending, setIsPending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const redirect = useSearchParams().get("next");
  const callbackURL = redirect ?? "/boards";

  const handleLoginWithGoogle = async () => {
    setIsPending(true);
    setLoginError(null);

    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });

    setIsPending(false);

    if (result.error) {
      setLoginError(t`Failed to login with Google. Please try again.`);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        onClick={handleLoginWithGoogle}
        isLoading={isPending}
        iconLeft={<FaGoogle />}
        fullWidth
        size="lg"
      >
        <Trans>Continue with Google</Trans>
      </Button>
      {loginError && (
        <p className="mt-2 text-xs text-red-400">{loginError}</p>
      )}
    </div>
  );
}
