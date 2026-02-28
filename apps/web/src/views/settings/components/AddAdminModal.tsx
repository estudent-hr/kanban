import { t } from "@lingui/core/macro";
import Image from "next/image";
import { useState } from "react";
import { HiXMark } from "react-icons/hi2";

import Button from "~/components/Button";
import Input from "~/components/Input";
import { usePopup } from "~/providers/popup";
import { api } from "~/utils/api";
import { formatMemberDisplayName } from "~/utils/helpers";

interface AddAdminModalProps {
  onAdd: (userId: string) => void;
  onClose: () => void;
  existingAdminIds: string[];
}

export default function AddAdminModal({
  onAdd,
  onClose,
  existingAdminIds,
}: AddAdminModalProps) {
  const [search, setSearch] = useState("");
  const { showPopup } = usePopup();
  const utils = api.useUtils();

  const { data: allUsers, isLoading } = api.user.getAllUsers.useQuery();

  const addAdmin = api.user.setAdminStatus.useMutation({
    onSuccess: async (_data, variables) => {
      showPopup({
        header: t`Admin added`,
        message: t`The user is now a global admin.`,
        icon: "success",
      });
      await utils.user.getAdmins.invalidate();
      await utils.user.getAllUsers.invalidate();
      onAdd(variables.userId);
    },
    onError: (error) => {
      showPopup({
        header: t`Unable to add admin`,
        message: error.message,
        icon: "error",
      });
    },
  });

  const nonAdminUsers = allUsers?.filter(
    (user) => !existingAdminIds.includes(user.id),
  );

  const filteredUsers = nonAdminUsers?.filter((user) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      user.name?.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="px-5 pt-5">
        <div className="flex w-full items-center justify-between pb-4 text-neutral-900 dark:text-dark-1000">
          <h2 className="text-sm font-bold">{t`Add admin`}</h2>
          <button
            type="button"
            className="rounded p-1 hover:bg-light-300 focus:outline-none dark:hover:bg-dark-300"
            onClick={onClose}
          >
            <HiXMark
              size={18}
              className="text-light-900 dark:text-dark-900"
            />
          </button>
        </div>

        <Input
          placeholder={t`Search by name or email...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div className="mt-4 max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <p className="py-4 text-center text-sm text-neutral-500 dark:text-dark-900">
              {t`Loading...`}
            </p>
          ) : filteredUsers?.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-500 dark:text-dark-900">
              {t`No users found`}
            </p>
          ) : (
            filteredUsers?.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-light-200 dark:hover:bg-dark-200"
                onClick={() =>
                  addAdmin.mutate({ userId: user.id, isAdmin: true })
                }
                disabled={addAdmin.isPending}
              >
                {user.image ? (
                  <Image
                    src={user.image}
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
                    {formatMemberDisplayName(user.name, user.email)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-dark-900">
                    {user.email}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end border-t border-light-600 px-5 pb-5 pt-5 dark:border-dark-600">
        <Button variant="secondary" onClick={onClose}>
          {t`Close`}
        </Button>
      </div>
    </div>
  );
}
