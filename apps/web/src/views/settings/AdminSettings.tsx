import { t } from "@lingui/core/macro";
import Image from "next/image";
import { useState } from "react";

import { PageHead } from "~/components/PageHead";
import Button from "~/components/Button";
import Modal from "~/components/modal";
import { usePopup } from "~/providers/popup";
import { api } from "~/utils/api";
import { formatMemberDisplayName, getAvatarUrl } from "~/utils/helpers";
import AddAdminModal from "./components/AddAdminModal";

export default function AdminSettings() {
  const { showPopup } = usePopup();
  const utils = api.useUtils();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data: currentUser } = api.user.getUser.useQuery();
  const { data: admins, isLoading } = api.user.getAdmins.useQuery();

  const removeAdmin = api.user.setAdminStatus.useMutation({
    onSuccess: async () => {
      showPopup({
        header: t`Admin removed`,
        message: t`The user is no longer an admin.`,
        icon: "success",
      });
      await utils.user.getAdmins.invalidate();
    },
    onError: (error) => {
      showPopup({
        header: t`Unable to remove admin`,
        message: error.message,
        icon: "error",
      });
    },
  });

  const handleAddAdmin = async (userId: string) => {
    setAddModalOpen(false);
  };

  return (
    <>
      <PageHead title={t`Settings | Admin`} />

      <div className="mb-8 border-t border-light-300 dark:border-dark-300">
        <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
          {t`Global admins`}
        </h2>
        <p className="mb-6 text-sm text-neutral-500 dark:text-dark-900">
          {t`Manage users who have global admin privileges across all workspaces.`}
        </p>

        {isLoading ? (
          <p className="text-sm text-neutral-500 dark:text-dark-900">
            {t`Loading...`}
          </p>
        ) : (
          <div className="space-y-3">
            {admins?.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between rounded-lg border border-light-300 px-4 py-3 dark:border-dark-300"
              >
                <div className="flex items-center gap-3">
                  {admin.image ? (
                    <Image
                      src={admin.image}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="inline-block h-8 w-8 overflow-hidden rounded-full bg-light-400 dark:bg-dark-400">
                      <svg
                        className="h-full w-full text-dark-700"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-dark-1000">
                      {formatMemberDisplayName(admin.name, admin.email)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-dark-900">
                      {admin.email}
                    </p>
                  </div>
                </div>
                {admin.id !== currentUser?.id && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() =>
                      removeAdmin.mutate({
                        userId: admin.id,
                        isAdmin: false,
                      })
                    }
                    disabled={removeAdmin.isPending}
                  >
                    {t`Remove`}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-4 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
            {t`Add admin`}
          </h2>
          <p className="mb-6 text-sm text-neutral-500 dark:text-dark-900">
            {t`Search for a user and grant them global admin privileges.`}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAddModalOpen(true)}
          >
            {t`Add admin`}
          </Button>
        </div>
      </div>

      {addModalOpen && (
        <Modal modalSize="md" positionFromTop="sm" isVisible>
          <AddAdminModal
            onAdd={handleAddAdmin}
            onClose={() => setAddModalOpen(false)}
            existingAdminIds={admins?.map((a) => a.id) ?? []}
          />
        </Modal>
      )}
    </>
  );
}
